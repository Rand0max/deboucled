///////////////////////////////////////////////////////////////////////////////////////
// DÉCENSURED HELPERS
///////////////////////////////////////////////////////////////////////////////////////

// Cache et utilitaires de performance

function getCachedElement(selector, context = document, ttl = DECENSURED_CONFIG.CACHE_TTL) {
    const cacheKey = `${selector}:${context === document ? 'document' : context.id || 'context'}`;
    const cached = domCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.element;
    }

    const element = context.querySelector(selector);
    domCache.set(cacheKey, { element, timestamp: Date.now() });
    return element;
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return func.apply(this, args);
        }
    };
}

function clearDomCache() {
    domCache.clear();
}

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of domCache.entries()) {
        if (now - value.timestamp > DECENSURED_CONFIG.CACHE_TTL * 2) {
            domCache.delete(key);
        }
    }
}, DECENSURED_CONFIG.CACHE_TTL);

// Sequence Helpers

function getRandomSticker() {
    if (stickers.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * stickers.length);
    return stickers[randomIndex];
}

function addStickerToMessage(message) {
    if (Math.random() <= 1 / 3) {
        const sticker = getRandomSticker();
        if (sticker) return `${message} ${sticker}`;
    }
    return message;
}

function getRandomPlatitudeMessage() {
    initAllPlatitudeSequences();
    const messageIndex = getNextIndexFromSequence(platitudeMessageSequenceData, platitudeMessages.length);
    const message = platitudeMessages[messageIndex];
    return addStickerToMessage(message);
}

function getRandomPlatitudeTitle() {
    initAllPlatitudeSequences();
    const topicIndex = getNextIndexFromSequence(platitudeTopicSequenceData, platitudeTopics.length);
    return platitudeTopics[topicIndex].title;
}

function createShuffledSequence(length) {
    const sequence = Array.from({ length }, (_, i) => i);
    // Algorithme de Fisher-Yates
    for (let i = sequence.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }
    return sequence;
}

function getNextIndexFromSequence(sequenceData, totalLength) {
    if (!sequenceData.sequence || sequenceData.currentIndex >= sequenceData.sequence.length) {
        sequenceData.sequence = createShuffledSequence(totalLength);
        sequenceData.currentIndex = 0;
    }

    const index = sequenceData.sequence[sequenceData.currentIndex];
    sequenceData.currentIndex++;
    return index;
}

function initAllSequences() {
    platitudeTopicSequenceData = {
        sequence: createShuffledSequence(platitudeTopics.length),
        currentIndex: 0
    };

    platitudeMessageSequenceData = {
        sequence: createShuffledSequence(platitudeMessages.length),
        currentIndex: 0
    };

    topicWithMessagesIndexSequences.clear();
    platitudeTopics.forEach(topic => {
        topicWithMessagesIndexSequences.set(topic.title.toLowerCase(), {
            sequence: createShuffledSequence(topic.messages.length),
            currentIndex: 0
        });
    });
}

function initAllPlatitudeSequences() {
    if (!sequencesInitialized) {
        initAllSequences();
        sequencesInitialized = true;
    }
}

function getRandomTopicWithMessage() {
    initAllPlatitudeSequences();

    const topicIndex = getNextIndexFromSequence(platitudeTopicSequenceData, platitudeTopics.length);
    const selectedTopic = platitudeTopics[topicIndex];

    const messageSequenceData = topicWithMessagesIndexSequences.get(selectedTopic.title.toLowerCase());
    const messageIndex = getNextIndexFromSequence(messageSequenceData, selectedTopic.messages.length);

    const message = selectedTopic.messages[messageIndex];
    const messageWithSticker = addStickerToMessage(message);

    return {
        title: selectedTopic.title,
        message: messageWithSticker
    };
}

function getRandomMessageForTitle(title) {
    initAllPlatitudeSequences();
    const titleLower = title.toLowerCase();
    const messageSequenceData = topicWithMessagesIndexSequences.get(titleLower);
    if (messageSequenceData) {
        const matchingTopic = platitudeTopics.find(topic => topic.title.toLowerCase() === titleLower);
        const messageIndex = getNextIndexFromSequence(messageSequenceData, matchingTopic.messages.length);
        const message = matchingTopic.messages[messageIndex];
        return addStickerToMessage(message);
    }
    return getRandomPlatitudeMessage();
}

// Utilitaires DOM helpers

function findElement(selectors, context = document) {
    if (typeof selectors === 'string') {
        return getCachedElement(selectors, context);
    }

    for (const selector of selectors) {
        const element = getCachedElement(selector, context);
        if (element && element.offsetParent !== null) {
            return element;
        }
    }
    return null;
}

function cleanupTimers() {
    if (decensuredPingTimer) {
        clearInterval(decensuredPingTimer);
        decensuredPingTimer = null;
    }
    if (decensuredUsersTimer) {
        clearInterval(decensuredUsersTimer);
        decensuredUsersTimer = null;
    }
    if (window.deboucledStatsTimer) {
        clearInterval(window.deboucledStatsTimer);
        window.deboucledStatsTimer = null;
    }
    if (window.deboucledCardTimer) {
        clearInterval(window.deboucledCardTimer);
        window.deboucledCardTimer = null;
    }

    clearDomCache();
    invalidateMessageElementsCache();
    cleanupTopicDecensuredState();
    cleanupFormObserver();
}

function logDecensuredError(error, context = '', showNotification = false) {
    console.error(`[Décensured] ${context}:`, error);

    if (typeof sendDiagnostic === 'function') {
        sendDiagnostic(0, `Décensured: ${context} - ${error.message}`);
    }

    if (showNotification) {
        addAlertbox('error', `Erreur ${context}: ${error.message}`);
    }
}

// Notifications utilisateur

function addAlertbox(type, message, duration = DECENSURED_CONFIG.NOTIFICATION_DURATION) {
    const notification = document.createElement('div');
    notification.className = `deboucled-decensured-notification deboucled-notification-${type}`;
    notification.id = `deboucled-notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const icon = DECENSURED_CONFIG.NOTIFICATION_ICONS[type] || DECENSURED_CONFIG.NOTIFICATION_ICONS['info'];

    notification.innerHTML = `
        <span class="deboucled-notification-icon">${icon}</span>
        <span class="deboucled-notification-message">${message}</span>
        <button class="deboucled-decensured-notification-close" onclick="this.parentNode.remove()">×</button>
    `;

    const existingNotifications = document.querySelectorAll(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_NOTIFICATION);
    if (existingNotifications.length > 0) {
        const topOffset = DECENSURED_CONFIG.NOTIFICATION_TOP_OFFSET + (existingNotifications.length * DECENSURED_CONFIG.NOTIFICATION_SPACING);
        notification.style.top = `${topOffset}px`;
    }

    document.body.appendChild(notification);

    if (duration > 0) {
        setTimeout(() => {
            notification.style.animation = 'deboucledSlideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, DECENSURED_CONFIG.ANIMATION_DELAY);
        }, duration);
    }

    return notification;
}

window.addEventListener('beforeunload', cleanupTimers);

// API Helper

async function fetchDecensuredApi(endpoint, options = {}) {
    try {
        const method = options.method || 'GET';

        return new Promise((resolve) => {
            const headers = {
                'Referer': window.location.href,
                ...options.headers
            };

            const currentUserPseudo = getCurrentUserPseudo();
            if (currentUserPseudo && currentUserPseudo.trim() !== '') {
                headers['X-Deboucled-User'] = currentUserPseudo;
            }

            if (method !== 'GET') {
                headers['Content-Type'] = 'application/json';
            }

            GM.xmlHttpRequest({
                method: method,
                url: endpoint,
                headers: headers,
                data: options.body || null,
                timeout: options.timeout || DECENSURED_CONFIG.API_TIMEOUT,
                onload: (response) => {
                    if (response.status >= DECENSURED_CONFIG.HTTP_OK_MIN && response.status < DECENSURED_CONFIG.HTTP_OK_MAX) {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch {
                            if (method === 'GET') {
                                resolve(null);
                            } else {
                                resolve({ success: true });
                            }
                        }
                    } else {
                        console.error('fetchDecensuredApi erreur HTTP :', response.status, response.statusText);
                        resolve(null);
                    }
                },
                onerror: (response) => {
                    console.error('fetchDecensuredApi erreur réseau :', response);
                    resolve(null);
                },
                ontimeout: () => {
                    console.warn('fetchDecensuredApi timeout :', endpoint);
                    resolve(null);
                }
            });
        });
    } catch (error) {
        console.error('fetchDecensuredApi exception :', error);
        return null;
    }
}
