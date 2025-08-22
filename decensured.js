///////////////////////////////////////////////////////////////////////////////////////
// DÉCENSURED
///////////////////////////////////////////////////////////////////////////////////////

let decensuredInitialized = false;
let decensuredPingTimer = null;

const DECENSURED_CONFIG = {
    RETRY_TIMEOUT: 10 * 60 * 1000,
    NOTIFICATION_DURATION: 5000,
    POST_TIMEOUT: 20000,

    URLS: {
        POST_MESSAGE: '/forums/message/add'
    },

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
            '.btn-poster-msg',
            '.postMessage',
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
        ]
    },

    NOTIFICATION_ICONS: {
        'success': '✅',
        'warning': '⚠️',
        'danger': '❌',
        'error': '❌',
        'info': 'ℹ️',
        'primary': 'ℹ️'
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
}

function handleApiError(error, context, showNotification = false) {
    console.error(`[Déboucled Décensuré] ${context}:`, error);

    if (typeof sendDiagnostic === 'function') {
        sendDiagnostic(0, `Décensuré: ${context} - ${error.message}`);
    }

    if (showNotification) {
        addAlertbox('error', `Erreur ${context}: ${error.message}`);
    }
}

///////////////////////////////////////////////////////////////////////////////////////
// Helpers intégrés
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

    const icon = DECENSURED_CONFIG.NOTIFICATION_ICONS[type] || DECENSURED_CONFIG.NOTIFICATION_ICONS['info'];

    notification.innerHTML = `
        <span class="deboucled-notification-icon">${icon}</span>
        <span class="deboucled-notification-message">${message}</span>
        <button class="deboucled-decensured-notification-close" onclick="this.parentNode.remove()">×</button>
    `;

    const existingNotifications = document.querySelectorAll('.deboucled-decensured-notification');
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
            return new Promise((resolve, reject) => {
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
                            } catch (e) {
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
                    ontimeout: (response) => {
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
// Chiffrement/Déchiffrement moderne (utilise l'API au lieu de l'ancien btoa/atob)
///////////////////////////////////////////////////////////////////////////////////////

async function encryptContent(message, fakeMessage = '') {
    try {
        const encrypted = btoa(unescape(encodeURIComponent(message)));
        return {
            encrypted: encrypted,
            fake: fakeMessage || getRandomPlatitudeMessage()
        };
    } catch (error) {
        logDecensuredError(error, 'encryptMessage');
        return null;
    }
}

function decryptContent(encryptedContent) {
    try {
        return decodeURIComponent(escape(atob(encryptedContent)));
    } catch (error) {
        logDecensuredError(error, 'decryptContent');
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
    text = text.replace(/\*\*([^\*\n]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
    return text;
}

function formatItalicText(text) {
    text = text.replace(/\B\*([^\*\n]+)\*\B/g, '<em>$1</em>');
    text = text.replace(/\b_([^_\n]+)_\b/g, '<em>$1</em>');
    return text;
}

function formatStrikethrough(text) {
    return text.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
}

function formatImages(text) {
    return text.replace(/https:\/\/(?:www\.noelshack\.com\/(\d+)-(\d+)-(\d+)-(.+)|image\.noelshack\.com\/fichiers\/(\d+)\/(\d+)\/(\d+)\/(.+))\.(png|jpg|jpeg|gif|webp)/gi, (match, y1, w1, d1, name1, y2, w2, d2, name2, ext) => {
        let imageUrl, miniUrl;
        if (y1) {
            // Format www.noelshack.com
            imageUrl = `https://image.noelshack.com/fichiers/${y1}/${w1}/${d1}/${name1}.${ext}`;
            miniUrl = `https://image.noelshack.com/minis/${y1}/${w1}/${d1}/${name1}.${ext}`;
        } else {
            // Format image.noelshack.com
            imageUrl = match;
            miniUrl = match.replace('/fichiers/', '/minis/');
        }

        return `<a href="${imageUrl}" target="_blank" rel="noreferrer"><img class="img-shack" src="${miniUrl}" width="68" height="51" alt="${imageUrl}"></a>`;
    });
}

function formatLinks(text) {
    return text.replace(/(https?:\/\/[^\s<>"']+)/g, (url, match, offset) => {
        // Vérifier si cette URL est déjà dans une balise HTML
        const beforeUrl = text.substring(Math.max(0, offset - 50), offset);
        const afterUrl = text.substring(offset + url.length, Math.min(text.length, offset + url.length + 50));

        // Si l'URL est déjà dans href="" ou src="", on ne la modifie pas
        if (beforeUrl.includes('href="') || beforeUrl.includes('src="') ||
            afterUrl.startsWith('"') || beforeUrl.endsWith('="')) {
            return url;
        }

        // Ne pas traiter les URLs NoelShack qui sont déjà converties en images
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

async function createDecensuredMessage(messageId, username, messageUrl, encryptedContent, realContent, topicId, topicUrl, topicTitle) {
    try {
        const currentUserId = userId || '0';

        const cleanedTopicUrl = cleanTopicUrl(topicUrl);

        const data = {
            userid: currentUserId,
            messageid: messageId,
            username: username,
            messageurl: messageUrl,
            encryptedcontent: encryptedContent,
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

        if (parseInt(topicId) < 70000000) {
            console.error(`TopicId trop petit: ${topicId} < 70000000`);
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
// Interface utilisateur
///////////////////////////////////////////////////////////////////////////////////////

function buildDecensuredBadge(username) {
    const badge = document.createElement('span');
    badge.className = 'deboucled-decensured-badge';
    badge.innerHTML = '🔒';

    const displayUsername = username || 'Utilisateur';
    badge.title = `${displayUsername} utilise Déboucled (messages chiffrés)`;
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
        setTimeout(buildDecensuredInputUI, 1000);
        return;
    }

    if (!container || container.querySelector('.deboucled-decensured-input')) return;

    const decensuredContainer = document.createElement('div');
    decensuredContainer.className = 'deboucled-decensured-input';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.id = 'decensured-toggle';
    toggleButton.className = 'deboucled-decensured-toggle btn btn-primary';
    toggleButton.innerHTML = '🔒 Message masqué';
    toggleButton.title = 'Activer le mode message masqué';

    const fakeMessageContainer = document.createElement('div');
    fakeMessageContainer.className = 'deboucled-decensured-fake-message-container';

    const fakeMessageLabel = document.createElement('label');
    fakeMessageLabel.textContent = 'Message visible par tous (optionnel) :';
    fakeMessageLabel.className = 'form-label deboucled-decensured-fake-message-label';

    const fakeMessageInput = document.createElement('textarea');
    fakeMessageInput.id = 'decensured-fake-message';
    fakeMessageInput.className = 'form-control deboucled-decensured-fake-message-input';
    fakeMessageInput.placeholder = 'Ce message sera affiché pour ceux qui n\'ont pas Déboucled. Si aucun message n\'est fourni, un message aléatoire sera généré.';
    fakeMessageInput.rows = 3;

    fakeMessageInput.addEventListener('input', () => {
        if (fakeMessageInput.classList.contains('auto-generated')) {
            fakeMessageInput.classList.remove('auto-generated');
        }
    });

    fakeMessageContainer.appendChild(fakeMessageLabel);
    fakeMessageContainer.appendChild(fakeMessageInput);

    decensuredContainer.appendChild(toggleButton);
    decensuredContainer.appendChild(fakeMessageContainer);

    if (modernEditor) {
        modernEditor.parentElement.insertBefore(decensuredContainer, modernEditor);
    } else if (traditionalTextarea) {
        traditionalTextarea.parentElement.insertBefore(decensuredContainer, traditionalTextarea);
    }

    let decensuredMode = false;

    toggleButton.addEventListener('click', () => {
        decensuredMode = !decensuredMode;
        toggleButton.checked = decensuredMode;

        if (decensuredMode) {
            toggleButton.innerHTML = '🔓 Message normal';
            toggleButton.className = 'deboucled-decensured-toggle btn btn-secondary';
            toggleButton.title = 'Désactiver le mode message masqué';
            fakeMessageContainer.classList.add('deboucled-decensured-visible');

            replacePostButtonWithDecensured();

            const textarea = getMessageTextarea();
            if (textarea) {
                textarea.classList.add('deboucled-decensured-textarea-active');
                if (textarea.placeholder !== undefined) {
                    textarea.placeholder = 'Votre véritable message, chiffré et visible uniquement par les utilisateurs Déboucled.';
                }
            }
        } else {
            toggleButton.innerHTML = '🔒 Message masqué';
            toggleButton.className = 'deboucled-decensured-toggle btn btn-primary';
            toggleButton.title = 'Activer le mode message masqué';
            fakeMessageContainer.classList.remove('deboucled-decensured-visible');

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
}

///////////////////////////////////////////////////////////////////////////////////////
// Déchiffrement automatique des messages et topics
///////////////////////////////////////////////////////////////////////////////////////

function getMessageElements() {
    let messageElements = document.querySelectorAll(DECENSURED_CONFIG.SELECTORS.MESSAGE_ELEMENTS.slice(0, 2).join(', '));

    if (messageElements.length === 0) {
        messageElements = document.querySelectorAll(DECENSURED_CONFIG.SELECTORS.MESSAGE_ELEMENTS.slice(2).join(', '));
    }

    if (messageElements.length === 0) {
        const allMsgs = document.querySelectorAll('.msg');
        messageElements = Array.from(allMsgs).filter(el =>
            !el.classList.contains('deboucled-quote-notif') &&
            !el.closest('.headerAccount__dropdown')
        );
    }

    return messageElements;
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

function addDecensuredBadge(msgElement, decensuredMsg) {
    if (msgElement.querySelector('.deboucled-decensured-badge')) {
        return;
    }

    const pseudoLink = msgElement.querySelector('.bloc-pseudo-msg');
    if (!pseudoLink) return;

    const username = decensuredMsg.message_username || decensuredMsg.username || 'Utilisateur';
    const badge = buildDecensuredBadge(username);

    pseudoLink.insertAdjacentElement('afterend', badge);
}

function processDecensuredMessage(msgElement, decensuredMsg) {
    const realContent = decensuredMsg.message_real_content;
    if (!realContent) return;

    const contentElement = msgElement.querySelector('.message-content, .text-enrichi-forum');
    if (!contentElement) return;

    const originalContent = contentElement.querySelector('p, div');

    const realContentDiv = document.createElement('div');
    realContentDiv.className = 'deboucled-decensured-content';
    realContentDiv.innerHTML = formatMessageContent(realContent);

    const decensuredIndicator = createToggleButton(originalContent, realContentDiv);

    if (originalContent) {
        originalContent.style.display = 'none';
    }

    contentElement.insertBefore(decensuredIndicator, contentElement.firstChild);
    contentElement.appendChild(realContentDiv);

    initializeSpoilerHandlers(realContentDiv);

    addDecensuredBadge(msgElement, decensuredMsg);

    removeReportButton(msgElement);

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

    await decryptMessages();
}

///////////////////////////////////////////////////////////////////////////////////////
// Posting de messages décensurés
///////////////////////////////////////////////////////////////////////////////////////

async function handleDecensuredPost() {
    const textarea = getMessageTextarea();
    if (!textarea) return;

    const decensuredToggle = document.querySelector('#decensured-toggle');
    if (!decensuredToggle || !decensuredToggle.checked) return;

    const realMessage = textarea.value.trim();
    if (!realMessage) return;

    const fakeMessageInput = document.querySelector('#decensured-fake-message');
    let fakeMessage = fakeMessageInput ? fakeMessageInput.value.trim() : '';

    if (!fakeMessage) {
        fakeMessage = getRandomPlatitudeMessage();
        if (fakeMessageInput) {
            fakeMessageInput.value = fakeMessage;
            fakeMessageInput.classList.add('auto-generated');
        }
    }

    try {
        const encrypted = await encryptContent(realMessage, fakeMessage);
        if (!encrypted) {
            handleApiError(new Error('Échec du chiffrement'), 'handleDecensuredPost', true);
            return;
        }

        const jvcResponse = await postDecensuredMessageToJvc(encrypted.fake);
        const messageId = extractMessageId(jvcResponse);

        if (messageId && jvcResponse.redirectUrl) {
            const success = await saveToDecensuredApi(messageId, realMessage, encrypted.fake);

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

async function saveToDecensuredApi(messageId, realMessage, encryptedContent) {
    const topicId = getCurrentTopicId();
    const username = getUserPseudo();
    const messageUrl = `${window.location.origin}/forums/message/${messageId}`;
    const topicUrl = window.location.origin + window.location.pathname;
    const topicTitle = getTitleFromTopicPage();

    return await createDecensuredMessage(
        messageId,
        username,
        messageUrl,
        encryptedContent,
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

    } catch (e) {
        reject(new Error('Erreur parsing réponse: ' + response.responseText));
    }
}

function replacePostButtonWithDecensured() {
    const postButton = findElement(DECENSURED_CONFIG.SELECTORS.POST_BUTTON);
    if (!postButton) return;

    const decensuredToggle = document.querySelector('#decensured-toggle');
    if (!decensuredToggle || !decensuredToggle.checked) return;

    if (!postButton.dataset.deboucledOriginal) {
        postButton.dataset.deboucledOriginal = 'true';
        postButton.dataset.deboucledOriginalOnclick = postButton.onclick ? postButton.onclick.toString() : '';
        postButton.dataset.deboucledOriginalType = postButton.type || 'button';
    }

    const newButton = postButton.cloneNode(true);
    postButton.parentNode.replaceChild(newButton, postButton);

    newButton.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleDecensuredPost();
    };

    newButton.type = "button";
    newButton.classList.add('deboucled-decensured-post-button-active');
    newButton.title = 'Poster le message masqué';
}

function restoreOriginalPostButton() {
    const postButton = findElement(DECENSURED_CONFIG.SELECTORS.POST_BUTTON);
    if (!postButton || !postButton.dataset.deboucledOriginal) return;

    const newButton = postButton.cloneNode(true);
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
}

function getMessageTextarea() {
    return findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_TEXTAREA);
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
