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
    }

    async initialize() {
        if (!getCurrentUserPseudo() || !userId) {
            console.warn('[Chat] User not authenticated');
            return false;
        }

        this.setupDOM();
        await this.loadRecentMessages();
        this.connect();
        this.setupEventListeners();

        return true;
    }

    setupDOM() {
        this.messageContainer = document.querySelector('.deboucled-chat-messages');
        this.inputElement = document.querySelector('.deboucled-chat-input');
        this.sendButton = document.querySelector('.deboucled-chat-send-btn');
        this.statusElement = document.querySelector('.deboucled-chat-status');

        // Créer l'indicateur "En réponse à..." au-dessus de l'input
        this.createReplyIndicator();
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
                console.log('[Chat] SSE connected');
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

            default:
                console.log('[Chat] Unknown message type:', data.type);
        }
    }

    showMentionNotification(message) {
        // Notification visuelle pour les mentions
        if (!this.debugMode && (this.isTabActive && !document.hidden)) return; // Pas de notification si déjà actif (sauf en mode debug)

        console.log(`[Chat] 🔔 ${this.debugMode ? '[DEBUG MODE] ' : ''}Vous avez été mentionné par ${message.sender_full_username || message.sender_username}`);

        // Marquer qu'on a une notification de mention et incrémenter le compteur
        this.hasMentionNotification = true;
        this.mentionCount++;
        this.updateUnreadBadge();

        // On pourrait ajouter une notification système ici si désiré
        this.updateBrowserNotification();
    }

    async sendMessage() {
        const content = this.inputElement?.value.trim();
        if (!content || !this.isConnected) return;

        const username = getCurrentUserPseudo();

        if (!username || !userId) {
            console.error('[Chat] User not authenticated');
            return;
        }

        // Vérifier le throttle - empêcher l'envoi trop rapide de messages
        const now = Date.now();
        const timeSinceLastMessage = now - this.lastSentMessageTime;

        if (timeSinceLastMessage < this.messageCooldown) {
            addAlertbox('info', `Veuillez patienter avant d'envoyer un nouveau message.`);
            return;
        }

        // Disable send button temporarily
        if (this.sendButton) {
            this.sendButton.disabled = true;
        }

        try {
            // Ajouter le reply_to_message_id si on répond à un message
            const replyToId = this.replyToMessageId || null;

            const success = await sendChatMessage(username, userId, content, 'text', replyToId);

            if (success) {
                // Mettre à jour le timestamp du dernier message envoyé
                this.lastSentMessageTime = now;

                // Clear input
                if (this.inputElement) {
                    this.inputElement.value = '';
                    this.inputElement.style.height = 'auto';
                }

                // Annuler la réponse après l'envoi
                this.cancelReply();

                // Scroll to bottom immediately after sending
                setTimeout(() => {
                    this.scrollToBottom(true);
                }, 100);

                // Message will be received via SSE
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

        if (message.message_type === 'system') {
            messageEl.classList.add('system');
            messageEl.innerHTML = `<div class="deboucled-chat-message-content">${escapeHtml(message.message_content)}</div>`;
            this.messageContainer.appendChild(messageEl);
        } else if (message.message_type === 'private') {
            messageEl.classList.add('private');
            this.buildMessageHTML(message).then(html => {
                messageEl.innerHTML = html;
                this.attachReplyButton(messageEl, message);
                this.attachQuoteClickHandler(messageEl);
            });
            this.messageContainer.appendChild(messageEl);
        } else {
            this.buildMessageHTML(message).then(html => {
                messageEl.innerHTML = html;
                this.attachReplyButton(messageEl, message);
                this.attachQuoteClickHandler(messageEl);
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

    scrollToMessage(messageId) {
        const targetMessage = this.messageContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (targetMessage) {
            targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Animation de highlight temporaire
            targetMessage.style.backgroundColor = 'rgba(33, 160, 211, 0.15)';
            setTimeout(() => {
                targetMessage.style.backgroundColor = '';
            }, 2000);
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

        let html = '';

        // Afficher la citation si le message répond à un autre message
        if (message.reply_to_message_id) {
            const quotedHtml = await this.buildQuotedMessageHTML(message.reply_to_message_id);
            html += quotedHtml;
        }

        html += `
            <div class="deboucled-chat-message-header">
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
    }

    markMessagesAsRead() {
        this.unreadCount = 0;
        this.hasMentionNotification = false;
        this.mentionCount = 0;
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

    playNotificationSound() {
        // Optional: play a subtle notification sound
        // Can be implemented later if desired
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

    destroy() {
        this.disconnect();

        // Restaurer le titre de la page
        this.restorePageTitle();

        // Clean up event listeners
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
    decensuredChatInstance.debugMode = true;
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
