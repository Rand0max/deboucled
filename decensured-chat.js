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

            default:
                console.log('[Chat] Unknown message type:', data.type);
        }
    }

    async sendMessage() {
        const content = this.inputElement?.value.trim();
        if (!content || !this.isConnected) return;

        const username = getCurrentUserPseudo();

        if (!username || !userId) {
            console.error('[Chat] User not authenticated');
            return;
        }

        // Disable send button temporarily
        if (this.sendButton) {
            this.sendButton.disabled = true;
        }

        try {
            const success = await sendChatMessage(username, userId, content, 'text');

            if (success) {
                // Clear input
                if (this.inputElement) {
                    this.inputElement.value = '';
                    this.inputElement.style.height = 'auto';
                }

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

        // Only show notification badge for messages from others
        const isOwnMessage = message.sender_username.toLowerCase() === getCurrentUserPseudo().toLowerCase();

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

        // Play notification sound for new messages from others
        if (!isOwnMessage) {
            this.playNotificationSound();
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
        } else if (message.message_type === 'private') {
            messageEl.classList.add('private');
            messageEl.innerHTML = this.buildMessageHTML(message);
        } else {
            messageEl.innerHTML = this.buildMessageHTML(message);
        }

        this.messageContainer.appendChild(messageEl);
    }

    buildMessageHTML(message) {
        const time = this.formatTime(message.creation_date);
        const username = escapeHtml(message.sender_full_username || message.sender_username);
        const content = formatChatMessageContent(message.message_content);
        const profileUrl = `https://www.jeuxvideo.com/profil/${encodeURIComponent(message.sender_username.toLowerCase())}?mode=infos`;

        return `
            <div class="deboucled-chat-message-header">
                <a href="${profileUrl}" class="deboucled-chat-message-username" data-username="${escapeHtml(message.sender_username)}" target="_blank" rel="noopener noreferrer" title="Voir le profil de ${escapeHtml(message.sender_username)}">${username}</a>
                <span class="deboucled-chat-message-time">${time}</span>
            </div>
            <div class="deboucled-chat-message-content">${content}</div>
        `;
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
        this.updateUnreadBadge();
    }

    updateUnreadBadge() {
        const badge = document.querySelector('.deboucled-widget-tab[data-tab="chat"] .notification-badge');
        const widget = document.querySelector('.deboucled-floating-widget');

        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }

        // Mettre à jour le badge sur la languette du widget
        if (widget) {
            if (this.unreadCount > 0) {
                widget.setAttribute('data-unread-count', this.unreadCount > 99 ? '99+' : this.unreadCount);
                widget.classList.add('has-unread');
            } else {
                widget.removeAttribute('data-unread-count');
                widget.classList.remove('has-unread');
            }
        }
    }

    playNotificationSound() {
        // Optional: play a subtle notification sound
        // Can be implemented later if desired
    }

    setTabActive(active) {
        this.isTabActive = active;
        if (active) {
            this.markMessagesAsRead();
        }
    }

    destroy() {
        this.disconnect();

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
