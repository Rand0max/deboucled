///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED API
///////////////////////////////////////////////////////////////////////////////////////

async function pingDecensuredApi() {
    const username = getUserPseudo();
    if (!username) {
        return;
    }

    const lastPing = await store.get(storage_decensuredLastPing, 0);
    const now = Date.now();

    if (now - lastPing < decensuredPingInterval) {
        return;
    }

    const failureKey = 'deboucled_decensuredPingFailures';
    const lastFailure = await store.get(failureKey, 0);
    const timeSinceFailure = now - lastFailure;

    if (timeSinceFailure < DECENSURED_CONFIG.RETRY_TIMEOUT) {
        return;
    }

    try {
        const response = await fetchDecensuredApi(apiDecensuredUsersUrl, {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                userversion: getCurrentScriptVersion()
            })
        });

        if (response) {
            await store.set(failureKey, 0);
            await store.set(storage_decensuredLastPing, now);
        } else {
            await store.set(failureKey, now);
        }
    } catch (error) {
        await store.set(failureKey, now);
        console.error('Ping API échoué :', error);
        logDecensuredError(error, 'pingDecensuredApi');
        await store.set(storage_decensuredLastPing, now - decensuredPingInterval + DECENSURED_CONFIG.RETRY_TIMEOUT);
    }
}

async function createDecensuredMessage(messageId, username, messageUrl, fakeContent, realContent, topicId, topicUrl, topicTitle) {
    try {
        const currentUserId = userId || '0';

        const cleanedTopicUrl = cleanTopicUrl(topicUrl);

        const data = {
            userid: currentUserId,
            messageid: messageId,
            username: username,
            messageurl: messageUrl,
            fakecontent: fakeContent,
            realcontent: realContent,
            topicid: topicId,
            topicurl: cleanedTopicUrl,
            topictitle: topicTitle,
            creationdate: new Date().toISOString()
        };

        for (const [key, value] of Object.entries(data)) {
            if (!value || !value.toString().length) {
                console.error(`Champ manquant ou vide: ${key} = ${value}`);
            }
        }

        if (!isValidTopicId(topicId)) {
            console.error(`TopicId invalide: ${topicId} < ${DECENSURED_CONFIG.TOPICS.MIN_VALID_TOPIC_ID}`);
        }

        const response = await fetchDecensuredApi(apiDecensuredCreateMessageUrl, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        return response !== null;
    } catch (error) {
        logDecensuredError(error, 'createDecensuredMessage');
        return false;
    }
}

async function getDecensuredMessages(topicId) {
    try {
        const data = await fetchDecensuredApi(`${apiDecensuredMessagesUrl}/${topicId}/${DECENSURED_CONFIG.API_MAX_MESSAGES}/0`);
        if (data && Array.isArray(data)) {
            return data;
        }
    } catch (error) {
        logDecensuredError(error, 'getDecensuredMessages');
    }

    return [];
}

async function createDecensuredTopic(topicData) {
    try {
        const topicApiData = {
            topicid: topicData.topic_id,
            topicnamefake: topicData.fake_title,
            topicnamereal: topicData.real_title,
            topicurl: topicData.jvc_topic_url,
            topicauthor: getUserPseudo() || 'Unknown',
            creationdate: new Date().toISOString()
        };

        for (const [key, value] of Object.entries(topicApiData)) {
            if (!value || !value.toString().length) {
                console.warn(`⚠️ Champ manquant ou vide pour topic: ${key} = ${value}`);
            }
        }

        const topicResponse = await fetchDecensuredApi(apiDecensuredCreateTopicUrl, {
            method: 'POST',
            body: JSON.stringify(topicApiData)
        });

        const success = topicResponse !== null;
        return success;
    } catch (error) {
        console.error('💥 Erreur dans createDecensuredTopic:', error);
        logDecensuredError(error, 'createDecensuredTopic');
        return false;
    }
}

async function createDecensuredTopicMessage(topicId, messageId, topicUrl, topicTitle, fakeContent, realContent) {
    try {
        const messageApiData = {
            userid: userId || '0',
            messageid: messageId,
            username: getUserPseudo() || 'Unknown',
            messageurl: topicUrl + '#message' + messageId,
            fakecontent: fakeContent,
            realcontent: realContent,
            topicid: topicId,
            topicurl: topicUrl,
            topictitle: topicTitle,
            creationdate: new Date().toISOString()
        };

        for (const [key, value] of Object.entries(messageApiData)) {
            if (!value || !value.toString().length) {
                console.warn(`⚠️ Champ manquant ou vide pour message: ${key} = ${value}`);
            }
        }

        const messageResponse = await fetchDecensuredApi(apiDecensuredCreateMessageUrl, {
            method: 'POST',
            body: JSON.stringify(messageApiData)
        });

        const success = messageResponse !== null;
        return success;
    } catch (error) {
        console.error('💥 Erreur dans createDecensuredTopicMessage:', error);
        logDecensuredError(error, 'createDecensuredTopicMessage');
        return false;
    }
}

async function getDecensuredTopic(topicId) {
    try {
        if (!topicId) return null;
        const response = await fetchDecensuredApi(`${apiDecensuredTopicByIdUrl}/${topicId}`, {
            method: 'GET'
        });
        return response;
    } catch (error) {
        console.error('Erreur lors de la récupération du topic:', error);
        return null;
    }
}

async function getDecensuredTopicsBatch(topicIds) {
    try {
        if (!topicIds || topicIds.length === 0) return [];

        const response = await fetchDecensuredApi(apiDecensuredTopicsByIdsUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topicIds })
        });

        if (Array.isArray(response)) return response;
        return [];
    } catch (error) {
        console.error('Erreur lors de la récupération batch des topics:', error);
        return [];
    }
}

async function decryptSingleMessage() {
    const messageId = getCurrentMessageIdFromUrl();
    if (!messageId) return;

    try {
        const apiResponse = await fetchDecensuredApi(`${apiDecensuredSingleMessageUrl}/${messageId}`);

        const decensuredMsg = Array.isArray(apiResponse) && apiResponse.length > 0 ? apiResponse[0] : null;

        if (!decensuredMsg || !decensuredMsg.message_real_content) return;

        const messageElements = getMessageElements();
        const messageElement = messageElements.find(elem => {
            const elemMessageId = getMessageId(elem);
            return elemMessageId && elemMessageId.toString() === messageId.toString();
        });

        if (messageElement) {
            processDecensuredMessage(messageElement, decensuredMsg);
        }

    } catch (error) {
        handleApiError(error, `Erreur lors du déchiffrement du message unique ${messageId}`);
    }
}

async function showDecensuredUsersModal() {
    if (!userPseudo) {
        addAlertbox('info', 'Vous devez être connecté pour voir la liste des utilisateurs Décensured en ligne.');
        return;
    }

    try {
        const usersData = await fetchDecensuredApi(apiDecensuredUsersOnlineUrl, { method: 'GET' });

        if (usersData && usersData.users) {
            createAndShowUsersModal(usersData.users, usersData.count);
        } else {
            addAlertbox('warning', 'Aucun utilisateur Décensured trouvé');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        addAlertbox('error', 'Impossible de charger la liste des utilisateurs');
    }
}

async function loadDecensuredUsersData() {
    if (decensuredUsersLoading) return;
    decensuredUsersLoading = true;

    try {
        const response = await fetchDecensuredApi(apiDecensuredStatsUrl);
        if (response && response.nb) {
            const onlineCount = parseInt(response.nb) || 0;
            updateDecensuredUsersCount(onlineCount);
        } else {
            updateDecensuredUsersCount(0);
        }
    } catch (error) {
        handleApiError(error, 'Chargement utilisateurs Décensured');
        updateDecensuredUsersCount(0);
    } finally {
        decensuredUsersLoading = false;
    }
}
