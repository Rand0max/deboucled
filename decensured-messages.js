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

    realContentDiv.classList.add('deboucled-content-entering');

    realContentDiv.addEventListener('animationend', function handleAnimation(e) {
        if (e.animationName === 'deboucled-content-enter') {
            realContentDiv.classList.remove('deboucled-content-entering');
            realContentDiv.classList.add('deboucled-content-entered');
            realContentDiv.removeEventListener('animationend', handleAnimation);
        }
    }, { once: true });

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
        logDecensuredError(error, 'decryptMessages - Erreur lors du déchiffrement des messages du topic');
    }
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
