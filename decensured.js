///////////////////////////////////////////////////////////////////////////////////////
// DÉCENSURED
///////////////////////////////////////////////////////////////////////////////////////

let decensuredInitialized = false;
let decensuredPingTimer = null;

const DECENSURED_CONFIG = {
    // === TIMING CONFIGURATION ===
    INIT_DELAY: 1000,
    RETRY_TIMEOUT: 10 * 60 * 1000,
    POST_TIMEOUT: 40000,
    USERS_REFRESH_INTERVAL: 3 * 60 * 1000,

    // === UI CONFIGURATION ===
    NOTIFICATION_DURATION: 5000,
    NOTIFICATION_ICONS: {
        'success': '✅',
        'warning': '⚠️',
        'danger': '❌',
        'error': '❌',
        'info': 'ℹ️',
        'primary': 'ℹ️'
    },

    // === API ENDPOINTS ===
    URLS: {
        POST_MESSAGE: '/forums/message/add',
        CREATE_TOPIC: '/forums/topic/add'
    },

    // === TOPICS SPECIFIC CONFIGURATION ===
    TOPICS: {
        MIN_VALID_TOPIC_ID: 70000000,
        FORM_OBSERVER_TIMEOUT: 500,
        CHECK_DELAY: 500,
        HIGHLIGHT_DELAY: 1500
    },

    // === DOM SELECTORS ===
    SELECTORS: {
        MESSAGE_TEXTAREA: [
            '#message_topic',
            'textarea[name="message_topic"]',
            '#forums-post-message-editor textarea',
            '.message-editor textarea',
            '[data-input-name="message_topic"]',
            'textarea[placeholder*="message"]'
        ],
        POST_BUTTON: [
            '.postMessage',
            '.btn-poster-msg',
            'button[type="submit"]'
        ],
        MESSAGE_FORM: [
            '#forums-post-message-editor > form',
            '#bloc-formulaire-forum'
        ],
        MESSAGE_ELEMENTS: [
            '.conteneur-message .msg',
            '.bloc-message-forum .msg',
            '.bloc-message-forum',
            '.message-topic',
            '[id^="message"]',
            '.post-content'
        ],
        REPORT_BUTTON: [
            '.picto-msg-exclam',
            '[class*="picto-msg-exclam"]',
            '.msg-report-btn',
            '[title*="signaler"]',
            '[aria-label*="signaler"]'
        ],
        TOPIC_TITLE_INPUT: [
            '#input-topic-title',
            'input[name="input-topic-title"]',
            '#topicTitle',
            'input[name="topicTitle"]',
            'input[name="topic_title"]',
            'input[placeholder*="titre"]',
            'input[placeholder*="Titre"]',
            '#titre_topic',
            '.topic-title-input',
            'input[name="titre"]',
            '#sujet',
            'input[name="sujet"]'
        ],
        TOPIC_FORM: [
            '#forums-post-topic-editor form',
            '#bloc-formulaire-forum form',
            'form[action*="topic/add"]',
            'form[action*="/forums/topic/add"]',
            '.form-topic-add',
            'form[action*="sujet"]',
            '.formulaire-nouveau-topic',
            'form.topic-form',
            'form[method="post"]',
            '.form-post-topic'
        ],
        // === DÉCENSURED ELEMENTS ===
        DECENSURED_MESSAGE_TOGGLE: '#decensured-message-toggle',
        DECENSURED_MESSAGE_FAKE: '#decensured-message-fake-message',
        DECENSURED_TOPIC_TOGGLE: '#decensured-topic-toggle',
        DECENSURED_TOPIC_FAKE: '#decensured-topic-fake-message',
        DECENSURED_CONTAINER: '.deboucled-decensured-input',
        DECENSURED_POST_BUTTON_MESSAGE: 'button[title*="Publier le message"]',
        DECENSURED_POST_BUTTON_TOPIC: 'button[title*="Publier le topic"]',
        // === DÉBOUCLED SPECIFIC IDS ===
        DEBOUCLED_DECENSURED_TOPIC_POST_BUTTON: '#deboucled-decensured-topic-post-button',
        DEBOUCLED_DECENSURED_MESSAGE_POST_BUTTON: '#deboucled-decensured-message-post-button',
        DEBOUCLED_ORIGINAL_TOPIC_POST_BUTTON: 'button[data-decensured-topic-original="true"]',
        DEBOUCLED_ORIGINAL_MESSAGE_POST_BUTTON: 'button[data-decensured-message-original="true"]',
        // === DÉBOUCLED CONTAINERS AND ELEMENTS ===
        DEBOUCLED_DECENSURED_MESSAGE_CONTAINER: '#deboucled-decensured-message-container',
        DEBOUCLED_DECENSURED_TOPIC_CONTAINER: '#deboucled-decensured-topic-container',
        DEBOUCLED_DECENSURED_MESSAGE_TOGGLE: '#deboucled-decensured-message-toggle',
        DEBOUCLED_DECENSURED_TOPIC_TOGGLE: '#deboucled-decensured-topic-toggle',
        DEBOUCLED_DECENSURED_MESSAGE_FAKE_TEXTAREA: '#deboucled-decensured-message-fake-textarea',
        DEBOUCLED_DECENSURED_TOPIC_FAKE_TEXTAREA: '#deboucled-decensured-topic-fake-textarea',
        DEBOUCLED_DECENSURED_MESSAGE_FAKE_CONTAINER: '#deboucled-decensured-message-fake-container',
        DEBOUCLED_DECENSURED_TOPIC_FAKE_CONTAINER: '#deboucled-decensured-topic-fake-container',
        DEBOUCLED_DECENSURED_MESSAGE_FAKE_LABEL: '#deboucled-decensured-message-fake-label',
        DEBOUCLED_DECENSURED_TOPIC_FAKE_LABEL: '#deboucled-decensured-topic-fake-label',
        // === DYNAMIC ELEMENTS ===
        DEBOUCLED_DECENSURED_NOTIFICATION: '.deboucled-decensured-notification',
        DEBOUCLED_DECENSURED_BADGE: '.deboucled-decensured-badge',
        DEBOUCLED_DECENSURED_INDICATOR: '.deboucled-decensured-indicator',
        DEBOUCLED_DECENSURED_CONTENT: '.deboucled-decensured-content',
        DEBOUCLED_HEADER_DECENSURED: '#deboucled-header-decensured',
        DEBOUCLED_USERS_COUNTER: '#deboucled-users-counter'
    }
};

const platitudeMessages = [
    "J'apprécie ce forum", "Je ne sais pas quoi en penser", "Je te retourne la question", "Cette communauté est incroyable", "Que pensez-vous de l'actualité ?",
    "A titre personnel j'hésite", "Oui et non", "C'est étonnant", "Ma réaction à chaud ? ent", "C'est un peu décevant", "Je garde la tête haute", "Pourquoi ?",
    "Je préfère m'abstenir", "Que répondre à ça !", "Dans la vie c'est tout ou rien", "Je préfère en rire", "Il vaut mieux rester concentré et attentif",
    "Il faut se battre pour réussir", "La roue finira par tourner pour tout le monde !", "La chance peut te sourire à n'importe quel moment", "plus flou stp",
    "Je ne sais pas trop de quel côté me ranger", "ça reste à débattre nonobstant.", "En dépit des mesures sanitaires je reste vigilant", "Une de perdue dix de retrouvées",
    "Mieux vaut tard que jamais", "ça reste à confirmer", "Je condamne fermement", "Pourquoi tu dis ça ?", "Le destin en décidera.", "Tout est relatif tu sais...",
    "Chacun fait ce qu'il veut", "Le pollen gratte les yeux en ce moment", "Un week-end de 3 jours ça fait toujours du bien", "C'est dur le lundi :(",
    "Les prix de l'essence aident pas à se détendre non plus", "Je ronge trop souvent mes ongles", "beaucoup de monde à la pompe à essence ce matin !",
    "Il y a des chances qu'on soit pas seul dans l'univers selon moi !", "Mon eau préférée c'est la cristalline et vous ?", "Y'a plus de saisons de toute manière...",
    "On vit en démocratie ne l'oubliez pas les kheys !", "la politique ne m'intéresse pas trop de toute facon", "C'est peu ou prou la même chose", "ça a de la gueule",
    "l'important c'est de participer", "Il pleut vraiment très souvent en ce moment vous trouvez pas ?", "C'est comme chiens et chats", "bientôt mon anniversaire faut le savoir",
    "Les goûts et les couleurs hein...", "Savoir rester ouvert d'esprit c'est le plus important", "Quel temps il va faire demain déjà ?", "J'aime bien Star Wars persoent",
    "Drôle d'idée !", "Selon toi il faudrait faire quoi ?", "Peut-être pas aujourd'hui mais à réfléchir", "ta reacprout ?", "ça marche", "d'accord", "la je vois pas",
    "L'amour te tombera dessus au moment où tu t'y attendras le moins crois moi", "Garde l'oeil ouvert, et le bon !", "Protégez-vous les kheys", "La pluie c'est déprimant",
    "Prenez soin de vos proches les kheys", "Les bouchons près de Paris on en parle ?", "Le principal c'est de protéger les autres avant soi-même", "Oula c'est quoi ce topic",
    "le week-end est passé tellement vite", "C'est lequel votre sticker préféré ? Moi c'est ", "Franchement je préfère pas y penser", "ça veut dire quoi pnj ?",
    "Son point de vue est à considérer, mais restons prudents", "up", "je up", "hophophop on up le topic", "perso ça m'est égal", "peut-être pas qui sait",
    "Le travail paie", "Mangez 5 fruits et légumes par jour les kheys", "La musique de nos jours tu sais", "Ca parait peu probable en dépit de", "Faut voir",
    "A voir", "Ca permet de respirer j'avoue", "Le mieux étant de rester nuancé", "J'hésite à le dire mais bon", "Sérieux ?", "Sérieusement ?", "Non mais allo quoi",
    "Pfff de toute manière c'est inévitable khey", "Peut être un jour oui mais la j'ai la flemme", "Honnêtement c'est pas si simple", "Plus compliqué que ça",
    "Ca me rappelle Zizou en 98 ça", "D'accord mais qui l'a dit ?", "J'en reviens pas si nofake", "Je re, je dois aller manger", " Aidez moi pour mes devoirs en MP svp",
    "Faut aller voter c'est important pour la démocratie", "Allez les bleus !", "Mon voisin me regarde pas la fenêtre chelou non ?", "Rien de nouveau, toujours le boulot",
    "Votre youtubeur préféré c'est qui ? J'aime bien Squeezie", "J'ai renversé mon café l'autre jour", "Le ciel est grisatre aujourd'hui non ?", "Les oiseaux chantent ou crient ?",
    "J'aimerais bien voir ça", "Plutôt deux fois qu'une", "Le lièvre ou la tortue ?", "Petit à petit quoi", "Boucle", "Boucled", "Malaise", "Gros malaise", "Enorme malaise",
    "Ok khey", "Depuis quand ?", "Y'a pas à dire l'evian est délicieuse", "Harry Potter vous aimez ?", "Je préfère être sur téléphone perso", "Je préfère être sur pc perso",
    "Y'a pas à dire, Zidane il était bon hein", ":(", ":ouch:", ":ouch2:", ":-(", ":noel:", ":play:", "Je go toilettes attendez moi", "Le topic bug non ?", "J'aurais pas dit ça moi",
    "si tu le dis...", "personne te croit mais bon...", "c'est pas si sûr", "explique un peu plus si tu veux nous convaincre", "je ne sais pas quoi en penser",
    "ça se tente", "Il faut toujours croire en ses rêves", "Tellement content d'être ici", "Vive la république !", "Profitez bien de la vie les kheys", "Le temps passe",
    "du coup je ne sais pas qui écouter", "Ce topic est étonnant", "Je dis ça je dis rien", "Restons courtois svp", "Attendez j'écris un gros pavé pour expliquer",
    "Source ?", "Ca a été debunk y'a longtemps", "Euh pardon ?", "Pffff même pas", "Rien compris", "Rien compris l'op", "rien compris à ton message", "qui me cite la ?",
    "Tant qu'il y a de la vie il y a de l'espoir", "Ouaip faisons comme ça", "Sélection naturelle", "Naturelle", "ent", "pas faux", "je ne me positionne pas",
    "ça n'en vaut pas la peine", "Après l'heure, c'est plus l'heure", "J'ai rencontré quelqu'un", "Plutôt l'un que l'autre si tu veux mon avis", "Honnêtement je ne sais pas",
    "C'est en cours d'étude khey", "Hé oui le temps passe", "Jamais deux sans trois j'ai envie de dire", "En parlant du loup...", "Pas de sophismes svp",
    "ca vient de quel journal ?", "Mon pied a failli faire déco ma box ahiii", "Ayaaaaaaa", "Ahiiii", "Ahi", "Ayaaa", "oulaaa qu'est ce que tu n'as pas dit la ?",
    "Rien à voir mais vous savez pourquoi y'a pas la formule 1 ce week-end ?", "On se retrouve sur le topic M6 kheyou", "Salut les quilles je viens d'arriver, j'ai raté quoi ?",
    "a plus tard les kheys, je dois me déco là", "Plutôt pour ou contre ? chaud", "chaud", "abusé j'ai lu quoi la ?", "mouais bof", "malaise", "qui a dit ca en fait ?",
    "A bon entendeur...", "A méditer...", "Sur quoi tu te bases pour dire ça ?", "Sur quelle base au juste ?", "Je fais mon trou en dépit de", "Faut il repasser ses slips ?",
    "On va faire comme si on avait rien lu", "Faut il repasser ses chaussettes ?", "Faut il repasser ses t-shirts ?", "Faut il repasser ses jeans ?", "Je suis troublé",
    "Rien compris", "Quelqu'un comprend l'auteur ?", "Quelqu'un a compris ?", "Comprend pas là", "Mais il parle de quoi lui ?", "Complètement H.S nonobstant",
    "Moi tu vois, je vis pour le moment présent, je me casse pas la tête", "Et sinon tu bosses dans quoi ?", "Après je prétend pas avoir la vérité absolue", "Ah ça..."];


///////////////////////////////////////////////////////////////////////////////////////
// Utilitaires DOM helpers
///////////////////////////////////////////////////////////////////////////////////////

function findElement(selectors, context = document) {
    for (const selector of selectors) {
        const element = context.querySelector(selector);
        if (element && element.offsetParent !== null) {
            return element;
        }
    }
    return null;
}

function cleanupTimers() {
    if (decensuredPingTimer) {
        clearInterval(decensuredPingTimer);
        decensuredPingTimer = null;
    }
    if (window.deboucledStatsTimer) {
        clearInterval(window.deboucledStatsTimer);
        window.deboucledStatsTimer = null;
    }
    if (window.deboucledCardTimer) {
        clearInterval(window.deboucledCardTimer);
        window.deboucledCardTimer = null;
    }
    cleanupTopicDecensuredState();
}

function handleApiError(error, context, showNotification = false) {
    console.error(`[Déboucled Décensured] ${context}:`, error);

    if (typeof sendDiagnostic === 'function') {
        sendDiagnostic(0, `Décensured: ${context} - ${error.message}`);
    }

    if (showNotification) {
        addAlertbox('error', `Erreur ${context}: ${error.message}`);
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// Helpers
///////////////////////////////////////////////////////////////////////////////////////

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

function getTitleFromTopicPage() {
    const titleSelectors = [
        '.topic-title',
        'h1',
        '.bloc-title h1',
        '.titre-topic'
    ];

    for (const selector of titleSelectors) {
        const titleElement = document.querySelector(selector);
        if (titleElement) {
            return titleElement.textContent.trim();
        }
    }

    return document.title.replace(' - Jeuxvideo.com', '').trim();
}

function logDecensuredError(error, context = '') {
    handleApiError(error, context);
}

function getRandomPlatitudeMessage() {
    return platitudeMessages[Math.floor(Math.random() * platitudeMessages.length)];
}

///////////////////////////////////////////////////////////////////////////////////////
// Notifications utilisateur
///////////////////////////////////////////////////////////////////////////////////////

function addAlertbox(type, message, duration = DECENSURED_CONFIG.NOTIFICATION_DURATION) {
    const notification = document.createElement('div');
    notification.className = `deboucled-decensured-notification deboucled-notification-${type}`;
    notification.id = `deboucled-notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const icon = DECENSURED_CONFIG.NOTIFICATION_ICONS[type] || DECENSURED_CONFIG.NOTIFICATION_ICONS['info'];

    notification.innerHTML = `
        <span class="deboucled-notification-icon">${icon}</span>
        <span class="deboucled-notification-message">${message}</span>
        <button class="deboucled-decensured-notification-close" onclick="this.parentNode.remove()">×</button>
    `;

    const existingNotifications = document.querySelectorAll(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_NOTIFICATION);
    if (existingNotifications.length > 0) {
        const topOffset = 20 + (existingNotifications.length * 80);
        notification.style.top = `${topOffset}px`;
    }

    document.body.appendChild(notification);

    if (duration > 0) {
        setTimeout(() => {
            notification.style.animation = 'deboucledSlideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    return notification;
}

window.addEventListener('beforeunload', cleanupTimers);

///////////////////////////////////////////////////////////////////////////////////////
// API Helpers
///////////////////////////////////////////////////////////////////////////////////////

async function fetchDecensuredApi(endpoint, options = {}) {
    try {
        const method = options.method || 'GET';

        if (method === 'GET') {
            const data = await fetchJson(endpoint, options.timeout || 5000);
            if (data === undefined) {
                return null;
            }
            return data;
        } else {
            return new Promise((resolve) => {
                GM.xmlHttpRequest({
                    method: method,
                    url: endpoint,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    data: options.body || null,
                    timeout: options.timeout || 5000,
                    onload: (response) => {
                        if (response.status >= 200 && response.status < 300) {
                            try {
                                resolve(JSON.parse(response.responseText));
                            } catch {
                                resolve({ success: true });
                            }
                        } else {
                            console.error('fetchDecensuredApi erreur HTTP :', response.status, response.statusText);
                            resolve(null);
                        }
                    },
                    onerror: (response) => {
                        console.error('fetchDecensuredApi erreur réseau :', response);
                        resolve(null);
                    },
                    ontimeout: () => {
                        console.warn('fetchDecensuredApi timeout :', endpoint);
                        resolve(null);
                    }
                });
            });
        }
    } catch (error) {
        console.error('fetchDecensuredApi exception :', error);
        return null;
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// Utilitaires pour les URLs
///////////////////////////////////////////////////////////////////////////////////////

function cleanTopicUrl(url) {
    if (!url) return url;

    const cleanUrl = url.split('#')[0];

    if (cleanUrl.endsWith('.htm')) {
        return cleanUrl;
    }

    console.warn('URL de topic ne se termine pas par .htm :', url);
    return url;
}

///////////////////////////////////////////////////////////////////////////////////////
// Traitement du contenu des messages
///////////////////////////////////////////////////////////////////////////////////////

async function processContent(message, fakeMessage = '') {
    try {
        const finalFake = fakeMessage || getRandomPlatitudeMessage();

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

///////////////////////////////////////////////////////////////////////////////////////
// Formatage du contenu des messages
///////////////////////////////////////////////////////////////////////////////////////

function formatSpoilers(text) {
    return text.replace(/\[spoil\](.*?)\[\/spoil\]/gs, (match, content) => {
        return `<span class="JvCare JvCare--masked" data-tooltip="Cliquer pour révéler"><span class="JvCare-content">${content.trim()}</span></span>`;
    });
}

function formatCodeBlocks(text) {
    return text.replace(/```([\s\S]*?)```/g, (match, content) => {
        const cleanContent = content.trim().replace(/\n/g, '\n');
        return `<pre class="jv-code-block"><code>${cleanContent}</code></pre>`;
    });
}

function formatInlineCode(text) {
    return text.replace(/`([^`\n]+)`/g, '<code class="jv-code">$1</code>');
}

function formatBoldText(text) {
    text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
    return text;
}

function formatItalicText(text) {
    text = text.replace(/\B\*([^*\n]+)\*\B/g, '<em>$1</em>');
    text = text.replace(/\b_([^_\n]+)_\b/g, '<em>$1</em>');
    return text;
}

function formatStrikethrough(text) {
    return text.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
}

function formatImages(text) {
    return text.replace(/https:\/\/(?:www\.|image\.)?noelshack\.com\/[^\s<>"']+\.(png|jpg|jpeg|gif|webp)/gi, (match) => {
        const imageUrl = match;
        const miniUrl = match.replace('/fichiers/', '/minis/').replace('www.noelshack.com/', 'image.noelshack.com/minis/');

        return `<a href="${imageUrl}" target="_blank" rel="noreferrer"><img class="img-shack" src="${miniUrl}" width="68" height="51" alt="${imageUrl}"></a>`;
    });
}

function formatLinks(text) {
    return text.replace(/(https?:\/\/[^\s<>"']+)/g, (url, match, offset) => {
        const beforeUrl = text.substring(Math.max(0, offset - 50), offset);
        const afterUrl = text.substring(offset + url.length, Math.min(text.length, offset + url.length + 50));

        if (beforeUrl.includes('href="') || beforeUrl.includes('src="') ||
            afterUrl.startsWith('"') || beforeUrl.endsWith('="')) {
            return url;
        }

        if (url.includes('image.noelshack.com')) {
            return url;
        }

        return `<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`;
    });
}

function processParagraphContent(paragraph) {
    const lines = paragraph.split('\n');
    let processedLines = [];
    let inList = false;
    let inQuote = false;
    let quoteLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Citations > texte
        if (line.startsWith('>')) {
            if (!inQuote) {
                inQuote = true;
                quoteLines = [];
            }
            quoteLines.push(line.substring(1).trim());
            continue;
        } else if (inQuote) {
            // Fin de citation
            processedLines.push(`<blockquote class="blockquote-jv">${quoteLines.join('<br>')}</blockquote>`);
            inQuote = false;
            quoteLines = [];
        }

        // Listes - élément ou * élément
        if (line.match(/^[-*]\s+/)) {
            if (!inList) {
                inList = true;
                processedLines.push('<ul class="jv-list">');
            }
            const itemText = line.replace(/^[-*]\s+/, '');
            processedLines.push(`<li>${itemText}</li>`);
            continue;
        } else if (inList) {
            // Fin de liste
            processedLines.push('</ul>');
            inList = false;
        }

        // Mentions @pseudo (simple détection)
        line = line.replace(/@([a-zA-Z0-9_-]+)/g, '<span class="jv-mention">@$1</span>');

        // Ligne normale
        processedLines.push(line);
    }

    // Fermer les blocs ouverts en fin de paragraphe
    if (inQuote) {
        processedLines.push(`<blockquote class="blockquote-jv">${quoteLines.join('<br>')}</blockquote>`);
    }
    if (inList) {
        processedLines.push('</ul>');
    }

    return processedLines.join('\n');
}

function cleanupContent(content) {
    return content
        .replace(/\n\n+/g, '\n')  // Supprime les doubles \n
        .replace(/\n(<\/ul>|<\/blockquote>)/g, '$1')  // Supprime \n avant les fermetures
        .replace(/(<ul[^>]*>|<blockquote[^>]*>)\n/g, '$1')  // Supprime \n après les ouvertures
        .replace(/\n(<li>)/g, '$1')  // Supprime \n avant les <li>
        .replace(/\n/g, '<br>');  // Convertit les \n restants en <br>
}

function formatParagraphs(text) {
    const paragraphs = text.split(/\n\s*\n/);

    const processedParagraphs = paragraphs.map(paragraph => {
        if (!paragraph.trim()) return '';

        const content = processParagraphContent(paragraph.trim());
        if (!content || content.trim() === '') return '';

        const finalContent = cleanupContent(content);

        // Gère la classe spéciale pour les images seules sans ligne blanche précédente
        const isImageOnly = /^<a href[^>]*><img class="message__urlImg"[^>]*><\/a>$/.test(finalContent);
        const className = isImageOnly ? 'class="message__noBlankline"' : '';

        return `<p ${className}>${finalContent}</p>`;
    }).filter(p => p && p.trim() !== '' && p !== '<p></p>').join('');

    // Post-traitement final pour supprimer les paragraphes vides résiduels
    return processedParagraphs.replace(/<p><\/p>/g, '').replace(/<p\s+><\/p>/g, '');
}

function formatMessageContent(rawText) {
    if (!rawText) return '';

    let text = rawText;

    text = formatSpoilers(text);
    text = formatCodeBlocks(text);
    text = formatInlineCode(text);
    text = formatBoldText(text);
    text = formatItalicText(text);
    text = formatStrikethrough(text);
    text = formatImages(text);
    text = formatLinks(text);

    return formatParagraphs(text);
}

function initializeSpoilerHandlers(container) {
    if (!container) return;

    const spoilers = container.querySelectorAll('.JvCare--masked');
    spoilers.forEach(spoiler => {
        spoiler.addEventListener('click', function () {
            this.classList.remove('JvCare--masked');
            this.classList.add('JvCare--revealed');
        });
    });
}

///////////////////////////////////////////////////////////////////////////////////////
// Gestion des utilisateurs
///////////////////////////////////////////////////////////////////////////////////////

async function pingDecensuredApi() {
    const username = getUserPseudo();
    if (!username) {
        return;
    }

    const lastPing = await store.get(storage_decensuredLastPing, 0);
    const now = Date.now();

    if (now - lastPing < decensuredPingInterval) {
        return;
    }

    const failureKey = 'deboucled_decensuredPingFailures';
    const lastFailure = await store.get(failureKey, 0);
    const timeSinceFailure = now - lastFailure;

    if (timeSinceFailure < DECENSURED_CONFIG.RETRY_TIMEOUT) {
        return;
    }

    try {
        const response = await fetchDecensuredApi(apiDecensuredUsersUrl, {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                userversion: getCurrentScriptVersion()
            })
        });

        if (response) {
            await store.set(failureKey, 0);
            await store.set(storage_decensuredLastPing, now);
        } else {
            await store.set(failureKey, now);
        }
    } catch (error) {
        await store.set(failureKey, now);
        console.error('Ping API échoué :', error);
        logDecensuredError(error, 'pingDecensuredApi');
        await store.set(storage_decensuredLastPing, now - decensuredPingInterval + DECENSURED_CONFIG.RETRY_TIMEOUT);
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// Gestion des messages
///////////////////////////////////////////////////////////////////////////////////////

async function createDecensuredMessage(messageId, username, messageUrl, fakeContent, realContent, topicId, topicUrl, topicTitle) {
    try {
        const currentUserId = userId || '0';

        const cleanedTopicUrl = cleanTopicUrl(topicUrl);

        const data = {
            userid: currentUserId,
            messageid: messageId,
            username: username,
            messageurl: messageUrl,
            fakecontent: fakeContent,
            realcontent: realContent,
            topicid: topicId,
            topicurl: cleanedTopicUrl,
            topictitle: topicTitle,
            creationdate: new Date().toISOString()
        };

        for (const [key, value] of Object.entries(data)) {
            if (!value || !value.toString().length) {
                console.error(`Champ manquant ou vide: ${key} = ${value}`);
            }
        }

        if (!isValidTopicId(topicId)) {
            console.error(`TopicId invalide: ${topicId} < ${DECENSURED_CONFIG.TOPICS.MIN_VALID_TOPIC_ID}`);
        }

        const response = await fetchDecensuredApi(apiDecensuredCreateMessageUrl, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        return response !== null;
    } catch (error) {
        logDecensuredError(error, 'createDecensuredMessage');
        return false;
    }
}

async function getDecensuredMessages(topicId) {
    try {
        const data = await fetchDecensuredApi(`${apiDecensuredMessagesUrl}/${topicId}/999999/0`);
        if (data && Array.isArray(data)) {
            return data;
        }
    } catch (error) {
        logDecensuredError(error, 'getDecensuredMessages');
    }

    return [];
}

///////////////////////////////////////////////////////////////////////////////////////
// Gestion des topics
///////////////////////////////////////////////////////////////////////////////////////

async function createDecensuredTopic(topicData) {
    try {
        const username = getUserPseudo() || 'Unknown';

        const topicApiData = {
            topicid: topicData.topic_id,
            topicname: topicData.title,
            topicurl: topicData.jvc_topic_url,
            topicauthor: username,
            creationdate: new Date().toISOString()
        };

        for (const [key, value] of Object.entries(topicApiData)) {
            if (!value || !value.toString().length) {
                console.warn(`⚠️ Champ manquant ou vide pour topic: ${key} = ${value}`);
            }
        }

        const topicResponse = await fetchDecensuredApi(apiDecensuredCreateTopicUrl, {
            method: 'POST',
            body: JSON.stringify(topicApiData)
        });

        const success = topicResponse !== null;

        return success;
    } catch (error) {
        console.error('💥 Erreur dans createDecensuredTopic:', error);
        logDecensuredError(error, 'createDecensuredTopic');
        return false;
    }
}

async function createDecensuredTopicMessage(topicId, messageId, topicUrl, topicTitle, fakeContent, realContent) {
    try {
        const username = getUserPseudo() || 'Unknown';

        const messageApiData = {
            userid: userId || '0',
            messageid: messageId,
            username: username,
            messageurl: topicUrl + '#message' + messageId,
            fakecontent: fakeContent,
            realcontent: realContent,
            topicid: topicId,
            topicurl: topicUrl,
            topictitle: topicTitle,
            creationdate: new Date().toISOString()
        };


        for (const [key, value] of Object.entries(messageApiData)) {
            if (!value || !value.toString().length) {
                console.warn(`⚠️ Champ manquant ou vide pour message: ${key} = ${value}`);
            }
        }


        const messageResponse = await fetchDecensuredApi(apiDecensuredCreateMessageUrl, {
            method: 'POST',
            body: JSON.stringify(messageApiData)
        });



        const success = messageResponse !== null;


        return success;
    } catch (error) {
        console.error('💥 Erreur dans createDecensuredTopicMessage:', error);
        logDecensuredError(error, 'createDecensuredTopicMessage');
        return false;
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// Interface utilisateur
///////////////////////////////////////////////////////////////////////////////////////

function buildDecensuredBadge() {
    const badge = document.createElement('span');
    badge.className = 'deboucled-decensured-badge deboucled-decensured-premium-logo';
    badge.id = `deboucled-badge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    badge.setAttribute('deboucled-data-tooltip', `Membre d'élite Décensured`);
    return badge;
}

function buildDecensuredInputUI() {
    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topicmessages') return;

    const modernEditor = document.querySelector('#forums-post-message-editor');
    const traditionalTextarea = document.querySelector('#message_topic');

    let container;
    if (modernEditor) {
        container = modernEditor.parentElement;
    } else if (traditionalTextarea) {
        container = traditionalTextarea.parentElement;
    } else {
        setTimeout(() => {
            buildDecensuredInputUI();
            buildDecensuredTopicInputUI();
            setTimeout(highlightDecensuredTopics, DECENSURED_CONFIG.TOPICS.HIGHLIGHT_DELAY);
        }, DECENSURED_CONFIG.INIT_DELAY);
        return;
    }

    if (!container || document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_MESSAGE_CONTAINER)) return;

    const decensuredContainer = createDecensuredContainer('message');

    if (modernEditor) {
        modernEditor.parentElement.insertBefore(decensuredContainer, modernEditor);
    } else if (traditionalTextarea) {
        traditionalTextarea.parentElement.insertBefore(decensuredContainer, traditionalTextarea);
    }

    setupToggleHandlers(decensuredContainer, 'message', (isActive) => {
        if (isActive) {
            replacePostButtonWithDecensured();
            const textarea = getMessageTextarea();
            if (textarea) {
                textarea.classList.add('deboucled-decensured-textarea-active');
                if (textarea.placeholder !== undefined) {
                    textarea.placeholder = 'Votre véritable message, chiffré et visible uniquement par les utilisateurs Déboucled.';
                }
            }
        } else {
            restoreOriginalPostButton();
            const textarea = getMessageTextarea();
            if (textarea) {
                textarea.classList.remove('deboucled-decensured-textarea-active');
                if (textarea.placeholder !== undefined) {
                    textarea.placeholder = '';
                }
            }
        }
    });

    setTimeout(() => setupTabOrder(), 100);
}

let tabOrderSetupInProgress = false;

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
    // Ordre logique : Toggle Décensured → Fake Message → Textarea principal → Bouton Post
    // Utiliser des tabindex élevés (100+) pour éviter les conflits avec JVC
    let tabIndex = 100;

    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topicmessages') return;

    // 1. Toggle button Décensured
    const toggleButton = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_MESSAGE_TOGGLE);
    if (toggleButton) {
        toggleButton.tabIndex = tabIndex++;
    }

    // 2. Fake message textarea (si visible)
    const fakeTextarea = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_MESSAGE_FAKE_TEXTAREA);
    if (fakeTextarea) {
        fakeTextarea.tabIndex = tabIndex++;
    }

    // 3. Textarea principal du message
    const mainTextarea = findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_TEXTAREA, context);
    if (mainTextarea) {
        mainTextarea.tabIndex = tabIndex++;
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
    // Ordre logique : Titre → Toggle Décensured → Fake Message → Textarea → Bouton Post
    // Utiliser des tabindex élevés (200+) pour éviter les conflits avec JVC
    let tabIndex = 200;

    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topiclist') return;

    // 1. Input du titre du topic
    const titleInput = findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_INPUT, form);
    if (titleInput) {
        titleInput.tabIndex = tabIndex++;
    }

    // 2. Toggle button Décensured
    const toggleButton = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_TOGGLE);
    if (toggleButton) {
        toggleButton.tabIndex = tabIndex++;
    }

    // 3. Fake message textarea (si visible)
    const fakeTextarea = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_FAKE_TEXTAREA);
    if (fakeTextarea) {
        fakeTextarea.tabIndex = tabIndex++;
    }

    // 4. Textarea principal du message
    const mainTextarea = findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_TEXTAREA, form);
    if (mainTextarea) {
        mainTextarea.tabIndex = tabIndex++;
    }

    // 5. Bouton de post (original ou Décensured)
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

///////////////////////////////////////////////////////////////////////////////////////
// Utilitaires pour l'interface Décensured
///////////////////////////////////////////////////////////////////////////////////////

function createDecensuredContainer(type = 'message') {
    const container = document.createElement('div');
    container.className = 'deboucled-decensured-input';
    container.id = `deboucled-decensured-${type}-container`;

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.id = `deboucled-decensured-${type}-toggle`;
    toggleButton.className = 'deboucled-decensured-toggle btn btn-primary';
    toggleButton.innerHTML = `🔒 ${type === 'topic' ? 'Topic' : 'Message'} masqué`;
    toggleButton.title = `Activer le mode ${type} masqué`;

    const fakeContainer = document.createElement('div');
    fakeContainer.className = 'deboucled-decensured-fake-message-container';
    fakeContainer.id = `deboucled-decensured-${type}-fake-container`;

    const label = document.createElement('label');
    label.textContent = 'Message visible par tous (optionnel) :';
    label.className = 'form-label deboucled-decensured-fake-message-label';
    label.id = `deboucled-decensured-${type}-fake-label`;

    const input = document.createElement('textarea');
    input.id = `deboucled-decensured-${type}-fake-textarea`;
    input.className = 'form-control deboucled-decensured-fake-message-input';
    input.placeholder = 'Ce message sera affiché pour ceux qui n\'ont pas Déboucled. Si aucun message n\'est fourni, un message aléatoire sera généré.';
    input.rows = 3;

    if (type === 'message') {
        input.addEventListener('input', () => {
            if (input.classList.contains('auto-generated')) {
                input.classList.remove('auto-generated');
                input.style.fontStyle = 'normal';
            }
        });
    }

    fakeContainer.appendChild(label);
    fakeContainer.appendChild(input);
    container.appendChild(toggleButton);
    container.appendChild(fakeContainer);

    return container;
}

function setupToggleHandlers(container, type, onToggle) {
    const toggleButton = document.getElementById(`deboucled-decensured-${type}-toggle`);
    const fakeContainer = document.getElementById(`deboucled-decensured-${type}-fake-container`);

    let isActive = false;

    toggleButton.addEventListener('click', () => {
        isActive = !isActive;
        toggleButton.checked = isActive;

        if (isActive) {
            toggleButton.innerHTML = '🔓 Mode normal';
            toggleButton.title = `Désactiver le mode ${type} masqué`;
            toggleButton.classList.add('deboucled-decensured-toggle-active');

            fakeContainer.classList.remove('deboucled-decensured-hiding');
            fakeContainer.classList.add('deboucled-decensured-visible');
        } else {
            toggleButton.innerHTML = `🔒 ${type === 'topic' ? 'Topic' : 'Message'} masqué`;
            toggleButton.title = `Activer le mode ${type} masqué`;
            toggleButton.classList.remove('deboucled-decensured-toggle-active');

            if (fakeContainer.classList.contains('deboucled-decensured-visible')) {
                fakeContainer.classList.remove('deboucled-decensured-visible');
                fakeContainer.classList.add('deboucled-decensured-hiding');

                setTimeout(() => {
                    if (!isActive) {
                        fakeContainer.classList.remove('deboucled-decensured-hiding');
                    }
                }, 200);
            }
        }

        if (onToggle) onToggle(isActive);

        setTimeout(() => setupTabOrder(), 50);
    });

    return { toggleButton, fakeContainer, isActive: () => isActive };
}

///////////////////////////////////////////////////////////////////////////////////////
// GESTION DES TOPICS
///////////////////////////////////////////////////////////////////////////////////////

const topicDecensuredState = {
    isObservingForm: false,
    currentObserver: null,
    formElements: null,
    toggleHandlers: null
};

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
        const isValid = topicDecensuredState.formElements.titleInput &&
            document.contains(topicDecensuredState.formElements.titleInput);
        if (isValid) return topicDecensuredState.formElements;
    }

    const elements = {
        titleInput: findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_TITLE_INPUT),
        messageTextarea: findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_TEXTAREA),
        fakeMessageInput: document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_FAKE_TEXTAREA),
        form: findElement(DECENSURED_CONFIG.SELECTORS.TOPIC_FORM)
    };

    if (elements.titleInput && elements.messageTextarea && elements.form) {
        topicDecensuredState.formElements = elements;
    }

    return elements;
}

function buildDecensuredTopicInputUI() {
    if (!isTopicsDecensuredEnabled()) return;

    const currentPage = getCurrentPageType(window.location.pathname);

    if (currentPage === 'topicmessages') {
        const pendingTopicJson = store.get(storage_pendingDecensuredTopic, storage_pendingDecensuredTopic_default);
        if (!pendingTopicJson) {
            setTimeout(verifyCurrentTopicDecensured, DECENSURED_CONFIG.TOPICS.CHECK_DELAY);
        }
        return;
    }

    if (currentPage !== 'topiclist') return;

    const elements = getTopicFormElements();

    if (!elements.form || !elements.titleInput || !elements.messageTextarea) {
        setupTopicFormObserver();
        return;
    }

    injectDecensuredTopicUI(elements);
}

function setupTopicFormObserver() {
    if (topicDecensuredState.isObservingForm) return;

    const blocFormulaire = document.querySelector('#bloc-formulaire-forum');
    if (!blocFormulaire) return;

    topicDecensuredState.isObservingForm = true;

    const checkAndInject = () => {
        const elements = getTopicFormElements();
        if (elements.form && elements.titleInput && elements.messageTextarea) {
            if (!document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_CONTAINER)) {
                injectDecensuredTopicUI(elements);
            }
            cleanupTopicDecensuredState();
            return true;
        }
        return false;
    };

    if (checkAndInject()) return;

    const observer = new MutationObserver(() => {
        checkAndInject();
    });

    topicDecensuredState.currentObserver = observer;
    observer.observe(blocFormulaire, { childList: true, subtree: true });

    setTimeout(checkAndInject, DECENSURED_CONFIG.TOPICS.FORM_OBSERVER_TIMEOUT);
}

function injectDecensuredTopicUI(elements) {
    const { messageTextarea } = elements;

    if (document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_CONTAINER)) return;

    const container = createDecensuredContainer('topic');
    messageTextarea.parentElement.insertBefore(container, messageTextarea);

    topicDecensuredState.toggleHandlers = setupToggleHandlers(container, 'topic', (isActive) => {
        if (isActive) {
            replaceTopicPostButtonWithDecensured();
            setupTopicTextareaForDecensured(elements.messageTextarea);
        } else {
            restoreOriginalTopicPostButton();
            restoreTopicTextareaFromDecensured(elements.messageTextarea);
        }
    });

    setTimeout(() => setupTabOrder(), 100);
}

function setupTopicTextareaForDecensured(textarea) {
    if (!textarea) return;
    
    // Définir le nouveau placeholder pour le mode Décensured
    textarea.placeholder = 'Votre véritable message, chiffré et visible uniquement par les utilisateurs Déboucled.';
    
    // Ajouter la classe pour le style visuel
    textarea.classList.add('deboucled-decensured-textarea-active');
}

function restoreTopicTextareaFromDecensured(textarea) {
    if (!textarea) return;
    
    // Laisser le placeholder vide au lieu de restaurer l'ancien
    textarea.placeholder = '';
    
    // Retirer la classe de style
    textarea.classList.remove('deboucled-decensured-textarea-active');
}

///////////////////////////////////////////////////////////////////////////////////////
// GESTION DES BOUTONS DE CRÉATION DE TOPICS DÉCENSURED
///////////////////////////////////////////////////////////////////////////////////////

let isProcessingTopicCreation = false;

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
    decensuredButton.title = 'Publier le topic avec chiffrement Déboucled';
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

    setTimeout(() => setupTabOrder(), 50);
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

///////////////////////////////////////////////////////////////////////////////////////
// CRÉATION DE TOPICS
///////////////////////////////////////////////////////////////////////////////////////

async function handleTopicDecensuredCreationFlow() {
    try {
        await handleDecensuredTopicCreation();

        setTimeout(() => {
            triggerNativeTopicCreation();
        }, 100);
    } catch (error) {
        console.error('❌ Erreur dans handleTopicDecensuredCreationFlow:', error);
        throw error;
    }
}

function triggerNativeTopicCreation() {
    const originalPostButton = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_ORIGINAL_TOPIC_POST_BUTTON);
    if (originalPostButton) {
        originalPostButton.style.visibility = 'hidden';
        originalPostButton.style.display = '';
        originalPostButton.click();
        setTimeout(() => {
            originalPostButton.style.display = 'none';
            originalPostButton.style.visibility = '';
        }, 50);
    }
}

async function handleDecensuredTopicCreation() {
    const elements = getTopicFormElements();
    if (!elements.titleInput || !elements.messageTextarea) {
        throw new Error('Impossible de trouver les éléments du formulaire');
    }

    const fakeMessageInput = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_FAKE_TEXTAREA);

    const initialTopicTitle = elements.titleInput.value.trim();
    const initialRealMessage = elements.messageTextarea.value.trim();
    const initialFakeMessage = fakeMessageInput ? fakeMessageInput.value.trim() : '';

    if (!initialTopicTitle || !initialRealMessage) {
        throw new Error('Le titre et le message sont obligatoires');
    }

    const finalFakeMessage = initialFakeMessage.length > 0 ? initialFakeMessage : getRandomPlatitudeMessage();

    const processedContent = await processContent(initialRealMessage, finalFakeMessage);

    const topicData = {
        title: initialTopicTitle,
        realMessage: initialRealMessage,
        processedContent: processedContent,
        timestamp: Date.now()
    };

    await store.set(storage_pendingDecensuredTopic, JSON.stringify(topicData));

    setTextAreaValue(elements.messageTextarea, finalFakeMessage);

    return { success: true, fakeMessage: finalFakeMessage };
}

async function processNewTopicCreation() {
    const pendingTopicJson = await store.get(storage_pendingDecensuredTopic, storage_pendingDecensuredTopic_default);
    if (!pendingTopicJson) return;

    let pendingTopic;
    try {
        pendingTopic = JSON.parse(pendingTopicJson);
    } catch (error) {
        console.error('Erreur parsing pendingTopic:', error);
        await store.delete(storage_pendingDecensuredTopic);
        return;
    }

    const timeElapsed = Date.now() - pendingTopic.timestamp;
    if (timeElapsed > 30000) {
        await store.delete(storage_pendingDecensuredTopic);
        return;
    }

    const topicId = extractTopicIdFromUrl(window.location.pathname);
    const topicUrl = cleanTopicUrl(window.location.href);
    const username = getUserPseudo();

    if (!topicId || !username) return;

    const messages = document.querySelectorAll('.conteneur-messages-pagi > div.bloc-message-forum');
    if (messages.length !== 1) return;

    const firstMessage = messages[0];
    const authorElement = firstMessage.querySelector('.text-user, .bloc-pseudo-msg');
    const authorName = authorElement ? authorElement.textContent.trim() : '';

    if (authorName !== username) return;

    const success = await createTopicAndMessage(topicId, topicUrl, pendingTopic, firstMessage);

    if (success) {
        addAlertbox('success', 'Topic Décensured créé avec succès !');

        const decensuredMsg = {
            message_real_content: pendingTopic.realMessage
        };
        await applyDecensuredFormattingToNewTopic(firstMessage, decensuredMsg);
        highlightCurrentTopicAsDecensured();
    } else {
        addAlertbox('warning', 'Topic créé sur JVC mais échec de l\'enregistrement Décensured');
    }

    await store.delete(storage_pendingDecensuredTopic);
}

async function createTopicAndMessage(topicId, topicUrl, pendingTopic, messageElement) {
    const topicApiResult = await createDecensuredTopic({
        topic_id: topicId,
        title: pendingTopic.title,
        jvc_topic_url: topicUrl
    });

    if (!topicApiResult) return false;

    const messageId = getMessageId(messageElement);

    if (messageId) {
        const messageApiResult = await createDecensuredTopicMessage(
            topicId, messageId, topicUrl, pendingTopic.title,
            pendingTopic.processedContent.fake, pendingTopic.realMessage
        );

        if (messageApiResult) {
            await applyDecensuredFormattingToNewTopic(messageElement, {
                message_real_content: pendingTopic.realMessage
            });
        }

        return messageApiResult;
    }

    return false;
}

///////////////////////////////////////////////////////////////////////////////////////
// DÉTECTION ET TRAITEMENT DES NOUVEAUX TOPICS CRÉÉS
///////////////////////////////////////////////////////////////////////////////////////

async function checkAndProcessNewTopic() {
    const currentPage = getCurrentPageType(window.location.pathname);
    if (currentPage !== 'topicmessages') return;

    await processNewTopicCreation();
}

async function applyDecensuredFormattingToNewTopic(messageElement, decensuredMsg) {
    processDecensuredMessage(messageElement, decensuredMsg);

    const topicTitleElement = document.querySelector('.topic-title, h1, #bloc-title-forum');
    if (topicTitleElement && !topicTitleElement.querySelector('.deboucled-decensured-topic-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'deboucled-decensured-topic-indicator';
        indicator.innerHTML = ' 🔒';
        indicator.title = 'Topic Décensured';
        topicTitleElement.appendChild(indicator);
    }
}

function highlightCurrentTopicAsDecensured() {
    const mainContent = document.querySelector('.main-content, .topic-content, body');
    if (mainContent) {
        mainContent.classList.add('deboucled-current-topic-decensured');

    }

    const topicTitleElement = document.querySelector('#bloc-title-forum');
    if (topicTitleElement && !topicTitleElement.querySelector('.deboucled-decensured-topic-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'deboucled-decensured-topic-indicator';
        indicator.textContent = 'DÉCENSURED';
        indicator.title = 'Ce topic contient des messages Décensured';
        topicTitleElement.appendChild(indicator);
    }
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
        if (topicData) {
            highlightCurrentTopicAsDecensured();
            await decryptMessages();
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification du topic:', error);
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// GESTION DE LA VÉRIFICATION BATCH DES TOPICS DÉCENSURED
///////////////////////////////////////////////////////////////////////////////////////

async function getDecensuredTopic(topicId) {
    try {
        if (!topicId) {
            return null;
        }

        const response = await fetchDecensuredApi(`${apiDecensuredTopicByIdUrl}/${topicId}`, {
            method: 'GET'
        });

        return response;
    } catch (error) {
        console.error('Erreur lors de la récupération du topic:', error);
        return null;
    }
}

async function getDecensuredTopicsBatch(topicIds) {
    try {
        if (!topicIds || topicIds.length === 0) {
            return [];
        }

        const response = await fetchDecensuredApi(apiDecensuredTopicsByIdsUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topicIds })
        });

        if (Array.isArray(response)) {

            return response;
        }

        return [];
    } catch (error) {
        console.error('Erreur lors de la récupération batch des topics:', error);
        return [];
    }
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

            if (link) {
                const topicListItem = link.closest('li');
                if (topicListItem) {
                    topicListItem.classList.add('deboucled-topic-decensured');

                    const folderIcon = topicListItem.querySelector('.icon-topic-folder, .topic-img');
                    if (folderIcon) {
                        folderIcon.classList.add('deboucled-decensured-topic-icon');
                        folderIcon.title = 'Topic Décensured';
                    }
                }
            }
        });
    });
}

function setupDynamicTopicHighlighting() {
    let highlightTimer = null;

    const observer = new MutationObserver((mutations) => {
        let hasNewTopics = false;

        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const topicLinks = node.querySelectorAll ?
                            node.querySelectorAll('a[href*="/topics/"]:not(.deboucled-decensured-checked)') : [];

                        if (topicLinks.length > 0 ||
                            (node.matches && node.matches('a[href*="/topics/"]:not(.deboucled-decensured-checked)'))) {
                            hasNewTopics = true;
                        }
                    }
                });
            }
        });

        if (hasNewTopics) {
            if (highlightTimer) {
                clearTimeout(highlightTimer);
            }

            highlightTimer = setTimeout(() => {
                highlightDecensuredTopics();
            }, 500);
        }
    });

    const targetNode = document.body || document.documentElement;
    if (targetNode) {
        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });
    }

    return observer;
}

function setupTopicRedirectionListener() {
    window.addEventListener('pageshow', () => {
        if (window.location.pathname.includes('/topics/') &&
            document.referrer.includes('/forums/topic/add')) {
            setTimeout(() => {
                buildDecensuredInputUI();
                buildDecensuredTopicInputUI();
            }, 1000);
        }
    });
}

///////////////////////////////////////////////////////////////////////////////////////
// Déchiffrement automatique des messages et topics
///////////////////////////////////////////////////////////////////////////////////////

function getMessageElements() {
    let messageElements = document.querySelectorAll('.conteneur-messages-pagi > div.bloc-message-forum');

    if (messageElements.length === 0) {

        for (const selector of DECENSURED_CONFIG.SELECTORS.MESSAGE_ELEMENTS) {
            messageElements = document.querySelectorAll(selector);

            if (messageElements.length > 0) {
                break;
            }
        }
    }

    return Array.from(messageElements);
}

function createMessageIndex(decensuredMessages) {
    const messageIndex = new Map();
    decensuredMessages.forEach(msg => {
        messageIndex.set(msg.message_id.toString(), msg);
    });
    return messageIndex;
}

function animateContentTransition(fromElement, toElement, onComplete) {
    if (!fromElement || !toElement) {
        if (onComplete) onComplete();
        return;
    }

    fromElement.classList.add('fade-out');

    setTimeout(() => {
        fromElement.style.display = 'none';
        fromElement.classList.remove('fade-out');

        toElement.style.display = '';
        toElement.classList.add('fade-in');
        setTimeout(() => toElement.classList.remove('fade-in'), 300);

        if (onComplete) onComplete();
    }, 300);
}

function createToggleButton(originalContent, realContentDiv) {
    const SWITCH_TO_ORIGINAL_TITLE = '🔓 Afficher le message original';
    const SWITCH_TO_DECENSURED_TITLE = '🔒 Afficher le message dissimulé';

    const decensuredIndicator = document.createElement('button');
    decensuredIndicator.className = 'deboucled-decensured-indicator showing-fake';
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

function handleDecensuredQuote(msgElement, decensuredMsg, selection = null) {
    const textArea = document.querySelector('#message_topic');
    if (!textArea) return;

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
    if (currentPage !== 'topicmessages') return;

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
        console.error('Erreur lors du déchiffrement des messages :', error);
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// Gestion du compteur d'utilisateurs dans le header
///////////////////////////////////////////////////////////////////////////////////////

function createDecensuredUsersHeader() {
    if (document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_HEADER_DECENSURED)) return;

    const headerNotif = document.querySelector('.headerAccount--notif');
    if (!headerNotif) return;

    const headerDecensured = document.createElement('div');
    headerDecensured.className = 'headerAccount headerAccount--decensured';
    headerDecensured.id = 'deboucled-header-decensured';

    headerNotif.insertAdjacentElement('afterend', headerDecensured);

    const decensuredButton = document.createElement('span');
    decensuredButton.className = 'headerAccount__notif js-header-decensured';
    decensuredButton.id = 'deboucled-users-counter';
    decensuredButton.setAttribute('data-val', '0');
    decensuredButton.title = 'Cliquer pour voir les utilisateurs Décensured connectés';
    decensuredButton.style.cursor = 'pointer';

    const icon = document.createElement('i');
    icon.className = 'icon-people';
    icon.id = 'deboucled-users-counter-icon';

    decensuredButton.appendChild(icon);
    headerDecensured.appendChild(decensuredButton);

    decensuredButton.addEventListener('click', showDecensuredUsersModal);

    return decensuredButton;
}

async function showDecensuredUsersModal() {
    try {
        const usersData = await fetchDecensuredApi(apiDecensuredUsersOnlineUrl, { method: 'GET' });

        if (usersData && usersData.users) {
            createAndShowUsersModal(usersData.users, usersData.count);
        } else {
            addAlertbox('warning', 'Aucun utilisateur Décensured trouvé');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        addAlertbox('error', 'Impossible de charger la liste des utilisateurs');
    }
}

function createAndShowUsersModal(users, totalCount) {
    const existingModal = document.querySelector('.deboucled-users-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'deboucled-users-modal';

    const sortedUsers = [...users].sort((a, b) => new Date(b.lastActiveDate) - new Date(a.lastActiveDate));

    const USERS_PER_PAGE = 15;
    let currentPage = 0;
    let isLoading = false;

    function loadMoreUsers() {
        const startIndex = currentPage * USERS_PER_PAGE;
        const endIndex = Math.min(startIndex + USERS_PER_PAGE, sortedUsers.length);
        const usersToShow = sortedUsers.slice(startIndex, endIndex);

        if (usersToShow.length === 0) return;

        const modalBody = modal.querySelector('.deboucled-users-modal-body');
        const userContainer = modalBody.querySelector('.deboucled-users-container');

        if (!userContainer) return;

        usersToShow.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'deboucled-user-item';
            userItem.innerHTML = `
                <a href="https://www.jeuxvideo.com/profil/${encodeURIComponent(user.username)}?mode=infos" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="deboucled-user-pseudo">${escapeHtml(user.username)}</a>
                <span class="deboucled-user-status">Actif ${formatTimeAgo(user.lastActiveDate)}</span>
            `;
            userContainer.appendChild(userItem);
        });

        currentPage++;

        if (endIndex >= sortedUsers.length) {
            const loader = modalBody.querySelector('.deboucled-users-loader');
            if (loader) loader.style.display = 'none';
        }
    }

    modal.innerHTML = `
        <div class="deboucled-users-modal-content">
            <div class="deboucled-users-modal-header">
                <h3>🔒 Utilisateurs Décensured en ligne (${totalCount})</h3>
                <button class="deboucled-users-modal-close">×</button>
            </div>
            <div class="deboucled-users-modal-body">
                ${sortedUsers.length === 0 ?
            '<div class="deboucled-no-users">Aucun utilisateur connecté</div>' :
            `<div class="deboucled-users-container"></div>
                     <div class="deboucled-users-loader">
                         <div class="deboucled-loading-text">Chargement...</div>
                     </div>`
        }
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const modalBody = modal.querySelector('.deboucled-users-modal-body');
    const loader = modal.querySelector('.deboucled-users-loader');

    if (loader) {
        loader.style.display = sortedUsers.length > USERS_PER_PAGE ? 'block' : 'none';
    }

    if (sortedUsers.length > 0) {
        loadMoreUsers();
    }

    if (modalBody && sortedUsers.length > USERS_PER_PAGE) {
        modalBody.addEventListener('scroll', () => {
            if (isLoading) return;

            const { scrollTop, scrollHeight, clientHeight } = modalBody;
            const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
            const isNearBottom = scrollPercentage >= 0.8;

            if (isNearBottom && currentPage * USERS_PER_PAGE < sortedUsers.length) {
                isLoading = true;

                if (loader) loader.style.display = 'block';

                setTimeout(() => {
                    loadMoreUsers();
                    isLoading = false;
                }, 500);
            }
        });
    }

    const closeButton = modal.querySelector('.deboucled-users-modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => modal.remove());
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function toggleDecensuredUsersCountDisplay() {
    const headerElement = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_HEADER_DECENSURED);
    const isEnabled = store.get(storage_optionDisplayDecensuredUsersCount, storage_optionDisplayDecensuredUsersCount_default);

    if (headerElement) {
        headerElement.style.display = isEnabled ? '' : 'none';
    }
}

function toggleDecensuredBadgesDisplay() {
    const isEnabled = store.get(storage_optionEnableDecensuredBadges, storage_optionEnableDecensuredBadges_default);
    const badges = document.querySelectorAll(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_BADGE);

    badges.forEach(badge => {
        badge.style.display = isEnabled ? '' : 'none';
    });
}

function updateDecensuredUsersCount(count) {
    const button = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_USERS_COUNTER);
    if (!button) return;

    button.setAttribute('data-val', count);

    button.classList.toggle('headerAccount__notif--hasNotif', count > 0);
}

async function loadDecensuredUsersData() {
    try {
        const response = await fetchDecensuredApi(apiDecensuredStatsUrl);
        if (response && response.nb) {
            const onlineCount = parseInt(response.nb) || 0;
            updateDecensuredUsersCount(onlineCount);
        } else {
            updateDecensuredUsersCount(0);
        }
    } catch (error) {
        handleApiError(error, 'Chargement utilisateurs Décensured');
        updateDecensuredUsersCount(0);
    }
}

function startDecensuredUsersMonitoring() {
    if (!store.get(storage_optionDisplayDecensuredUsersCount, storage_optionDisplayDecensuredUsersCount_default)) {
        return;
    }

    loadDecensuredUsersData();

    setInterval(loadDecensuredUsersData, DECENSURED_CONFIG.USERS_REFRESH_INTERVAL);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadDecensuredUsersData();
        }
    });
}

///////////////////////////////////////////////////////////////////////////////////////
// Initialisation
///////////////////////////////////////////////////////////////////////////////////////

async function initDecensured() {
    if (decensuredInitialized) {
        return;
    }

    if (!await store.get(storage_optionEnableDecensured, storage_optionEnableDecensured_default)) {
        return;
    }

    decensuredInitialized = true;

    if (getUserPseudo()) {
        await pingDecensuredApi();

        if (decensuredPingTimer) {
            clearInterval(decensuredPingTimer);
            decensuredPingTimer = null;
        }

        decensuredPingTimer = setInterval(() => {
            pingDecensuredApi().catch(err => console.error('Erreur ping timer :', err));
        }, decensuredPingInterval);
    }

    buildDecensuredInputUI();
    buildDecensuredTopicInputUI();

    createDecensuredUsersHeader();
    toggleDecensuredUsersCountDisplay();
    startDecensuredUsersMonitoring();

    await decryptMessages();
    highlightDecensuredTopics();
    setupTopicRedirectionListener();
    setupDynamicTopicHighlighting();

    await checkAndProcessNewTopic();
}

///////////////////////////////////////////////////////////////////////////////////////
// Posting de messages Decensured
///////////////////////////////////////////////////////////////////////////////////////

async function handleDecensuredPost() {
    const textarea = getMessageTextarea();
    if (!textarea) return;

    const realMessage = textarea.value.trim();
    if (!realMessage) return;

    const fakeMessageInput = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_MESSAGE_FAKE_TEXTAREA);
    let fakeMessage = fakeMessageInput ? fakeMessageInput.value.trim() : '';

    if (!fakeMessage) {
        fakeMessage = getRandomPlatitudeMessage();
        if (fakeMessageInput) {
            fakeMessageInput.value = fakeMessage;
            fakeMessageInput.classList.add('auto-generated');
        }
    }

    try {
        const processedContent = await processContent(realMessage, fakeMessage);
        if (!processedContent) {
            handleApiError(new Error('Échec du traitement du contenu'), 'handleDecensuredPost', true);
            return;
        }

        const jvcResponse = await postDecensuredMessageToJvc(processedContent.fake);
        const messageId = extractMessageId(jvcResponse);

        if (messageId && jvcResponse.redirectUrl) {
            const success = await saveToDecensuredApi(messageId, realMessage, processedContent.fake);

            const redirectUrl = jvcResponse.redirectUrl.startsWith('http')
                ? jvcResponse.redirectUrl
                : window.location.origin + jvcResponse.redirectUrl;

            if (success) {
                addAlertbox("success", "Message Décensured posté avec succès ! Redirection en cours...");
                setTimeout(() => performRedirection(redirectUrl), 1500);
            } else {
                addAlertbox("warning", "Message posté sur JVC mais pas sauvegardé avec Décensured. Redirection en cours...");
                setTimeout(() => performRedirection(redirectUrl), 2000);
            }
        } else {
            setTextAreaValue(textarea, realMessage);
            handleApiError(new Error('Échec du posting sur JVC'), 'handleDecensuredPost', true);
        }

    } catch (error) {
        setTextAreaValue(textarea, realMessage);
        handleApiError(error, 'handleDecensuredPost', true);
    }
}

function extractMessageId(jvcResponse) {
    if (!jvcResponse) return null;

    if (jvcResponse.messageId || jvcResponse.id) {
        return jvcResponse.messageId || jvcResponse.id;
    }

    if (jvcResponse.redirectUrl) {
        const match = jvcResponse.redirectUrl.match(/#post_(\d+)$/);
        if (match) return match[1];
    }

    return null;
}

function performRedirection(redirectUrl) {
    window.location.href = redirectUrl;
    window.location.reload();
}

async function saveToDecensuredApi(messageId, realMessage, fakeContent) {
    const topicId = getCurrentTopicId();
    const username = getUserPseudo();
    const messageUrl = `${window.location.origin}/forums/message/${messageId}`;
    const topicUrl = window.location.origin + window.location.pathname;
    const topicTitle = getTitleFromTopicPage();

    return await createDecensuredMessage(
        messageId,
        username,
        messageUrl,
        fakeContent,
        realMessage,
        topicId,
        topicUrl,
        topicTitle
    );
}

async function postDecensuredMessageToJvc(messageContent) {
    const textarea = getMessageTextarea();
    if (!textarea) return;

    const form = findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_FORM);
    if (!form) {
        throw new Error('Impossible de trouver le formulaire de post JVC');
    }

    const formulaire = document.getElementById("bloc-formulaire-forum");
    setFormDisabled(formulaire, textarea, true);

    try {
        const formData = buildFormData(form, messageContent);
        const body = buildMultipartBody(formData);

        return await submitForm(body, formulaire, textarea);

    } catch (error) {
        setFormDisabled(formulaire, textarea, false);
        logDecensuredError(error, 'postDecensuredMessageToJvc');
        throw error;
    }
}

function setFormDisabled(formulaire, textarea, disabled) {
    if (formulaire) {
        formulaire.classList.toggle("jvchat-disabled-form", disabled);
    }
    if (disabled) {
        textarea.setAttribute("disabled", "true");
    } else {
        textarea.removeAttribute("disabled");
    }
}

function buildFormData(form, messageContent) {
    let formData = new FormData(form);

    formData.set("message_topic", messageContent);
    formData.set("text", messageContent);

    const topicId = getCurrentTopicId();
    const forumId = getForumId ? getForumId() : window.location.pathname.match(/\/forums\/(\d+)-/)?.[1];

    if (topicId) formData.set("topicId", topicId);
    if (forumId) formData.set("forumId", forumId);
    formData.set("group", "1");
    formData.set("messageId", "undefined");

    const jvcPayload = getForumPayload();
    if (jvcPayload) {
        if (jvcPayload.formSession) {
            Object.entries(jvcPayload.formSession).forEach(([key, value]) => {
                formData.set(key, value);
            });
        }
        if (jvcPayload.ajaxToken) {
            formData.set("ajax_hash", jvcPayload.ajaxToken);
        }
    }

    document.querySelectorAll('input[type="hidden"]').forEach(input => {
        if (input.name && input.value) {
            formData.set(input.name, input.value);
        }
    });

    const fs_custom_input = Array.from(form.elements).find(e => /^fs_[a-f0-9]{40}$/i.test(e.name));
    if (fs_custom_input && !formData.has(fs_custom_input.name)) {
        formData.set(fs_custom_input.name, fs_custom_input.value);
    }

    if (!formData.has("ajax_hash")) {
        const ajaxHashInput = document.querySelector('input[name="ajax_hash"], #ajax_hash_liste_messages');
        if (ajaxHashInput) {
            formData.set("ajax_hash", ajaxHashInput.value);
        } else {
            console.error('Aucun ajax_hash trouvé !');
        }
    }

    return formData;
}

function buildMultipartBody(formData) {
    const boundary = "----deboucledformboundary" + Math.random().toString(16).slice(2);
    let body = "";
    for (let [key, value] of formData.entries()) {
        body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
    }
    body += `--${boundary}--\r\n`;
    return { body, boundary };
}

function submitForm(bodyData, formulaire, textarea) {
    return new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: 'POST',
            url: DECENSURED_CONFIG.URLS.POST_MESSAGE,
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'fr',
                'x-requested-with': 'XMLHttpRequest',
                'Content-Type': `multipart/form-data; boundary=${bodyData.boundary}`,
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            },
            data: bodyData.body,
            timeout: DECENSURED_CONFIG.POST_TIMEOUT,
            onload: (response) => handleFormResponse(response, formulaire, textarea, resolve, reject),
            onerror: () => {
                setFormDisabled(formulaire, textarea, false);
                reject(new Error('Erreur réseau'));
            },
            ontimeout: () => {
                setFormDisabled(formulaire, textarea, false);
                reject(new Error('Timeout'));
            }
        });
    });
}

function handleFormResponse(response, formulaire, textarea, resolve, reject) {
    setFormDisabled(formulaire, textarea, false);

    if (response.status < 200 || response.status >= 300) {
        reject(new Error(`Erreur HTTP ${response.status}: ${response.responseText}`));
        return;
    }

    try {
        const res = JSON.parse(response.responseText);

        if (res.errors) {
            const errorMsg = res.errors.session
                ? `Erreur de session JVC: ${res.errors.session}`
                : 'Erreurs JVC: ' + JSON.stringify(res.errors);
            reject(new Error(errorMsg));
            return;
        }

        const messageId = extractMessageId(res);
        if (!messageId) {
            reject(new Error('Réponse JVC sans messageId'));
            return;
        }

        setTextAreaValue(textarea, '');

        const event = new CustomEvent('jvchat:postmessage', {
            detail: {
                id: messageId,
                content: textarea.value,
                username: getUserPseudo()
            }
        });
        dispatchEvent(event);

        resolve(res);

    } catch {
        reject(new Error('Erreur parsing réponse: ' + response.responseText));
    }
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

function getPayloadFromScripts(doc) {
    const scripts = doc.getElementsByTagName('script');
    let rawPayloadString = null;

    for (let i = 0; i < scripts.length; i++) {
        const scriptContent = scripts[i].textContent || scripts[i].innerText;

        if (scriptContent) {
            const match = scriptContent.match(/window\.jvc\.forumsAppPayload\s*=\s*['"]([^'"]+)['"]/);
            if (match && match[1]) {
                rawPayloadString = match[1];
                break;
            }

            const jvcVarMatch = scriptContent.match(/jvc\.forumsAppPayload\s*=\s*['"]([^'"]+)['"]/);
            if (!rawPayloadString && jvcVarMatch && jvcVarMatch[1]) {
                rawPayloadString = jvcVarMatch[1];
                break;
            }
        }
    }

    if (rawPayloadString) {
        try {
            const decodedPayload = JSON.parse(atob(rawPayloadString));
            return decodedPayload;
        } catch (e) {
            console.error('Erreur parsing payload JVC :', e);
            return null;
        }
    }
    return null;
}

function getForumPayload() {
    if (window.jvc && window.jvc.forumsAppPayload) {
        try {
            return JSON.parse(atob(window.jvc.forumsAppPayload));
        } catch (e) {
            console.error('Erreur parsing window.jvc.forumsAppPayload :', e);
        }
    }

    return getPayloadFromScripts(document);
}
