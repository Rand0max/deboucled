///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED CHAT
///////////////////////////////////////////////////////////////////////////////////////

class DecensuredChat {
    constructor() {
        this.messages = [];
        this.eventSource = null;
        this.isConnecting = false;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 3000;
        this.maxReconnectDelay = 30000;
        this.messageContainer = null;
        this.inputElement = null;
        this.sendButton = null;
        this.statusElement = null;
        this.unreadCount = 0;
        this.isTabActive = false;
        this.lastMessageTime = null;
        this.typingTimeout = null;
        this.replyToMessageId = null; // ID du message auquel on répond
        this.replyToMessage = null; // Message auquel on répond (objet complet)
        this.debugMode = false; // Mode debug pour tester les notifications de mention sur soi-même
        this.hasMentionNotification = false; // Indique si on a une notification de mention non lue
        this.mentionCount = 0; // Compteur de mentions/citations non lues
        this.lastSentMessageTime = 0; // Timestamp du dernier message envoyé
        this.messageCooldown = 2000; // Cooldown entre les messages (2 secondes)
        this.originalTitle = document.title; // Titre original de la page
        this.lastReadMessageId = null; // ID du dernier message lu
        this.storageKey = 'decensured_chat_unread'; // Clé localStorage
        this.isManualScrolling = false; // Flag pour empêcher l'auto-scroll pendant un scroll manuel
        this.risiBankInstance = null; // Instance RisiBank
        this.risiBankEnabled = false; // RisiBank userscript détecté
        this.isTyping = false; // Flag pour savoir si on est en train de taper
        this.typingDebounceTimer = null; // Timer pour debounce typing
        this.typingStopTimer = null; // Timer pour auto-stop typing
        this.typingUsers = new Map(); // Map des utilisateurs en train de taper
    }

    async initialize() {
        if (!getCurrentUserPseudo() || !userId) {
            console.warn('[Chat] User not authenticated');
            return false;
        }

        this.setupDOM();
        await loadChatReactionConfig();
        await this.loadRecentMessages();
        this.loadUnreadState(); // Charger l'état des messages non lus
        this.setupRisiBank(); // Configurer RisiBank si disponible
        this.connect();
        this.setupEventListeners();

        return true;
    }

    setupDOM() {
        this.messageContainer = document.querySelector('.deboucled-chat-messages');
        this.inputElement = document.querySelector('.deboucled-chat-input');
        this.sendButton = document.querySelector('.deboucled-chat-send-btn');
        this.statusElement = document.querySelector('.deboucled-chat-status');

        this.createReplyIndicator();
        this.createTypingIndicator();
    }

    createReplyIndicator() {
        const inputContainer = document.querySelector('.deboucled-chat-input-container');
        if (!inputContainer || inputContainer.querySelector('.deboucled-chat-replying-to')) return;

        const replyIndicator = document.createElement('div');
        replyIndicator.className = 'deboucled-chat-replying-to';
        replyIndicator.style.display = 'none';
        replyIndicator.innerHTML = `
            <div class="deboucled-chat-replying-to-text">
                ↩️ En réponse à <strong></strong>: <span></span>
            </div>
            <button class="deboucled-chat-cancel-reply" title="Annuler">×</button>
        `;

        const cancelBtn = replyIndicator.querySelector('.deboucled-chat-cancel-reply');
        cancelBtn.addEventListener('click', () => this.cancelReply());

        inputContainer.insertBefore(replyIndicator, inputContainer.firstChild);
    }

    createTypingIndicator() {
        const messagesContainer = document.querySelector('.deboucled-chat-messages');
        if (!messagesContainer || document.querySelector('.deboucled-chat-typing-indicator')) return;

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'deboucled-chat-typing-indicator';
        typingIndicator.style.display = 'none';
        typingIndicator.innerHTML = `
            <div class="deboucled-chat-typing-dots">
                <span></span><span></span><span></span>
            </div>
            <span class="deboucled-chat-typing-text"></span>
        `;

        messagesContainer.parentElement.insertBefore(typingIndicator, messagesContainer.nextSibling);
    }

    updateTypingIndicator() {
        const indicator = document.querySelector('.deboucled-chat-typing-indicator');
        if (!indicator) return;

        const currentUser = getCurrentUserPseudo()?.toLowerCase();
        const typingUsernames = [...this.typingUsers.values()]
            .filter(u => u.username !== currentUser)
            .map(u => u.fullUsername);

        if (typingUsernames.length === 0) {
            indicator.style.display = 'none';
            return;
        }

        const textEl = indicator.querySelector('.deboucled-chat-typing-text');
        if (textEl) {
            if (typingUsernames.length === 1) {
                textEl.textContent = `${typingUsernames[0]} est en train d'écrire...`;
            } else if (typingUsernames.length === 2) {
                textEl.textContent = `${typingUsernames[0]} et ${typingUsernames[1]} sont en train d'écrire...`;
            } else {
                textEl.textContent = `${typingUsernames.length} personnes sont en train d'écrire...`;
            }
        }

        indicator.style.display = 'flex';
    }

    handleTypingStart() {
        if (this.isTyping) {
            // Reset le timer de stop si on tape encore
            clearTimeout(this.typingStopTimer);
            this.typingStopTimer = setTimeout(() => this.handleTypingStop(), 10000);
            return;
        }

        this.isTyping = true;
        const username = getCurrentUserPseudo();
        const fullUsername = userPseudo || username;

        sendTypingStart(username, userId, fullUsername);

        // Auto-stop après 3 secondes d'inactivité
        this.typingStopTimer = setTimeout(() => this.handleTypingStop(), 10000);
    }

    handleTypingStop() {
        if (!this.isTyping) return;

        this.isTyping = false;
        clearTimeout(this.typingStopTimer);

        const username = getCurrentUserPseudo();
        sendTypingStop(username, userId);
    }

    setupRisiBank() {
        if (!document.querySelector('button.risibank-toggle') || typeof window.RisiBank === 'undefined') {
            console.log('[Chat] RisiBank non disponible');
            return;
        }

        console.log('[Chat] RisiBank détecté, intégration du bouton');
        this.risiBankEnabled = true;
        this.createRisiBankButton();
    }

    createRisiBankButton() {
        const inputWrapper = document.querySelector('.deboucled-chat-input-wrapper');
        if (!inputWrapper || inputWrapper.querySelector('.deboucled-chat-risibank-btn')) return;

        const risiBankBtn = document.createElement('button');
        risiBankBtn.className = 'deboucled-chat-risibank-btn';
        risiBankBtn.type = 'button';
        risiBankBtn.title = 'RisiBank';
        risiBankBtn.innerHTML = `
            <img src="https://risibank.fr/logo.png" width="18" height="18" style="vertical-align: baseline;">
        `;

        risiBankBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleRisiBank();
        });

        const sendBtn = inputWrapper.querySelector('.deboucled-chat-send-btn');
        if (sendBtn) {
            inputWrapper.insertBefore(risiBankBtn, sendBtn);
        }
    }

    toggleRisiBank() {
        const container = document.querySelector('.deboucled-chat-risibank-container');

        if (!container) {
            this.initializeRisiBank();
            return;
        }

        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';

        if (isVisible && this.risiBankInstance) {
            this.risiBankInstance = null;
            container.querySelector('#deboucled-risibank-embed').innerHTML = '';
        } else if (!isVisible && !this.risiBankInstance) {
            this.initializeRisiBank();
        }
    }

    initializeRisiBank() {
        let embedContainer = document.getElementById('deboucled-risibank-embed');

        if (!embedContainer) {
            const chatContainer = document.querySelector('.deboucled-chat-container');
            if (!chatContainer) return;

            const risiBankContainer = document.createElement('div');
            risiBankContainer.className = 'deboucled-chat-risibank-container';
            risiBankContainer.innerHTML = '<div id="deboucled-risibank-embed"></div>';

            const inputContainer = document.querySelector('.deboucled-chat-input-container');
            if (inputContainer) {
                chatContainer.insertBefore(risiBankContainer, inputContainer);
            }

            embedContainer = document.getElementById('deboucled-risibank-embed');
        }

        if (!embedContainer || !window.RisiBank) return;

        try {
            this.risiBankInstance = window.RisiBank.activate({
                type: 'iframe',
                container: embedContainer,
                theme: preferDarkTheme() ? 'dark' : 'light',
                defaultTab: 'top',
                mediaSize: 'sm',
                navbarSize: 'sm',
                allowUsernameSelection: false,
                showNSFW: true,
                showCopyButton: false,
                onSelectMedia: (media) => {
                    window.RisiBank.Actions.addSourceImageLink('.deboucled-chat-input')(media);
                    this.toggleRisiBank();
                }
            });
        } catch (error) {
            console.error('[Chat] Erreur lors de l\'initialisation de RisiBank:', error);
        }
    }

    setReplyTo(message) {
        this.replyToMessageId = message.id;
        this.replyToMessage = message;

        const replyIndicator = document.querySelector('.deboucled-chat-replying-to');
        if (replyIndicator) {
            const usernameEl = replyIndicator.querySelector('strong');
            const contentEl = replyIndicator.querySelector('.deboucled-chat-replying-to-text span');

            usernameEl.textContent = message.sender_full_username || message.sender_username;

            // Tronquer le contenu à 50 caractères
            const content = message.message_content.length > 50
                ? message.message_content.substring(0, 50) + '...'
                : message.message_content;
            contentEl.textContent = content;

            replyIndicator.style.display = 'flex';
        }

        // Ajouter une classe pour décaler le bouton scroll
        const chatContainer = document.querySelector('.deboucled-chat-container');
        if (chatContainer) {
            chatContainer.classList.add('replying-active');
        }

        // Focus sur l'input
        if (this.inputElement) {
            this.inputElement.focus();
        }
    }

    cancelReply() {
        this.replyToMessageId = null;
        this.replyToMessage = null;

        const replyIndicator = document.querySelector('.deboucled-chat-replying-to');
        if (replyIndicator) {
            replyIndicator.style.display = 'none';
        }

        // Retirer la classe pour remettre le bouton scroll à sa place
        const chatContainer = document.querySelector('.deboucled-chat-container');
        if (chatContainer) {
            chatContainer.classList.remove('replying-active');
        }
    }

    setupEventListeners() {
        if (!this.inputElement || !this.sendButton) return;

        // Send on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());

        // Send on Enter (but not Shift+Enter for multiline)
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.inputElement.addEventListener('input', () => {
            this.inputElement.style.height = 'auto';
            this.inputElement.style.height = Math.min(this.inputElement.scrollHeight, 80) + 'px';

            // Typing indicator
            if (this.inputElement.value.trim().length > 0) {
                clearTimeout(this.typingDebounceTimer);
                this.typingDebounceTimer = setTimeout(() => this.handleTypingStart(), 100);
            } else {
                this.handleTypingStop();
            }
        });

        // Scroll to bottom button
        const scrollBtn = document.querySelector('.deboucled-chat-scroll-bottom');
        if (scrollBtn) {
            scrollBtn.addEventListener('click', () => this.scrollToBottom(true));
        }

        // Detect when user scrolls up
        if (this.messageContainer) {
            this.messageContainer.addEventListener('scroll', () => {
                const isAtBottom = this.isScrolledToBottom();
                const scrollBtn = document.querySelector('.deboucled-chat-scroll-bottom');
                if (scrollBtn) {
                    scrollBtn.classList.toggle('visible', !isAtBottom);
                }
            });
        }

        // Mark messages as read when tab becomes active
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isTabActive) {
                this.markMessagesAsRead();
            }
        });

        // Restaurer le titre quand l'utilisateur revient sur l'onglet
        window.addEventListener('focus', () => {
            if (this.isTabActive) {
                this.markMessagesAsRead();
            }
        });
    }

    connect() {
        if (this.isConnecting || this.isConnected) return;

        const username = getCurrentUserPseudo();

        if (!username) {
            console.error('[Chat] Missing credentials');
            this.updateConnectionStatus('disconnected');
            return;
        }

        this.isConnecting = true;
        this.updateConnectionStatus('connecting');

        try {
            this.eventSource = createChatEventSource(username);

            if (!this.eventSource) {
                console.error('[Chat] Failed to create EventSource');
                this.isConnecting = false;
                this.updateConnectionStatus('disconnected');
                this.scheduleReconnect();
                return;
            }

            this.eventSource.onopen = () => {
                this.isConnecting = false;
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 3000;
                this.updateConnectionStatus('connected');
            };

            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                } catch (err) {
                    console.error('[Chat] Failed to parse message:', err);
                }
            };

            this.eventSource.onerror = (error) => {
                console.error('[Chat] SSE error:', error);
                this.isConnected = false;
                this.isConnecting = false;
                this.updateConnectionStatus('disconnected');

                if (this.eventSource) {
                    this.eventSource.close();
                    this.eventSource = null;
                }

                this.scheduleReconnect();
            };

        } catch (error) {
            console.error('[Chat] Connection error:', error);
            this.isConnecting = false;
            this.updateConnectionStatus('disconnected');
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('[Chat] Max reconnection attempts reached');
            this.updateConnectionStatus('disconnected');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectDelay);

        console.log(`[Chat] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            if (!this.isConnected && !this.isConnecting) {
                this.connect();
            }
        }, delay);
    }

    disconnect() {
        console.log('[Chat] Disconnecting...');
        this.isConnected = false;
        this.isConnecting = false;

        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }

        this.updateConnectionStatus('disconnected');
    }

    handleServerMessage(data) {
        switch (data.type) {
            case 'connected':
                console.log('[Chat] Server confirmed connection:', data.username);
                break;

            case 'new_message':
                this.addMessage(data.message);
                break;

            case 'new_private_message':
                this.addMessage(data.message, true);
                break;

            case 'user_mentioned':
                // Notification spéciale quand on est mentionné
                this.addMessage(data.message);
                this.showMentionNotification(data.message);
                break;

            case 'typing_start':
                if (data.message?.username) {
                    this.typingUsers.set(data.message.username, {
                        username: data.message.username,
                        fullUsername: data.message.fullUsername || data.message.username
                    });
                    this.updateTypingIndicator();
                }
                break;

            case 'typing_stop':
                if (data.message?.username) {
                    this.typingUsers.delete(data.message.username);
                    this.updateTypingIndicator();
                }
                break;

            case 'new_topic':
                handleNewTopicNotification();
                break;

            case 'new_message_decensured':
                handleNewMessageDecensuredNotification();
                break;

            case 'reaction_added':
                this.handleReactionUpdate(data.message, true);
                break;

            case 'reaction_removed':
                this.handleReactionUpdate(data.message, false);
                break;

            default:
                console.log('[Chat] Unknown message type:', data.type);
        }
    }

    showMentionNotification(message) {
        if (!this.debugMode && (this.isTabActive && !document.hidden)) return; // Pas de notification si déjà actif (sauf en mode debug)

        if (this.debugMode)
            console.log(`[Chat] 🔔 ${this.debugMode ? '[DEBUG MODE] ' : ''}Vous avez été mentionné par ${message.sender_full_username || message.sender_username}`);

        this.hasMentionNotification = true;
        this.mentionCount++;
        this.updateUnreadBadge();
        this.saveUnreadState();

        this.updateBrowserNotification();
    }

    async sendMessage() {
        const content = this.inputElement?.value.trim();
        if (!content || !this.isConnected) return;

        this.handleTypingStop();

        const username = getCurrentUserPseudo();

        if (!username || !userId) {
            console.error('[Chat] User not authenticated');
            return;
        }

        const now = Date.now();
        const timeSinceLastMessage = now - this.lastSentMessageTime;

        if (timeSinceLastMessage < this.messageCooldown) {
            addAlertbox('info', `Veuillez patienter avant d'envoyer un nouveau message.`);
            return;
        }

        if (this.sendButton) {
            this.sendButton.disabled = true;
        }

        try {
            const replyToId = this.replyToMessageId || null;
            const success = await sendChatMessage(username, userId, content, 'text', replyToId);

            if (success) {
                this.lastSentMessageTime = now;

                if (this.inputElement) {
                    this.inputElement.value = '';
                    this.inputElement.style.height = 'auto';
                }

                this.cancelReply();

                setTimeout(() => {
                    this.scrollToBottom(true);
                }, 100);
            } else {
                console.error('[Chat] Failed to send message');
                addAlertbox('error', 'Erreur lors de l\'envoi du message');
            }

        } catch (error) {
            console.error('[Chat] Send message error:', error);
            addAlertbox('error', 'Erreur de connexion');
        } finally {
            if (this.sendButton) {
                this.sendButton.disabled = false;
            }
        }
    }

    async loadRecentMessages(limit = 50) {
        try {
            const messages = await getChatMessages(limit);

            if (messages && Array.isArray(messages)) {
                // Trier les messages du plus ancien au plus récent (ordre chronologique)
                this.messages = messages.sort((a, b) => {
                    return new Date(a.creation_date) - new Date(b.creation_date);
                });
                this.renderMessages();
                this.scrollToBottom(false);
            } else {
                this.showEmptyState('Erreur de chargement des messages');
            }

        } catch (error) {
            console.error('[Chat] Failed to load messages:', error);
            this.showEmptyState('Erreur de chargement des messages');
        }
    }

    addMessage(message) {
        // Avoid duplicates
        if (this.messages.some(m => m.id === message.id)) {
            return;
        }

        this.messages.push(message);
        this.renderMessage(message);

        // Only show notification badge for messages from others (ou en mode debug)
        const isOwnMessage = !this.debugMode && message.sender_username.toLowerCase() === getCurrentUserPseudo().toLowerCase();

        // Auto-scroll if at bottom
        if (this.isScrolledToBottom()) {
            this.scrollToBottom(true);
        } else if (!isOwnMessage) {
            // Show notification badge only if not at bottom and message is from someone else
            this.incrementUnreadCount();
        }

        // Mark as read if tab is active and visible
        if (this.isTabActive && !document.hidden) {
            this.markMessagesAsRead();
        }
    }

    renderMessages() {
        if (!this.messageContainer) return;

        this.messageContainer.innerHTML = '';

        if (this.messages.length === 0) {
            this.showEmptyState();
            return;
        }

        this.messages.forEach(message => {
            this.renderMessage(message);
        });
    }

    renderMessage(message) {
        if (!this.messageContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = 'deboucled-chat-message';
        messageEl.setAttribute('data-message-id', message.id);

        if (message.sender_username && deboucledPseudos.includes(message.sender_username.toLowerCase())) {
            messageEl.classList.add('deboucled-team-message');
        }

        if (message.message_type === 'system') {
            messageEl.classList.add('system');
            messageEl.innerHTML = `<div class="deboucled-chat-message-content">${escapeHtml(message.message_content)}</div>`;
            this.messageContainer.appendChild(messageEl);
        } else if (message.message_type === 'private') {
            messageEl.classList.add('private');
            this.buildMessageHTML(message).then(html => {
                messageEl.innerHTML = html;
                this.attachReplyButton(messageEl, message);
                this.attachReactionUI(messageEl, message);
                this.attachQuoteClickHandler(messageEl);
                embedVideos(messageEl, '', 400, 300);
            });
            this.messageContainer.appendChild(messageEl);
        } else {
            this.buildMessageHTML(message).then(html => {
                messageEl.innerHTML = html;
                this.attachReplyButton(messageEl, message);
                this.attachReactionUI(messageEl, message);
                this.attachQuoteClickHandler(messageEl);
                embedVideos(messageEl, '', 400, 300);
            });
            this.messageContainer.appendChild(messageEl);
        }
    }

    attachReplyButton(messageEl, message) {
        // Intégrer le bouton dans le header (à côté de l'heure) au lieu d'un conteneur séparé
        const header = messageEl.querySelector('.deboucled-chat-message-header');
        if (!header) return;

        const replyBtn = document.createElement('button');
        replyBtn.className = 'deboucled-chat-reply-btn';
        replyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <circle cx="256" cy="256" r="256" fill="currentColor" opacity="0.15"/>
                <path d="M196.39,243.88c8.29-29.56,35.31-61.25,35.31-61.25l-14-12.92c-87.4,50.8-77.91,125.84-77.91,125.84l.42-.14a49.34,49.34,0,1,0,56.15-51.53Z" fill="currentColor"/>
                <path d="M370.07,277.46a49.28,49.28,0,0,0-40-33.58c8.3-29.56,35.31-61.25,35.31-61.25l-14-12.92c-87.4,50.8-77.92,125.84-77.92,125.84l.41-.14a49.36,49.36,0,1,0,96.19-18Z" fill="currentColor"/>
            </svg>
        `;
        replyBtn.title = 'Répondre';
        replyBtn.onclick = (e) => {
            e.stopPropagation();
            this.setReplyTo(message);
        };

        // Ajouter le bouton après l'heure
        header.appendChild(replyBtn);
    }

    attachQuoteClickHandler(messageEl) {
        // Handler pour les citations
        const quotedMessage = messageEl.querySelector('.deboucled-chat-quoted-message');
        if (quotedMessage) {
            quotedMessage.addEventListener('click', () => {
                const quotedMessageId = quotedMessage.getAttribute('data-quoted-message-id');
                if (quotedMessageId) {
                    this.scrollToMessage(quotedMessageId);
                }
            });
        }

        // Handler pour les mentions (optionnel - pour ouvrir le profil)
        const mentions = messageEl.querySelectorAll('.deboucled-chat-mention');
        mentions.forEach(mention => {
            mention.addEventListener('click', () => {
                const username = mention.getAttribute('data-username');
                if (username) {
                    const profileUrl = `https://www.jeuxvideo.com/profil/${encodeURIComponent(username.toLowerCase())}?mode=infos`;
                    window.open(profileUrl, '_blank', 'noopener,noreferrer');
                }
            });
        });
    }

    attachReactionUI(messageEl, message) {
        if (!store.get(storage_optionEnableChatReactions, storage_optionEnableChatReactions_default)) return;
        const contentEl = messageEl.querySelector('.deboucled-chat-message-content');
        if (!contentEl) return;

        // Barre des réactions existantes
        const reactionsBar = document.createElement('div');
        reactionsBar.className = 'deboucled-chat-reactions-bar';
        this.renderReactionsBar(reactionsBar, message);

        // Bouton "ajouter réaction" Slack-style (toujours visible dans la barre)
        const addBtn = document.createElement('button');
        addBtn.className = 'deboucled-chat-reaction-add-btn';
        addBtn.title = 'Ajouter une réaction';
        addBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
        addBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleReactionPicker(messageEl, message.id);
        };
        reactionsBar.appendChild(addBtn);

        contentEl.after(reactionsBar);
    }

    renderReactionsBar(barEl, message) {
        // Préserver le bouton add s'il existe
        const existingAddBtn = barEl.querySelector('.deboucled-chat-reaction-add-btn');
        barEl.innerHTML = '';
        const reactions = message.reactions || [];
        const currentUser = getCurrentUserPseudo()?.toLowerCase();

        for (const reaction of reactions) {
            const badge = document.createElement('button');
            badge.className = 'deboucled-chat-reaction-badge';
            const isOwnReaction = currentUser && reaction.usernames.map(u => u.toLowerCase()).includes(currentUser);
            if (isOwnReaction) badge.classList.add('own-reaction');

            // Sticker RisiBank : afficher image, sinon emoji texte
            const sticker = chatReactionStickerMap.get(reaction.emoji);
            if (sticker) {
                const img = document.createElement('img');
                img.src = sticker.url;
                img.alt = sticker.label;
                img.className = 'deboucled-chat-reaction-sticker-img';
                badge.appendChild(img);
                badge.classList.add('sticker-badge');
            } else {
                badge.appendChild(document.createTextNode(reaction.emoji));
            }
            badge.appendChild(document.createTextNode(` ${reaction.count}`));
            badge.title = reaction.usernames.join(', ');
            badge.onclick = (e) => {
                e.stopPropagation();
                this.onReactionClick(message.id, reaction.emoji);
            };
            barEl.appendChild(badge);
        }

        // Réinjecter le bouton add à la fin
        if (existingAddBtn) barEl.appendChild(existingAddBtn);
    }

    toggleReactionPicker(messageEl, messageId) {
        // Fermer un picker déjà ouvert
        const existingPicker = document.querySelector('.deboucled-chat-reaction-picker');
        if (existingPicker) {
            existingPicker.remove();
            if (existingPicker.dataset.messageId === String(messageId)) return;
        }

        const picker = document.createElement('div');
        picker.className = `deboucled-chat-reaction-picker${preferDarkTheme() ? ' dark-theme' : ''}`;
        picker.dataset.messageId = messageId;

        // Section emojis
        const emojiSection = document.createElement('div');
        emojiSection.className = 'deboucled-chat-reaction-picker-section';
        for (const emoji of chatReactionEmojis) {
            const btn = document.createElement('button');
            btn.className = 'deboucled-chat-reaction-picker-emoji';
            btn.textContent = emoji;
            btn.onclick = (e) => {
                e.stopPropagation();
                this.onReactionClick(messageId, emoji);
                picker.remove();
            };
            emojiSection.appendChild(btn);
        }
        picker.appendChild(emojiSection);

        // Séparateur + Section stickers (seulement si des stickers sont disponibles)
        if (chatReactionStickers.length > 0) {
            const separator = document.createElement('div');
            separator.className = 'deboucled-chat-reaction-picker-separator';
            picker.appendChild(separator);

            const stickerSection = document.createElement('div');
            stickerSection.className = 'deboucled-chat-reaction-picker-section deboucled-chat-reaction-picker-stickers';
            for (const sticker of chatReactionStickers) {
                const btn = document.createElement('button');
                btn.className = 'deboucled-chat-reaction-picker-sticker';
                btn.title = sticker.label;
                const img = document.createElement('img');
                img.src = sticker.url;
                img.alt = sticker.label;
                img.loading = 'lazy';
                btn.appendChild(img);
                btn.onclick = (e) => {
                    e.stopPropagation();
                    this.onReactionClick(messageId, sticker.code);
                    picker.remove();
                };
                stickerSection.appendChild(btn);
            }
            picker.appendChild(stickerSection);
        }

        // Ajouter au body pour éviter le clipping par overflow du conteneur de messages
        document.body.appendChild(picker);

        // Positionner en fixed par rapport au bouton de réaction
        const addBtn = messageEl.querySelector('.deboucled-chat-reaction-add-btn');
        const btnRect = addBtn ? addBtn.getBoundingClientRect() : messageEl.getBoundingClientRect();
        const pickerHeight = picker.offsetHeight;
        const pickerWidth = picker.offsetWidth;
        const spaceAbove = btnRect.top;

        // Horizontal : aligner à droite du bouton, sans dépasser l'écran
        let left = btnRect.right - pickerWidth;
        if (left < 4) left = 4;

        // Vertical : au-dessus si assez de place, sinon en dessous
        let top;
        if (spaceAbove >= pickerHeight + 8) {
            top = btnRect.top - pickerHeight - 4;
        } else {
            top = btnRect.bottom + 4;
        }

        picker.style.position = 'fixed';
        picker.style.left = `${left}px`;
        picker.style.top = `${top}px`;
        picker.style.bottom = 'auto';
        picker.style.right = 'auto';
        picker.style.margin = '0';

        // Fermer le picker en cliquant ailleurs
        const closePicker = (e) => {
            if (!picker.contains(e.target)) {
                picker.remove();
                document.removeEventListener('click', closePicker);
            }
        };
        setTimeout(() => document.addEventListener('click', closePicker), 0);
    }

    async onReactionClick(messageId, emoji) {
        const response = await toggleChatReaction(messageId, emoji);
        if (!response) return;
        // La mise à jour UI se fait via SSE (reaction_added / reaction_removed)
    }

    handleReactionUpdate(reactionData, isAdded) {
        if (!reactionData) return;
        const { message_id, username, emoji } = reactionData;

        // Mettre à jour le message en mémoire
        const message = this.messages.find(m => m.id === message_id);
        if (!message) return;

        if (!message.reactions) message.reactions = [];

        if (isAdded) {
            const existing = message.reactions.find(r => r.emoji === emoji);
            if (existing) {
                if (!existing.usernames.includes(username)) {
                    existing.usernames.push(username);
                    existing.count = existing.usernames.length;
                }
            } else {
                message.reactions.push({ emoji, usernames: [username], count: 1 });
            }
        } else {
            const existing = message.reactions.find(r => r.emoji === emoji);
            if (existing) {
                existing.usernames = existing.usernames.filter(u => u !== username);
                existing.count = existing.usernames.length;
                if (existing.count === 0) {
                    message.reactions = message.reactions.filter(r => r.emoji !== emoji);
                }
            }
        }

        // Mettre à jour le DOM
        const messageEl = this.messageContainer?.querySelector(`[data-message-id="${message_id}"]`);
        if (messageEl) {
            const reactionsBar = messageEl.querySelector('.deboucled-chat-reactions-bar');
            if (reactionsBar) {
                this.renderReactionsBar(reactionsBar, message);
            }
        }
    }

    scrollToMessage(messageId) {
        const targetMessage = this.messageContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (targetMessage) {
            // Bloquer l'auto-scroll pendant le scroll manuel
            this.isManualScrolling = true;

            targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Animation de highlight temporaire
            targetMessage.style.backgroundColor = 'rgba(33, 160, 211, 0.15)';
            setTimeout(() => {
                targetMessage.style.backgroundColor = '';
            }, 2000);

            // Débloquer après l'animation du scroll (1 seconde pour smooth scroll)
            setTimeout(() => {
                this.isManualScrolling = false;
            }, 1000);
        } else {
            console.log('[Chat] Message cité non trouvé dans la liste');
        }
    }

    async buildMessageHTML(message) {
        const time = this.formatTime(message.creation_date);
        const username = escapeHtml(message.sender_full_username || message.sender_username);
        const currentUser = getCurrentUserPseudo();
        const content = formatChatMessageContent(message.message_content, currentUser);
        const profileUrl = `https://www.jeuxvideo.com/profil/${encodeURIComponent(message.sender_username.toLowerCase())}?mode=infos`;

        const avatarUrl = await getAuthorAvatarUrl(message.sender_username.toLowerCase(), profileUrl) || defaultAvatarUrl;
        let avatarHtml = `<img class="deboucled-chat-message-avatar" src="${avatarUrl}" onerror="this.onerror=null; this.src='${defaultAvatarUrl}';">`;

        let html = '';
        // Afficher la citation si le message répond à un autre message
        if (message.reply_to_message_id) {
            const quotedHtml = await this.buildQuotedMessageHTML(message.reply_to_message_id);
            html += quotedHtml;
        }

        html += `
            <div class="deboucled-chat-message-header">
                ${avatarHtml}
                <a href="${profileUrl}" class="deboucled-chat-message-username" data-username="${escapeHtml(message.sender_username)}" target="_blank" rel="noopener noreferrer" title="Voir le profil de ${escapeHtml(message.sender_username)}">${username}</a>
                <span class="deboucled-chat-message-time">${time}</span>
            </div>
            <div class="deboucled-chat-message-content">${content}</div>
        `;

        return html;
    }

    async buildQuotedMessageHTML(quotedMessageId) {
        try {
            // Chercher d'abord dans les messages locaux
            const localMessage = this.messages.find(m => m.id === quotedMessageId);
            let quotedMessage;

            if (localMessage) {
                quotedMessage = localMessage;
            } else {
                // Sinon, récupérer depuis l'API
                const response = await fetchDecensuredApi(`/chat/messages/${quotedMessageId}`);
                if (!response || response.error) {
                    return ''; // Message supprimé ou introuvable
                }
                quotedMessage = response;
            }

            const quotedUsername = escapeHtml(quotedMessage.sender_full_username || quotedMessage.sender_username);
            const quotedContent = escapeHtml(quotedMessage.message_content);

            // Tronquer le contenu à 100 caractères
            const truncatedContent = quotedContent.length > 100
                ? quotedContent.substring(0, 100) + '...'
                : quotedContent;

            return `
                <div class="deboucled-chat-quoted-message" data-quoted-message-id="${quotedMessageId}">
                    <div class="deboucled-chat-quote-indicator">
                        ↩️ En réponse à ${quotedUsername}
                    </div>
                    <div class="deboucled-chat-quote-content">${truncatedContent}</div>
                </div>
            `;
        } catch (error) {
            console.error('[Chat] Error fetching quoted message:', error);
            return '';
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Il y a ${diffHours}h`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `Il y a ${diffDays}j`;

        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }

    showEmptyState(message = null) {
        if (!this.messageContainer) return;

        const emptyMsg = message || 'Aucun message pour le moment. Soyez le premier à démarrer la conversation !';

        this.messageContainer.innerHTML = `
            <div class="deboucled-chat-empty">
                <div class="deboucled-chat-empty-icon">💬</div>
                <div>${emptyMsg}</div>
            </div>
        `;
    }

    isScrolledToBottom() {
        if (!this.messageContainer) return true;

        const threshold = 50;
        const position = this.messageContainer.scrollTop + this.messageContainer.clientHeight;
        const bottom = this.messageContainer.scrollHeight;

        return bottom - position < threshold;
    }

    scrollToBottom(smooth = true) {
        if (!this.messageContainer) return;

        // Ne pas scroller si un scroll manuel est en cours
        if (this.isManualScrolling) {
            return;
        }

        this.messageContainer.scrollTo({
            top: this.messageContainer.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    updateConnectionStatus(status) {
        if (!this.statusElement) return;

        const statusTexts = {
            connected: 'Connecté',
            connecting: 'Connexion...',
            disconnected: 'Déconnecté'
        };

        this.statusElement.className = `deboucled-chat-status ${status}`;

        const statusSpans = this.statusElement.querySelectorAll('span');
        if (statusSpans.length > 1) {
            statusSpans[1].textContent = statusTexts[status] || 'Inconnu';
        }
    }

    incrementUnreadCount() {
        if (this.isTabActive && !document.hidden) return;

        this.unreadCount++;
        this.updateUnreadBadge();
        this.saveUnreadState();
    }

    markMessagesAsRead() {
        this.unreadCount = 0;
        this.hasMentionNotification = false;
        this.mentionCount = 0;

        // Sauvegarder le dernier message lu
        if (this.messages.length > 0) {
            this.lastReadMessageId = this.messages[this.messages.length - 1].id;
            this.saveUnreadState();
        }

        this.updateUnreadBadge();
        this.restorePageTitle();
    }

    updateUnreadBadge() {
        const badge = document.querySelector('.deboucled-widget-tab[data-tab="chat"] .notification-badge');
        const widget = document.querySelector('.deboucled-floating-widget');

        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'block';

                // Ajouter la classe mention si on a une notification de mention
                if (this.hasMentionNotification) {
                    badge.classList.add('mention-notification');
                } else {
                    badge.classList.remove('mention-notification');
                }
            } else {
                badge.style.display = 'none';
                badge.classList.remove('mention-notification');
            }
        }

        // Mettre à jour le badge sur la languette du widget
        if (widget) {
            if (this.unreadCount > 0) {
                widget.setAttribute('data-unread-count', this.unreadCount > 99 ? '99+' : this.unreadCount);
                widget.classList.add('has-unread');

                // Ajouter la classe mention au widget aussi
                if (this.hasMentionNotification) {
                    widget.classList.add('has-mention');
                } else {
                    widget.classList.remove('has-mention');
                }
            } else {
                widget.removeAttribute('data-unread-count');
                widget.classList.remove('has-unread');
                widget.classList.remove('has-mention');
            }
        }
    }

    updateBrowserNotification() {
        // Ne modifier le titre que pour les mentions/citations et si l'onglet n'est pas visible
        if (document.hidden || !this.isTabActive) {
            if (this.hasMentionNotification && this.mentionCount > 0) {
                document.title = `(${this.mentionCount}) ${this.originalTitle}`;
            } else {
                document.title = this.originalTitle;
            }
        }
    }

    restorePageTitle() {
        document.title = this.originalTitle;
    }

    setTabActive(active) {
        this.isTabActive = active;
        if (active) {
            this.markMessagesAsRead();
        }
    }

    loadUnreadState() {
        try {
            const username = getCurrentUserPseudo();
            if (!username) return;

            const storageKey = `${this.storageKey}_${username}`;
            const saved = localStorage.getItem(storageKey);

            if (saved) {
                const data = JSON.parse(saved);
                this.lastReadMessageId = data.lastReadMessageId;

                // Calculer le nombre de messages non lus
                if (this.lastReadMessageId && this.messages.length > 0) {
                    const lastReadIndex = this.messages.findIndex(m => m.id === this.lastReadMessageId);

                    if (lastReadIndex !== -1) {
                        // Compter les messages après le dernier lu
                        const unreadMessages = this.messages.slice(lastReadIndex + 1);
                        this.unreadCount = unreadMessages.filter(m => {
                            return m.sender_username.toLowerCase() !== username.toLowerCase();
                        }).length;

                        // Vérifier s'il y a des mentions dans les messages non lus
                        const currentUserLower = username.toLowerCase();
                        const hasMention = unreadMessages.some(m => {
                            const mentionRegex = new RegExp(`@${currentUserLower}\\b`, 'i');
                            return mentionRegex.test(m.message_content) ||
                                (m.reply_to_message_id && this.messages.find(orig =>
                                    orig.id === m.reply_to_message_id &&
                                    orig.sender_username.toLowerCase() === currentUserLower
                                ));
                        });

                        if (hasMention) {
                            this.hasMentionNotification = true;
                            // Compter le nombre de mentions/citations
                            this.mentionCount = unreadMessages.filter(m => {
                                const mentionRegex = new RegExp(`@${currentUserLower}\\b`, 'i');
                                return mentionRegex.test(m.message_content) ||
                                    (m.reply_to_message_id && this.messages.find(orig =>
                                        orig.id === m.reply_to_message_id &&
                                        orig.sender_username.toLowerCase() === currentUserLower
                                    ));
                            }).length;
                        }

                        this.updateUnreadBadge();

                        if (this.mentionCount > 0) {
                            this.updateBrowserNotification();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[Chat] Failed to load unread state:', error);
        }
    }

    saveUnreadState() {
        try {
            const username = getCurrentUserPseudo();
            if (!username) return;

            const storageKey = `${this.storageKey}_${username}`;
            const data = {
                lastReadMessageId: this.lastReadMessageId,
                timestamp: Date.now()
            };

            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('[Chat] Failed to save unread state:', error);
        }
    }

    destroy() {
        this.disconnect();

        this.restorePageTitle();

        if (this.inputElement) {
            this.inputElement.replaceWith(this.inputElement.cloneNode(true));
        }
        if (this.sendButton) {
            this.sendButton.replaceWith(this.sendButton.cloneNode(true));
        }
    }
}

// Global chat instance
let decensuredChatInstance = null;

async function initializeDecensuredChat() {
    if (decensuredChatInstance) {
        console.log('[Chat] Already initialized');
        return decensuredChatInstance;
    }

    if (!getCurrentUserPseudo() || !userId) {
        console.warn('[Chat] Cannot initialize: user not authenticated');
        return null;
    }

    decensuredChatInstance = new DecensuredChat();
    //decensuredChatInstance.debugMode = true;
    const success = await decensuredChatInstance.initialize();

    if (!success) {
        decensuredChatInstance = null;
        return null;
    }

    return decensuredChatInstance;
}

function getDecensuredChatInstance() {
    return decensuredChatInstance;
}

function destroyDecensuredChat() {
    if (decensuredChatInstance) {
        decensuredChatInstance.destroy();
        decensuredChatInstance = null;
    }
}
