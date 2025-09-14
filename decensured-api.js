///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED API
///////////////////////////////////////////////////////////////////////////////////////

async function pingDecensuredApi() {
    const username = getCurrentUserPseudo();
    if (!username) {
        return;
    }

    const lastPing = await store.get(storage_decensuredLastPing, 0);
    const now = Date.now();

    if (now - lastPing < DECENSURED_CONFIG.PING_INTERVAL) {
        return;
    }

    const lastFailure = await store.get(storage_deboucled_decensuredPingFailures, 0);
    const timeSinceFailure = now - lastFailure;

    if (timeSinceFailure < DECENSURED_CONFIG.RETRY_TIMEOUT) {
        return;
    }

    try {
        const response = await fetchDecensuredApi(apiDecensuredUsersUrl, {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                userversion: getCurrentScriptVersion(),
                userid: userId
            })
        });

        if (response) {
            await store.set(storage_deboucled_decensuredPingFailures, 0);
            await store.set(storage_decensuredLastPing, now);
        } else {
            await store.set(storage_deboucled_decensuredPingFailures, now);
        }
    } catch (error) {
        await store.set(storage_deboucled_decensuredPingFailures, now);
        logDecensuredError(error, 'pingDecensuredApi - Ping API échoué');
        await store.set(storage_decensuredLastPing, now - DECENSURED_CONFIG.PING_INTERVAL + DECENSURED_CONFIG.RETRY_TIMEOUT);
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
                logDecensuredError(new Error(`Champ manquant ou vide: ${key} = ${value}`), 'createDecensuredMessage');
            }
        }

        if (!isValidTopicId(topicId)) {
            logDecensuredError(new Error(`TopicId invalide: ${topicId} < ${DECENSURED_CONFIG.TOPICS.MIN_VALID_TOPIC_ID}`), 'createDecensuredMessage');
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
        if (decensuredTopicMessagesUseCache && decensuredTopicMessagesCache?.length) {
            return decensuredTopicMessagesCache;
        }
        const data = await fetchDecensuredApi(`${apiDecensuredMessagesUrl}/${topicId}/${DECENSURED_CONFIG.API_MAX_MESSAGES}/0`);
        if (data && Array.isArray(data)) {
            decensuredTopicMessagesCache = data;
            return data;
        }
    } catch (error) {
        logDecensuredError(error, 'getDecensuredMessages');
    }
}

async function createDecensuredTopic(topicData) {
    try {
        const topicApiData = {
            topicid: topicData.topic_id,
            topicnamefake: topicData.fake_title,
            topicnamereal: topicData.real_title,
            topicurl: topicData.jvc_topic_url,
            topicauthor: userPseudo,
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
        logDecensuredError(error, 'createDecensuredTopic - Erreur dans createDecensuredTopic');
        return false;
    }
}

async function createDecensuredTopicMessage(topicId, messageId, topicUrl, topicTitle, fakeContent, realContent) {
    try {
        const messageApiData = {
            userid: userId || '0',
            messageid: messageId,
            username: userPseudo,
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
        logDecensuredError(error, 'createDecensuredTopicMessage - Erreur dans createDecensuredTopicMessage');
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
        logDecensuredError(error, 'getDecensuredTopic - Erreur lors de la récupération du topic');
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
        logDecensuredError(error, 'getDecensuredTopicsBatch - Erreur lors de la récupération batch des topics');
        return [];
    }
}

async function getDecensuredSingleMessage(messageId) {
    try {
        const apiResponse = await fetchDecensuredApi(`${apiDecensuredSingleMessageUrl}/${messageId}`);
        const decensuredMsg = Array.isArray(apiResponse) && apiResponse.length > 0 ? apiResponse[0] : null;
        return decensuredMsg;
    } catch (error) {
        logDecensuredError(error, 'getDecensuredMessages');
    }
}

async function decryptSingleMessage() {
    const messageId = getCurrentMessageIdFromUrl();
    if (!messageId) return;

    try {
        const decensuredMsg = await getDecensuredSingleMessage(messageId);
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
        logDecensuredError(error, `decryptSingleMessage - Erreur lors du déchiffrement du message unique ${messageId}`);
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
            await createAndShowUsersModal(usersData.users, usersData.count);
        } else {
            addAlertbox('warning', 'Aucun utilisateur Décensured trouvé');
        }
    } catch (error) {
        logDecensuredError(error, 'showDecensuredUsersModal - Erreur lors du chargement des utilisateurs');
        addAlertbox('error', 'Impossible de charger la liste des utilisateurs');
    }
}

async function loadDecensuredStatsData(forceRefresh = false) {
    if (decensuredUsersLoading) return;

    const now = Date.now();
    const lastLoad = await store.get(storage_decensuredLastStatsLoad, 0);

    if (!forceRefresh && now - lastLoad < DECENSURED_CONFIG.STATS_CACHE_DURATION) {
        const cachedCount = await store.get(storage_decensuredOnlineCount, 0);
        updateDecensuredStatsOnlineCount(cachedCount);
        return;
    }

    decensuredUsersLoading = true;

    try {
        const response = await fetchDecensuredApi(apiDecensuredStatsUrl);
        if (response && response.nb) {
            const onlineCount = parseInt(response.nb) || 0;
            updateDecensuredStatsOnlineCount(onlineCount);

            await store.set(storage_decensuredOnlineCount, onlineCount);
            await store.set(storage_decensuredLastStatsLoad, now);
        } else {
            updateDecensuredStatsOnlineCount(0);

            await store.set(storage_decensuredOnlineCount, 0);
            await store.set(storage_decensuredLastStatsLoad, now);
        }
    } catch (error) {
        logDecensuredError(error, 'loadDecensuredStatsData - Chargement statistiques Décensured');

        const cachedCount = await store.get(storage_decensuredOnlineCount, 0);
        updateDecensuredStatsOnlineCount(cachedCount);
    } finally {
        decensuredUsersLoading = false;
    }
}

async function getDecensuredTopicsPaginated(limit, offset) {
    try {
        const response = await fetchDecensuredApi(`${apiDecensuredTopicsPaginatedUrl}/${limit}/${offset}`);

        if (!response || !Array.isArray(response)) {
            return [];
        }

        return response;
    } catch (error) {
        logDecensuredError(error, 'getDecensuredTopicsPaginated - Erreur lors de la récupération des topics paginés');
        return [];
    }
}
