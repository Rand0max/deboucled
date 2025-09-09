///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED UI
///////////////////////////////////////////////////////////////////////////////////////

function buildDecensuredBadge() {
    const badge = document.createElement('div');
    badge.className = 'deboucled-decensured-badge deboucled-decensured-premium-logo';
    badge.id = `deboucled-badge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    badge.setAttribute('deboucled-data-tooltip', `Membre d'élite Décensured`);
    return badge;
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

function buildDecensuredMessagesUI() {
    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topicmessages') return;

    if (isTopicsDecensuredEnabled()) {
        const pendingTopicJson = store.get(storage_pendingDecensuredTopic, storage_pendingDecensuredTopic_default);
        if (!pendingTopicJson) {
            setTimeout(verifyCurrentTopicDecensured, DECENSURED_CONFIG.TOPICS.CHECK_DELAY);
        }
    }

    const modernEditor = document.querySelector('#forums-post-message-editor');
    const traditionalTextarea = document.querySelector('#message_topic');

    let container;
    if (modernEditor) {
        container = modernEditor.parentElement;
    } else if (traditionalTextarea) {
        container = traditionalTextarea.parentElement;
    } else {
        setupFormElementsObserver();
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

    setTimeout(() => throttledSetupTabOrder(), DECENSURED_CONFIG.TAB_ORDER_DELAY_LONG);
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
    let tabIndex = DECENSURED_CONFIG.TAB_INDEX_MESSAGE_START;

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
    let tabIndex = DECENSURED_CONFIG.TAB_INDEX_TOPIC_START;

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
        const isValid = topicDecensuredState.formElements.titleInput && document.contains(topicDecensuredState.formElements.titleInput);
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

function buildDecensuredTopicsUI() {
    if (decensuredIsBuilding) return;
    if (!isTopicsDecensuredEnabled()) return;
    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topiclist') return;

    decensuredIsBuilding = true;

    const elements = getTopicFormElements();
    if (!elements.form || !elements.titleInput || !elements.messageTextarea) {
        if (!decensuredFormObserver) setupFormElementsObserver();
        decensuredIsBuilding = false;
        return;
    }

    injectDecensuredTopicUI(elements);
    decensuredIsBuilding = false;
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
        logDecensuredError(new Error('Impossible d\'insérer le container - textarea ou parent manquant'), 'addDecensuredTopicContainer');
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

    setTimeout(() => throttledSetupTabOrder(), DECENSURED_CONFIG.TAB_ORDER_DELAY_LONG);
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
        setTimeout(() => diceIcon?.classList.remove('rotating'), DECENSURED_CONFIG.DICE_ROTATION_DELAY);
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

function activateDecensuredMode() {
    const toggleButton = document.getElementById('deboucled-decensured-message-toggle');
    if (!toggleButton) return;

    if (!toggleButton.classList.contains('deboucled-decensured-toggle-active')) {
        toggleButton.click();
    }
}

function animateContentTransition(fromElement, toElement, onComplete) {
    if (!fromElement || !toElement) {
        if (onComplete) onComplete();
        return;
    }

    const toggleButton = fromElement.closest('.bloc-message-forum, .conteneur-message')?.querySelector('.deboucled-decensured-indicator');
    if (toggleButton) {
        toggleButton.classList.add('transitioning');
    }

    fromElement.classList.add('deboucled-content-hiding');

    fromElement.addEventListener('animationend', function handleHideAnimation(e) {
        if (e.animationName === 'deboucled-content-hide') {
            fromElement.removeEventListener('animationend', handleHideAnimation);
            fromElement.style.display = 'none';
            fromElement.classList.remove('deboucled-content-hiding');

            toElement.style.display = '';
            toElement.classList.add('deboucled-content-revealing');

            toElement.addEventListener('animationend', function handleRevealAnimation(e) {
                if (e.animationName === 'deboucled-content-reveal') {
                    toElement.removeEventListener('animationend', handleRevealAnimation);
                    toElement.classList.remove('deboucled-content-revealing');

                    if (toggleButton) {
                        toggleButton.classList.remove('transitioning');
                    }

                    if (onComplete) onComplete();
                }
            }, { once: true });
        }
    }, { once: true });
}

function animateTopicTitleTransition(titleElement, newText, onComplete) {
    if (!titleElement) {
        if (onComplete) onComplete();
        return;
    }

    titleElement.classList.add('deboucled-title-exiting');

    titleElement.addEventListener('animationend', function handleExitAnimation(e) {
        if (e.animationName === 'deboucled-title-exit') {
            titleElement.removeEventListener('animationend', handleExitAnimation);

            const children = Array.from(titleElement.children);
            titleElement.textContent = newText;

            const allowedChildren = children.filter(child => {
                if (child.classList && child.classList.contains('deboucled-decensured-topic-indicator')) {
                    return true;
                }

                if (child.classList && child.classList.contains('deboucled-blacklisted')) {
                    return false;
                }

                return true;
            });

            allowedChildren.forEach(child => {
                titleElement.appendChild(child);
            });

            titleElement.classList.remove('deboucled-title-exiting');
            titleElement.classList.add('deboucled-title-entering');

            titleElement.addEventListener('animationend', function handleEnterAnimation(e) {
                if (e.animationName === 'deboucled-title-enter') {
                    titleElement.classList.remove('deboucled-title-entering');
                    titleElement.removeEventListener('animationend', handleEnterAnimation);

                    if (onComplete) onComplete();
                }
            }, { once: true });
        }
    }, { once: true });
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

function setupFormElementsObserver() {
    if (decensuredFormObserver) return;

    const currentPage = getCurrentPageType(window.location.pathname);
    let targetSelectors = [];
    let callbackFunction = null;

    if (currentPage === 'topicmessages') {
        targetSelectors = ['#forums-post-message-editor', '#message_topic'];
        callbackFunction = buildDecensuredMessagesUI;
    } else if (currentPage === 'topiclist') {
        targetSelectors = ['#forums-post-topic-editor', '#input-topic-title', '#message_topic'];
        callbackFunction = buildDecensuredTopicsUI;
    } else {
        return;
    }

    const targetNode = document.querySelector('.main-content') ||
        document.querySelector('#forums-post-message-editor')?.parentElement ||
        document.querySelector('#forums-post-topic-editor')?.parentElement ||
        document.body;

    if (!targetNode) {
        console.warn('[Décensured] Impossible de trouver un nœud cible pour l\'observer');
        return;
    }

    let retryCount = 0;

    const checkAndInject = () => {
        const foundElements = targetSelectors.filter(selector => document.querySelector(selector));
        if (foundElements.length > 0) {
            if (callbackFunction) callbackFunction();
            cleanupFormObserver();
            return true;
        }
        return false;
    };

    if (checkAndInject()) return;

    decensuredFormObserver = new MutationObserver((mutations) => {
        let shouldCheck = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const hasTargetElement = targetSelectors.some(selector => {
                            return node.querySelector?.(selector) || node.id === selector.replace('#', '');
                        });
                        if (hasTargetElement) {
                            shouldCheck = true;
                        }
                    }
                });
            }
        });

        if (shouldCheck) {
            retryCount++;
            if (retryCount > DECENSURED_CONFIG.API_MAX_RETRIES) {
                console.warn(`[Décensured] Abandon après ${DECENSURED_CONFIG.API_MAX_RETRIES} tentatives d'injection de l'UI`);
                cleanupFormObserver();
                return;
            }
            setTimeout(checkAndInject, DECENSURED_CONFIG.DOM_STABILIZATION_DELAY);
        }
    });

    decensuredFormObserver.observe(targetNode, {
        childList: true,
        subtree: true
    });

    setTimeout(() => { cleanupFormObserver(); }, DECENSURED_CONFIG.OBSERVER_CLEANUP_TIMEOUT);
}

function cleanupFormObserver() {
    if (decensuredFormObserver) {
        decensuredFormObserver.disconnect();
        decensuredFormObserver = null;
    }
}

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
        }, DECENSURED_CONFIG.DICE_ROTATION_DELAY);
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

    const jvcContainer = textarea.parentElement;
    if (!jvcContainer) return;

    const originalTabIndex = textarea.tabIndex;
    const editButtons = jvcContainer.querySelector('.messageEditor__buttonEdit');
    const previewContainer = document.querySelector('.messageEditor__containerPreview');

    const decensuredContainer = textareaWrapper.closest(DECENSURED_CONFIG.SELECTORS.DECENSURED_CONTAINER);
    if (decensuredContainer && decensuredContainer.parentElement) {
        decensuredContainer.setAttribute('data-original-parent-selector', getElementSelector(decensuredContainer.parentElement));
        jvcContainer.insertBefore(decensuredContainer, textarea);
        textareaWrapper.appendChild(textarea);
        if (editButtons) textareaWrapper.appendChild(editButtons);
        if (previewContainer) textareaWrapper.appendChild(previewContainer);
    }

    if (originalTabIndex > 0) textarea.tabIndex = originalTabIndex;
    textarea.placeholder = 'Message Décensured';
}

function getElementSelector(element) {
    if (!element) return '';
    if (element.id) return `#${element.id}`;
    if (element.className) {
        const classes = element.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
}

function restoreMainTextareaFromContainer(type, textarea) {
    if (!textarea) return;

    const textareaWrapper = document.getElementById(`deboucled-textarea-wrapper-${type}`);
    if (!textareaWrapper) return;

    const jvcContainer = document.querySelector(DECENSURED_CONFIG.SELECTORS.MESSAGE_EDITOR_CONTAINER);
    if (!jvcContainer) return;

    const elements = Array.from(textareaWrapper.children);
    elements.forEach(element => { jvcContainer.appendChild(element); });

    const decensuredContainer = textareaWrapper.closest(DECENSURED_CONFIG.SELECTORS.DECENSURED_CONTAINER);
    if (decensuredContainer) {
        const originalParentSelector = decensuredContainer.getAttribute('data-original-parent-selector');
        let targetParent = null;
        if (originalParentSelector) targetParent = document.querySelector(originalParentSelector);
        if (!targetParent) targetParent = jvcContainer.parentElement;
        if (targetParent) {
            const jvcContainerOrParent = targetParent === jvcContainer.parentElement ? jvcContainer : targetParent.querySelector('#forums-post-message-editor');
            if (jvcContainerOrParent) {
                targetParent.insertBefore(decensuredContainer, jvcContainerOrParent);
            } else {
                targetParent.appendChild(decensuredContainer);
            }
        }
        decensuredContainer.removeAttribute('data-original-parent-selector');
    }

    textarea.placeholder = '';
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
                }, DECENSURED_CONFIG.CONTAINER_HIDE_DELAY);
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

        setTimeout(() => throttledSetupTabOrder(), DECENSURED_CONFIG.TAB_ORDER_DELAY);
    });

    return {
        toggleButton,
        fakeContainer,
        realContainer,
        titlesContainer,
        isActive: () => isActive
    };
}
