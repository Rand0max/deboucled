///////////////////////////////////////////////////////////////////////////////////////
// DÉCENSURED
///////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////
// Cache et utilitaires de performance
///////////////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////////////
// Sequence Helpers
///////////////////////////////////////////////////////////////////////////////////////

function getRandomPlatitudeMessage() {
    initAllPlatitudeSequences();
    const messageIndex = getNextIndexFromSequence(platitudeMessageSequenceData, platitudeMessages.length);
    return platitudeMessages[messageIndex];
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
        topicWithMessagesIndexSequences.set(topic.title, {
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

    const messageSequenceData = topicWithMessagesIndexSequences.get(selectedTopic.title);
    const messageIndex = getNextIndexFromSequence(messageSequenceData, selectedTopic.messages.length);

    return {
        title: selectedTopic.title,
        message: selectedTopic.messages[messageIndex]
    };
}

function getRandomMessageForTitle(title) {
    const messageSequenceData = topicWithMessagesIndexSequences.get(title);
    if (messageSequenceData) {
        initAllPlatitudeSequences();

        const matchingTopic = platitudeTopics.find(topic => topic.title === title);
        const messageIndex = getNextIndexFromSequence(messageSequenceData, matchingTopic.messages.length);

        return matchingTopic.messages[messageIndex];
    }
    return getRandomPlatitudeMessage();
}


///////////////////////////////////////////////////////////////////////////////////////
// Utilitaires pour les titres de topics décensured
///////////////////////////////////////////////////////////////////////////////////////

function getTopicTitleElement() {
    const selectors = ['#bloc-title-forum', '.topic-title', 'h1'];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            return element;
        }
    }
    return null;
}

function updateTopicTitle(realTitle, fakeTitle = null) {
    const topicTitleElement = getTopicTitleElement();
    if (!topicTitleElement || !realTitle) {
        return false;
    }

    const originalTitle = topicTitleElement.textContent;
    topicTitleElement.textContent = realTitle;

    const fakeTitleForTooltip = fakeTitle || originalTitle;
    if (fakeTitleForTooltip !== realTitle) {
        topicTitleElement.title = `Titre réel : ${realTitle}\nTitre de couverture : ${fakeTitleForTooltip}`;
    }

    return true;
}

function addTopicDecensuredIndicator(indicatorType = 'default') {
    const topicTitleElement = getTopicTitleElement();
    if (!topicTitleElement || topicTitleElement.querySelector('.deboucled-decensured-topic-indicator')) {
        return false;
    }

    const indicator = document.createElement('span');
    indicator.className = 'deboucled-decensured-topic-indicator';

    if (indicatorType === 'lock') {
        indicator.className += ' icon-topic-lock';
        indicator.innerHTML = '';
        indicator.title = 'Topic Décensured';
    } else {
        indicator.textContent = 'DÉCENSURED';
        indicator.title = 'Ce topic contient des messages Décensured';
    }

    topicTitleElement.appendChild(indicator);
    return true;
}

function formatTopicAsDecensured(realTitle = null, fakeTitle = null, options = {}) {
    const {
        updateTitle = true,
        addIndicator = true,
        indicatorType = 'default',
        highlightPage = true
    } = options;

    let success = true;

    if (updateTitle && realTitle) {
        success = updateTopicTitle(realTitle, fakeTitle) && success;
    }

    if (addIndicator) {
        addTopicDecensuredIndicator(indicatorType);
    }

    if (highlightPage) {
        const mainContent = document.querySelector('.main-content, .topic-content, body');
        if (mainContent) {
            mainContent.classList.add('deboucled-current-topic-decensured');
        }
    }

    return success;
}

///////////////////////////////////////////////////////////////////////////////////////
// Utilitaires DOM helpers
///////////////////////////////////////////////////////////////////////////////////////

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
}

function handleApiError(error, context, showNotification = false) {
    console.error(`[Décensured] ${context}:`, error);

    if (typeof sendDiagnostic === 'function') {
        sendDiagnostic(0, `Décensured: ${context} - ${error.message}`);
    }

    if (showNotification) {
        addAlertbox('error', `Erreur ${context}: ${error.message}`);
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// Helpers
///////////////////////////////////////////////////////////////////////////////////////

function getMessageId(messageElement) {
    const messageLink = messageElement.querySelector('a[href*="#message"]');

    if (messageLink) {
        const href = messageLink.href;
        const match = href.match(/#message(\d+)/);
        const result = match ? match[1] : null;
        return result;
    }

    const messageId = messageElement.id;

    if (messageId && messageId.startsWith('message')) {
        const result = messageId.replace('message', '');
        return result;
    }

    const dataId = messageElement.getAttribute('data-id') || messageElement.getAttribute('data-message-id');

    if (dataId) {
        return dataId;
    }

    return null;
}

function getTitleFromTopicPage() {
    const titleElement = getTopicTitleElement();
    if (titleElement) {
        return titleElement.textContent.trim();
    }

    const additionalSelectors = [
        '.bloc-title h1',
        '.titre-topic'
    ];

    for (const selector of additionalSelectors) {
        const titleElement = document.querySelector(selector);
        if (titleElement) {
            return titleElement.textContent.trim();
        }
    }

    return document.title.replace(' - Jeuxvideo.com', '').trim();
}

function logDecensuredError(error, context = '') {
    handleApiError(error, context);
}

///////////////////////////////////////////////////////////////////////////////////////
// Notifications utilisateur
///////////////////////////////////////////////////////////////////////////////////////

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
        const topOffset = 20 + (existingNotifications.length * 80);
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
            }, 300);
        }, duration);
    }

    return notification;
}

window.addEventListener('beforeunload', cleanupTimers);

///////////////////////////////////////////////////////////////////////////////////////
// API Helpers
///////////////////////////////////////////////////////////////////////////////////////

async function fetchDecensuredApi(endpoint, options = {}) {
    try {
        const method = options.method || 'GET';

        return new Promise((resolve) => {
            const headers = {
                'Referer': window.location.href,
                ...options.headers
            };

            if (method !== 'GET') {
                headers['Content-Type'] = 'application/json';
            }

            GM.xmlHttpRequest({
                method: method,
                url: endpoint,
                headers: headers,
                data: options.body || null,
                timeout: options.timeout || 2000,
                onload: (response) => {
                    if (response.status >= 200 && response.status < 300) {
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

///////////////////////////////////////////////////////////////////////////////////////
// Utilitaires pour les URLs
///////////////////////////////////////////////////////////////////////////////////////

function cleanTopicUrl(url) {
    if (!url) return url;

    const cleanUrl = url.split('#')[0];

    if (cleanUrl.endsWith('.htm')) {
        return cleanUrl;
    }

    console.warn('URL de topic ne se termine pas par .htm :', url);
    return url;
}

///////////////////////////////////////////////////////////////////////////////////////
// Traitement du contenu des messages
///////////////////////////////////////////////////////////////////////////////////////

async function processContent(message, fakeMessage = '') {
    try {
        let finalFake = fakeMessage;

        if (!finalFake) {
            const titleInput = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_INPUT);
            if (titleInput && titleInput.value.trim()) {
                const currentTitle = titleInput.value.trim();
                finalFake = getRandomMessageForTitle(currentTitle);
            } else {
                finalFake = getRandomPlatitudeMessage();
            }
        }

        const result = {
            real: message,
            fake: finalFake
        };

        return result;
    } catch (error) {
        logDecensuredError(error, 'processContent');
        return null;
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// Formatage du contenu des messages
///////////////////////////////////////////////////////////////////////////////////////

function formatSpoilers(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.spoilers, (match, content) => {
        return `<span class="JvCare JvCare--masked" data-tooltip="Cliquer pour révéler"><span class="JvCare-content">${content.trim()}</span></span>`;
    });
}

function formatCodeBlocks(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.codeBlocks, (match, content) => {
        const cleanContent = content.trim().replace(/\n/g, '\n');
        return `<pre class="pre-jv"><code class="code-jv">${cleanContent}</code></pre>`;
    });
}

function formatInlineCode(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.inlineCode, '<code class="jv-code">$1</code>');
}

function formatJvcBold(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcBold, '<strong>$1</strong>');
}

function formatJvcItalic(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcItalic, '<em>$1</em>');
}

function formatJvcUnderline(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcUnderline, '<u>$1</u>');
}

function formatJvcStrikethrough(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcStrikethrough, '<s>$1</s>');
}

function formatJvcCode(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcCode, '<code>$1</code>');
}

function formatJvcSpoiler(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.jvcSpoiler, (match, content) => {
        const spoilerId = Math.random().toString(36).substr(2, 32);
        return `<div class="bloc-spoil-jv"><input type="checkbox" id="${spoilerId}" class="open-spoil"><label class="barre-head" for="${spoilerId}"><span class="txt-spoil">Spoil</span><span class="aff-spoil">Afficher</span><span class="masq-spoil">Masquer</span></label><div class="contenu-spoil"><p>${content}</p></div></div>`;
    });
}

function formatJvcLists(text) {
    // Listes à puces avec *
    text = text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.bulletList, (match, items) => {
        const listItems = items.split('\n').filter(line => line.trim().startsWith('*')).map(line => {
            const content = line.trim().substring(1).trim();
            return `  <li>${content}</li>`;
        }).join('\n');
        return `<ul class="liste-default-jv">\n${listItems}\n</ul>`;
    });

    // Listes numérotées avec #
    text = text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.numberedList, (match, items) => {
        const listItems = items.split('\n').filter(line => line.trim().startsWith('#')).map(line => {
            const content = line.trim().substring(1).trim();
            return `  <li>${content}</li>`;
        }).join('\n');
        return `<ol class="liste-default-jv">\n${listItems}\n</ol>`;
    });

    return text;
}

function formatJvcBlockquotes(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.blockquote, (match, quote) => {
        const quotedText = quote.split('\n').map(line => line.trim().substring(1).trim()).join('<br>');
        return `<blockquote class="blockquote-jv"><p>${quotedText}</p></blockquote>`;
    });
}

function formatBoldAndItalicText(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.combined, (match, bold1, boldContent1, bold2, boldContent2, italic1, italicContent1, italic2, italicContent2) => {
        if (bold1) return `<strong>${boldContent1}</strong>`;
        if (bold2) return `<strong>${boldContent2}</strong>`;
        if (italic1) return `<em>${italicContent1}</em>`;
        if (italic2) return `<em>${italicContent2}</em>`;
        return match;
    });
}

function formatStrikethrough(text) {
    return text.replace(DECENSURED_CONFIG.FORMATTING_REGEX.strikethrough, '<del>$1</del>');
}

function formatImages(text) {
    return text.replace(/https:\/\/(?:www\.|image\.)?noelshack\.com\/[^\s<>"']+\.(png|jpg|jpeg|gif|webp)/gi, (match) => {
        const imageUrl = match;
        let miniUrl;

        if (match.includes('/minis/')) {
            miniUrl = imageUrl;
        } else if (match.includes('/fichiers/')) {
            miniUrl = match.replace('/fichiers/', '/minis/').replace(/\.(jpg|jpeg|gif|webp)$/i, '.png');
        } else if (match.includes('www.noelshack.com/') && match.match(/\/\d{4}-\d{2}-\d-\d+-/)) {
            const urlParts = match.match(/https:\/\/www\.noelshack\.com\/(\d{4})-(\d{2})-(\d)-(\d+-)(.+)\.(png|jpg|jpeg|gif|webp)/i);
            if (urlParts) {
                const [, year, week, day, timestamp, fileName, extension] = urlParts;
                const fichiersUrl = `https://image.noelshack.com/fichiers/${year}/${week}/${day}/${timestamp}${fileName}.${extension}`;
                miniUrl = fichiersUrl.replace('/fichiers/', '/minis/').replace(/\.(jpg|jpeg|gif|webp)$/i, '.png');
            } else {
                miniUrl = imageUrl;
            }
        } else if (match.includes('www.noelshack.com/')) {
            miniUrl = match.replace('www.noelshack.com/', 'image.noelshack.com/minis/').replace(/\.(jpg|jpeg|gif|webp)$/i, '.png');
        } else {
            miniUrl = match.replace('noelshack.com/', 'noelshack.com/minis/').replace(/\.(jpg|jpeg|gif|webp)$/i, '.png');
        }

        return `<a href="${imageUrl}" target="_blank" class="xXx "><img class="img-shack" width="68" height="51" src="${miniUrl}" alt="${imageUrl}"></a>`;
    });
}

function formatLinks(text) {
    return text.replace(/(https?:\/\/[^\s<>"']+)/g, (url, match, offset) => {
        const beforeUrl = text.substring(Math.max(0, offset - 50), offset);
        const afterUrl = text.substring(offset + url.length, Math.min(text.length, offset + url.length + 50));

        if (beforeUrl.includes('href="') || beforeUrl.includes('src="') ||
            afterUrl.startsWith('"') || beforeUrl.endsWith('="')) {
            return url;
        }

        if (url.includes('image.noelshack.com')) {
            return url;
        }

        return `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`;
    });
}

function formatSmileys(text) {
    if (!text) return text;
    return text.replaceAll(smileyGifRegex, (e) => getSmileyImgHtml(e, false));
}

function processParagraphContent(paragraph) {
    const lines = paragraph.split('\n');
    let processedLines = [];
    let inList = false;
    let inQuote = false;
    let quoteLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Citations > texte
        if (line.startsWith('>')) {
            if (!inQuote) {
                inQuote = true;
                quoteLines = [];
            }
            quoteLines.push(line.substring(1).trim());
            continue;
        } else if (inQuote) {
            // Fin de citation
            processedLines.push(`<blockquote class="blockquote-jv">${quoteLines.join('<br>')}</blockquote>`);
            inQuote = false;
            quoteLines = [];
        }

        // Listes - élément ou * élément
        if (line.match(/^[-*]\s+/)) {
            if (!inList) {
                inList = true;
                processedLines.push('<ul class="jv-list">');
            }
            const itemText = line.replace(/^[-*]\s+/, '');
            processedLines.push(`<li>${itemText}</li>`);
            continue;
        } else if (inList) {
            // Fin de liste
            processedLines.push('</ul>');
            inList = false;
        }

        // Mentions @pseudo (simple détection)
        line = line.replace(/@([a-zA-Z0-9_-]+)/g, '<span class="jv-mention">@$1</span>');

        // Ligne normale
        processedLines.push(line);
    }

    // Fermer les blocs ouverts en fin de paragraphe
    if (inQuote) {
        processedLines.push(`<blockquote class="blockquote-jv">${quoteLines.join('<br>')}</blockquote>`);
    }
    if (inList) {
        processedLines.push('</ul>');
    }

    return processedLines.join('\n');
}

function cleanupContent(content) {
    return content
        .replace(/\n\n+/g, '\n')  // Supprime les doubles \n
        .replace(/\n(<\/ul>|<\/blockquote>)/g, '$1')  // Supprime \n avant les fermetures
        .replace(/(<ul[^>]*>|<blockquote[^>]*>)\n/g, '$1')  // Supprime \n après les ouvertures
        .replace(/\n(<li>)/g, '$1')  // Supprime \n avant les <li>
        .replace(/\n/g, '<br>');  // Convertit les \n restants en <br>
}

function formatParagraphs(text) {
    const paragraphs = text.split(/\n\s*\n/);

    const processedParagraphs = paragraphs.map(paragraph => {
        if (!paragraph.trim()) return '';

        const content = processParagraphContent(paragraph.trim());
        if (!content || content.trim() === '') return '';

        const finalContent = cleanupContent(content);

        // Gère la classe spéciale pour les images seules sans ligne blanche précédente
        const isImageOnly = /^<a href[^>]*><img class="message__urlImg"[^>]*><\/a>$/.test(finalContent);
        const className = isImageOnly ? 'class="message__noBlankline"' : '';

        return `<p ${className}>${finalContent}</p>`;
    }).filter(p => p && p.trim() !== '' && p !== '<p></p>').join('');

    // Post-traitement final pour supprimer les paragraphes vides résiduels
    return processedParagraphs.replace(/<p><\/p>/g, '').replace(/<p\s+><\/p>/g, '');
}

function formatMessageContent(rawText) {
    if (!rawText) return '';

    let text = rawText;

    // Formatage JVC natif en priorité
    text = formatJvcBold(text);
    text = formatJvcItalic(text);
    text = formatJvcUnderline(text);
    text = formatJvcStrikethrough(text);
    text = formatJvcCode(text);
    text = formatJvcSpoiler(text);
    text = formatJvcLists(text);
    text = formatJvcBlockquotes(text);

    // Formatage Markdown pour compatibilité
    text = formatSpoilers(text);
    text = formatCodeBlocks(text);
    text = formatInlineCode(text);
    text = formatBoldAndItalicText(text);
    text = formatStrikethrough(text);

    text = formatImages(text);
    text = formatLinks(text);
    text = formatSmileys(text);

    return formatParagraphs(text);
}

function initializeSpoilerHandlers(container) {
    if (!container) return;

    const markdownSpoilers = container.querySelectorAll('.JvCare--masked');
    markdownSpoilers.forEach(spoiler => {
        spoiler.addEventListener('click', function () {
            this.classList.remove('JvCare--masked');
            this.classList.add('JvCare--revealed');
        });
    });
}

///////////////////////////////////////////////////////////////////////////////////////
// Gestion des utilisateurs
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

///////////////////////////////////////////////////////////////////////////////////////
// Gestion des messages
///////////////////////////////////////////////////////////////////////////////////////

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
        const data = await fetchDecensuredApi(`${apiDecensuredMessagesUrl}/${topicId}/999999/0`);
        if (data && Array.isArray(data)) {
            return data;
        }
    } catch (error) {
        logDecensuredError(error, 'getDecensuredMessages');
    }

    return [];
}

///////////////////////////////////////////////////////////////////////////////////////
// Gestion des topics
///////////////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////////////
// Interface utilisateur
///////////////////////////////////////////////////////////////////////////////////////

function buildDecensuredBadge() {
    const badge = document.createElement('div');
    badge.className = 'deboucled-decensured-badge deboucled-decensured-premium-logo';
    badge.id = `deboucled-badge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    badge.setAttribute('deboucled-data-tooltip', `Membre d'élite Décensured`);
    return badge;
}

function buildDecensuredInputUI() {
    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topicmessages') return;

    const modernEditor = document.querySelector('#forums-post-message-editor');
    const traditionalTextarea = document.querySelector('#message_topic');

    let container;
    if (modernEditor) {
        container = modernEditor.parentElement;
    } else if (traditionalTextarea) {
        container = traditionalTextarea.parentElement;
    } else {
        setTimeout(() => {
            initAllPlatitudeSequences();
            buildDecensuredInputUI();
            buildDecensuredTopicInputUI();
            setTimeout(highlightDecensuredTopics, DECENSURED_CONFIG.TOPICS.HIGHLIGHT_DELAY);
        }, DECENSURED_CONFIG.INIT_DELAY);
        return;
    }

    if (!container || document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_MESSAGE_CONTAINER)) return;

    const decensuredContainer = createDecensuredContainer('message');

    if (modernEditor) {
        modernEditor.parentElement.insertBefore(decensuredContainer, modernEditor);
    } else if (traditionalTextarea) {
        traditionalTextarea.parentElement.insertBefore(decensuredContainer, traditionalTextarea);
    }

    setupToggleHandlers('message', (isActive) => {
        if (isActive) {
            replacePostButtonWithDecensured();
            const textarea = getMessageTextarea();
            if (textarea) {
                textarea.classList.add('deboucled-decensured-textarea-active');
                if (textarea.placeholder !== undefined) {
                    textarea.placeholder = 'Message Décensured';
                }
                moveMainTextareaToContainer('message', textarea);
            }
        } else {
            restoreOriginalPostButton();
            const textarea = getMessageTextarea();
            if (textarea) {
                textarea.classList.remove('deboucled-decensured-textarea-active');
                if (textarea.placeholder !== undefined) {
                    textarea.placeholder = '';
                }
                restoreMainTextareaFromContainer('message', textarea);
            }
        }
    });

    addUXHints('message');

    setTimeout(() => throttledSetupTabOrder(), 100);
}

function setupTabOrder() {
    if (tabOrderSetupInProgress) return;
    tabOrderSetupInProgress = true;

    const currentPage = getCurrentPageType(window.location.pathname);

    try {
        if (currentPage === 'topicmessages') {
            setupMessageFormTabOrder(document);
        } else if (currentPage === 'topiclist') {
            const topicForm = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_FORM);
            if (topicForm) {
                setupTopicFormTabOrder(topicForm);
            }
        }
    } finally {
        tabOrderSetupInProgress = false;
    }
}

function setupMessageFormTabOrder(context) {
    // Ordre logique : Toggle → Message réel → Message fake → Bouton Post
    // Utiliser des tabindex élevés (100+) pour éviter les conflits avec JVC
    let tabIndex = 100;

    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topicmessages') return;

    // 1. Toggle button Décensured
    const toggleButton = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_MESSAGE_TOGGLE);
    if (toggleButton) {
        toggleButton.tabIndex = tabIndex++;
    }

    // 2. Textarea principal du message réel
    const mainTextarea = findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_TEXTAREA, document);
    if (mainTextarea) {
        mainTextarea.tabIndex = tabIndex++;
    }

    // 3. Message fake (si visible)
    const fakeTextarea = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_MESSAGE_FAKE_TEXTAREA);
    if (fakeTextarea) {
        fakeTextarea.tabIndex = tabIndex++;
    }

    // 4. Bouton de post (original ou Décensured)
    const postButton = findElement(DECENSURED_CONFIG.SELECTORS.POST_BUTTON, context);
    if (postButton && postButton.style.display !== 'none') {
        postButton.tabIndex = tabIndex++;
    }

    // Bouton Décensured s'il existe
    const decensuredPostButton = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_MESSAGE_POST_BUTTON);
    if (decensuredPostButton) {
        decensuredPostButton.tabIndex = tabIndex++;
    }
}

function setupTopicFormTabOrder(form) {
    // Ordre logique UX : 
    // 1. Toggle → 2. Titre réel → 3. Titre fake → 4. Message réel → 5. Message fake → 6. Post
    let tabIndex = 200;

    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topiclist') return;

    // 1. Toggle button Décensured (point d'entrée)
    const toggleButton = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_TOGGLE);
    if (toggleButton) {
        toggleButton.tabIndex = tabIndex++;
    }

    // 2. Input du vrai titre
    const realTitleInput = document.querySelector('#deboucled-decensured-topic-real-title');
    if (realTitleInput) {
        realTitleInput.tabIndex = tabIndex++;
    }

    // 3. Input du titre JVC (titre de camouflage)
    const titleInput = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_INPUT, form);
    if (titleInput) {
        titleInput.tabIndex = tabIndex++;
    }

    // 4. Textarea principal du message réel
    const mainTextarea = findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_TEXTAREA, document);
    if (mainTextarea) {
        mainTextarea.tabIndex = tabIndex++;
    }

    // 5. Message de camouflage
    const fakeTextarea = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_FAKE_TEXTAREA);
    if (fakeTextarea) {
        fakeTextarea.tabIndex = tabIndex++;
    }

    // 6. Bouton de post (original ou Décensured)
    const postButton = findElement(DECENSURED_CONFIG.SELECTORS.POST_BUTTON, form);
    if (postButton && postButton.style.display !== 'none') {
        postButton.tabIndex = tabIndex++;
    }

    // Bouton Décensured s'il existe
    const decensuredPostButton = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_POST_BUTTON);
    if (decensuredPostButton) {
        decensuredPostButton.tabIndex = tabIndex++;
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// Utilitaires pour l'interface Décensured
///////////////////////////////////////////////////////////////////////////////////////

function createDecensuredContainer(type = 'message') {
    const container = document.createElement('div');
    container.className = 'deboucled-decensured-input';
    container.id = `deboucled-decensured-${type}-container`;

    // 1. Toggle Décensured (point d'entrée)
    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.id = `deboucled-decensured-${type}-toggle`;
    toggleButton.className = 'deboucled-decensured-toggle icon-topic-lock btn btn-primary';
    toggleButton.innerHTML = `${type === 'topic' ? 'Topic' : 'Message'} masqué`;
    toggleButton.title = `Activer le mode ${type} masqué Décensured`;

    container.appendChild(toggleButton);

    // 2. Pour les topics : Titre réel (contenu principal)
    if (type === 'topic') {
        const titleContainers = createTopicTitleContainers();
        titleContainers.forEach(titleContainer => {
            container.appendChild(titleContainer);
        });
    }

    // 3. Conteneur pour le message réel (sera rempli dynamiquement)
    const realMessageContainer = document.createElement('div');
    realMessageContainer.className = 'deboucled-decensured-fake-message-container';
    realMessageContainer.id = `deboucled-decensured-${type}-real-container`;
    realMessageContainer.style.display = 'none';

    const realMessageLabel = document.createElement('label');
    realMessageLabel.textContent = '🔒 Votre véritable message (visible uniquement par les utilisateurs Décensured) :';
    realMessageLabel.className = 'form-label deboucled-decensured-fake-message-label';
    realMessageLabel.id = `deboucled-decensured-${type}-real-label`;

    realMessageContainer.appendChild(realMessageLabel);

    // Placeholder pour la textarea et ses boutons (sera rempli par moveMainTextareaToContainer)
    const textareaWrapper = document.createElement('div');
    textareaWrapper.id = `deboucled-textarea-wrapper-${type}`;
    textareaWrapper.className = 'deboucled-textarea-wrapper';
    realMessageContainer.appendChild(textareaWrapper);

    container.appendChild(realMessageContainer);

    // 4. Message de camouflage (maintenant à la fin)
    const fakeContainer = document.createElement('div');
    fakeContainer.className = 'deboucled-decensured-fake-message-container';
    fakeContainer.id = `deboucled-decensured-${type}-fake-container`;

    const label = document.createElement('label');
    label.textContent = '💬 Message de camouflage (visible par les tous les autres) :';
    label.className = 'form-label deboucled-decensured-fake-message-label';
    label.id = `deboucled-decensured-${type}-fake-label`;

    const inputGroup = document.createElement('div');
    inputGroup.className = 'deboucled-fake-input-group';

    const input = document.createElement('textarea');
    input.id = `deboucled-decensured-${type}-fake-textarea`;
    input.className = 'form-control deboucled-decensured-fake-message-input';
    input.placeholder = 'Optionnel, laissez vide pour génération automatique';
    input.rows = 3;

    const diceButton = document.createElement('button');
    diceButton.type = 'button';
    diceButton.className = 'deboucled-dice-button btn btn-secondary';
    diceButton.innerHTML = '<span class="deboucled-dice-icon deboucled-decensured-dice-logo"></span>';
    diceButton.title = 'Générer automatiquement un message de camouflage';

    diceButton.addEventListener('click', () => {
        let randomMessage;

        const titleInput = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_INPUT);
        if (titleInput && titleInput.value.trim()) {
            const currentTitle = titleInput.value.trim();
            randomMessage = getRandomMessageForTitle(currentTitle);
        } else {
            randomMessage = getRandomPlatitudeMessage();
        }

        input.value = randomMessage;
        input.classList.remove('auto-generated');
        input.style.fontStyle = 'normal';

        const diceIcon = diceButton.querySelector('.deboucled-dice-icon');
        diceIcon.classList.add('rotating');
        setTimeout(() => {
            diceIcon.classList.remove('rotating');
        }, 500);
    });

    if (type === 'message') {
        input.addEventListener('input', () => {
            if (input.classList.contains('auto-generated')) {
                input.classList.remove('auto-generated');
                input.style.fontStyle = 'normal';
            }
        });
    }

    inputGroup.appendChild(input);
    inputGroup.appendChild(diceButton);

    fakeContainer.appendChild(label);
    fakeContainer.appendChild(inputGroup);
    container.appendChild(fakeContainer);

    return container;
}

function createTopicTitleContainers() {
    const titleContainer = document.createElement('div');
    titleContainer.className = 'deboucled-decensured-fake-message-container';
    titleContainer.id = 'deboucled-decensured-topic-titles-container';
    titleContainer.style.display = 'none';

    const realTitleLabel = document.createElement('label');
    realTitleLabel.textContent = '🔒 Titre réel (visible uniquement par les utilisateurs Décensured) :';
    realTitleLabel.className = 'form-label deboucled-decensured-fake-message-label';
    realTitleLabel.setAttribute('for', 'deboucled-decensured-topic-real-title');

    const realTitleInput = document.createElement('input');
    realTitleInput.type = 'text';
    realTitleInput.id = 'deboucled-decensured-topic-real-title';
    realTitleInput.name = 'deboucled-topic-real-title';
    realTitleInput.className = 'form-control deboucled-decensured-fake-message-input';
    realTitleInput.placeholder = 'Titre Décensured';
    realTitleInput.required = true;

    titleContainer.appendChild(realTitleLabel);
    titleContainer.appendChild(realTitleInput);

    const spacer = document.createElement('div');
    spacer.style.marginTop = '15px';
    titleContainer.appendChild(spacer);

    const fakeTitleWrapper = document.createElement('div');
    fakeTitleWrapper.id = 'deboucled-fake-title-wrapper';
    fakeTitleWrapper.style.display = 'none';

    const fakeTitleLabel = document.createElement('label');
    fakeTitleLabel.textContent = '💬 Titre de camouflage (visible par tous les autres) :';
    fakeTitleLabel.className = 'form-label deboucled-decensured-fake-message-label';
    fakeTitleLabel.setAttribute('for', 'input-topic-title');

    const inputGroup = document.createElement('div');
    inputGroup.className = 'deboucled-fake-input-group';

    const diceButton = document.createElement('button');
    diceButton.type = 'button';
    diceButton.className = 'deboucled-dice-button btn btn-secondary deboucled-jvc-dice-button';
    diceButton.innerHTML = '<span class="deboucled-dice-icon deboucled-decensured-dice-logo"></span>';
    diceButton.title = 'Générer un titre de couverture aléatoire';
    diceButton.style.display = 'none';

    inputGroup.appendChild(diceButton);

    fakeTitleWrapper.appendChild(fakeTitleLabel);
    fakeTitleWrapper.appendChild(inputGroup);
    titleContainer.appendChild(fakeTitleWrapper);

    return [titleContainer];
}

function moveMainTextareaToContainer(type, textarea) {
    const textareaWrapper = document.getElementById(`deboucled-textarea-wrapper-${type}`);
    if (!textareaWrapper || !textarea) return;

    const originalTabIndex = textarea.tabIndex;

    const editButtons = textarea.parentElement.querySelector('.messageEditor__buttonEdit') ||
        textarea.parentElement.querySelector('[class*="messageEditor"]') ||
        textarea.nextElementSibling;

    const previewContainer = document.querySelector('.messageEditor__containerPreview');

    textareaWrapper.appendChild(textarea);

    if (editButtons) {
        textareaWrapper.appendChild(editButtons);
    }

    if (previewContainer) {
        textareaWrapper.appendChild(previewContainer);
    }

    if (originalTabIndex > 0) {
        textarea.tabIndex = originalTabIndex;
    }

    textarea.placeholder = 'Message Décensured';
}

function restoreMainTextareaFromContainer(type, textarea) {
    if (!textarea) return;
    const textAreaParent = document.querySelector(DECENSURED_CONFIG.SELECTORS.MESSAGE_EDITOR_CONTAINER);
    if (!textAreaParent) return;
    const textareaWrapper = document.getElementById(`deboucled-textarea-wrapper-${type}`);
    if (textareaWrapper) {
        const elements = Array.from(textareaWrapper.children);
        elements.forEach(element => {
            textAreaParent.appendChild(element);
        });
    }
    textarea.placeholder = '';
}

function addUXHints(type) {
    const container = document.getElementById(`deboucled-decensured-${type}-container`);
    if (!container) return;

    const helpDiv = document.createElement('div');
    helpDiv.className = 'deboucled-ux-help';
    helpDiv.innerHTML = `
        <div class="deboucled-help-text">
            💡 <strong>Mode ${type} masqué :</strong> 
            ${type === 'topic' ?
            'Votre vrai titre et message ne seront visibles que par les utilisateurs Décensured. Le titre et message de camouflage seront vus par tous les autres.' :
            'Votre vrai message ne sera visible que par les utilisateurs Décensured. Le message de camouflage sera vu par tous les autres.'
        }
        </div>
    `;
    helpDiv.style.display = 'none';

    container.appendChild(helpDiv);

    const toggleButton = document.getElementById(`deboucled-decensured-${type}-toggle`);
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            setTimeout(() => {
                const isActive = toggleButton.classList.contains('deboucled-decensured-toggle-active');
                if (isActive) {
                    helpDiv.style.display = 'block';
                    helpDiv.style.animation = 'none';
                    helpDiv.offsetHeight; // Force reflow
                    helpDiv.style.animation = 'fadeIn 0.4s ease-in-out forwards';
                } else {
                    helpDiv.style.display = 'none';
                }
            }, 100);
        });
    }
}

function setupToggleHandlers(type, onToggle) {
    const toggleButton = document.getElementById(`deboucled-decensured-${type}-toggle`);
    const fakeContainer = document.getElementById(`deboucled-decensured-${type}-fake-container`);
    const realContainer = document.getElementById(`deboucled-decensured-${type}-real-container`);

    const titlesContainer = type === 'topic' ? document.getElementById('deboucled-decensured-topic-titles-container') : null;

    let isActive = false;

    function toggleVisibility(container, show) {
        if (!container) return;

        if (show) {
            container.style.display = 'block';
            container.classList.remove('deboucled-decensured-hiding');
            container.classList.add('deboucled-decensured-visible');
        } else {
            if (container.classList.contains('deboucled-decensured-visible')) {
                container.classList.remove('deboucled-decensured-visible');
                container.classList.add('deboucled-decensured-hiding');

                setTimeout(() => {
                    if (!isActive) {
                        container.classList.remove('deboucled-decensured-hiding');
                        container.style.display = 'none';
                    }
                }, 200);
            }
        }
    }

    toggleButton.addEventListener('click', () => {
        isActive = !isActive;
        toggleButton.checked = isActive;

        if (isActive) {
            toggleButton.innerHTML = 'Mode normal';
            toggleButton.title = `Désactiver le mode ${type} masqué Décensured`;
            toggleButton.classList.add('deboucled-decensured-toggle-active');

            toggleVisibility(realContainer, true);
            toggleVisibility(fakeContainer, true);
            if (type === 'topic') {
                toggleVisibility(titlesContainer, true);

                const realTitleInput = document.querySelector('#deboucled-decensured-topic-real-title');
                if (realTitleInput) {
                    setTimeout(() => {
                        realTitleInput.focus();
                        realTitleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            }
        } else {
            toggleButton.innerHTML = `${type === 'topic' ? 'Topic' : 'Message'} masqué`;
            toggleButton.title = `Activer le mode ${type} masqué Décensured`;
            toggleButton.classList.remove('deboucled-decensured-toggle-active');

            toggleVisibility(realContainer, false);
            toggleVisibility(fakeContainer, false);
            if (type === 'topic') {
                toggleVisibility(titlesContainer, false);
            }
        }

        if (onToggle) onToggle(isActive);

        setTimeout(() => throttledSetupTabOrder(), 50);
    });

    return {
        toggleButton,
        fakeContainer,
        realContainer,
        titlesContainer,
        isActive: () => isActive
    };
}

///////////////////////////////////////////////////////////////////////////////////////
// GESTION DES TOPICS
///////////////////////////////////////////////////////////////////////////////////////

function isTopicsDecensuredEnabled() {
    return store.get(storage_optionEnableDecensuredTopics, storage_optionEnableDecensuredTopics_default);
}

function extractTopicIdFromUrl(pathname) {
    const match = pathname.match(/\/forums\/\d+-\d+-(\d+)-/);
    return match ? parseInt(match[1]) : null;
}

function isValidTopicId(topicId) {
    return topicId && parseInt(topicId) >= DECENSURED_CONFIG.TOPICS.MIN_VALID_TOPIC_ID;
}

function extractMessageIdFromUrl(pathname) {
    const match = pathname.match(/\/forums\/message\/(\d+)$/);
    return match ? parseInt(match[1]) : null;
}

function getCurrentMessageIdFromUrl() {
    return extractMessageIdFromUrl(window.location.pathname);
}

function cleanupTopicDecensuredState() {
    if (topicDecensuredState.currentObserver) {
        topicDecensuredState.currentObserver.disconnect();
        topicDecensuredState.currentObserver = null;
    }
    Object.assign(topicDecensuredState, {
        isObservingForm: false,
        formElements: null,
        toggleHandlers: null
    });
}

function getTopicFormElements() {

    if (topicDecensuredState.formElements) {
        const isValid = topicDecensuredState.formElements.titleInput &&
            document.contains(topicDecensuredState.formElements.titleInput);
        if (isValid) return topicDecensuredState.formElements;
    }

    const form = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_FORM);

    let titleInput, messageTextarea;

    if (form) {
        titleInput = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_INPUT, form);
        messageTextarea = findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_TEXTAREA, form);

        if (!titleInput) {
            titleInput = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_INPUT);
        }
        if (!messageTextarea) {
            messageTextarea = findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_TEXTAREA);
        }
    } else {
        titleInput = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_INPUT);
        messageTextarea = findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_TEXTAREA);
    }

    const elements = {
        titleInput: titleInput,
        realTitleInput: document.querySelector('#deboucled-decensured-topic-real-title'),
        messageTextarea: messageTextarea,
        fakeMessageInput: document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_FAKE_TEXTAREA),
        form: form
    };

    if (elements.titleInput && elements.messageTextarea && elements.form) {
        topicDecensuredState.formElements = elements;
    }

    return elements;
}

function buildDecensuredTopicInputUI() {

    if (!isTopicsDecensuredEnabled()) {
        return;
    }

    const currentPage = getCurrentPageType(window.location.pathname);

    if (currentPage === 'topicmessages') {
        const pendingTopicJson = store.get(storage_pendingDecensuredTopic, storage_pendingDecensuredTopic_default);
        if (!pendingTopicJson) {
            setTimeout(verifyCurrentTopicDecensured, DECENSURED_CONFIG.TOPICS.CHECK_DELAY);
        }
        return;
    }

    if (currentPage !== 'topiclist') {
        return;
    }

    const elements = getTopicFormElements();

    if (!elements.form || !elements.titleInput || !elements.messageTextarea) {
        setupTopicFormObserver();
        return;
    }

    injectDecensuredTopicUI(elements);
}

function setupTopicFormObserver() {

    if (topicDecensuredState.isObservingForm) {
        return;
    }

    const formContainer = document.querySelector('#forums-post-topic-editor');
    if (!formContainer) return;

    topicDecensuredState.isObservingForm = true;

    const checkAndInject = () => {
        const contentLength = formContainer.innerHTML ? formContainer.innerHTML.length : 0;

        if (contentLength < 100) {
            return false;
        }

        const elements = getTopicFormElements();

        if (elements.form && elements.titleInput && elements.messageTextarea) {
            const existingContainer = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_CONTAINER);

            if (!existingContainer) {
                injectDecensuredTopicUI(elements);
            }
            cleanupTopicDecensuredState();
            return true;
        }

        return false;
    };

    if (checkAndInject()) return;

    const observer = new MutationObserver(() => {
        checkAndInject();
    });

    topicDecensuredState.currentObserver = observer;
    observer.observe(formContainer, { childList: true, subtree: true });

    setTimeout(checkAndInject, DECENSURED_CONFIG.TOPICS.FORM_OBSERVER_TIMEOUT);
}

function injectDecensuredTopicUI(elements) {
    const { messageTextarea } = elements;

    const existingContainer = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_CONTAINER);
    if (existingContainer) {
        return;
    }

    const container = createDecensuredContainer('topic');

    if (messageTextarea && messageTextarea.parentElement) {
        messageTextarea.parentElement.insertBefore(container, messageTextarea);
    } else {
        console.error('[Décensured] Impossible d\'insérer le container - textarea ou parent manquant');
        return;
    }

    topicDecensuredState.toggleHandlers = setupToggleHandlers('topic', (isActive) => {
        if (isActive) {
            replaceTopicPostButtonWithDecensured();
            setupTopicTextareaForDecensured(elements.messageTextarea);
            setupTopicTitleInputForDecensured(elements.titleInput);
            moveMainTextareaToContainer('topic', elements.messageTextarea);
            reorderTopicFormElements(elements);
        } else {
            restoreOriginalTopicPostButton();
            restoreTopicTextareaFromDecensured(elements.messageTextarea);
            restoreTopicTitleInputFromDecensured(elements.titleInput);
            restoreMainTextareaFromContainer('topic', elements.messageTextarea);
        }
    });

    addUXHints('topic');

    setTimeout(() => throttledSetupTabOrder(), 100);
}

function reorderTopicFormElements(elements) {
    const existingWrapper = document.querySelector('#deboucled-fake-title-wrapper');
    if (!existingWrapper) return;

    const titleInput = elements.titleInput;
    if (!titleInput) return;

    existingWrapper.style.display = 'block';

    if (!titleInput.hasAttribute('data-original-position')) {
        const titleOriginalParent = titleInput.parentElement;
        titleInput.setAttribute('data-original-parent-class', titleOriginalParent.className || 'form-parent');
        titleInput.setAttribute('data-original-position', 'saved');
    }

    if (existingWrapper.contains(titleInput)) {
        titleInput.className = 'form-control deboucled-decensured-fake-message-input';
        return;
    }

    const inputGroup = existingWrapper.querySelector('.deboucled-fake-input-group');
    if (!inputGroup) {
        titleInput.className = 'form-control deboucled-decensured-fake-message-input';
        return;
    }

    const diceButton = inputGroup.querySelector('.deboucled-jvc-dice-button');
    const existingContainer = titleInput.parentElement;
    const isContainerValid = existingContainer?.classList.contains('deboucled-title-input-container');

    const elementToInsert = isContainerValid ? existingContainer : titleInput;
    const insertMethod = diceButton ? 'insertBefore' : 'appendChild';
    const insertArgs = diceButton ? [elementToInsert, diceButton] : [elementToInsert];

    inputGroup[insertMethod](...insertArgs);
    titleInput.className = 'form-control deboucled-decensured-fake-message-input';
}

function setupTopicTextareaForDecensured(textarea) {
    if (!textarea) return;

    textarea.placeholder = 'Message Décensured';
    textarea.classList.add('deboucled-decensured-textarea-active');
}

function restoreTopicTextareaFromDecensured(textarea) {
    if (!textarea) return;

    textarea.placeholder = '';
    textarea.classList.remove('deboucled-decensured-textarea-active');
}

function setupTopicTitleInputForDecensured(titleInput) {
    if (!titleInput) return;

    const originalPlaceholder = titleInput.placeholder;
    titleInput.setAttribute('data-original-placeholder', originalPlaceholder);
    titleInput.placeholder = 'Optionnel, laissez vide pour génération automatique';
    titleInput.classList.add('deboucled-decensured-title-active');

    const existingDiceButton = document.querySelector('#deboucled-fake-title-wrapper .deboucled-jvc-dice-button');
    if (!existingDiceButton) return;

    existingDiceButton.style.display = 'inline-block';

    if (existingDiceButton.hasAttribute('data-listener-added')) return;

    existingDiceButton.setAttribute('data-listener-added', 'true');
    existingDiceButton.addEventListener('click', () => {
        const randomTopicData = getRandomTopicWithMessage();
        titleInput.value = randomTopicData.title;
        titleInput.focus();

        const fakeTextarea = document.querySelector('#deboucled-decensured-topic-fake-textarea');
        const diceIcon = existingDiceButton.querySelector('.deboucled-dice-icon');

        fakeTextarea && (fakeTextarea.value = randomTopicData.message);

        diceIcon?.classList.add('rotating');
        setTimeout(() => diceIcon?.classList.remove('rotating'), 500);
    });
}

function restoreTopicTitleInputFromDecensured(titleInput) {
    if (!titleInput) return;

    const originalPlaceholder = titleInput.getAttribute('data-original-placeholder');
    titleInput.placeholder = originalPlaceholder || '';
    originalPlaceholder && titleInput.removeAttribute('data-original-placeholder');
    titleInput.classList.remove('deboucled-decensured-title-active');

    if (!titleInput.hasAttribute('data-original-position')) {
        document.querySelectorAll('.deboucled-title-input-container:empty, .deboucled-title-wrapper:empty')
            .forEach(container => container.remove());

        document.querySelectorAll('.deboucled-jvc-dice-button:not(#deboucled-fake-title-wrapper .deboucled-jvc-dice-button)')
            .forEach(button => {
                const container = button.closest('.deboucled-title-input-container');
                if (container) {
                    const input = container.querySelector('input');
                    input && container.parentElement?.insertBefore(input, container);
                    container.remove();
                } else {
                    button.remove();
                }
            });
        return;
    }

    const topicTitleContainer = document.querySelector(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_CONTAINER);
    if (topicTitleContainer) {
        titleInput.className = 'topicTitle__input';
        titleInput.id = 'input-topic-title';

        const fakeWrapper = document.querySelector('#deboucled-fake-title-wrapper');
        if (fakeWrapper) {
            fakeWrapper.style.display = 'none';
            const diceButton = fakeWrapper.querySelector('.deboucled-jvc-dice-button');
            diceButton && (diceButton.style.display = 'none');
        }

        topicTitleContainer.appendChild(titleInput);
        titleInput.removeAttribute('data-original-position');
        titleInput.removeAttribute('data-original-parent-class');

        document.querySelectorAll('.deboucled-title-input-container:empty, .deboucled-title-wrapper:empty')
            .forEach(container => container.remove());

        document.querySelectorAll('.deboucled-jvc-dice-button:not(#deboucled-fake-title-wrapper .deboucled-jvc-dice-button)')
            .forEach(button => {
                const container = button.closest('.deboucled-title-input-container');
                if (container) {
                    const input = container.querySelector('input');
                    input && container.parentElement?.insertBefore(input, container);
                    container.remove();
                } else {
                    button.remove();
                }
            });
        return;
    }

    const formParent = document.querySelector('.panel-container .panel-form') ||
        document.querySelector('.form-nouvelle-liste') ||
        document.querySelector('form');

    if (!formParent) {
        titleInput.removeAttribute('data-original-position');
        titleInput.removeAttribute('data-original-parent-class');
        return;
    }

    const messageTextarea = formParent.querySelector('textarea[name="message"]') ||
        formParent.querySelector('#message');

    if (!messageTextarea) {
        titleInput.removeAttribute('data-original-position');
        titleInput.removeAttribute('data-original-parent-class');
        return;
    }

    titleInput.className = 'form-control';

    const fakeWrapper = document.querySelector('#deboucled-fake-title-wrapper');
    if (fakeWrapper) {
        fakeWrapper.style.display = 'none';
        const diceButton = fakeWrapper.querySelector('.deboucled-jvc-dice-button');
        diceButton && (diceButton.style.display = 'none');
    }

    formParent.insertBefore(titleInput, messageTextarea);
    titleInput.removeAttribute('data-original-position');
    titleInput.removeAttribute('data-original-parent-class');

    document.querySelectorAll('.deboucled-title-input-container:empty, .deboucled-title-wrapper:empty')
        .forEach(container => container.remove());

    document.querySelectorAll('.deboucled-jvc-dice-button:not(#deboucled-fake-title-wrapper .deboucled-jvc-dice-button)')
        .forEach(button => {
            const container = button.closest('.deboucled-title-input-container');
            if (container) {
                const input = container.querySelector('input');
                input && container.parentElement?.insertBefore(input, container);
                container.remove();
            } else {
                button.remove();
            }
        });
}

///////////////////////////////////////////////////////////////////////////////////////
// GESTION DES BOUTONS DE CRÉATION DE TOPICS DÉCENSURED
///////////////////////////////////////////////////////////////////////////////////////

function replaceTopicPostButtonWithDecensured() {
    const postButton = findElement(DECENSURED_CONFIG.SELECTORS.POST_BUTTON);
    if (!postButton) return;

    if (postButton.hasAttribute('data-decensured-topic-original')) return;

    postButton.style.display = 'none';
    postButton.setAttribute('data-decensured-topic-original', 'true');

    const decensuredButton = document.createElement('button');
    decensuredButton.id = 'deboucled-decensured-topic-post-button';
    decensuredButton.className = postButton.className;
    decensuredButton.innerHTML = postButton.innerHTML;
    decensuredButton.classList.add('deboucled-decensured-post-button-active');
    decensuredButton.title = 'Publier le topic Décensured';
    decensuredButton.type = 'button';

    postButton.parentElement.insertBefore(decensuredButton, postButton);

    decensuredButton.addEventListener('click', async (event) => {
        if (isProcessingTopicCreation) {
            return false;
        }

        event.preventDefault();
        event.stopPropagation();

        try {
            isProcessingTopicCreation = true;
            await handleTopicDecensuredCreationFlow();
        } catch (error) {
            console.error('❌ Erreur lors de la création du topic Décensured:', error);
            addAlertbox('danger', 'Erreur lors de la création du topic masqué: ' + error.message);
        } finally {
            setTimeout(() => {
                isProcessingTopicCreation = false;
            }, 500);
        }

        return false;
    });

    setTimeout(() => throttledSetupTabOrder(), 50);
}

function restoreOriginalTopicPostButton() {
    const postButton = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_ORIGINAL_TOPIC_POST_BUTTON);
    if (!postButton || !postButton.hasAttribute('data-decensured-topic-original')) return;

    postButton.style.display = '';

    const decensuredButton = document.getElementById('deboucled-decensured-topic-post-button');
    if (decensuredButton) {
        decensuredButton.remove();
    }

    postButton.removeAttribute('data-decensured-topic-original');
}

///////////////////////////////////////////////////////////////////////////////////////
// CRÉATION DE TOPICS
///////////////////////////////////////////////////////////////////////////////////////

async function handleTopicDecensuredCreationFlow() {
    try {
        await handleDecensuredTopicCreation();

        setTimeout(async () => {
            await triggerNativeTopicCreation();
        }, 300);
    } catch (error) {
        console.error('❌ Erreur dans handleTopicDecensuredCreationFlow:', error);
        throw error;
    }
}

async function triggerNativeTopicCreation() {
    const originalPostButton = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_ORIGINAL_TOPIC_POST_BUTTON);
    if (!originalPostButton) {
        console.error('❌ Bouton de post original introuvable');
        return;
    }

    const elements = getTopicFormElements();
    if (elements.titleInput && !elements.titleInput.value.trim()) {
        console.warn('⚠️ Le titre est vide, tentative de récupération...');
        const pendingTopicJson = await store.get(storage_pendingDecensuredTopic, storage_pendingDecensuredTopic_default);
        if (pendingTopicJson) {
            try {
                const pendingTopic = JSON.parse(pendingTopicJson);
                setTextAreaValue(elements.titleInput, pendingTopic.fakeTitle);
            } catch (error) {
                console.error('❌ Erreur lors de la récupération du titre:', error);
            }
        }
    }

    originalPostButton.style.visibility = 'hidden';
    originalPostButton.style.display = '';
    originalPostButton.click();
    setTimeout(() => {
        originalPostButton.style.display = 'none';
        originalPostButton.style.visibility = '';
    }, 50);
}

async function handleDecensuredTopicCreation() {
    const elements = getTopicFormElements();
    if (!elements.titleInput || !elements.messageTextarea) {
        throw new Error('Impossible de trouver les éléments du formulaire');
    }

    const fakeMessageInput = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_FAKE_TEXTAREA);
    const realTitleInput = document.querySelector('#deboucled-decensured-topic-real-title');

    const jvcTitleValue = elements.titleInput.value.trim();
    const realTitleValue = realTitleInput ? realTitleInput.value.trim() : '';
    const initialRealMessage = elements.messageTextarea.value.trim();
    const initialFakeMessage = fakeMessageInput ? fakeMessageInput.value.trim() : '';

    let finalRealTitle, finalFakeTitle, finalFakeMessage;

    if (realTitleValue) {
        finalRealTitle = realTitleValue;

        if (jvcTitleValue || initialFakeMessage) {
            finalFakeTitle = jvcTitleValue || getRandomPlatitudeTitle();
            finalFakeMessage = initialFakeMessage.length > 0 ? initialFakeMessage : getRandomPlatitudeMessage();
        } else {
            const randomTopicData = getRandomTopicWithMessage();
            finalFakeTitle = randomTopicData.title;
            finalFakeMessage = randomTopicData.message;
        }
    } else {
        throw new Error('Le titre réel est obligatoire en mode Topic masqué');
    }

    if (!finalRealTitle || !initialRealMessage) {
        throw new Error('Le titre réel et le message sont obligatoires');
    }

    const processedContent = await processContent(initialRealMessage, finalFakeMessage);

    const topicData = {
        realTitle: finalRealTitle,
        fakeTitle: finalFakeTitle,
        realMessage: initialRealMessage,
        processedContent: processedContent,
        timestamp: Date.now()
    };

    await store.set(storage_pendingDecensuredTopic, JSON.stringify(topicData));

    setTextAreaValue(elements.messageTextarea, finalFakeMessage);

    setTextAreaValue(elements.titleInput, finalFakeTitle);

    if (fakeMessageInput && !initialFakeMessage) {
        fakeMessageInput.value = finalFakeMessage;
    }

    return { success: true, fakeTitle: finalFakeTitle, fakeMessage: finalFakeMessage };
}

async function processNewTopicCreation() {
    const pendingTopicJson = await store.get(storage_pendingDecensuredTopic, storage_pendingDecensuredTopic_default);
    if (!pendingTopicJson) return;

    let pendingTopic;
    try {
        pendingTopic = JSON.parse(pendingTopicJson);
    } catch (error) {
        console.error('Erreur parsing pendingTopic:', error);
        await store.delete(storage_pendingDecensuredTopic);
        return;
    }

    const timeElapsed = Date.now() - pendingTopic.timestamp;
    if (timeElapsed > 30000) {
        await store.delete(storage_pendingDecensuredTopic);
        return;
    }

    const topicId = extractTopicIdFromUrl(window.location.pathname);
    const topicUrl = cleanTopicUrl(window.location.href);
    const username = getUserPseudo();

    if (!topicId || !username) return;

    const messages = document.querySelectorAll('.conteneur-messages-pagi > div.bloc-message-forum');
    if (messages.length !== 1) return;

    const firstMessage = messages[0];
    const authorElement = firstMessage.querySelector('.text-user, .bloc-pseudo-msg');
    const authorName = authorElement ? authorElement.textContent.trim() : '';

    if (authorName !== username) return;

    const success = await createTopicAndMessage(topicId, topicUrl, pendingTopic, firstMessage);

    if (success) {
        addAlertbox('success', 'Topic Décensured créé avec succès !');

        formatTopicAsDecensured(
            pendingTopic.realTitle,
            pendingTopic.fakeTitle,
            { indicatorType: 'default' }
        );

        const decensuredMsg = {
            message_real_content: pendingTopic.realMessage
        };
        await applyDecensuredFormattingToNewTopic(firstMessage, decensuredMsg);
    } else {
        addAlertbox('warning', 'Topic créé sur JVC mais échec de l\'enregistrement Décensured');
    }

    await store.delete(storage_pendingDecensuredTopic);
}

async function createTopicAndMessage(topicId, topicUrl, pendingTopic, messageElement) {
    const topicApiResult = await createDecensuredTopic({
        topic_id: topicId,
        real_title: pendingTopic.realTitle,
        fake_title: pendingTopic.fakeTitle,
        jvc_topic_url: topicUrl
    });

    if (!topicApiResult) return false;

    const messageId = getMessageId(messageElement);
    if (!messageId) return false;

    const messageApiResult = await createDecensuredTopicMessage(
        topicId, messageId, topicUrl, pendingTopic.realTitle,
        pendingTopic.processedContent.fake, pendingTopic.realMessage
    );

    if (messageApiResult) {
        await applyDecensuredFormattingToNewTopic(messageElement, {
            message_real_content: pendingTopic.realMessage
        });
    }

    return messageApiResult;
}

///////////////////////////////////////////////////////////////////////////////////////
// DÉTECTION ET TRAITEMENT DES NOUVEAUX TOPICS CRÉÉS
///////////////////////////////////////////////////////////////////////////////////////

async function checkAndProcessNewTopic() {
    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topicmessages') return;

    await processNewTopicCreation();
}

async function applyDecensuredFormattingToNewTopic(messageElement, decensuredMsg) {
    processDecensuredMessage(messageElement, decensuredMsg);
    addTopicDecensuredIndicator();
}

async function verifyCurrentTopicDecensured() {
    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topicmessages') {
        return;
    }

    const topicId = extractTopicIdFromUrl(window.location.pathname);
    if (!topicId) {
        return;
    }

    try {
        const topicData = await getDecensuredTopic(topicId);
        if (!topicData) return;

        const shouldUpdateTitle = topicData.topic_name_real &&
            topicData.topic_name_real !== topicData.topic_name_fake;

        if (shouldUpdateTitle) {
            formatTopicAsDecensured(
                topicData.topic_name_real,
                topicData.topic_name_fake
            );
        } else {
            formatTopicAsDecensured(null, null, {
                updateTitle: false,
                addIndicator: true,
                indicatorType: 'default',
                highlightPage: true
            });
        }

        await decryptMessages();
    } catch (error) {
        console.error('❌ Erreur lors de la vérification du topic:', error);
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// GESTION DE LA VÉRIFICATION BATCH DES TOPICS DÉCENSURED
///////////////////////////////////////////////////////////////////////////////////////

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

function highlightDecensuredTopics() {
    if (!store.get(storage_optionEnableDecensuredTopics, storage_optionEnableDecensuredTopics_default)) {
        return;
    }

    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topiclist' && currentPage !== 'search') {
        return;
    }

    const allTopics = document.querySelectorAll('.topic-list > li:not(.dfp__atf):not(.message)');

    if (allTopics.length === 0) {
        return;
    }

    const topicsToCheck = Array.from(allTopics).filter(topic => {
        const hasBeenChecked = topic.classList.contains('deboucled-decensured-checked');
        const titleLink = topic.querySelector('.topic-title, .lien-jv.topic-title');
        const hasValidLink = titleLink && titleLink.href;

        return !hasBeenChecked && hasValidLink;
    });

    if (topicsToCheck.length === 0) {
        return;
    }

    const topicIds = [];
    const linksByTopicId = new Map();

    topicsToCheck.forEach(topic => {
        topic.classList.add('deboucled-decensured-checked');

        const titleLink = topic.querySelector('.topic-title, .lien-jv.topic-title');
        const topicUrl = titleLink.href;
        const dataId = topic.getAttribute('data-id');

        let topicId = dataId;

        if (!topicId) {
            const topicIdMatch = topicUrl.match(/\/forums\/\d+-\d+-(\d+)-/);
            topicId = topicIdMatch ? topicIdMatch[1] : null;
        }

        if (topicId) {
            topicIds.push(topicId);
            linksByTopicId.set(topicId, titleLink);
        }
    });

    if (topicIds.length === 0) {

        return;
    }

    getDecensuredTopicsBatch(topicIds).then(topicsData => {
        topicsData.forEach(topicData => {
            const topicId = topicData.topic_id.toString();
            const link = linksByTopicId.get(topicId);
            if (!link) return;

            const topicListItem = link.closest('li');
            if (!topicListItem) return;

            topicListItem.classList.add('deboucled-topic-decensured');

            const hasRealTitle = topicData.topic_name_real && topicData.topic_name_real !== topicData.topic_name_fake;
            if (hasRealTitle) {
                link.textContent = topicData.topic_name_real;
                link.title = `Titre réel : ${topicData.topic_name_real}\nTitre de couverture : ${topicData.topic_name_fake || topicData.topic_name}`;
            }

            const folderIcon = topicListItem.querySelector('.icon-topic-folder, .topic-img');
            if (folderIcon) {
                folderIcon.classList.add('deboucled-decensured-topic-icon');
                folderIcon.title = 'Topic Décensured';
            }
        });
    });
}

function setupDynamicTopicHighlighting() {
    let highlightTimer = null;

    const observer = new MutationObserver((mutations) => {
        let hasNewTopics = false;

        mutations.forEach((mutation) => {
            if (mutation.type !== 'childList') return;

            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;

                const topicLinks = node.querySelectorAll ?
                    node.querySelectorAll('a[href*="/topics/"]:not(.deboucled-decensured-checked)') : [];

                const hasTopicLinks = topicLinks.length > 0;
                const isTopicNode = node.matches && node.matches('a[href*="/topics/"]:not(.deboucled-decensured-checked)');

                if (hasTopicLinks || isTopicNode) {
                    hasNewTopics = true;
                }
            });
        });

        if (hasNewTopics) {
            throttledClearDomCache();
            invalidateMessageElementsCache();

            if (highlightTimer) {
                clearTimeout(highlightTimer);
            }

            highlightTimer = setTimeout(() => {
                throttledHighlightDecensuredTopics();
            }, 500);
        }
    });

    const setupIntersectionObserver = () => {
        const topicObserver = new IntersectionObserver((entries) => {
            const visibleTopics = entries
                .filter(entry => entry.isIntersecting && !entry.target.classList.contains('deboucled-decensured-checked'))
                .map(entry => entry.target);

            if (visibleTopics.length > 0) {
                throttledHighlightDecensuredTopics();
            }
        }, {
            rootMargin: '200px',
            threshold: 0.1
        });

        const existingTopics = document.querySelectorAll('.topic-list > li:not(.dfp__atf):not(.message)');
        existingTopics.forEach(topic => topicObserver.observe(topic));

        return topicObserver;
    };

    const intersectionObserver = setupIntersectionObserver();

    const targetNode = document.body || document.documentElement;
    if (targetNode) {
        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
    }

    return { mutationObserver: observer, intersectionObserver };
}

function setupTopicRedirectionListener() {
    window.addEventListener('pageshow', () => {
        if (window.location.pathname.includes('/topics/') &&
            document.referrer.includes('/forums/topic/add')) {
            setTimeout(() => {
                buildDecensuredInputUI();
                buildDecensuredTopicInputUI();
                verifyCurrentTopicDecensured();
            }, 1000);
        }
    });
}

///////////////////////////////////////////////////////////////////////////////////////
// Déchiffrement automatique des messages et topics
///////////////////////////////////////////////////////////////////////////////////////

function getMessageElements() {
    const now = Date.now();

    if (messageElementsCache && (now - messageElementsCacheTime) < DECENSURED_CONFIG.MESSAGE_CACHE_TTL) {
        return messageElementsCache;
    }

    let messageElements = document.querySelectorAll('.conteneur-messages-pagi > div.bloc-message-forum');

    if (messageElements.length === 0) {
        for (const selector of DECENSURED_CONFIG.SELECTORS.MESSAGE_ELEMENTS) {
            messageElements = document.querySelectorAll(selector);
            if (messageElements.length > 0) {
                break;
            }
        }
    }

    messageElementsCache = Array.from(messageElements);
    messageElementsCacheTime = now;

    return messageElementsCache;
}

function invalidateMessageElementsCache() {
    messageElementsCache = null;
    messageElementsCacheTime = 0;
}

function createMessageIndex(decensuredMessages) {
    const messageIndex = new Map();
    decensuredMessages.forEach(msg => {
        messageIndex.set(msg.message_id.toString(), msg);
    });
    return messageIndex;
}

function animateContentTransition(fromElement, toElement, onComplete) {
    if (!fromElement || !toElement) {
        if (onComplete) onComplete();
        return;
    }

    fromElement.classList.add('fade-out');

    setTimeout(() => {
        fromElement.style.display = 'none';
        fromElement.classList.remove('fade-out');

        toElement.style.display = '';
        toElement.classList.add('fade-in');
        setTimeout(() => toElement.classList.remove('fade-in'), 300);

        if (onComplete) onComplete();
    }, 300);
}

function createToggleButton(originalContent, realContentDiv) {
    const SWITCH_TO_ORIGINAL_TITLE = 'Afficher le message original';
    const SWITCH_TO_DECENSURED_TITLE = 'Afficher le message dissimulé';

    const decensuredIndicator = document.createElement('button');
    decensuredIndicator.className = 'deboucled-decensured-indicator showing-fake icon-topic-lock';
    decensuredIndicator.id = `deboucled-indicator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    decensuredIndicator.innerHTML = SWITCH_TO_ORIGINAL_TITLE;
    decensuredIndicator.title = 'Cliquer pour basculer entre le message original et le message dissimulé';
    decensuredIndicator.style.cursor = 'pointer';

    let showingDecensured = true;

    decensuredIndicator.addEventListener('click', () => {
        if (showingDecensured) {
            animateContentTransition(realContentDiv, originalContent, () => {
                decensuredIndicator.innerHTML = SWITCH_TO_DECENSURED_TITLE;
                decensuredIndicator.title = 'Cliquer pour voir le message Décensured';
                decensuredIndicator.classList.remove('showing-fake');
                showingDecensured = false;
            });
        } else {
            animateContentTransition(originalContent, realContentDiv, () => {
                decensuredIndicator.innerHTML = SWITCH_TO_ORIGINAL_TITLE;
                decensuredIndicator.title = 'Cliquer pour voir le message original';
                decensuredIndicator.classList.add('showing-fake');
                showingDecensured = true;
            });
        }
    });

    return decensuredIndicator;
}

function getCurrentMessageContent(msgElement, decensuredMsg) {
    const realContentDiv = msgElement.querySelector('.deboucled-decensured-content');
    const originalContent = msgElement.querySelector('.message-content p, .text-enrichi-forum p');

    if (realContentDiv && realContentDiv.style.display !== 'none') {
        return decensuredMsg.message_real_content;
    } else if (originalContent && originalContent.style.display !== 'none') {
        return originalContent.textContent || originalContent.innerText;
    }

    return decensuredMsg.message_real_content;
}

function handleDecensuredQuote(msgElement, decensuredMsg, selection = null) {
    const textArea = document.querySelector('#message_topic');
    if (!textArea) return;

    activateDecensuredMode();

    const authorElement = msgElement.querySelector('.bloc-pseudo-msg');
    const dateElement = msgElement.querySelector('.bloc-date-msg');

    const author = authorElement ? authorElement.textContent.trim() : 'Utilisateur';
    const date = dateElement ? dateElement.textContent.trim() : '';

    const newQuoteHeader = `> Le ${date} '''${author}''' a écrit : `;

    if (selection && selection.length) {
        const currentContent = textArea.value.length === 0 ? '' : `${textArea.value.trim()}\n\n`;
        const quotedText = selection.replaceAll('\n', '\n> ');
        setTextAreaValue(textArea, `${currentContent}${newQuoteHeader}\n> ${quotedText}\n\n`);
    } else {
        const messageContent = getCurrentMessageContent(msgElement, decensuredMsg);
        const currentContent = textArea.value.length === 0 ? '' : `${textArea.value.trim()}\n\n`;
        const quotedText = messageContent.replaceAll('\n', '\n> ');
        setTextAreaValue(textArea, `${currentContent}${newQuoteHeader}\n> ${quotedText}\n\n`);
    }

    textArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    textArea.focus({ preventScroll: true });
    textArea.setSelectionRange(textArea.value.length, textArea.value.length);
}

function activateDecensuredMode() {
    const toggleButton = document.getElementById('deboucled-decensured-message-toggle');
    if (!toggleButton) return;

    if (!toggleButton.classList.contains('deboucled-decensured-toggle-active')) {
        toggleButton.click();
    }
}

function removeReportButton(msgElement) {
    const reportSelectors = DECENSURED_CONFIG.SELECTORS.REPORT_BUTTON;

    for (const selector of reportSelectors) {
        const reportButton = msgElement.querySelector(selector);
        if (reportButton) {
            reportButton.remove();
            break;
        }
    }
}

function addDecensuredBadge(msgElement) {
    if (!store.get(storage_optionEnableDecensuredBadges, storage_optionEnableDecensuredBadges_default)) {
        return;
    }

    if (msgElement.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_BADGE)) {
        return;
    }

    const userLevelElement = msgElement.querySelector('.bloc-user-level');
    if (userLevelElement) {
        const badge = buildDecensuredBadge();
        userLevelElement.appendChild(badge);
        return;
    }

    const pseudoLink = msgElement.querySelector('.bloc-pseudo-msg');
    if (!pseudoLink) return;

    const badge = buildDecensuredBadge();
    pseudoLink.insertAdjacentElement('afterend', badge);
}

function processDecensuredMessage(msgElement, decensuredMsg) {
    const realContent = decensuredMsg.message_real_content;
    if (!realContent) return;

    if (msgElement.classList.contains('deboucled-decensured-processed')) {
        return;
    }

    const contentElement = msgElement.querySelector('.message-content, .text-enrichi-forum');
    if (!contentElement) return;

    const originalContent = contentElement.querySelector('p, div');

    const realContentDiv = document.createElement('div');
    realContentDiv.className = 'deboucled-decensured-content';
    realContentDiv.id = `deboucled-content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    realContentDiv.innerHTML = formatMessageContent(realContent);

    const decensuredIndicator = createToggleButton(originalContent, realContentDiv);

    if (originalContent) {
        originalContent.style.display = 'none';
    }

    contentElement.insertBefore(decensuredIndicator, contentElement.firstChild);
    contentElement.appendChild(realContentDiv);

    initializeSpoilerHandlers(realContentDiv);

    addDecensuredBadge(msgElement);

    removeReportButton(msgElement);

    msgElement.classList.add('deboucled-decensured-processed');

    const quoteButton = msgElement.querySelector('.picto-msg-quote');
    if (quoteButton) {
        const newQuoteButton = quoteButton.cloneNode(true);
        quoteButton.parentNode.replaceChild(newQuoteButton, quoteButton);

        newQuoteButton.addEventListener('click', () => {
            handleDecensuredQuote(msgElement, decensuredMsg);
        });
    }
}

async function decryptMessages() {
    if (!await store.get(storage_optionAutoDecryptMessages, storage_optionAutoDecryptMessages_default)) {
        return;
    }

    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage === 'topicmessages') {
        await decryptTopicMessages();
    } else if (currentPage === 'singlemessage') {
        await decryptSingleMessage();
    }
}

async function decryptTopicMessages() {
    const topicId = getCurrentTopicId();
    if (!topicId) return;

    try {
        const decensuredMessages = await getDecensuredMessages(topicId);
        if (!decensuredMessages.length) return;

        const messageIndex = createMessageIndex(decensuredMessages);

        const messageElements = getMessageElements();

        messageElements.forEach(msgElement => {
            const messageId = getMessageId(msgElement);
            if (!messageId) return;

            const decensuredMsg = messageIndex.get(messageId);
            if (!decensuredMsg) return;

            processDecensuredMessage(msgElement, decensuredMsg);
        });
    } catch (error) {
        handleApiError(error, 'Erreur lors du déchiffrement des messages du topic');
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

///////////////////////////////////////////////////////////////////////////////////////
// Gestion du compteur d'utilisateurs dans le header
///////////////////////////////////////////////////////////////////////////////////////

function createDecensuredUsersHeader() {
    if (document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_HEADER_DECENSURED)) return;

    const headerAccount = findElement(DECENSURED_CONFIG.SELECTORS.HEADER_ACCOUNT_CONNECTED);
    if (!headerAccount) return;

    const headerDecensured = document.createElement('div');
    headerDecensured.className = 'headerAccount headerAccount--decensured';
    headerDecensured.id = 'deboucled-header-decensured';

    headerAccount.insertAdjacentElement('afterend', headerDecensured);

    const decensuredButton = document.createElement('span');
    decensuredButton.className = 'headerAccount__notif js-header-decensured';
    decensuredButton.id = 'deboucled-users-counter';
    decensuredButton.setAttribute('data-val', '0');
    decensuredButton.title = 'Cliquer pour voir les utilisateurs Décensured connectés';
    decensuredButton.style.cursor = 'pointer';

    const icon = document.createElement('i');
    icon.className = 'icon-people';
    icon.id = 'deboucled-users-counter-icon';

    decensuredButton.appendChild(icon);
    headerDecensured.appendChild(decensuredButton);

    decensuredButton.addEventListener('click', showDecensuredUsersModal);

    return decensuredButton;
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

function createAndShowUsersModal(users, totalCount) {
    const existingModal = document.querySelector('.deboucled-users-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'deboucled-users-modal';

    const sortedUsers = [...users].sort((a, b) => new Date(b.lastActiveDate) - new Date(a.lastActiveDate));

    const USERS_PER_PAGE = 15;
    let currentPage = 0;
    let isLoading = false;

    function loadMoreUsers() {
        const startIndex = currentPage * USERS_PER_PAGE;
        const endIndex = Math.min(startIndex + USERS_PER_PAGE, sortedUsers.length);
        const usersToShow = sortedUsers.slice(startIndex, endIndex);

        if (usersToShow.length === 0) return;

        const modalBody = modal.querySelector('.deboucled-users-modal-body');
        const userContainer = modalBody.querySelector('.deboucled-users-container');

        if (!userContainer) return;

        usersToShow.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'deboucled-user-item';
            userItem.innerHTML = `
                <a href="https://www.jeuxvideo.com/profil/${encodeURIComponent(user.username)}?mode=infos" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="deboucled-user-pseudo">${escapeHtml(user.username)}</a>
                <span class="deboucled-user-status">Actif ${formatTimeAgo(user.lastActiveDate)}</span>
            `;
            userContainer.appendChild(userItem);
        });

        currentPage++;

        if (endIndex >= sortedUsers.length) {
            const loader = modalBody.querySelector('.deboucled-users-loader');
            if (loader) loader.style.display = 'none';
        }
    }

    modal.innerHTML = `
        <div class="deboucled-users-modal-content">
            <div class="deboucled-users-modal-header">
                <h3><span class="deboucled-decensured-premium-logo users"></span> Utilisateurs Décensured en ligne (${totalCount})</h3>
                <button class="deboucled-users-modal-close">×</button>
            </div>
            <div class="deboucled-users-modal-body">
                ${sortedUsers.length === 0 ?
            '<div class="deboucled-no-users">Aucun utilisateur connecté</div>' :
            `<div class="deboucled-users-container"></div>
                     <div class="deboucled-users-loader">
                         <div class="deboucled-loading-text">Chargement...</div>
                     </div>`
        }
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const modalBody = modal.querySelector('.deboucled-users-modal-body');
    const loader = modal.querySelector('.deboucled-users-loader');

    if (loader) {
        loader.style.display = sortedUsers.length > USERS_PER_PAGE ? 'block' : 'none';
    }

    if (sortedUsers.length > 0) {
        loadMoreUsers();
    }

    if (modalBody && sortedUsers.length > USERS_PER_PAGE) {
        modalBody.addEventListener('scroll', () => {
            if (isLoading) return;

            const { scrollTop, scrollHeight, clientHeight } = modalBody;
            const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
            const isNearBottom = scrollPercentage >= 0.8;

            if (isNearBottom && currentPage * USERS_PER_PAGE < sortedUsers.length) {
                isLoading = true;

                if (loader) loader.style.display = 'block';

                setTimeout(() => {
                    loadMoreUsers();
                    isLoading = false;
                }, 300);
            }
        });
    }

    const closeButton = modal.querySelector('.deboucled-users-modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => modal.remove());
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function toggleDecensuredUsersCountDisplay() {
    const headerElement = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_HEADER_DECENSURED);
    const isEnabled = store.get(storage_optionDisplayDecensuredUsersCount, storage_optionDisplayDecensuredUsersCount_default);

    if (headerElement) {
        headerElement.style.display = isEnabled ? '' : 'none';
    }
}

function toggleDecensuredBadgesDisplay() {
    const isEnabled = store.get(storage_optionEnableDecensuredBadges, storage_optionEnableDecensuredBadges_default);
    const badges = document.querySelectorAll(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_BADGE);

    badges.forEach(badge => {
        badge.style.display = isEnabled ? '' : 'none';
    });
}

function toggleDecensuredFloatingWidget() {
    const isEnabled = store.get(storage_optionDisplayDecensuredTopics, storage_optionDisplayDecensuredTopics_default);

    if (isEnabled) {
        if (!document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_FLOATING_WIDGET)) {
            createDecensuredFloatingWidget();
            startFloatingWidgetMonitoring();
        }
    } else {
        const widget = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_FLOATING_WIDGET);
        if (widget) {
            widget.remove();
        }
    }
}

function updateDecensuredUsersCount(count) {
    const button = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_USERS_COUNTER);
    if (!button) return;

    button.setAttribute('data-val', count);

    button.classList.toggle('headerAccount__notif--hasNotif', count > 0);
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

function startDecensuredUsersMonitoring() {
    if (!store.get(storage_optionDisplayDecensuredUsersCount, storage_optionDisplayDecensuredUsersCount_default)) {
        return;
    }
    if (decensuredUsersTimer) return;

    loadDecensuredUsersData();

    decensuredUsersTimer = setInterval(loadDecensuredUsersData, DECENSURED_CONFIG.USERS_REFRESH_INTERVAL);
}

///////////////////////////////////////////////////////////////////////////////////////
// Widget flottant des topics Décensured
///////////////////////////////////////////////////////////////////////////////////////

function createDecensuredFloatingWidget() {
    if (document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_FLOATING_WIDGET)) return;

    const widget = document.createElement('div');
    widget.id = 'deboucled-floating-widget';
    widget.className = 'deboucled-floating-widget';

    widget.innerHTML = `
        <div class="deboucled-floating-widget-header">
            <h4 class="deboucled-floating-widget-title">
                <span class="deboucled-decensured-premium-logo widget"></span> 
                <div style="display: flex; flex-direction: column; align-items: flex-start; line-height: 1.2;">
                    <span style="font-size: 18px; font-weight: 700;">Décensured</span>
                    <span style="font-size: 13px; font-weight: 400; opacity: 0.9;">Topics récents</span>
                </div>
            </h4>
            <div style="display: flex; align-items: center; gap: 12px;">
                <button class="deboucled-floating-widget-refresh" id="deboucled-floating-widget-refresh" title="Actualiser">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M3 21v-5h5"/>
                    </svg>
                </button>
                <button class="deboucled-floating-widget-close" id="deboucled-floating-widget-close">×</button>
            </div>
        </div>
        <div class="deboucled-floating-widget-content">
            <div class="deboucled-floating-widget-loading">
                <div class="deboucled-spinner active"></div>
            </div>
            <div class="deboucled-floating-widget-topics" id="deboucled-floating-widget-topics"></div>
        </div>
    `;

    if (preferDarkTheme()) {
        widget.classList.add('dark-theme');
    }

    document.body.appendChild(widget);

    setupFloatingWidgetEvents();

    loadFloatingWidgetTopics();

    return widget;
}

function setupFloatingWidgetEvents() {
    const widgetElem = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_FLOATING_WIDGET);
    const closeWidgetButton = document.getElementById('deboucled-floating-widget-close');
    const refreshWidgetButton = document.getElementById('deboucled-floating-widget-refresh');

    if (!widgetElem) return;

    let hoverTimeout;

    widgetElem.addEventListener('click', () => {
        clearTimeout(hoverTimeout);
        showFloatingWidget();
    });

    if (window.innerWidth > 950) { // not smartphone
        widgetElem.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
            showFloatingWidget();
        });

        widgetElem.addEventListener('mouseleave', () => {
            hoverTimeout = setTimeout(() => {
                hideFloatingWidget();
            }, 300);
        });
    }

    if (closeWidgetButton) {
        closeWidgetButton.addEventListener('click', (e) => {
            e.stopPropagation();
            hideFloatingWidget();
        });
    }

    if (refreshWidgetButton) {
        refreshWidgetButton.addEventListener('click', (e) => {
            e.stopPropagation();
            refreshWidgetButton.classList.add('spinning');
            loadFloatingWidgetTopics().finally(() => {
                setTimeout(() => refreshWidgetButton.classList.remove('spinning'), 500);
            });
        });
    }

    createFloatingWidgetOverlay();

    setupThemeToggleListener();
}

function setupThemeToggleListener() {
    const themeToggleButton = document.querySelector('.toggleTheme');

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            setTimeout(() => {
                updateFloatingWidgetTheme();
            }, 100);
        });
    }
}

function createFloatingWidgetOverlay() {
    if (document.querySelector('.deboucled-floating-widget-overlay')) {
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'deboucled-floating-widget-overlay';
    overlay.id = 'deboucled-floating-widget-overlay';

    overlay.addEventListener('click', () => {
        hideFloatingWidget();
    });

    document.body.appendChild(overlay);
}

function updateFloatingWidgetTheme() {
    const widget = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_FLOATING_WIDGET);
    if (!widget) return;

    if (preferDarkTheme()) {
        widget.classList.add('dark-theme');
    } else {
        widget.classList.remove('dark-theme');
    }
}

function showFloatingWidget() {
    const widget = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_FLOATING_WIDGET);
    const overlay = document.querySelector('.deboucled-floating-widget-overlay');

    if (!widget) return;

    widget.classList.remove('hidden');
    widget.classList.add('visible');

    if (overlay) {
        overlay.classList.add('visible');
    }

    if (!widget.hasAttribute('data-loaded')) {
        loadFloatingWidgetTopics();
        widget.setAttribute('data-loaded', 'true');
    }

    if (window.innerWidth <= 768) {
        widget.classList.add('mobile-mode');
    }
}

function hideFloatingWidget() {
    const widget = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_FLOATING_WIDGET);
    const overlay = document.querySelector('.deboucled-floating-widget-overlay');

    if (!widget) return;

    widget.classList.remove('visible', 'mobile-mode');
    widget.classList.add('hidden');

    if (overlay) {
        overlay.classList.remove('visible');
    }
}

async function loadFloatingWidgetTopics() {
    const widget = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_FLOATING_WIDGET);
    const topicsContainer = document.getElementById('deboucled-floating-widget-topics');
    const loadingContainer = document.querySelector('.deboucled-floating-widget-loading');
    const refreshButton = document.getElementById('deboucled-floating-widget-refresh');

    if (!topicsContainer) return;

    if (!widget || !widget.classList.contains('visible')) {
        return;
    }

    if (loadingContainer) {
        loadingContainer.classList.add('active');
    }
    if (refreshButton) refreshButton.disabled = true;

    try {
        const response = await fetchDecensuredApi(`${apiDecensuredTopicsLatestUrl}/${DECENSURED_CONFIG.FLOATING_WIDGET.MAX_TOPICS}`);

        if (!response || !Array.isArray(response)) {
            throw new Error('Réponse API invalide');
        }

        renderFloatingWidgetTopics(response);
    } catch (error) {
        console.error('Erreur lors du chargement des topics:', error);
        const errorClass = preferDarkTheme() ? 'deboucled-floating-error dark-theme' : 'deboucled-floating-error';
        topicsContainer.innerHTML = `
            <div class="${errorClass}">
                <i class="icon-warning"></i>
                <span>Erreur de chargement</span>
                <button onclick="loadFloatingWidgetTopics()">Réessayer</button>
            </div>
        `;
    } finally {
        if (loadingContainer) {
            loadingContainer.classList.remove('active');
        }
        if (refreshButton) refreshButton.disabled = false;
    }
}

function renderFloatingWidgetTopics(topics) {
    const topicsContainer = document.getElementById('deboucled-floating-widget-topics');
    if (!topicsContainer) return;

    if (!topics || topics.length === 0) {
        const emptyClass = preferDarkTheme() ? 'deboucled-floating-widget-empty dark-theme' : 'deboucled-floating-widget-empty';
        topicsContainer.innerHTML = `
            <div class="${emptyClass}">
                <i class="icon-info"></i>
                <span>Aucun topic Décensured récent</span>
            </div>
        `;
        return;
    }

    const html = topics.map(topic => {
        const timeAgo = formatTimeAgo(topic.latest_message_date ?? topic.creation_date);
        const messageCount = topic.nb_message || 1;
        const authorProfileUrl = `https://www.jeuxvideo.com/profil/${encodeURIComponent(topic.topic_author.toLowerCase())}?mode=infos`;

        const displayTitle = topic.topic_name_real || topic.topic_name_fake || topic.topic_name;
        const titleTooltip = topic.topic_name_real && topic.topic_name_real !== topic.topic_name_fake
            ? `Titre réel : ${topic.topic_name_real}\nTitre de couverture : ${topic.topic_name_fake || topic.topic_name}`
            : displayTitle;

        return `
            <div class="deboucled-floating-widget-topic" data-topic-id="${topic.topic_id}">
                <div class="deboucled-floating-widget-topic-header">
                    <i class="deboucled-decensured-topic-icon icon-topic-folder deboucled-floating-widget-topic-icon" title="Topic Décensured"></i>
                    <span class="deboucled-floating-widget-topic-time">${timeAgo}</span>
                </div>
                <a href="${topic.topic_url}" class="deboucled-floating-widget-topic-title" title="${escapeHtml(titleTooltip)}">
                    ${escapeHtml(displayTitle)}
                </a>
                <div class="deboucled-floating-widget-topic-meta">
                    <a href="${authorProfileUrl}" class="deboucled-floating-widget-topic-author" target="_blank" rel="noopener noreferrer" title="Voir le profil de ${escapeHtml(topic.topic_author)}">
                        par ${escapeHtml(topic.topic_author)}
                    </a>
                    <span class="deboucled-floating-widget-topic-messages">${messageCount} msg</span>
                </div>
            </div>
        `;
    }).join('');

    topicsContainer.innerHTML = html;

}

function startFloatingWidgetMonitoring() {
    if (!store.get(storage_optionDisplayDecensuredTopics, storage_optionDisplayDecensuredTopics_default)) {
        return;
    }

    setInterval(() => {
        const widget = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_FLOATING_WIDGET);
        if (widget && widget.classList.contains('visible') && widget.hasAttribute('data-loaded')) {
            debouncedLoadFloatingWidgetTopics();
        }
    }, DECENSURED_CONFIG.FLOATING_WIDGET.REFRESH_INTERVAL);
}

///////////////////////////////////////////////////////////////////////////////////////
// Initialisation
///////////////////////////////////////////////////////////////////////////////////////

async function initDecensured() {
    if (decensuredInitialized) {
        return;
    }

    if (!await store.get(storage_optionEnableDecensured, storage_optionEnableDecensured_default)) {
        return;
    }

    decensuredInitialized = true;

    if (getUserPseudo()) {
        await pingDecensuredApi();

        if (decensuredPingTimer) {
            clearInterval(decensuredPingTimer);
            decensuredPingTimer = null;
        }

        decensuredPingTimer = setInterval(() => {
            pingDecensuredApi().catch(err => console.error('Erreur ping timer :', err));
        }, decensuredPingInterval);
    }

    buildDecensuredInputUI();
    buildDecensuredTopicInputUI();

    createDecensuredUsersHeader();
    toggleDecensuredUsersCountDisplay();
    startDecensuredUsersMonitoring();

    toggleDecensuredFloatingWidget();

    debouncedDecryptMessages();
    debouncedHighlightDecensuredTopics();
    setupTopicRedirectionListener();
    setupDynamicTopicHighlighting();

    await checkAndProcessNewTopic();
}

///////////////////////////////////////////////////////////////////////////////////////
// Posting de messages Decensured
///////////////////////////////////////////////////////////////////////////////////////

async function handleDecensuredPost() {
    const textarea = getMessageTextarea();
    if (!textarea) return;

    const realMessage = textarea.value.trim();
    if (!realMessage) return;

    const fakeMessageInput = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_MESSAGE_FAKE_TEXTAREA);
    let fakeMessage = fakeMessageInput ? fakeMessageInput.value.trim() : '';

    if (!fakeMessage) {
        const titleInput = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_INPUT);
        if (titleInput && titleInput.value.trim()) {
            const currentTitle = titleInput.value.trim();
            fakeMessage = getRandomMessageForTitle(currentTitle);
        } else {
            fakeMessage = getRandomPlatitudeMessage();
        }

        if (fakeMessageInput) {
            fakeMessageInput.value = fakeMessage;
            fakeMessageInput.classList.add('auto-generated');
        }
    }

    try {
        const processedContent = await processContent(realMessage, fakeMessage);
        if (!processedContent) {
            handleApiError(new Error('Échec du traitement du contenu'), 'handleDecensuredPost', true);
            return;
        }

        const jvcResponse = await postDecensuredMessageToJvc(processedContent.fake);
        const messageId = extractMessageId(jvcResponse);

        if (messageId && jvcResponse.redirectUrl) {
            const success = await saveToDecensuredApi(messageId, realMessage, processedContent.fake);

            const redirectUrl = jvcResponse.redirectUrl.startsWith('http')
                ? jvcResponse.redirectUrl
                : window.location.origin + jvcResponse.redirectUrl;

            if (success) {
                addAlertbox("success", "Message Décensured posté avec succès ! Redirection en cours...");
                setTimeout(() => performRedirection(redirectUrl), 1500);
            } else {
                addAlertbox("warning", "Message posté sur JVC mais pas sauvegardé avec Décensured. Redirection en cours...");
                setTimeout(() => performRedirection(redirectUrl), 2000);
            }
        } else {
            setTextAreaValue(textarea, realMessage);
            handleApiError(new Error('Échec du posting sur JVC'), 'handleDecensuredPost', true);
        }

    } catch (error) {
        setTextAreaValue(textarea, realMessage);
        handleApiError(error, 'handleDecensuredPost', true);
    }
}

function extractMessageId(jvcResponse) {
    if (!jvcResponse) return null;

    if (jvcResponse.messageId || jvcResponse.id) {
        return jvcResponse.messageId || jvcResponse.id;
    }

    if (jvcResponse.redirectUrl) {
        const match = jvcResponse.redirectUrl.match(/#post_(\d+)$/);
        if (match) return match[1];
    }

    return null;
}

function performRedirection(redirectUrl) {
    window.location.href = redirectUrl;
    window.location.reload();
}

async function saveToDecensuredApi(messageId, realMessage, fakeContent) {
    const topicId = getCurrentTopicId();
    const username = getUserPseudo();
    const messageUrl = `${window.location.origin}/forums/message/${messageId}`;
    const topicUrl = window.location.origin + window.location.pathname;
    const topicTitle = getTitleFromTopicPage();

    return await createDecensuredMessage(
        messageId,
        username,
        messageUrl,
        fakeContent,
        realMessage,
        topicId,
        topicUrl,
        topicTitle
    );
}

async function postDecensuredMessageToJvc(messageContent) {
    const textarea = getMessageTextarea();
    if (!textarea) return;

    const form = findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_FORM);
    if (!form) {
        throw new Error('Impossible de trouver le formulaire de post JVC');
    }

    const formulaire = document.getElementById("bloc-formulaire-forum");
    setFormDisabled(formulaire, textarea, true);

    try {
        const formData = buildFormData(form, messageContent);
        const body = buildMultipartBody(formData);

        return await submitForm(body, formulaire, textarea);

    } catch (error) {
        setFormDisabled(formulaire, textarea, false);
        logDecensuredError(error, 'postDecensuredMessageToJvc');
        throw error;
    }
}

function setFormDisabled(formulaire, textarea, disabled) {
    if (formulaire) {
        formulaire.classList.toggle("jvchat-disabled-form", disabled);
    }
    if (disabled) {
        textarea.setAttribute("disabled", "true");
    } else {
        textarea.removeAttribute("disabled");
    }
}

function buildFormData(form, messageContent) {
    let formData = new FormData(form);

    formData.set("message_topic", messageContent);
    formData.set("text", messageContent);

    const topicId = getCurrentTopicId();
    const forumId = getForumId ? getForumId() : window.location.pathname.match(/\/forums\/(\d+)-/)?.[1];

    if (topicId) formData.set("topicId", topicId);
    if (forumId) formData.set("forumId", forumId);
    formData.set("group", "1");
    formData.set("messageId", "undefined");

    const jvcPayload = getForumPayload();
    if (jvcPayload) {
        if (jvcPayload.formSession) {
            Object.entries(jvcPayload.formSession).forEach(([key, value]) => {
                formData.set(key, value);
            });
        }
        if (jvcPayload.ajaxToken) {
            formData.set("ajax_hash", jvcPayload.ajaxToken);
        }
    }

    document.querySelectorAll('input[type="hidden"]').forEach(input => {
        if (input.name && input.value) {
            formData.set(input.name, input.value);
        }
    });

    const fs_custom_input = Array.from(form.elements).find(e => /^fs_[a-f0-9]{40}$/i.test(e.name));
    if (fs_custom_input && !formData.has(fs_custom_input.name)) {
        formData.set(fs_custom_input.name, fs_custom_input.value);
    }

    if (!formData.has("ajax_hash")) {
        const ajaxHashInput = document.querySelector('input[name="ajax_hash"], #ajax_hash_liste_messages');
        if (ajaxHashInput) {
            formData.set("ajax_hash", ajaxHashInput.value);
        } else {
            console.error('Aucun ajax_hash trouvé !');
        }
    }

    return formData;
}

function buildMultipartBody(formData) {
    const boundary = "----deboucledformboundary" + Math.random().toString(16).slice(2);
    let body = "";
    for (let [key, value] of formData.entries()) {
        body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
    }
    body += `--${boundary}--\r\n`;
    return { body, boundary };
}

function submitForm(bodyData, formulaire, textarea) {
    return new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: 'POST',
            url: DECENSURED_CONFIG.URLS.POST_MESSAGE,
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'fr',
                'x-requested-with': 'XMLHttpRequest',
                'Content-Type': `multipart/form-data; boundary=${bodyData.boundary}`,
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            },
            data: bodyData.body,
            timeout: DECENSURED_CONFIG.POST_TIMEOUT,
            onload: (response) => handleFormResponse(response, formulaire, textarea, resolve, reject),
            onerror: () => {
                setFormDisabled(formulaire, textarea, false);
                reject(new Error('Erreur réseau'));
            },
            ontimeout: () => {
                setFormDisabled(formulaire, textarea, false);
                reject(new Error('Timeout'));
            }
        });
    });
}

function handleFormResponse(response, formulaire, textarea, resolve, reject) {
    setFormDisabled(formulaire, textarea, false);

    if (response.status < 200 || response.status >= 300) {
        reject(new Error(`Erreur HTTP ${response.status}: ${response.responseText}`));
        return;
    }

    try {
        const res = JSON.parse(response.responseText);

        if (res.errors) {
            const errorMsg = res.errors.session
                ? `Erreur de session JVC: ${res.errors.session}`
                : 'Erreurs JVC: ' + JSON.stringify(res.errors);
            reject(new Error(errorMsg));
            return;
        }

        const messageId = extractMessageId(res);
        if (!messageId) {
            reject(new Error('Réponse JVC sans messageId'));
            return;
        }

        setTextAreaValue(textarea, '');

        const event = new CustomEvent('jvchat:postmessage', {
            detail: {
                id: messageId,
                content: textarea.value,
                username: getUserPseudo()
            }
        });
        dispatchEvent(event);

        resolve(res);

    } catch {
        reject(new Error('Erreur parsing réponse: ' + response.responseText));
    }
}

function getMessageTextarea() {
    return findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_TEXTAREA);
}

function replacePostButtonWithDecensured() {
    const postButton = findElement(DECENSURED_CONFIG.SELECTORS.POST_BUTTON);
    if (!postButton) return;

    if (!postButton.dataset.deboucledOriginal) {
        postButton.dataset.deboucledOriginal = 'true';
        postButton.dataset.deboucledOriginalOnclick = postButton.onclick ? postButton.onclick.toString() : '';
        postButton.dataset.deboucledOriginalType = postButton.type || 'button';
        postButton.setAttribute('data-decensured-message-original', 'true');
    }

    const newButton = postButton.cloneNode(true);
    newButton.id = 'deboucled-decensured-message-post-button';
    postButton.parentNode.replaceChild(newButton, postButton);

    newButton.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleDecensuredPost();
    };

    newButton.type = "button";
    newButton.classList.add('deboucled-decensured-post-button-active');
    newButton.title = 'Poster le message masqué';

    setTimeout(() => setupTabOrder(), 50);
}

function restoreOriginalPostButton() {
    const postButton = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_ORIGINAL_MESSAGE_POST_BUTTON);
    if (!postButton || !postButton.dataset.deboucledOriginal) return;

    const newButton = postButton.cloneNode(true);
    newButton.removeAttribute('id');
    postButton.parentNode.replaceChild(newButton, postButton);

    newButton.type = postButton.dataset.deboucledOriginalType || 'submit';
    newButton.classList.remove('deboucled-decensured-post-button-active');
    newButton.title = '';

    if (postButton.dataset.deboucledOriginalOnclick && postButton.dataset.deboucledOriginalOnclick !== 'null') {
        try {
            newButton.onclick = null;
        } catch (e) {
            console.warn(e);
        }
    }

    delete newButton.dataset.deboucledOriginal;
    delete newButton.dataset.deboucledOriginalOnclick;
    delete newButton.dataset.deboucledOriginalType;
    newButton.removeAttribute('data-decensured-message-original');

    setTimeout(() => setupTabOrder(), 50);
}

function getPayloadFromScripts(doc) {
    const scripts = doc.getElementsByTagName('script');
    let rawPayloadString = null;

    for (let i = 0; i < scripts.length; i++) {
        const scriptContent = scripts[i].textContent || scripts[i].innerText;

        if (scriptContent) {
            const match = scriptContent.match(/window\.jvc\.forumsAppPayload\s*=\s*['"]([^'"]+)['"]/);
            if (match && match[1]) {
                rawPayloadString = match[1];
                break;
            }

            const jvcVarMatch = scriptContent.match(/jvc\.forumsAppPayload\s*=\s*['"]([^'"]+)['"]/);
            if (!rawPayloadString && jvcVarMatch && jvcVarMatch[1]) {
                rawPayloadString = jvcVarMatch[1];
                break;
            }
        }
    }

    if (rawPayloadString) {
        try {
            const decodedPayload = JSON.parse(atob(rawPayloadString));
            return decodedPayload;
        } catch (e) {
            console.error('Erreur parsing payload JVC :', e);
            return null;
        }
    }
    return null;
}

function getForumPayload() {
    if (window.jvc && window.jvc.forumsAppPayload) {
        try {
            return JSON.parse(atob(window.jvc.forumsAppPayload));
        } catch (e) {
            console.error('Erreur parsing window.jvc.forumsAppPayload :', e);
        }
    }

    return getPayloadFromScripts(document);
}

