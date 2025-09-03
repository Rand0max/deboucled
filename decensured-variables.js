///////////////////////////////////////////////////////////////////////////////////////
// DÉCENSURED VARIABLES
///////////////////////////////////////////////////////////////////////////////////////

let decensuredInitialized = false;
let decensuredPingTimer = null;
let decensuredUsersTimer = null;
let decensuredUsersLoading = false;
let tabOrderSetupInProgress = false;
let isProcessingTopicCreation = false;
let messageElementsCache = null;
let messageElementsCacheTime = 0;
let decensuredFormObserver = null;

let platitudeTopicSequenceData = { sequence: [], currentIndex: 0 };
let platitudeMessageSequenceData = { sequence: [], currentIndex: 0 };
let topicWithMessagesIndexSequences = new Map();
let sequencesInitialized = false;

const domCache = new Map();

// Versions debounced et throttled des fonctions critiques
const debouncedHighlightDecensuredTopics = debounce(highlightDecensuredTopics, 500);
const debouncedDecryptMessages = debounce(decryptMessages, 300);
const debouncedLoadFloatingWidgetTopics = debounce(loadFloatingWidgetTopics, 1000);

// Versions throttled pour les events frequents
const throttledSetupTabOrder = throttle(setupTabOrder, 250);
const throttledClearDomCache = throttle(clearDomCache, 2000);
const throttledHighlightDecensuredTopics = throttle(highlightDecensuredTopics, 1000);

const topicDecensuredState = {
    isObservingForm: false,
    currentObserver: null,
    formElements: null,
    toggleHandlers: null
};

const DECENSURED_CONFIG = {
    // === TIMING CONFIGURATION ===
    INIT_DELAY: 1000,
    RETRY_TIMEOUT: 10 * 60 * 1000, // 10 minutes
    POST_TIMEOUT: 40000,
    USERS_REFRESH_INTERVAL: 4 * 60 * 1000, // 4 minutes

    // === ANIMATION DELAYS ===
    ANIMATION_DELAY: 300,
    ANIMATION_FADE_DELAY: 300,
    CONTAINER_HIDE_DELAY: 200,
    DICE_ROTATION_DELAY: 500,
    TAB_ORDER_DELAY: 50,
    TAB_ORDER_DELAY_LONG: 100,
    DOM_STABILIZATION_DELAY: 100,
    OBSERVER_CLEANUP_TIMEOUT: 15000, // 15 seconds
    PENDING_TOPIC_TIMEOUT: 30000, // 30 seconds
    TRIGGER_NATIVE_CREATION_DELAY: 50,

    // === PERFORMANCE CONFIGURATION ===
    CACHE_TTL: 5000, // 5 secondes
    MESSAGE_CACHE_TTL: 3000, // 3 secondes

    // === API CONFIGURATION ===
    API_TIMEOUT: 2000, // 2 seconds
    API_MAX_RETRIES: 10,
    API_MAX_MESSAGES: 999999,

    // === UI SPACING AND LAYOUT ===
    NOTIFICATION_TOP_OFFSET: 20,
    NOTIFICATION_SPACING: 80,
    IMAGE_THUMBNAIL_WIDTH: 68,
    IMAGE_THUMBNAIL_HEIGHT: 51,
    URL_CONTEXT_LENGTH: 50,
    SPOILER_ID_LENGTH: 32,

    // === TAB INDEX CONFIGURATION ===
    TAB_INDEX_MESSAGE_START: 100,
    TAB_INDEX_TOPIC_START: 200,

    // === HTTP STATUS CODES ===
    HTTP_OK_MIN: 200,
    HTTP_OK_MAX: 300,

    // === FORMATTING REGEX ===
    FORMATTING_REGEX: {
        // JVC native formats
        jvcBold: /'''([^'\n]+)'''/g,
        jvcItalic: /''([^'\n]+)''/g,
        jvcUnderline: /<u>([^<\n]+)<\/u>/g,
        jvcStrikethrough: /<s>([^<\n]+)<\/s>/g,
        jvcCode: /<code>([\s\S]*?)<\/code>/g,
        jvcSpoiler: /<spoil>([\s\S]*?)<\/spoil>/g,

        // Listes JVC
        bulletList: /^(\*\s+.+(?:\n\*\s+.*)*)/gm,
        numberedList: /^(#\s+.+(?:\n#\s+.*)*)/gm,

        // Citations JVC
        blockquote: /^(>\s*.+(?:\n>\s*.*)*)/gm,

        // Markdown compatibility (existing)
        spoilers: /\[spoil\](.*?)\[\/spoil\]/gs,
        codeBlocks: /```([\s\S]*?)```/g,
        inlineCode: /`([^`\n]+)`/g,
        images: /https:\/\/(?:www\.|image\.)?noelshack\.com\/[^\s<>"']+\.(png|jpg|jpeg|gif|webp)/gi,
        links: /(https?:\/\/[^\s<>"']+)/g,
        strikethrough: /~~([^~\n]+)~~/g,
        // Regex combinee pour formatage gras et italique (markdown)
        combined: /(\*\*([^*\n]+)\*\*)|(__([^_\n]+)__)|(\B\*([^*\n]+)\*\B)|(\b_([^_\n]+)_\b)/g
    },

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

    // === FLOATING WIDGET CONFIGURATION ===
    FLOATING_WIDGET: {
        MAX_TOPICS: 15,
        REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
        ANIMATION_DURATION: 300
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
            '.messageEditor__edit',
            'textarea[name="message_topic"]',
            '#forums-post-message-editor textarea',
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
            '.bloc-message-forum',
            '.conteneur-message .txt-msg',
            '.bloc-message-forum .txt-msg',
            '.txt-msg'
        ],
        REPORT_BUTTON: [
            '.picto-msg-exclam',
            '[class*="picto-msg-exclam"]'
        ],
        TOPIC_TITLE_INPUT: [
            '#input-topic-title',
            '.topicTitle__input',
            'input[name="input-topic-title"]',
            'input[name="topic_title"]',
            'input[placeholder*="titre"]',
            'input[placeholder*="Titre"]',
            '#forums-post-topic-editor input[type="text"]'
        ],
        TOPIC_REAL_TITLE_INPUT: [
            '#deboucled-decensured-topic-real-title',
            'input[name="deboucled-topic-real-title"]'
        ],
        TOPIC_FORM: [
            '#forums-post-topic-editor form',
            '#forums-post-topic-editor',
            '#bloc-formulaire-forum form',
            '#bloc-formulaire-forum'
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
        DEBOUCLED_USERS_COUNTER: '#deboucled-users-counter',
        // === HEADER ELEMENTS ===
        HEADER_ACCOUNT_CONNECTED: [
            '.headerAccount--pm',
            '.headerAccount--connect'
        ],
        // === FLOATING WIDGET ===
        DEBOUCLED_FLOATING_WIDGET: '#deboucled-floating-widget',
        MESSAGE_EDITOR_CONTAINER: '.messageEditor__containerEdit',
        TOPIC_TITLE_CONTAINER: '.topicTitle'
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

const platitudeTopics = [
    // Gaming
    {
        title: "ZELDA écrase MARIO dans tous les domaines",
        messages: [
            "Objectivement Nintendo favorise trop Zelda maintenant",
            "Mario Galaxy était le pic, depuis c'est de la daube",
            "Breath of the Wild a révolutionné le gaming, Mario stagne",
            "Les mécaniques de Zelda sont plus innovantes, faut l'admettre",
            "Nintendo mise tout sur Zelda car ça rapporte plus"
        ]
    },
    {
        title: "FORTNITE c'est de la BOUSE maintenant",
        messages: [
            "Depuis la saison 4 c'est devenu n'importe quoi",
            "Trop de collabs, plus d'âme ce jeu",
            "Les petits de 12 ans ont tué l'ambiance",
            "Epic Games fait que du fric, plus de passion",
            "Apex Legends 1000 fois mieux niveau gameplay"
        ]
    },
    {
        title: "GTA 6 CONFIRMÉ pour 2026",
        messages: [
            "Rockstar prend son temps mais ça va être DINGUE",
            "Vice City 2.0 avec la tech actuelle ça va défoncer",
            "J'espère qu'ils gardent l'esprit décalé des anciens",
            "16 ans d'attente, ça a intérêt à être parfait",
            "Les leaks donnent envie, graphismes de OUF"
        ]
    },
    {
        title: "ELDEN RING trop DIFFICILE pour les CASUALS",
        messages: [
            "FromSoftware assume sa ligne, tant mieux",
            "Un mode facile gâcherait l'expérience unique",
            "Faut mériter sa victoire dans ce jeu",
            "Les casuals ont 90% des autres jeux, laissez-nous ça",
            "La difficulté fait partie de l'identité du studio",
            "Git gud or go home, règle éternelle",
            "Dark Souls a créé une école, Elden Ring la perfectionne",
            "Miyazaki génie du level design punitif",
            "Malenia reste le boss le plus hardcore ever",
            "Open world + difficulté souls = combo parfait",
            "Chaque mort enseigne quelque chose de nouveau",
            "Coopération existe pour ceux qui galèrent",
            "Summons = mode facile déguisé pour les faibles",
            "Boss patterns à apprendre, pas de hasard",
            "Satisfaction victoire > instant gratification",
            "Gaming moderne trop assisté, Elden Ring résiste",
            "FromSoft ne cédera jamais aux pleurnichards",
            "Accessibilité != facilité artificielle",
            "Challenge réel manque cruellement au gaming actuel",
            "Elden Ring sépare vrais gamers des touristes"
        ]
    },
    {
        title: "LEAGUE OF LEGENDS toujours au TOP",
        messages: [
            "Meta équilibrée, Riot gère bien cette saison",
            "Valorant est bon mais LoL reste le KING",
            "15 ans après et toujours 100M de joueurs, respect",
            "L'e-sport LoL écrase tous les autres jeux",
            "Chaque patch apporte du fresh, bravo Riot"
        ]
    },

    // Tech
    {
        title: "IPHONE 15 DÉTRUIT SAMSUNG S24",
        messages: [
            "L'optimisation iOS écrase Android sur tout",
            "Samsung copie Apple depuis 10 ans, pathétique",
            "Qualité photo iPhone inégalée, point final",
            "Interface Samsung surchargée VS épuré iOS",
            "Prix élevé mais au moins ça dure 5 ans minimum"
        ]
    },
    {
        title: "WINDOWS 11 c'est de la DAUBE",
        messages: [
            "Windows 10 était parfait, pourquoi changer ?",
            "Interface changée pour rien, pure perte de temps",
            "Consommation RAM délirante sur W11",
            "Microsoft force la migration, technique de voyou",
            "Linux gagne des parts de marché grâce à ça"
        ]
    },
    {
        title: "L'IA va REMPLACER les devs bientôt",
        messages: [
            "GitHub Copilot code mieux que moi parfois",
            "Les juniors vont morfler en premier",
            "Faut s'adapter ou crever, règle éternelle",
            "L'IA écrit le code, nous on réfléchit l'archi",
            "Dans 10 ans on sera des chefs d'orchestre IA"
        ]
    },
    {
        title: "CRYPTO en 2025 : JACKPOT pour certains",
        messages: [
            "Bitcoin repart à la hausse, comme prévu",
            "Les sceptiques vont encore regretter leur avis",
            "DeFi révolutionne la finance traditionnelle",
            "Ethereum 2.0 change la donne énergétique",
            "Qui ne risque rien n'a rien, surtout en crypto"
        ]
    },
    {
        title: "5G = FAKE NEWS complotiste",
        messages: [
            "Débit de dingue comparé à la 4G",
            "Les antennes 5G sont moins puissantes que WiFi",
            "Complotistes confondent corrélation et causalité",
            "Corée du Sud en 5G depuis 3 ans, zéro problème",
            "Sciences VS peur irrationnelle, combat éternel"
        ]
    },

    // Société
    {
        title: "GÉNÉRATION Z plus MALIGNE que nous",
        messages: [
            "Ils maîtrisent la tech depuis la naissance",
            "Conscience écologique développée très tôt",
            "Moins naïfs face aux manipulations médias",
            "Multitâches naturels, nous on galère",
            "L'avenir leur appartient, on doit accepter"
        ]
    },
    {
        title: "TIKTOK a DÉTRUIT les cerveaux",
        messages: [
            "Durée d'attention réduite à 15 secondes",
            "Algorithme manipule les masses, c'est grave",
            "Contenu créatif VS cerveau disponible",
            "Instagram Reels copie TikTok, double peine",
            "Génération entière conditionnée par l'algo chinois"
        ]
    },
    {
        title: "TÉLÉTRAVAIL = FLEMME généralisée",
        messages: [
            "Productivité en chute libre depuis 2020",
            "Faux prétexte pour glander à la maison",
            "Collaboration équipe inexistante en remote",
            "Pause déjeuner de 2h, qui contrôle ?",
            "Retour au bureau obligatoire pour sauver l'économie"
        ]
    },
    {
        title: "NETFLIX TROP CHER mais on reste ABONNÉS",
        messages: [
            "15€/mois pour du contenu de plus en plus nul",
            "On partage les comptes, seule solution viable",
            "Disney+ et Prime Video fragmentent le marché",
            "Nostalgie des DVD, au moins on possédait",
            "Addiction moderne, difficile de décrocher"
        ]
    },
    {
        title: "IMPÔTS français RECORD MONDIAL",
        messages: [
            "45% de prélèvements, on marche sur la tête",
            "Services publics dégradés malgré la pression fiscale",
            "Irlande ou Portugal tentent de plus en plus",
            "Classe moyenne pressurée comme un citron",
            "Expatriation fiscale devient logique économique"
        ]
    },

    // Style JVC pur
    {
        title: "[HELP] C'est normal ça",
        messages: [
            "Jamais vu ça auparavant les kheys",
            "Quelqu'un a déjà eu ce problème ?",
            "Internet ne donne aucune solution viable",
            "Ça fait 3 jours que je cherche une explication",
            "Premier reflexe : demander sur le 18-25"
        ]
    },
    {
        title: "[URGENT] Quelqu'un confirme",
        messages: [
            "Info vue sur Twitter mais source douteuse",
            "Besoin de confirmation avant de partager",
            "Ça paraît gros mais on sait jamais",
            "Si c'est vrai ça va faire du bruit",
            "Debunk ou pas debunk ? That is the question"
        ]
    },
    {
        title: "Les KHEYS valident cette histoire",
        messages: [
            "Expérience personnelle un peu wtf",
            "J'ai besoin de votre avis éclairé",
            "Ça vous paraît plausible cette situation ?",
            "Forum le plus intelligent de France, à vous",
            "Intelligence collective du 18-25 activate"
        ]
    },
    {
        title: "PREMIÈRE fois ici soyez INDULGENTS",
        messages: [
            "Long time lurker, first time poster",
            "J'ai lu les règles mais je stress quand même",
            "Pas habitué aux codes du forum",
            "Soyez cool avec le petit nouveau",
            "J'apprends vite, promis les vétérans"
        ]
    },
    {
        title: "C'est CHAUD cette histoire",
        messages: [
            "Plot twist de dingue dans ma vie",
            "Réalité dépasse la fiction parfois",
            "Mes potes me croient pas, vous non plus ?",
            "Histoire vraie à 100%, main sur le cœur",
            "La vie réserve des surprises incroyables"
        ]
    },

    // Débats classiques
    {
        title: "PINEAPPLE sur pizza CRIME contre l'humanité",
        messages: [
            "Italie entière pleure à cause de cette hérésie",
            "Sucré-salé sur pizza = aberration gustative",
            "Hawaienne inventée au Canada, pas en Italie",
            "Tradition culinaire vs expérimentation douteuse",
            "Chacun ses goûts mais là c'est objectivement faux"
        ]
    },
    {
        title: "CHATS vs CHIENS : GUERRE éternelle du 18-25",
        messages: [
            "Team chat : indépendance et personnalité",
            "Team chien : fidélité et protection assurées",
            "Chat = colocataire, Chien = meilleur ami",
            "Allergies décident souvent à notre place",
            "Pourquoi choisir ? Les deux sont géniaux"
        ]
    },
    {
        title: "ANDROID users = PAUVRES assumés",
        messages: [
            "Flagship Android coûte autant qu'iPhone",
            "Liberté de customisation VS écosystème fermé",
            "Samsung Galaxy S24 concurrence iPhone 15",
            "Cliché de riche = avoir du goût pour l'overpriced",
            "Guerre de marques débile, les deux font le taf"
        ]
    },
    {
        title: "FAST FOOD écrase RESTAURANT traditionnel",
        messages: [
            "Rapidité et prix imbattables pour la génération",
            "McDo, KFC, Subway s'adaptent aux goûts actuels",
            "Restaurant tradi = 2h et 40€, pas réaliste",
            "Qualité fast-food s'améliore, l'écart se réduit",
            "Mode de vie moderne incompatible avec resto classique"
        ]
    },
    {
        title: "LIVRE papier résiste à KINDLE",
        messages: [
            "Sensation tactile irremplaçable du papier",
            "Bibliothèque physique = décoration et culture",
            "Fatigue oculaire moindre sur papier",
            "Kindle pratique en voyage mais c'est tout",
            "Librairies indépendantes méritent notre soutien"
        ]
    },

    // Expérience perso
    {
        title: "[VÉCU] Mon PATRON m'a dit un truc DINGUE",
        messages: [
            "Management toxique à son paroxysme",
            "J'ai cru halluciner en entendant ça",
            "Phrase qui résume l'entreprise française",
            "Pôle emploi, me revoilà bientôt",
            "Droit du travail inexistant dans cette boîte"
        ]
    },
    {
        title: "[CRINGE] SOIRÉE d'hier MALAISE total",
        messages: [
            "Niveau embarras : maximum critique atteint",
            "J'ai envie de déménager dans un autre pays",
            "Mes amis vont me charrier pendant 6 mois",
            "Alcool + stress social = combo destructeur",
            "Parfois le mieux c'est de rester chez soi"
        ]
    },
    {
        title: "[HELP] VOISIN chiants que faire",
        messages: [
            "Tapage nocturne quotidien depuis 3 mois",
            "Syndic incompétent, police s'en fout",
            "Déménager pour ça ? C'est eux les problèmes",
            "Guerre de voisinage, je deviens fou",
            "Solutions légales vs envie de violence"
        ]
    },
    {
        title: "[AWKWARD] RENCARD Tinder CATASTROPHIQUE",
        messages: [
            "Photos vs réalité : delta de 15 kg minimum",
            "Conversation niveau CP, j'ai souffert",
            "1h30 les plus longues de ma vie",
            "Tinder = loterie, parfois on perd gros",
            "Retour aux rencontres IRL obligatoire"
        ]
    },
    {
        title: "[LOVE] Premier RENCARD réussi CONSEILS",
        messages: [
            "Enfin une personne normale sur cette app",
            "Connexion intellectuelle immédiate, rare",
            "Pas trop en faire, rester naturel",
            "Deuxième date prévue, je stresse déjà",
            "L'espoir renaît après des mois de galère"
        ]
    },

    // Tech avancé
    {
        title: "SETUP gaming 2025 mes RECOMMENDATIONS",
        messages: [
            "RTX 4080 + Ryzen 7800X = combo parfait",
            "32 Go RAM pour être tranquille 5 ans",
            "SSD NVMe 2To, HDD c'est révolu",
            "Écran 1440p 144Hz sweet spot prix/perf",
            "Budget total 2500€ pour du high-end",
            "Refroidissement liquide obligatoire performance soutenue"
        ]
    },
    {
        title: "LINUX DOMINE WINDOWS pour DEV",
        messages: [
            "Terminal natif écrase PowerShell minable",
            "Package managers efficaces vs Windows Store",
            "Ubuntu 22.04 LTS stable et performant",
            "Docker natif, pas de VM parasites",
            "Microsoft pousse vers Linux avec WSL, aveu d'échec"
        ]
    },
    {
        title: "SSD 2TO ÉCRASE HDD 4TO pour GAMING",
        messages: [
            "Temps de chargement divisés par 10",
            "Prix SSD baissent, HDD deviennent obsolètes",
            "Jeux modernes optimisés pour SSD",
            "Silence total vs bruit mécanique HDD",
            "2 To suffisent si on gère sa ludothèque"
        ]
    },
    {
        title: "CLAVIER mécanique HYPE justifiée",
        messages: [
            "Frappe tactile incomparable au membrane",
            "Durabilité 50M de frappes vs 5M",
            "Cherry MX Brown équilibre parfait",
            "Productivité et plaisir de frappe++",
            "Investissement rentabilisé sur 10 ans"
        ]
    },
    {
        title: "ÉCRAN 4K 144Hz VAUT son PRIX",
        messages: [
            "Netteté 4K + fluidité 144Hz = perfection",
            "Gaming ET productivité sur même écran",
            "HDR correct change l'expérience visuelle",
            "RTX 4080 minimum pour exploiter",
            "1500€ mais ça dure 7-8 ans minimum"
        ]
    }
];

