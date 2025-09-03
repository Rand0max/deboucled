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
        TOPIC_TITLE_DISPLAY: [
            '#bloc-title-forum',
            '.topic-title',
            'h1'
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
            "Nintendo mise tout sur Zelda car ça rapporte plus",
            "Mario c'est devenu pour les gamins de 8 ans, alors que Zelda ça demande réflexion et exploration. L'évolution naturelle quoi.",
            "Les puzzles des sanctuaires dans BOTW écrasent n'importe quel niveau de Mario moderne. Y'a pas photo sur la complexité du game design.",
            "Link sans voix a plus de charisme que Mario avec ses 'wahoo' de débile. Nintendo l'a compris et mise sur le bon cheval.",
            "Tears of the Kingdom prouve que la créativité peut aller loin. Mario reste dans ses couloirs préfabriqués depuis des années.",
            "Au final Mario Kart reste le seul truc potable de la franchise. Le reste c'est juste du fan service pour les nostalgiques."
        ]
    },
    {
        title: "FORTNITE c'est de la BOUSE maintenant",
        messages: [
            "Depuis la saison 4 c'est devenu n'importe quoi",
            "Trop de collabs, plus d'âme ce jeu",
            "Les petits de 12 ans ont tué l'ambiance",
            "Epic Games fait que du fric, plus de passion",
            "Apex Legends 1000 fois mieux niveau gameplay",
            "Le Chapter 1 c'était magique, maintenant c'est du Marvel Simulator avec des skins overpriced. L'authenticité est morte.",
            "La construction était l'âme du jeu, maintenant c'est juste du spray and pray comme les autres BR bas de gamme.",
            "PUBG a mieux vieilli alors qu'il était censé être 'dépassé'. Au moins lui reste cohérent dans son délire tactique.",
            "Epic se fout de la communauté historique, ils visent juste les gamins qui claquent l'argent de papa maman sans réfléchir.",
            "Fall Guys qui était censé être 'temporaire' a finalement une meilleure longévité que Fortnite. L'ironie du gaming moderne."
        ]
    },
    {
        title: "GTA 6 CONFIRMÉ pour 2026",
        messages: [
            "Rockstar prend son temps mais ça va être DINGUE",
            "Vice City 2.0 avec la tech actuelle ça va défoncer",
            "J'espère qu'ils gardent l'esprit décalé des anciens",
            "16 ans d'attente, ça a intérêt à être parfait",
            "Les leaks donnent envie, graphismes de OUF",
            "GTA Online a financé ce projet pharaonique pendant des années. Maintenant on va voir si ça valait le coup d'attendre.",
            "Le trailer a explosé tous les records YouTube en 24h. L'engouement est réel, pas juste du battage médiatique artificiel.",
            "Première protagoniste féminine de la série, pari risqué mais Rockstar sait ce qu'ils font niveau écriture de personnages.",
            "Next-gen seulement c'est logique, pas de compromis pour accommoder les vieilles consoles. Enfin de l'ambition technique pure.",
            "Le budget dépasse celui de la plupart des blockbusters Hollywood. Si c'est pas un chef-d'œuvre avec ces moyens, y'a plus d'excuse."
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
            "Chaque patch apporte du fresh, bravo Riot",
            "Arcane sur Netflix a ramené des millions de nouveaux joueurs. Le lore devient enfin accessible au grand public.",
            "Les Worlds 2024 ont battu tous les records d'audience. Même les non-gamers regardent maintenant, c'est devenu mainstream.",
            "Le modèle free-to-play parfait : compétitif accessible mais cosmétiques premium. Tous les autres jeux copient cette formule.",
            "Les nouveaux champions restent créatifs après 160+ persos. Le game design team de Riot est au sommet de leur art.",
            "Même avec TFT, Wild Rift et Legends of Runeterra, LoL classic reste le pilier. L'original indétrônable depuis une décennie."
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
            "Prix élevé mais au moins ça dure 5 ans minimum",
            "L'écosystème Apple c'est du verrouillage mais au moins tout fonctionne ensemble sans prise de tête. Android c'est l'anarchie totale.",
            "Les mises à jour iOS arrivent le jour J sur tous les modèles. Samsung tu attends 6 mois et encore, si ton modèle est pas oublié.",
            "Build quality Apple reste inégalée. Mon iPhone 12 de 2020 tourne encore comme neuf, mon ex S20 ramait déjà au bout d'un an.",
            "iMessage et FaceTime gardent les utilisateurs captifs mais c'est parce que ça marche mieux que les alternatives Android fragmentées.",
            "Samsung met 12 caméras sur leur flagship pour compenser leur algorithme photo inférieur. Apple fait mieux avec 3 capteurs optimisés."
        ]
    },
    {
        title: "WINDOWS 11 c'est de la DAUBE",
        messages: [
            "Windows 10 était parfait, pourquoi changer ?",
            "Interface changée pour rien, pure perte de temps",
            "Consommation RAM délirante sur W11",
            "Microsoft force la migration, technique de voyou",
            "Linux gagne des parts de marché grâce à ça",
            "Le menu démarrer centré c'est une abomination. Qui a demandé ça ? Personne ! Mais Microsoft s'en fout de l'avis des utilisateurs.",
            "TPM 2.0 obligatoire pour des machines de 2019 encore performantes. Obsolescence programmée déguisée en 'sécurité'.",
            "Windows 10 sera plus supporté en 2025, migration forcée vers cette daube de W11. Technique de mafia informatique pure.",
            "La consommation RAM sur tâche vide dépasse celle de certains jeux. Microsoft a perdu tout sens de l'optimisation depuis Ballmer.",
            "Steam Deck et Linux gaming progressent grâce à ces conneries Microsoft. Ils creusent leur propre tombe à force de mépriser les users."
        ]
    },
    {
        title: "L'IA va REMPLACER les devs bientôt",
        messages: [
            "GitHub Copilot code mieux que moi parfois",
            "Les juniors vont morfler en premier",
            "Faut s'adapter ou crever, règle éternelle",
            "L'IA écrit le code, nous on réfléchit l'archi",
            "Dans 10 ans on sera des chefs d'orchestre IA",
            "ChatGPT debug mes erreurs plus vite que Stack Overflow. L'époque du copier-coller de forums random est révolue.",
            "L'IA généraliste fait du code fonctionnel mais pas optimisé. Les seniors qui maîtrisent la perf et l'archi gardent leur valeur.",
            "Les bootcamps 3 mois vont souffrir grave. Pourquoi payer quelqu'un qui fait du CRUD basique quand l'IA le fait gratis ?",
            "Par contre niveau créativité et résolution de problèmes complexes, l'humain reste irremplaçable. L'IA suit des patterns, nous on innove.",
            "Le métier évolue vers plus de conception et moins de frappe de code. Comme l'architecte vs le maçon, hiérarchie naturelle."
        ]
    },
    {
        title: "CRYPTO en 2025 : JACKPOT pour certains",
        messages: [
            "Bitcoin repart à la hausse, comme prévu",
            "Les sceptiques vont encore regretter leur avis",
            "DeFi révolutionne la finance traditionnelle",
            "Ethereum 2.0 change la donne énergétique",
            "Qui ne risque rien n'a rien, surtout en crypto",
            "Les ETF Bitcoin approuvés par la SEC ont ouvert les vannes institutionnelles. Wall Street valide enfin officiellement.",
            "Le halving de 2024 fait son effet avec 6 mois de retard comme prévu. Les cycles sont prévisibles pour qui étudie l'historique.",
            "DeFi élimine les intermédiaires bancaires parasites. Prêter/emprunter en peer-to-peer avec des taux transparents, révolution pure.",
            "Ethereum post-merge consomme 99% moins d'énergie. L'argument écologique des détracteurs tombe à l'eau définitivement.",
            "Les banques centrales préparent leurs CBDC en panique. Elles ont compris que Bitcoin devient réserve de valeur incontournable."
        ]
    },
    {
        title: "5G = FAKE NEWS complotiste",
        messages: [
            "Débit de dingue comparé à la 4G",
            "Les antennes 5G sont moins puissantes que WiFi",
            "Complotistes confondent corrélation et causalité",
            "Corée du Sud en 5G depuis 3 ans, zéro problème",
            "Sciences VS peur irrationnelle, combat éternel",
            "La latence ultra-faible change la donne pour le gaming mobile et les applis temps réel. Même les pros l'adoptent maintenant.",
            "Les études sanitaires sur 5 ans en Corée du Sud montrent zéro impact négatif. Mais les complotistes préfèrent ignorer les faits.",
            "Ironiquement la 5G consomme moins d'énergie que la 4G à débit équivalent. Même l'argument écologique tombe à l'eau.",
            "Facebook et les forums pourris diffusent plus de radiations cérébrales que toutes les antennes 5G réunies. Priorité aux vrais dangers.",
            "Les voitures autonomes et la chirurgie à distance nécessitent cette latence. On peut pas rester à l'âge de pierre par peur irrationnelle."
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
            "L'avenir leur appartient, on doit accepter",
            "TikTok leur apprend plus sur le monde en 1h que nos profs en 1 semaine. L'info arrive directe, sans filtre institutionnel biaisé.",
            "Niveau diversité et inclusion, ils sont naturellement ouverts là où nous on a dû déconstruire nos préjugés avec effort.",
            "Ils monétisent leur passion via les réseaux dès 15 ans. Entrepreneuriat digital instinctif, nous on découvre à 30 balais.",
            "Mental health awareness impressionnante chez eux. Ils normalisent la thérapie et l'introspection, on était des guerriers silencieux nous.",
            "On critique mais on était pareils à leur âge. Nos parents disaient qu'on perdait notre temps sur Skyblog et les forums."
        ]
    },
    {
        title: "TIKTOK a DÉTRUIT les cerveaux",
        messages: [
            "Durée d'attention réduite à 15 secondes",
            "Algorithme manipule les masses, c'est grave",
            "Contenu créatif VS cerveau disponible",
            "Instagram Reels copie TikTok, double peine",
            "Génération entière conditionnée par l'algo chinois",
            "La dopamine addiction est programmée dans l'app. Scroll infini calibré pour maximiser le temps d'écran, manipulation pure.",
            "Les challenges débiles mettent des vies en danger. Darwin Awards en temps réel sponsorisés par ByteDance, c'est dramatique.",
            "L'influence sur mineurs est inquiétante et non régulée. Ces gosses deviennent addicts avant même de comprendre ce qui leur arrive.",
            "Paradoxalement ça crée aussi de nouveaux talents créatifs. Certains arrivent à faire du contenu intelligent dans le format court.",
            "L'Europe doit créer une alternative crédible rapidement. Laisser les cerveaux de nos jeunes entre les mains de la Chine, c'est suicidaire."
        ]
    },
    {
        title: "TÉLÉTRAVAIL = FLEMME généralisée",
        messages: [
            "Productivité en chute libre depuis 2020",
            "Faux prétexte pour glander à la maison",
            "Collaboration équipe inexistante en remote",
            "Pause déjeuner de 2h, qui contrôle ?",
            "Retour au bureau obligatoire pour sauver l'économie",
            "Netflix pendant les calls Teams, nouveau standard de productivité française. Les managers s'en rendent même plus compte.",
            "Dress code pyjama toute la journée, le professionnalisme français touche le fond. Comment prendre au sérieux quelqu'un en jogging ?",
            "Les open spaces toxiques d'avant paraissent paradisiaques comparés à cette atomisation sociale généralisée du télétravail.",
            "Balance vie pro/perso complètement détraquée. Avant on rentrait chez soi, maintenant le bureau envahit le salon H24.",
            "L'immobilier de bureaux s'effondre, secteur entier en crise. Les centres-villes se vident, commerce local en souffrance extrême."
        ]
    },
    {
        title: "NETFLIX TROP CHER mais on reste ABONNÉS",
        messages: [
            "15€/mois pour du contenu de plus en plus nul",
            "On partage les comptes, seule solution viable",
            "Disney+ et Prime Video fragmentent le marché",
            "Nostalgie des DVD, au moins on possédait",
            "Addiction moderne, difficile de décrocher",
            "Le partage de comptes devient impossible avec leurs nouvelles restrictions. Stratégie de gangsters pour pressuriser les familles.",
            "La qualité du contenu original chute année après année. Budget marketing > budget création, logique Netflix moderne.",
            "On se retrouve avec 5 abonnements pour avoir l'équivalent de l'ancien catalogue Netflix. Fragmentation organisée du marché.",
            "Paradoxe moderne : on paie plus cher pour moins posséder. Nos parents avaient leurs DVD pour la vie, nous on loue l'accès.",
            "L'algorithme de recommandations pousse du contenu médiocre. On passe plus de temps à chercher qu'à regarder, expérience dégradée."
        ]
    },
    {
        title: "IMPÔTS français RECORD MONDIAL",
        messages: [
            "45% de prélèvements, on marche sur la tête",
            "Services publics dégradés malgré la pression fiscale",
            "Irlande ou Portugal tentent de plus en plus",
            "Classe moyenne pressurée comme un citron",
            "Expatriation fiscale devient logique économique",
            "La France taxe le travail comme si c'était un vice. Résultat : fuite des cerveaux vers des pays moins punitifs fiscalement.",
            "Services publics en déliquescence malgré cette pression fiscale record. L'argent part où exactement ? Mystère et boule de gomme.",
            "Portugal avec son statut de résident non habituel attire tous nos talents. Brain drain organisé par notre propre bêtise administrative.",
            "La classe moyenne française finance les extrêmes : RSA d'un côté, niches fiscales des riches de l'autre. Logique de dingue.",
            "Même l'Allemagne nous regarde bizarrement niveau fiscalité. Quand nos voisins nous trouvent excessifs, c'est qu'on a touché le fond."
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
            "Premier reflexe : demander sur le 18-25",
            "Les kheys du forum ont toujours des réponses que Google n'a pas. L'intelligence collective de la communauté reste imbattable.",
            "J'ai épluché tous les forums tech spécialisés, rien de probant. Mais ici on trouve souvent des solutions créatives inattendues.",
            "Le 18-25 c'est mon dernier recours avant de tout péter et recommencer from scratch. L'expertise diversifiée fait des miracles.",
            "Entre les trolls il y a de vrais génies qui traînent ici. Suffit de trier le bon grain de l'ivraie dans les réponses.",
            "Forum le plus réactif de France, réponse en moins d'une heure même pour les trucs les plus obscurs. Efficacité légendaire."
        ]
    },
    {
        title: "[URGENT] Quelqu'un confirme",
        messages: [
            "Info vue sur Twitter mais source douteuse",
            "Besoin de confirmation avant de partager",
            "Ça paraît gros mais on sait jamais",
            "Si c'est vrai ça va faire du bruit",
            "Debunk ou pas debunk ? That is the question",
            "Twitter c'est devenu un nid à fake news depuis le rachat Musk. Plus aucune modération, n'importe qui dit n'importe quoi.",
            "Les kheys ont l'habitude de croiser les sources et de fact-checker rapidement. Communauté plus fiable que les journalistes mainstream.",
            "Si ça passe le filtre du 18-25, c'est que l'info tient la route. Sinon ça se fait débunk en 3 messages chrono.",
            "L'époque où on pouvait faire confiance aux médias traditionnels est révolue. Maintenant c'est vérification communautaire ou rien.",
            "Le forum a déjà évité plusieurs fake news qui ont fait le tour des autres réseaux. Niveau fact-checking, on domine la concurrence."
        ]
    },
    {
        title: "Les KHEYS valident cette histoire",
        messages: [
            "Expérience personnelle un peu wtf",
            "J'ai besoin de votre avis éclairé",
            "Ça vous paraît plausible cette situation ?",
            "Forum le plus intelligent de France, à vous",
            "Intelligence collective du 18-25 activate",
            "Vécu quelque chose de totalement surréaliste aujourd'hui. J'ai besoin que d'autres cerveaux analysent pour voir si je deviens fou.",
            "Entre les trolls et les vrais conseils, le forum arrive toujours à dégager une vérité objective. L'effet de masse fonctionne.",
            "Parfois on vit des trucs qu'on croirait sortis d'un mauvais film. Mais la réalité dépasse souvent la fiction, malheureusement.",
            "Les kheys ont une expérience de vie collective impressionnante. Rare qu'une situation soit vraiment inédite pour la communauté.",
            "Au final c'est thérapeutique de partager ses galères ici. On se sent moins seul face aux absurdités de l'existence moderne."
        ]
    },
    {
        title: "PREMIÈRE fois ici soyez INDULGENTS",
        messages: [
            "Long time lurker, first time poster",
            "J'ai lu les règles mais je stress quand même",
            "Pas habitué aux codes du forum",
            "Soyez cool avec le petit nouveau",
            "J'apprends vite, promis les vétérans",
            "Ça fait des mois que je lis vos délires en mode fantôme. Aujourd'hui je me lance mais j'appréhende la violence des réactions.",
            "J'ai potassé le règlement et les topics épinglés pour pas me faire lyncher dès mon premier post. Préparation militaire.",
            "L'ambiance du forum intimide au début mais on sent qu'il y a une vraie communauté derrière. L'intégration se mérite ici.",
            "Les vétérans sont impressionnants niveau culture et répartie. J'espère atteindre ce niveau un jour si vous me laissez grandir.",
            "Premier post stressant mais excitant. On devient vraiment membre du 18-25 qu'une fois qu'on a posté son premier message."
        ]
    },
    {
        title: "C'est CHAUD cette histoire",
        messages: [
            "Plot twist de dingue dans ma vie",
            "Réalité dépasse la fiction parfois",
            "Mes potes me croient pas, vous non plus ?",
            "Histoire vraie à 100%, main sur le cœur",
            "La vie réserve des surprises incroyables",
            "J'ai vécu un truc tellement wtf que même Netflix refuserait le scénario. Mais c'est ma réalité depuis ce matin.",
            "Mes amis pensent que j'exagère ou que j'invente. Mais les kheys savent reconnaître quand quelqu'un dit la vérité vraie.",
            "Parfois la vie te balance des situations qu'aucun scénariste n'oserait écrire. Trop gros pour être crédible, mais pourtant réel.",
            "Je jure sur ce que j'ai de plus cher que chaque mot est authentique. La vérité vraie sans aucun enjolivement narratif.",
            "L'existence moderne nous réserve des retournements de situation dignes des meilleures séries. On vit dans une époque folle."
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
            "Chacun ses goûts mais là c'est objectivement faux",
            "Les Italiens ont créé un patrimoine culinaire millénaire. Venir foutre de l'ananas dessus c'est du vandalisme gastronomique pur.",
            "Le sucré-salé fonctionne dans certains plats asiatiques, mais sur une pizza margherita c'est une profanation. Context matters.",
            "Gordon Ramsay lui-même refuse de servir ça dans ses restos. Quand un chef de cette envergure dit non, c'est que c'est vraiment problématique.",
            "La Hawaienne fut inventée par un Grec au Canada pour satisfaire les touristes américains. Rien d'authentiquement italien là-dedans.",
            "Liberté gustative OK, mais certaines limites existent. On met pas de ketchup sur un foie gras, logique identique pour l'ananas-pizza."
        ]
    },
    {
        title: "CHATS vs CHIENS : GUERRE éternelle du 18-25",
        messages: [
            "Team chat : indépendance et personnalité",
            "Team chien : fidélité et protection assurées",
            "Chat = colocataire, Chien = meilleur ami",
            "Allergies décident souvent à notre place",
            "Pourquoi choisir ? Les deux sont géniaux",
            "Les chats respectent votre espace personnel et votre rythme de vie. Les chiens vous imposent leurs besoins H24, différence énorme.",
            "Un chien vous aime inconditionnellement même si vous êtes un connard. Un chat doit apprendre à vous respecter, c'est plus authentique.",
            "Niveau intelligence émotionnelle, les chats lisent vos humeurs et s'adaptent. Les chiens sont en mode 'hyperactif permanent' épuisant.",
            "Par contre pour la sécurité et la protection famille, rien ne vaut un bon chien dressé. Les chats s'enfuient au premier danger.",
            "Au final c'est une question de personnalité du maître. Introverti = chat, extraverti = chien. Chacun trouve son animal miroir."
        ]
    },
    {
        title: "ANDROID users = PAUVRES assumés",
        messages: [
            "Flagship Android coûte autant qu'iPhone",
            "Liberté de customisation VS écosystème fermé",
            "Samsung Galaxy S24 concurrence iPhone 15",
            "Cliché de riche = avoir du goût pour l'overpriced",
            "Guerre de marques débile, les deux font le taf",
            "Un S24 Ultra coûte 1400€, soit plus qu'un iPhone 15 standard. L'argument financier tombe complètement à l'eau maintenant.",
            "Android offre la liberté de personnalisation totale. iOS te traite comme un enfant incapable de gérer son téléphone.",
            "Google Pixel fait de meilleures photos qu'iPhone grâce à l'IA computationnelle. Apple reste sur du hardware traditionnel dépassé.",
            "Le cliché 'Android = pauvre' vient des téléphones d'entrée de gamme à 200€. Mais le haut de gamme Android domine techniquement.",
            "Au final c'est juste du tribalisme débile. Les deux OS font correctement leur travail, le reste c'est du marketing identitaire."
        ]
    },
    {
        title: "FAST FOOD écrase RESTAURANT traditionnel",
        messages: [
            "Rapidité et prix imbattables pour la génération",
            "McDo, KFC, Subway s'adaptent aux goûts actuels",
            "Restaurant tradi = 2h et 40€, pas réaliste",
            "Qualité fast-food s'améliore, l'écart se réduit",
            "Mode de vie moderne incompatible avec resto classique",
            "Un McDo tu sais exactement combien tu vas payer et combien de temps ça prend. Restaurant traditionnel c'est loterie niveau timing et prix.",
            "Les chaînes testent leurs recettes sur des millions de clients. Un resto local mise tout sur le talent d'un seul chef, plus risqué.",
            "Génération pressée par le temps et l'argent. Passer 2h à table pour 50€ par personne devient un luxe rare, pas la norme.",
            "La qualité s'améliore : KFC Colonel Club, McDo avec pain de mie, Subway ingrédients frais. L'écart se resserre clairement.",
            "Restaurant traditionnel = expérience sociale. Fast-food = efficacité nutritionnelle. Deux besoins différents, deux modèles qui coexistent."
        ]
    },
    {
        title: "LIVRE papier résiste à KINDLE",
        messages: [
            "Sensation tactile irremplaçable du papier",
            "Bibliothèque physique = décoration et culture",
            "Fatigue oculaire moindre sur papier",
            "Kindle pratique en voyage mais c'est tout",
            "Librairies indépendantes méritent notre soutien",
            "Tourner les pages physiquement active la mémoire spatiale. On retient mieux l'info avec un livre papier, c'est scientifiquement prouvé.",
            "Une bibliothèque bien fournie en impose socialement. Ça montre la culture et les centres d'intérêt, le Kindle reste invisible.",
            "Écran e-ink fatigue moins que LCD mais le papier reste optimal pour les sessions de lecture prolongées. Confort inégalé.",
            "Pour les voyages ou déménagements, Kindle gagne clairement. 1000 livres dans 200g, argument logistique imparable.",
            "Acheter en librairie indépendante soutient l'économie locale et maintient la diversité culturelle. Amazon standardise et appauvrit l'offre."
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
            "Droit du travail inexistant dans cette boîte",
            "Il m'a littéralement dit que l'ambiance de travail c'était pas son problème. Je cite : 'T'es payé pour bosser, pas pour être heureux'.",
            "Phrase prononcée avec un sérieux déconcertant devant toute l'équipe. Le malaise dans la salle était palpable, personne osait réagir.",
            "Ce type incarne tout ce qui dysfonctionne dans le management français. Autoritarisme désuet et mépris des employés, combo parfait.",
            "Ma démission est déjà rédigée, je cherche juste le moment parfait pour la déposer. Cette boîte mérite de couler avec ce genre de mentalité.",
            "Les RH sont complices ou inexistantes. Signaler ce comportement reviendrait à me tirer une balle dans le pied professionnellement."
        ]
    },
    {
        title: "[CRINGE] SOIRÉE d'hier MALAISE total",
        messages: [
            "Niveau embarras : maximum critique atteint",
            "J'ai envie de déménager dans un autre pays",
            "Mes amis vont me charrier pendant 6 mois",
            "Alcool + stress social = combo destructeur",
            "Parfois le mieux c'est de rester chez soi",
            "J'ai réussi l'exploit de renverser un verre sur la copine de mon pote devant tout le monde. Première impression ratée, record battu.",
            "En essayant de rattraper, j'ai glissé et je me suis étalé comme une merde. Level cringe maximum atteint en moins de 5 minutes.",
            "Le pire c'est que j'étais sobre à ce moment-là. Même pas l'excuse de l'alcool pour justifier cette coordination de manchot.",
            "Maintenant je suis 'le mec qui s'étale' dans leur groupe d'amis. Ma réputation sociale anéantie pour les 10 prochaines années minimum.",
            "Les réseaux sociaux modernes transforment chaque moment gênant en contenu viral potentiel. Plus moyen de mourir dans l'anonymat."
        ]
    },
    {
        title: "[HELP] VOISIN chiants que faire",
        messages: [
            "Tapage nocturne quotidien depuis 3 mois",
            "Syndic incompétent, police s'en fout",
            "Déménager pour ça ? C'est eux les problèmes",
            "Guerre de voisinage, je deviens fou",
            "Solutions légales vs envie de violence",
            "Musique à fond jusqu'à 2h du mat' tous les soirs. J'ai cogné au mur, parlé calmement, rien ne fonctionne avec ces débiles.",
            "Le syndic me renvoie vers la police, la police me dit 'débrouillez-vous entre voisins'. Cercle vicieux de l'incompétence administrative.",
            "Je paie 1200€ de loyer pour dormir avec des boules Quies tous les soirs. C'est moi qui dois partir à cause de ces parasites ?",
            "Mon niveau de patience atteint dangereusement le zéro absolu. Entre envie de tout casser et maintien de ma sanity, équilibre fragile.",
            "Les solutions légales prennent des mois voir années. Mon sommeil et ma santé mentale ne peuvent pas attendre si longtemps."
        ]
    },
    {
        title: "[AWKWARD] RENCARD Tinder CATASTROPHIQUE",
        messages: [
            "Photos vs réalité : delta de 15 kg minimum",
            "Conversation niveau CP, j'ai souffert",
            "1h30 les plus longues de ma vie",
            "Tinder = loterie, parfois on perd gros",
            "Retour aux rencontres IRL obligatoire",
            "Elle avait utilisé des photos d'il y a 5 ans minimum. Fausse publicité caractérisée, je me suis senti arnaqué dès les premières secondes.",
            "Zéro point commun découvert en 90 minutes de conversation forcée. Même la météo était un sujet épuisé au bout de 30 secondes.",
            "J'ai fait semblant d'avoir un appel urgent pour écourter. Technique lâche mais légitime défense psychologique dans ce cas précis.",
            "Les apps de rencontre créent des attentes irréalistes. Photos filtrées, personnalités surfacées, désillusion garantie au premier contact réel.",
            "Retour aux rencontres organiques obligatoire. Au moins en vrai on voit directement à qui on a affaire, sans marketing trompeur."
        ]
    },
    {
        title: "[LOVE] Premier RENCARD réussi CONSEILS",
        messages: [
            "Enfin une personne normale sur cette app",
            "Connexion intellectuelle immédiate, rare",
            "Pas trop en faire, rester naturel",
            "Deuxième date prévue, je stresse déjà",
            "L'espoir renaît après des mois de galère",
            "Conversation fluide pendant 3h sans voir le temps passer. Premier bon signe : elle sait développer une idée au-delà du superficiel.",
            "Profil honnête, photos récentes, personnalité authentique. Enfin quelqu'un qui joue cartes sur table sans faux-semblant marketing.",
            "On s'est découvert des passions communes inattendues. Rare de tomber sur quelqu'un qui partage tes centres d'intérêt vraiment.",
            "Je stresse déjà pour le deuxième rendez-vous. Paradoxe : plus ça se passe bien, plus on a peur de tout foirer au suivant.",
            "Après des mois de matches décevants, enfin une lueur d'espoir. Les apps peuvent fonctionner si on tombe sur la bonne personne."
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
            "Refroidissement liquide obligatoire performance soutenue",
            "Alimentation 850W Gold minimum pour cette config. Pas d'économies sur le PSU, c'est le cœur de tout le système.",
            "Boîtier avec bon airflow essentiel. Fractal Design ou Corsair pour du premium, mais l'aération prime sur l'esthétique.",
            "Carte mère B650 chipset suffisant, pas besoin de X670 hors de prix. L'argent économisé va mieux dans le GPU.",
            "Windows 11 Pro pour les features avancées et la RAM unlimited. L'investissement se justifie sur une config pareille."
        ]
    },
    {
        title: "LINUX DOMINE WINDOWS pour DEV",
        messages: [
            "Terminal natif écrase PowerShell minable",
            "Package managers efficaces vs Windows Store",
            "Ubuntu 22.04 LTS stable et performant",
            "Docker natif, pas de VM parasites",
            "Microsoft pousse vers Linux avec WSL, aveu d'échec",
            "Bash scripting naturel vs batch files préhistoriques de Windows. Productivité développeur incomparable entre les deux systèmes.",
            "APT, YUM, Pacman gèrent les dépendances intelligemment. Windows Store c'est un catalogue de jeux pour gamins, pas un vrai package manager.",
            "Développement web natif sur Linux : Apache, Nginx, MySQL tournent dans leur environnement d'origine. Pas de compromis ou adaptations foireuses.",
            "La communauté open source Linux répond en 10 minutes sur Stack Overflow. Support Microsoft facture 200€ pour te dire de redémarrer.",
            "Pop!_OS et Manjaro rendent Linux accessible aux non-geeks. Plus d'excuse pour rester sur Windows par flemme d'apprendre."
        ]
    },
    {
        title: "SSD 2TO ÉCRASE HDD 4TO pour GAMING",
        messages: [
            "Temps de chargement divisés par 10",
            "Prix SSD baissent, HDD deviennent obsolètes",
            "Jeux modernes optimisés pour SSD",
            "Silence total vs bruit mécanique HDD",
            "2 To suffisent si on gère sa ludothèque",
            "DirectStorage de Microsoft nécessite du SSD pour fonctionner. Les jeux next-gen seront littéralement injouables sur HDD traditionnel.",
            "Un SSD NVMe Gen4 charge Cyberpunk 2077 en 15 secondes. Mon ancien HDD prenait 3 minutes, temps de vie récupéré énorme.",
            "Niveau prix le gap se resserre : SSD 2To à 150€ vs HDD 4To à 100€. 50€ de différence pour un gain de performance colossal.",
            "Plus de vibrations, plus de bruit, plus de chaleur. Le SSD transforme ton PC en machine silencieuse et efficace énergétiquement.",
            "Steam Deck et consoles utilisent que du SSD maintenant. L'industrie entire a abandonné le HDD, signal clair de l'évolution."
        ]
    },
    {
        title: "CLAVIER mécanique HYPE justifiée",
        messages: [
            "Frappe tactile incomparable au membrane",
            "Durabilité 50M de frappes vs 5M",
            "Cherry MX Brown équilibre parfait",
            "Productivité et plaisir de frappe++",
            "Investissement rentabilisé sur 10 ans",
            "Le feedback tactile améliore réellement la précision de frappe. Moins d'erreurs, moins de fatigue, productivité mesurable en plus.",
            "Cherry MX Blue pour les nostalgiques du bruit, Red pour les gamers, Brown pour les polyvalents. Chacun trouve son switch idéal.",
            "Keycaps PBT résistent à l'usure contrairement aux ABS qui deviennent brillants. Détail important pour la longévité d'usage quotidien.",
            "Format TKL (sans pavé numérique) optimal pour gaming et bureautique. Économie d'espace bureau et position souris plus ergonomique.",
            "Éclairage RGB optionnel mais les profils par application changent vraiment l'expérience. Raccourcis visuels et ambiance de travail."
        ]
    },
    {
        title: "ÉCRAN 4K 144Hz VAUT son PRIX",
        messages: [
            "Netteté 4K + fluidité 144Hz = perfection",
            "Gaming ET productivité sur même écran",
            "HDR correct change l'expérience visuelle",
            "RTX 4080 minimum pour exploiter",
            "1500€ mais ça dure 7-8 ans minimum",
            "La densité de pixels 4K élimine totalement l'aliasing. Plus besoin d'anti-aliasing gourmand, performance pure récupérée.",
            "Dual usage gaming/productivité justifie l'investissement. Travailler en 4K puis switcher vers du 144Hz gaming, polyvalence totale.",
            "HDR 1000 nits minimum pour un vrai impact visuel. Les écrans HDR400 c'est du marketing, la différence est négligeable.",
            "Panel IPS pour les couleurs ou VA pour le contraste. OLED trop risqué pour usage bureau intensif à cause du burn-in.",
            "Investissement qui se rentabilise sur la durée. Un bon écran survit à 2-3 générations de config PC, priorité budgétaire logique."
        ]
    }
];

const stickers = [
    "https://image.noelshack.com/fichiers/2016/24/1466366209-risitas24.png",
    "https://image.noelshack.com/fichiers/2018/13/4/1522325846-jesusopti.png",
    "https://image.noelshack.com/fichiers/2018/26/7/1530476579-reupjesus.png",
    "https://image.noelshack.com/fichiers/2018/29/6/1532128784-risitas33.png",
    "https://image.noelshack.com/fichiers/2018/27/4/1530827992-jesusreup.png",
    "https://image.noelshack.com/fichiers/2016/24/1466366197-risitas10.png",
    "https://image.noelshack.com/fichiers/2016/26/1467335935-jesus1.png",
    "https://image.noelshack.com/fichiers/2017/13/1490886827-risibo.png",
    "https://image.noelshack.com/fichiers/2018/25/2/1529422413-risitaszoom.png",
    "https://image.noelshack.com/fichiers/2018/10/1/1520256134-risitasue2.png",
    "https://image.noelshack.com/fichiers/2017/18/1494048058-pppppppppppppppppppp.png",
    "https://image.noelshack.com/fichiers/2022/37/1/1663014384-ahi-pince-mais.png",
    "https://image.noelshack.com/fichiers/2016/38/1474488555-jesus24.png",
    "https://image.noelshack.com/fichiers/2017/39/3/1506524542-ruth-perplexev2.png",
    "https://image.noelshack.com/fichiers/2016/30/1469541952-risitas182.png",
    "https://image.noelshack.com/fichiers/2021/43/4/1635454847-elton-john-tison-golem.png",
    "https://image.noelshack.com/fichiers/2018/10/1/1520260980-risitas94.png",
    "https://image.noelshack.com/fichiers/2017/39/3/1506463228-risibg.png",
    "https://image.noelshack.com/fichiers/2017/39/3/1506463227-risitaspeur.png",
    "https://image.noelshack.com/fichiers/2016/36/1473263957-risitas33.png",
    "https://image.noelshack.com/fichiers/2017/30/4/1501186981-risimixbestreup.png",
    "https://image.noelshack.com/fichiers/2017/02/1484173541-cc-risitas596.png",
    "https://image.noelshack.com/fichiers/2017/22/1496583962-risisingecigarette.png",
    "https://image.noelshack.com/fichiers/2016/38/1474490235-risitas434.png",
    "https://image.noelshack.com/fichiers/2017/31/5/1501862610-jesus56bestreup.png",
    "https://image.noelshack.com/fichiers/2017/07/1487382298-risitasdepressif.png",
    "https://image.noelshack.com/fichiers/2021/04/4/1611841177-ahiahiahi.png",
    "https://image.noelshack.com/fichiers/2016/50/1482000512-onsecalmerisitas.png",
    "https://image.noelshack.com/fichiers/2016/47/1480081450-ris42.png",
    "https://image.noelshack.com/fichiers/2016/39/1474977832-sadchanclaloop.gif",
    "https://image.noelshack.com/fichiers/2018/51/3/1545248326-larryreup.png",
    "https://image.noelshack.com/fichiers/2017/22/1496587449-1494613194-risisinge.png",
    "https://image.noelshack.com/fichiers/2017/04/1485259037-bloggif-588741091e719.png",
    "https://image.noelshack.com/fichiers/2017/30/4/1501186458-risitalarmebestreup.gif",
    "https://image.noelshack.com/fichiers/2017/30/4/1501187858-risitassebestreup.png",
    "https://image.noelshack.com/fichiers/2017/19/1494343590-risitas2vz-z-3x.png",
    "https://image.noelshack.com/fichiers/2018/10/1/1520255849-risitasse.png",
    "https://image.noelshack.com/fichiers/2020/51/2/1607997474-ayaoo.png",
    "https://image.noelshack.com/fichiers/2016/30/1469402389-smiley16.png",
    "https://image.noelshack.com/fichiers/2017/18/1493933263-fou-rire-jesus.png",
    "https://image.noelshack.com/fichiers/2020/52/6/1608985783-ahi-triangle.png",
    "https://image.noelshack.com/fichiers/2022/38/4/1663852709-golemabasourdi.png",
    "https://image.noelshack.com/fichiers/2017/30/4/1501185683-jesusjournalbestreup.png",
    "https://image.noelshack.com/fichiers/2016/50/1481878288-asile2.jpg",
    "https://image.noelshack.com/fichiers/2022/24/6/1655577587-ahi-triangle-clopent.png",
    "https://image.noelshack.com/fichiers/2021/18/7/1620572127-jesus-barbe-serein.png",
    "https://image.noelshack.com/fichiers/2017/15/1492340491-jesus32.png",
    "https://image.noelshack.com/fichiers/2017/30/4/1501188028-risitasbestreup.png",
    "https://image.noelshack.com/fichiers/2018/13/6/1522530708-jesusgif.gif",
    "https://image.noelshack.com/fichiers/2017/02/1484089609-coeur.png",
    "https://image.noelshack.com/fichiers/2017/20/1494968374-pas-de-chance.png",
    "https://image.noelshack.com/fichiers/2016/49/1481221589-jesuszoom2.jpg",
    "https://image.noelshack.com/fichiers/2017/30/4/1501186885-risitasueurbestreup.png",
    "https://image.noelshack.com/fichiers/2016/47/1480092147-1477945635-1465556572-elrisitassticker3-copy.png",
    "https://image.noelshack.com/fichiers/2017/50/1/1513020307-jesusjointtransparent.png",
    "https://image.noelshack.com/fichiers/2022/38/5/1663951771-indespite.png",
    "https://image.noelshack.com/fichiers/2017/18/1493758368-mpytb.png",
    "https://image.noelshack.com/fichiers/2017/22/1496349456-thjghj.png",
    "https://image.noelshack.com/fichiers/2017/10/1489162412-1465686632-jesuus-risitas.gif",
    "https://image.noelshack.com/fichiers/2017/19/1494260086-zoom3.png",
    "https://image.noelshack.com/fichiers/2016/47/1480064732-1467335935-jesus4.png",
    "https://image.noelshack.com/fichiers/2016/49/1481201791-yaahshs.png",
    "https://image.noelshack.com/fichiers/2017/12/1490497882-zemmourrire.png",
    "https://image.noelshack.com/fichiers/2017/09/1488387951-zemmour-lol.png",
    "https://image.noelshack.com/fichiers/2021/08/1/1613997318-zidane.png",
    "https://image.noelshack.com/fichiers/2017/14/1491572376-img-0024.png",
    "https://image.noelshack.com/fichiers/2016/51/1482448857-celestinrisitas.png",
    "https://image.noelshack.com/fichiers/2016/47/1480081469-ris6.png",
    "https://image.noelshack.com/fichiers/2017/15/1491851452-villani-zepo.png",
    "https://image.noelshack.com/fichiers/2017/06/1486457204-issou3.png",
    "https://image.noelshack.com/fichiers/2024/40/4/1727979813-photo-outpute983ec5bc8086b8d.jpg",
    "https://image.noelshack.com/fichiers/2017/05/1485800183-2588741.png",
    "https://image.noelshack.com/fichiers/2017/08/1487984196-789797987987464646468798798.png",
    "https://image.noelshack.com/fichiers/2017/06/1486561574-jesusarthur.png",
    "https://image.noelshack.com/fichiers/2017/31/5/1501863678-risitas596bestreup.png",
    "https://image.noelshack.com/fichiers/2017/19/1494619651-larryhome-2.png",
    "https://image.noelshack.com/fichiers/2017/22/1496491923-jesusperplex2.png",
    "https://image.noelshack.com/fichiers/2016/31/1470170706-1469971038-risitas258.png",
    "https://image.noelshack.com/fichiers/2016/38/1474488637-jesus26.png"
];
