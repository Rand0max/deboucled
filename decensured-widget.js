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
            loadFloatingWidgetTopics().finally(() => {
                setTimeout(() => refreshWidgetButton.classList.remove('spinning'), 500);
            });
        });
    }

    createFloatingWidgetOverlay();

    setupThemeToggleListener();
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
