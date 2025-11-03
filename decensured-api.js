///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED API
///////////////////////////////////////////////////////////////////////////////////////

async function getCachedDecensuredTopics() {
    if (typeof localforage === 'undefined' || !localforage.getItem) {
        return new Map();
    }

    try {
        const cached = await localforage.getItem(localstorage_decensuredTopics);
        return cached ? new Map(cached) : new Map();
    } catch (error) {
        logDecensuredError(error, 'getCachedDecensuredTopics');
        return new Map();
    }
}

async function setCachedDecensuredTopic(topicId, topicData) {
    if (typeof localforage === 'undefined' || !localforage.setItemWithTTL) {
        return;
    }

    try {
        const cached = await getCachedDecensuredTopics();
        cached.set(parseInt(topicId), topicData);

        await localforage.setItemWithTTL(
            localstorage_decensuredTopics,
            [...cached],
            TTL_CONFIG.decensuredTopics
        );
    } catch (error) {
        logDecensuredError(error, 'setCachedDecensuredTopic');
    }
}

async function getCachedDecensuredMessages(topicId) {
    if (typeof localforage === 'undefined' || !localforage.getItem) {
        return null;
    }

    try {
        const cached = await localforage.getItem(`${localstorage_decensuredMessages}_${topicId}`);
        return cached || null;
    } catch (error) {
        logDecensuredError(error, 'getCachedDecensuredMessages');
        return null;
    }
}

async function setCachedDecensuredMessages(topicId, messages) {
    if (typeof localforage === 'undefined' || !localforage.setItemWithTTL) {
        return;
    }

    try {
        await localforage.setItemWithTTL(
            `${localstorage_decensuredMessages}_${topicId}`,
            messages,
            TTL_CONFIG.decensuredMessages
        );
    } catch (error) {
        logDecensuredError(error, 'setCachedDecensuredMessages');
    }
}

async function getCachedDecensuredSingleMessage(messageId) {
    if (typeof localforage === 'undefined' || !localforage.getItem) {
        return null;
    }

    try {
        const cached = await localforage.getItem(`${localstorage_decensuredSingleMessages}_${messageId}`);
        return cached || null;
    } catch (error) {
        logDecensuredError(error, 'getCachedDecensuredSingleMessage');
        return null;
    }
}

async function setCachedDecensuredSingleMessage(messageId, messageData) {
    if (typeof localforage === 'undefined' || !localforage.setItemWithTTL) {
        return;
    }

    try {
        await localforage.setItemWithTTL(
            `${localstorage_decensuredSingleMessages}_${messageId}`,
            messageData,
            TTL_CONFIG.decensuredSingleMessage
        );
    } catch (error) {
        logDecensuredError(error, 'setCachedDecensuredSingleMessage');
    }
}

async function invalidateDecensuredTopicCache(topicId) {
    if (typeof localforage === 'undefined' || !localforage.removeItem) {
        return;
    }

    try {
        await localforage.removeItem(`${localstorage_decensuredMessages}_${topicId}`);

        const cachedTopics = await getCachedDecensuredTopics();
        if (cachedTopics.has(parseInt(topicId))) {
            cachedTopics.delete(parseInt(topicId));
            await localforage.setItemWithTTL(
                localstorage_decensuredTopics,
                [...cachedTopics],
                TTL_CONFIG.decensuredTopics
            );
        }

        if (decensuredTopicMessagesCache) {
            decensuredTopicMessagesCache = null;
            decensuredTopicMessagesUseCache = false;
        }
    } catch (error) {
        logDecensuredError(error, 'invalidateDecensuredTopicCache');
    }
}

async function pingDecensuredApi(forceUpdate = false) {
    const username = getCurrentUserPseudo();
    if (!username) {
        return;
    }

    const now = Date.now();

    if (!forceUpdate) {
        const lastPing = await store.get(storage_decensuredLastPing, 0);

        if (now - lastPing < DECENSURED_CONFIG.PING_INTERVAL) {
            return;
        }

        const lastFailure = await store.get(storage_deboucled_decensuredPingFailures, 0);
        if (lastFailure > 0) {
            const timeSinceFailure = now - lastFailure;
            if (timeSinceFailure < DECENSURED_CONFIG.RETRY_TIMEOUT) {
                return;
            }
        }
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

        if (response !== null) {
            await invalidateDecensuredTopicCache(topicId);
        }

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

        const cachedMessages = await getCachedDecensuredMessages(topicId);
        if (cachedMessages) {
            decensuredTopicMessagesCache = cachedMessages;
            return cachedMessages;
        }

        const data = await fetchDecensuredApi(`${apiDecensuredMessagesUrl}/${topicId}/${DECENSURED_CONFIG.API_MAX_MESSAGES}/0`);
        if (data && Array.isArray(data)) {
            decensuredTopicMessagesCache = data;
            await setCachedDecensuredMessages(topicId, data);
            return data;
        }

        return [];
    } catch (error) {
        logDecensuredError(error, 'getDecensuredMessages');
        return [];
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

        if (success) {
            await invalidateDecensuredTopicCache(topicData.topic_id);
        }

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

        if (success) {
            await invalidateDecensuredTopicCache(topicId);
        }

        return success;
    } catch (error) {
        logDecensuredError(error, 'createDecensuredTopicMessage - Erreur dans createDecensuredTopicMessage');
        return false;
    }
}

async function getDecensuredTopic(topicId) {
    try {
        if (!topicId) return null;

        const cachedTopics = await getCachedDecensuredTopics();
        const cachedTopic = cachedTopics.get(parseInt(topicId));
        if (cachedTopic) {
            return cachedTopic;
        }

        const response = await fetchDecensuredApi(`${apiDecensuredTopicByIdUrl}/${topicId}`, {
            method: 'GET'
        });

        if (response) {
            await setCachedDecensuredTopic(topicId, response);
        } else {
            await setCachedDecensuredTopic(topicId, null);
        }

        return response;
    } catch (error) {
        logDecensuredError(error, 'getDecensuredTopic - Erreur lors de la récupération du topic');
        return null;
    }
}

async function getDecensuredTopicsBatch(topicIds) {
    try {
        if (!topicIds || topicIds.length === 0) return [];

        const cachedTopics = await getCachedDecensuredTopics();
        const results = [];
        const uncachedIds = [];

        for (const topicId of topicIds) {
            const parsedId = parseInt(topicId);
            if (cachedTopics.has(parsedId)) {
                const cachedData = cachedTopics.get(parsedId);
                if (cachedData) {
                    results.push(cachedData);
                }
            } else {
                uncachedIds.push(topicId);
            }
        }

        if (uncachedIds.length === 0) {
            return results;
        }

        const response = await fetchDecensuredApi(apiDecensuredTopicsByIdsUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topicIds: uncachedIds })
        });

        if (Array.isArray(response)) {
            for (const topic of response) {
                if (topic && topic.topic_id) {
                    await setCachedDecensuredTopic(topic.topic_id, topic);
                    results.push(topic);
                }
            }

            for (const uncachedId of uncachedIds) {
                const found = response.find(t => t && t.topic_id && t.topic_id.toString() === uncachedId.toString());
                if (!found) {
                    await setCachedDecensuredTopic(uncachedId, null);
                }
            }
        }

        return results;
    } catch (error) {
        logDecensuredError(error, 'getDecensuredTopicsBatch - Erreur lors de la récupération batch des topics');
        return [];
    }
}

async function getDecensuredSingleMessage(messageId) {
    try {
        const cachedMessage = await getCachedDecensuredSingleMessage(messageId);
        if (cachedMessage !== null) {
            return cachedMessage;
        }

        const apiResponse = await fetchDecensuredApi(`${apiDecensuredSingleMessageUrl}/${messageId}`);
        const decensuredMsg = Array.isArray(apiResponse) && apiResponse.length > 0 ? apiResponse[0] : null;

        await setCachedDecensuredSingleMessage(messageId, decensuredMsg);

        return decensuredMsg;
    } catch (error) {
        logDecensuredError(error, 'getDecensuredSingleMessage');
        return null;
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
            await processDecensuredMessage(messageElement, decensuredMsg);
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

async function checkDecensuredUsers(usernames) {
    if (!usernames || usernames.length === 0) return new Set();

    try {
        const cachedUsers = decensuredUsersSet || new Set();

        const uncachedUsernames = usernames.filter(username => !cachedUsers.has(username.toLowerCase()));

        if (uncachedUsernames.length === 0) {
            return new Set(usernames.filter(username => cachedUsers.has(username.toLowerCase())));
        }

        const response = await fetchDecensuredApi(apiDecensuredUsersUrl, {
            method: 'PUT',
            body: JSON.stringify({ usernames: uncachedUsernames })
        });

        if (response && Array.isArray(response)) {
            response.forEach(username => { decensuredUsersSet.add(username.toLowerCase()); });
            await saveLocalStorage();
        }

        return new Set(usernames.filter(username => decensuredUsersSet.has(username.toLowerCase())));
    } catch (error) {
        logDecensuredError(error, 'checkDecensuredUsers');
        return new Set();
    }
}

// Chat API

async function sendChatMessage(username, userid, content, messageType = 'text', replyToMessageId = null) {
    try {
        const payload = {
            username: username,
            userid: userid,
            message_content: content,
            message_type: messageType
        };

        // Ajouter reply_to_message_id si présent
        if (replyToMessageId) {
            payload.reply_to_message_id = replyToMessageId;
        }

        const response = await fetchDecensuredApi(apiDecensuredChatMessageUrl, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        return response !== null;
    } catch (error) {
        logDecensuredError(error, 'sendChatMessage');
        return false;
    }
}

async function getChatMessages(limit = 50) {
    try {
        const response = await fetchDecensuredApi(`${apiDecensuredChatMessagesUrl}?limit=${limit}`, {
            method: 'GET'
        });

        return Array.isArray(response) ? response : [];
    } catch (error) {
        logDecensuredError(error, 'getChatMessages');
        return [];
    }
}

function createChatEventSource(username) {
    if (!username) {
        console.error('[Chat] Username required for SSE connection');
        return null;
    }

    try {
        const url = `${apiDecensuredChatStreamUrl}?username=${encodeURIComponent(username)}`;
        return new EventSource(url);
    } catch (error) {
        logDecensuredError(error, 'createChatEventSource');
        return null;
    }
}
