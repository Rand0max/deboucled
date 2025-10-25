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

function updateTopicTitle(realTitle, fakeTitle = null) {
    const topicTitleElement = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_DISPLAY);
    if (!topicTitleElement || !realTitle) {
        return false;
    }

    const originalTitle = topicTitleElement.textContent;

    // Utiliser l'animation pour changer le titre
    animateTopicTitleTransition(topicTitleElement, realTitle, () => {
        topicTitleElement.setAttribute('topic-fake-title', fakeTitle);
        topicTitleElement.setAttribute('topic-real-title', realTitle);

        document.title = `DÉCENSURED - ${realTitle}`;

        const fakeTitleForTooltip = fakeTitle || originalTitle;
        if (fakeTitleForTooltip !== realTitle) {
            topicTitleElement.setAttribute('deboucled-data-tooltip', `Titre réel : ${realTitle}\nTitre de couverture : ${fakeTitleForTooltip}`);
            topicTitleElement.setAttribute('data-tooltip-location', 'bottom');
        }
    });

    return true;
}

function addTopicDecensuredIndicator(indicatorType = 'default') {
    const topicTitleElement = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_DISPLAY);
    if (!topicTitleElement || topicTitleElement.querySelector('.deboucled-decensured-topic-indicator')) {
        return false;
    }

    const indicator = document.createElement('span');
    indicator.className = 'deboucled-decensured-topic-indicator deboucled-topic-indicator-entering';

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
    await processDecensuredMessage(messageElement, decensuredMsg);
    addTopicDecensuredIndicator();
}

async function verifyCurrentTopicDecensured() {
    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topicmessages') return;

    const topicId = extractTopicIdFromUrl(window.location.pathname);
    if (!topicId) return;

    try {
        const topicData = await getDecensuredTopic(topicId);
        if (topicData) {

            const shouldUpdateTitle = topicData.topic_name_real && topicData.topic_name_real !== topicData.topic_name_fake;

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
        }

        if (store.get(storage_optionAutoDecryptMessages, storage_optionAutoDecryptMessages_default)) {
            await decryptMessages();
        }

        await addDecensuredBadgesToAllMessages();
    } catch (error) {
        logDecensuredError(error, 'checkAndHighlightCurrentTopicIfDecensured - Erreur lors de la vérification du topic');
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
            logDecensuredError(error, 'replaceTopicPostButtonWithDecensured - Erreur lors de la création du topic Décensured');
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

function extractTitleFromElement(titleElement, titleType) {
    if (!titleElement) return null;

    const attributeName = titleType === 'real' ? 'topic-real-title' : 'topic-fake-title';
    const savedTitle = titleElement.getAttribute(attributeName);
    if (savedTitle && savedTitle.trim()) {
        return savedTitle.trim();
    }

    return titleElement.firstChild ? titleElement.firstChild.textContent.trim() : titleElement.textContent.trim();
}

function getTitleFromTopicPage(titleType = 'fake') {
    const titleElement = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_DISPLAY);
    if (titleElement) {
        const title = extractTitleFromElement(titleElement, titleType);
        if (title) return title;
    }

    const additionalSelectors = [
        '.bloc-title h1',
        '.titre-topic'
    ];

    for (const selector of additionalSelectors) {
        const titleElement = document.querySelector(selector);
        const title = extractTitleFromElement(titleElement, titleType);
        if (title) return title;
    }

    return document.title.replace(' - Jeuxvideo.com', '').replace('DÉCENSURED - ', '').trim();
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

async function preloadDecensuredTopicsStatus(topicElements = null) {
    if (!isTopicsDecensuredEnabled()) return;

    try {
        if (!topicElements) {
            topicElements = document.querySelectorAll('.topic-list .topic-item, .forum-topic-list .topic-subject');
        }

        if (!topicElements.length) return;

        const topicIds = [];
        const topicElementsMap = new Map();

        for (const element of topicElements) {
            const topicLink = element.querySelector('a[href*="/forums/"]') || element;
            if (!topicLink.href) continue;

            const topicId = extractTopicIdFromUrl(topicLink.href);
            if (isValidTopicId(topicId)) {
                topicIds.push(topicId);
                topicElementsMap.set(topicId, element);
            }
        }

        if (topicIds.length === 0) return;

        const decensuredTopics = await getDecensuredTopicsBatch(topicIds);

        for (const topic of decensuredTopics) {
            const topicElement = topicElementsMap.get(topic.topic_id);
            if (topicElement) markTopicAsDecensured(topicElement, topic);
        }

    } catch (error) {
        logDecensuredError(error, 'preloadDecensuredTopicsStatus - Erreur lors du préchargement des statuts');
    }
}

function markTopicAsDecensured(topicElement, topicData) {
    if (!topicElement || !topicData) return;
    if (topicElement.querySelector('.deboucled-decensured-topic-list-indicator')) return;

    const link = topicElement.querySelector('.topic-title, .lien-jv.topic-title');
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
}
