///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED MESSAGES
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

async function processContent(message, fakeMessage = '') {
    try {
        let finalFake = fakeMessage;

        if (!finalFake) {
            const currentTitle = getTitleFromTopicPage('fake');
            if (currentTitle) {
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

async function processDecensuredMessage(msgElement, decensuredMsg) {
    const realContent = decensuredMsg.message_real_content;
    if (!realContent) return;

    if (msgElement.classList.contains('deboucled-decensured-processed')) {
        return;
    }

    const authorElement = msgElement.querySelector('.bloc-pseudo-msg');
    if (authorElement) {
        const username = authorElement.textContent.trim();
        if (username) {
            decensuredUsersSet.add(username.toLowerCase());
            await saveLocalStorage();
        }
    }

    const contentElement = msgElement.querySelector('.message-content, .text-enrichi-forum');
    if (!contentElement) return;

    const originalContentsContainer = document.createElement("div");
    originalContentsContainer.className = 'deboucled-decensured-original-content-container';
    originalContentsContainer.id = `deboucled-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const originalContents = contentElement.querySelectorAll(':scope > :not([class*="deboucled"])');
    originalContents.forEach(content => {
        originalContentsContainer.appendChild(content);
    });

    const realContentDiv = document.createElement('div');
    realContentDiv.className = 'deboucled-decensured-content';
    realContentDiv.id = `deboucled-content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    realContentDiv.innerHTML = formatMessageContent(realContent);

    const decensuredIndicator = createToggleButton(originalContentsContainer, realContentDiv);

    if (originalContentsContainer) {
        originalContentsContainer.style.display = 'none';
    }

    contentElement.insertBefore(decensuredIndicator, contentElement.firstChild);
    contentElement.insertBefore(originalContentsContainer, decensuredIndicator.nextSibling);
    contentElement.appendChild(realContentDiv);

    realContentDiv.classList.add('deboucled-content-entering');

    realContentDiv.addEventListener('animationend', function handleAnimation(e) {
        if (e.animationName === 'deboucled-content-enter') {
            realContentDiv.classList.remove('deboucled-content-entering');
            realContentDiv.classList.add('deboucled-content-entered');
            realContentDiv.removeEventListener('animationend', handleAnimation);
        }
    }, { once: true });

    initializeSpoilerHandlers(realContentDiv);

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
        await throttledDecryptTopicMessages();
    } else if (currentPage === 'singlemessage') {
        await decryptSingleMessage();
    }
}

async function addDecensuredBadgesToAllMessages() {
    if (!await store.get(storage_optionEnableDecensuredBadges, storage_optionEnableDecensuredBadges_default)) {
        return;
    }

    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topicmessages') return;

    try {
        const messageElements = getMessageElements();
        if (messageElements.length === 0) return;

        const usernames = [];
        const usernameToElements = new Map();
        const uncachedUsernames = [];

        messageElements.forEach(msgElement => {
            const pseudoLink = msgElement.querySelector('.bloc-pseudo-msg');
            if (!pseudoLink) return;

            const username = pseudoLink.textContent.trim();
            if (!username) return;

            usernames.push(username);

            if (!usernameToElements.has(username)) {
                usernameToElements.set(username, []);
            }
            usernameToElements.get(username).push(msgElement);

            if (!decensuredUsersSet.has(username.toLowerCase())) {
                uncachedUsernames.push(username);
            }
        });

        if (uncachedUsernames.length > 0) await checkDecensuredUsers([...new Set(uncachedUsernames)]);

        const uniqueUsernames = [...new Set(usernames)];
        uniqueUsernames.forEach(username => {
            if (!decensuredUsersSet.has(username.toLowerCase())) return;
            const elements = usernameToElements.get(username);
            if (elements) {
                elements.forEach(msgElement => addDecensuredBadge(msgElement));
            }
        });
    } catch (error) {
        logDecensuredError(error, 'addDecensuredBadgesToAllMessages');
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

        messageElements.forEach(async msgElement => {
            const messageId = getMessageId(msgElement);
            if (!messageId) return;

            const decensuredMsg = messageIndex.get(messageId);
            if (!decensuredMsg) return;

            await processDecensuredMessage(msgElement, decensuredMsg);
        });
    } catch (error) {
        logDecensuredError(error, 'decryptMessages - Erreur lors du déchiffrement des messages du topic');
    }
}

async function handleDecensuredQuote(msgElement, decensuredMsg, selection = null) {
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

    if (author.toLowerCase() !== userPseudo?.toLowerCase()) {
        messageQuotesPendingArray.push(prepareMessageQuoteInfo(msgElement));
        await saveLocalStorage();
    }
}

function extractMessageIdFromUrl(pathname) {
    const match = pathname.match(/\/forums\/message\/(\d+)$/);
    return match ? parseInt(match[1]) : null;
}

function getCurrentMessageIdFromUrl() {
    return extractMessageIdFromUrl(window.location.pathname);
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

function invalidateMessageElementsCache() {
    messageElementsCache = null;
    messageElementsCacheTime = 0;
}

///////////////////////////////////////////////////////////////////////////////////////
// JVCHAT INTEGRATION
///////////////////////////////////////////////////////////////////////////////////////

async function processJvChatDecensuredMessage(jvchatElement, decensuredMsg) {
    const realContent = decensuredMsg.message_real_content;
    if (!realContent) return;

    if (jvchatElement.classList.contains('deboucled-decensured-processed')) {
        return;
    }

    const authorElement = jvchatElement.querySelector('.jvchat-author');
    if (authorElement) {
        const username = authorElement.textContent.trim();
        if (username) {
            decensuredUsersSet.add(username.toLowerCase());
            await saveLocalStorage();
        }
    }

    const contentElement = jvchatElement.querySelector('.jvchat-content');
    if (!contentElement) return;

    const originalContent = contentElement.querySelector('div, p');

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

    realContentDiv.classList.add('deboucled-content-entering');

    realContentDiv.addEventListener('animationend', function handleAnimation(e) {
        if (e.animationName === 'deboucled-content-enter') {
            realContentDiv.classList.remove('deboucled-content-entering');
            realContentDiv.classList.add('deboucled-content-entered');
            realContentDiv.removeEventListener('animationend', handleAnimation);
        }
    }, { once: true });

    initializeSpoilerHandlers(realContentDiv);

    addJvChatDecensuredBadge(jvchatElement);

    jvchatElement.classList.add('deboucled-decensured-processed');

    const quoteButton = jvchatElement.querySelector('.jvchat-quote');
    if (quoteButton) {
        const newQuoteButton = quoteButton.cloneNode(true);
        quoteButton.parentNode.replaceChild(newQuoteButton, quoteButton);

        newQuoteButton.addEventListener('click', () => {
            handleJvChatDecensuredQuote(jvchatElement, decensuredMsg);
        });
    }
}

function addJvChatDecensuredBadge(jvchatElement) {
    const toolbarElement = jvchatElement.querySelector('.jvchat-toolbar');
    if (!toolbarElement) return;

    const existingBadge = toolbarElement.querySelector('.deboucled-decensured-badge');
    if (existingBadge) return;

    const badge = document.createElement('span');
    badge.className = 'deboucled-decensured-badge deboucled-decensured-premium-logo';
    badge.setAttribute('deboucled-data-tooltip', 'Membre d\'élite Décensured');

    const authorElement = toolbarElement.querySelector('.jvchat-author');
    if (authorElement) {
        authorElement.parentNode.insertBefore(badge, authorElement.nextSibling);
    } else {
        toolbarElement.appendChild(badge);
    }
}

async function handleJvChatDecensuredQuote(jvchatElement, decensuredMsg) {
    const textArea = document.querySelector('#message_topic');
    if (!textArea) return;

    activateDecensuredMode();

    const authorElement = jvchatElement.querySelector('.jvchat-author');
    const dateElement = jvchatElement.querySelector('.jvchat-date');

    const author = authorElement ? authorElement.textContent.trim() : 'Utilisateur';
    const date = dateElement ? dateElement.getAttribute('title') || dateElement.textContent.trim() : '';

    const newQuoteHeader = `> Le ${date} '''${author}''' a écrit : `;

    const messageContent = decensuredMsg.message_real_content || '';
    const currentContent = textArea.value.length === 0 ? '' : `${textArea.value.trim()}\n\n`;
    const quotedText = messageContent.replaceAll('\n', '\n> ');
    setTextAreaValue(textArea, `${currentContent}${newQuoteHeader}\n> ${quotedText}\n\n`);

    textArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    textArea.focus({ preventScroll: true });
    textArea.setSelectionRange(textArea.value.length, textArea.value.length);

    if (author.toLowerCase() !== userPseudo?.toLowerCase()) {
        messageQuotesPendingArray.push(prepareMessageQuoteInfo(jvchatElement));
        await saveLocalStorage();
    }
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

function createMessageIndex(decensuredMessages) {
    const messageIndex = new Map();
    decensuredMessages.forEach(msg => {
        messageIndex.set(msg.message_id.toString(), msg);
    });
    return messageIndex;
}

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
