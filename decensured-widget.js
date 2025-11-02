///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED WIDGET
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
                    <span style="font-size: 13px; font-weight: 400; opacity: 0.9;">Live Chat & Topics</span>
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
        <div class="deboucled-widget-tabs">
            <button class="deboucled-widget-tab active" data-tab="chat">
                💬 Chat
                <span class="notification-badge" style="display: none;">0</span>
            </button>
            <button class="deboucled-widget-tab" data-tab="topics">
                📋 Topics
            </button>
        </div>
        <div class="deboucled-floating-widget-content">
            <div class="deboucled-floating-widget-loading">
                <div class="deboucled-spinner active"></div>
            </div>
            <div class="deboucled-widget-tab-content active" data-content="chat">
                <div class="deboucled-chat-container">
                    <div class="deboucled-chat-status connecting">
                        <span class="deboucled-chat-status-indicator"></span>
                        <span>Connexion...</span>
                    </div>
                    <div class="deboucled-chat-messages"></div>
                    <button class="deboucled-chat-scroll-bottom" title="Aller en bas">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                            <path d="M12 5v14M19 12l-7 7-7-7"/>
                        </svg>
                    </button>
                    <div class="deboucled-chat-input-container">
                        <div class="deboucled-chat-input-wrapper">
                            <textarea class="deboucled-chat-input" placeholder="Écrivez votre message..." rows="1"></textarea>
                            <button class="deboucled-chat-send-btn">
                                <svg class="deboucled-chat-send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                                </svg>
                                Envoyer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="deboucled-widget-tab-content" data-content="topics">
                <div class="deboucled-floating-widget-topics" id="deboucled-floating-widget-topics">
                    <div class="deboucled-floating-widget-topics-container"></div>
                    <div class="deboucled-floating-widget-topics-loader" style="display: none;">
                        <div class="deboucled-loading-text">Chargement...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (preferDarkTheme()) {
        widget.classList.add('dark-theme');
    }

    document.body.appendChild(widget);

    setupFloatingWidgetEvents();

    // Initialize chat by default since it's the first tab
    const chatEnabled = store.get(storage_optionEnableDecensuredChat, storage_optionEnableDecensuredChat_default);
    if (chatEnabled) {
        setTimeout(() => {
            initializeDecensuredChat();
        }, 500);
    } else {
        updateChatStatusWhenDisabled();
    }

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
            }, DECENSURED_CONFIG.ANIMATION_DELAY);
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
            const currentTab = document.querySelector('.deboucled-widget-tab.active')?.dataset.tab;

            if (currentTab === 'topics') {
                loadFloatingWidgetTopics().finally(() => {
                    setTimeout(() => refreshWidgetButton.classList.remove('spinning'), 500);
                });
            } else if (currentTab === 'chat') {
                const chatInstance = getDecensuredChatInstance();
                if (chatInstance) {
                    chatInstance.loadRecentMessages().finally(() => {
                        setTimeout(() => refreshWidgetButton.classList.remove('spinning'), 500);
                    });
                } else {
                    setTimeout(() => refreshWidgetButton.classList.remove('spinning'), 500);
                }
            }
        });
    }

    // Setup tab switching
    setupWidgetTabs();

    createFloatingWidgetOverlay();

    setupThemeToggleListener();
}

function setupWidgetTabs() {
    const tabs = document.querySelectorAll('.deboucled-widget-tab');
    const tabContents = document.querySelectorAll('.deboucled-widget-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            const tabName = tab.dataset.tab;

            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');
            const targetContent = document.querySelector(`.deboucled-widget-tab-content[data-content="${tabName}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Handle tab-specific actions
            if (tabName === 'chat') {
                const chatEnabled = store.get(storage_optionEnableDecensuredChat, storage_optionEnableDecensuredChat_default);
                if (!chatEnabled) {
                    updateChatStatusWhenDisabled();
                    return;
                }

                const chatInstance = getDecensuredChatInstance();
                if (chatInstance) {
                    chatInstance.setTabActive(true);
                    chatInstance.scrollToBottom(false);
                } else {
                    initializeDecensuredChat();
                }
            } else if (tabName === 'topics') {
                const chatInstance = getDecensuredChatInstance();
                if (chatInstance) {
                    chatInstance.setTabActive(false);
                }
            }
        });
    });
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

    // Supprimer le badge de la languette quand le widget s'ouvre
    widget.classList.remove('has-unread');
    widget.removeAttribute('data-unread-count');

    // Si l'onglet Chat est actif, marquer les messages comme lus
    const chatTab = document.querySelector('.deboucled-widget-tab[data-tab="chat"]');
    if (chatTab && chatTab.classList.contains('active')) {
        const chatInstance = getDecensuredChatInstance();
        if (chatInstance) {
            chatInstance.markMessagesAsRead();
        }
    }

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
    if (!widget || !widget.classList.contains('visible')) return;
    initializeFloatingWidgetInfiniteScroll();
}

function initializeFloatingWidgetInfiniteScroll() {
    const topicsContainer = document.getElementById('deboucled-floating-widget-topics');
    const topicsListContainer = topicsContainer?.querySelector('.deboucled-floating-widget-topics-container');
    const loadingContainer = document.querySelector('.deboucled-floating-widget-loading');
    const loader = topicsContainer?.querySelector('.deboucled-floating-widget-topics-loader');
    const refreshButton = document.getElementById('deboucled-floating-widget-refresh');

    if (!topicsContainer || !topicsListContainer) return;

    topicsListContainer.innerHTML = '';
    let currentPage = 0;
    let isLoading = false;
    let hasMoreTopics = true;

    if (refreshButton) refreshButton.disabled = true;

    async function loadMoreTopics() {
        if (isLoading || !hasMoreTopics) return;

        isLoading = true;
        const isFirstLoad = currentPage === 0;

        if (isFirstLoad && loadingContainer) {
            loadingContainer.classList.add('active');
        } else if (loader) {
            loader.style.display = 'block';
        }

        try {
            const offset = currentPage * DECENSURED_CONFIG.FLOATING_WIDGET.TOPICS_PER_PAGE;
            const response = await getDecensuredTopicsPaginated(
                DECENSURED_CONFIG.FLOATING_WIDGET.TOPICS_PER_PAGE,
                offset
            );

            if (response.length === 0) {
                hasMoreTopics = false;
                if (currentPage === 0) {
                    showEmptyState(topicsListContainer);
                }
                return;
            }

            if (response.length < DECENSURED_CONFIG.FLOATING_WIDGET.TOPICS_PER_PAGE) {
                hasMoreTopics = false;
            }

            appendTopicsToContainer(topicsListContainer, response);
            currentPage++;

        } catch (error) {
            logDecensuredError(error, 'loadMoreTopics - Erreur lors du chargement des topics');
            if (currentPage === 0) {
                showErrorState(topicsListContainer);
            }
            hasMoreTopics = false;
        } finally {
            isLoading = false;
            if (isFirstLoad && loadingContainer) loadingContainer.classList.remove('active');
            if (loader) loader.style.display = 'none';
            if (refreshButton) refreshButton.disabled = false;
        }
    }

    topicsContainer.addEventListener('scroll', () => {
        if (isLoading || !hasMoreTopics) return;

        const { scrollTop, scrollHeight, clientHeight } = topicsContainer;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
        const isNearBottom = scrollPercentage >= 0.8;

        if (isNearBottom) loadMoreTopics();
    });

    loadMoreTopics();
}

function appendTopicsToContainer(container, topics) {
    topics.forEach(topic => {
        const topicElement = createTopicElement(topic);
        container.appendChild(topicElement);
    });
}

function createTopicElement(topic) {
    const topicDiv = document.createElement('div');
    topicDiv.className = 'deboucled-floating-widget-topic';
    topicDiv.setAttribute('data-topic-id', topic.topic_id);

    const timeAgo = formatTimeAgo(topic.latest_message_date ?? topic.creation_date);
    const messageCount = topic.nb_message || 1;
    const authorProfileUrl = `https://www.jeuxvideo.com/profil/${encodeURIComponent(topic.topic_author.toLowerCase())}?mode=infos`;

    const lastPage = Math.ceil(messageCount / maxMessageByPage);
    const lastPageUrl = topic.topic_url.replace(/-(\d+)-0-1-0-/, `-${lastPage}-0-1-0-`);

    const displayTitle = topic.topic_name_real || topic.topic_name_fake || topic.topic_name;
    const titleTooltip = topic.topic_name_real && topic.topic_name_real !== topic.topic_name_fake
        ? `Titre réel : ${topic.topic_name_real}\nTitre de couverture : ${topic.topic_name_fake || topic.topic_name}`
        : displayTitle;

    topicDiv.innerHTML = `
        <div class="deboucled-floating-widget-topic-header">
            <i class="deboucled-decensured-topic-icon icon-topic-folder deboucled-floating-widget-topic-icon" title="Topic Décensured"></i>
            <span class="deboucled-floating-widget-topic-time">${timeAgo}</span>
        </div>
        <a href="${topic.topic_url}" class="deboucled-floating-widget-topic-title" title="${escapeHtml(titleTooltip)}">${escapeHtml(displayTitle)}</a>
        <div class="deboucled-floating-widget-topic-meta">
            <a href="${authorProfileUrl}" class="deboucled-floating-widget-topic-author" target="_blank" rel="noopener noreferrer" title="Voir le profil de ${escapeHtml(topic.topic_author)}">${escapeHtml(topic.topic_author)}</a>
            <a href="${lastPageUrl}" class="deboucled-floating-widget-topic-messages" target="_blank" rel="noopener noreferrer" title="Aller à la dernière page (page ${lastPage})">${messageCount} msg</a>
        </div>
    `;

    return topicDiv;
}

function showEmptyState(container) {
    const emptyClass = preferDarkTheme() ? 'deboucled-floating-widget-empty dark-theme' : 'deboucled-floating-widget-empty';
    container.innerHTML = `
        <div class="${emptyClass}">
            <i class="icon-info"></i>
            <span>Aucun topic Décensured récent</span>
        </div>
    `;
}

function showErrorState(container) {
    const errorClass = preferDarkTheme() ? 'deboucled-floating-error dark-theme' : 'deboucled-floating-error';
    container.innerHTML = `
        <div class="${errorClass}">
            <i class="icon-warning"></i>
            <span>Erreur de chargement</span>
            <button onclick="loadFloatingWidgetTopics()">Réessayer</button>
        </div>
    `;
}

function startFloatingWidgetMonitoring() {
    if (!store.get(storage_optionDisplayDecensuredWidget, storage_optionDisplayDecensuredWidget_default)) {
        return;
    }

    setInterval(() => {
        const widget = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_FLOATING_WIDGET);
        if (widget && widget.classList.contains('visible') && widget.hasAttribute('data-loaded')) {
            debouncedLoadFloatingWidgetTopics();
        }
    }, DECENSURED_CONFIG.FLOATING_WIDGET.REFRESH_INTERVAL);
}

function toggleDecensuredFloatingWidget() {
    const isEnabled = store.get(storage_optionDisplayDecensuredWidget, storage_optionDisplayDecensuredWidget_default);

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

function updateChatStatusWhenDisabled() {
    const statusElement = document.querySelector('.deboucled-chat-status');
    if (!statusElement) return;

    statusElement.className = 'deboucled-chat-status disconnected';
    const statusSpans = statusElement.querySelectorAll('span');
    if (statusSpans.length > 1) {
        statusSpans[1].textContent = 'Déconnecté';
    }
}
