///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED TOPICS
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

    document.title = `DÉCENSURED - ${realTitle}`;

    const fakeTitleForTooltip = fakeTitle || originalTitle;
    if (fakeTitleForTooltip !== realTitle) {
        topicTitleElement.setAttribute('deboucled-data-tooltip', `Titre réel : ${realTitle}\nTitre de couverture : ${fakeTitleForTooltip}`);
        topicTitleElement.setAttribute('data-tooltip-location', 'bottom');
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

    setTimeout(() => throttledSetupTabOrder(), DECENSURED_CONFIG.TAB_ORDER_DELAY);
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

function cleanTopicUrl(url) {
    if (!url) return url;

    const cleanUrl = url.split('#')[0];

    if (cleanUrl.endsWith('.htm')) {
        return cleanUrl;
    }

    console.warn('URL de topic ne se termine pas par .htm :', url);
    return url;
}
