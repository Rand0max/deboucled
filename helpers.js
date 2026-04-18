
///////////////////////////////////////////////////////////////////////////////////////
// HELPERS
///////////////////////////////////////////////////////////////////////////////////////

// --- JVC DOM compatibility layer (April 2026 forum refresh) ---
// New JVC markup replaces the old BEM-less classes with messageUser__*, tablesForum__*, pagination__*, etc.
// These helpers target BOTH old and new DOMs so the rest of the code keeps working.

const JVC_SEL = {
    // topic list
    topicListContainer: 'ul.tablesForum--listTopics, .topic-list',
    // NOTE: keeps the .tablesForum__headRow first so existing code treating topics[0] as header still works.
    topicListItem: 'ul.tablesForum--listTopics > li:not(.dfp__atf):not(.message), .topic-list > li:not(.dfp__atf):not(.message)',
    topicTitle: 'a.tablesForum__cellSubject, a.lien-jv.topic-title, .topic-title',
    topicAuthor: '.tablesForum__authorLink, .topic-author',
    topicCount: '.tablesForum__cellText--msg, .topic-count',
    topicImg: '.tablesForum__subjectMarkerIcon, .topic-img',
    topicHeadSubject: '.tablesForum__headRow .tablesForum__rowSujets, .topic-head > span:nth-child(1)',
    topicHeadLastMsg: '.tablesForum__headRow .tablesForum__rowLastMsg, .topic-head > span:nth-child(4)',
    // topic (messages) page
    messagesContainer: '#listMessages, .conteneur-messages-pagi',
    message: '.messageUser, .bloc-message-forum',
    messageAuthor: 'a.messageUser__label, span.messageUser__label, a.bloc-pseudo-msg, span.bloc-pseudo-msg',
    messageDate: 'a.messageUser__date, .bloc-date-msg',
    messageContent: '.messageUser__msg.js-message-user-msg, .messageUser__msg, .txt-msg.text-enrichi-forum, .txt-msg',
    messageMain: '.messageUser__main, .bloc-contenu',
    messageOptions: '.messageUser__footer, .bloc-options-msg',
    // Anchor for inline author buttons (spirale, filtre, jvarchive). On new DOM
    // we insert them right after the pseudo link so they stay on the same line
    // as the pseudo inside .messageUser__profil. Old DOM keeps div.bloc-mp-pseudo.
    messageMpBloc: 'a.messageUser__label, span.messageUser__label, div.bloc-mp-pseudo',
    messageAvatar: '.messageUser__header .avatar__image, .user-avatar-msg',
    messageBlockquote: '.message__blockquote, .blockquote-jv',
    messageSignature: '.messageUser__signature, .signature-msg',
    // pagination
    paginationContainer: '.pagination, .bloc-pagi-default',
    pageActive: '.pagination__item--current, .page-active',
    pageLast: '.pagination__button--last, .pagi-fin-actif.icon-next2',
    // editors / forms
    topicTitleHeader: '.titleMessagesUsers__title, #bloc-title-forum',
    topicBlocFormulaire: '#forums-post-message-editor, #forums-post-topic-editor, #bloc-formulaire-forum',
    messageTopicInput: 'textarea[name="message_topic"], textarea[name="message_reponse"], #message_topic',
    // misc
    blocPreRight: '#js-list-message-tools-actions .buttonsNavbar, #js-list-topics-tools-actions, .bloc-pre-right',
};

// Extracts the topic author pseudo from a topic list row, handling both the legacy DOM
// and the April 2026 JVC refresh. Returns null when the pseudo is not exposed (e.g. not-logged-in
// rows where JVC only displays a "+N" participant placeholder).
function getTopicAuthor(topicElement) {
    if (!topicElement) return null;
    // New DOM (logged-in): participants cell has <a class="tablesForum__firstAvatar" title="Pseudo" href="/profil/pseudo...">
    // New DOM (not-logged-in): same cell but as <span class="JvCare ... tablesForum__firstAvatar" title="Pseudo">
    // (the href is JvCare-obfuscated in the class, but the title still carries the real pseudo).
    const firstAvatar = topicElement.querySelector('.tablesForum__firstAvatar');
    if (firstAvatar) {
        const pseudo = firstAvatar.getAttribute('title')?.trim()
            || firstAvatar.querySelector('img')?.getAttribute('alt')?.trim()
            || '';
        if (pseudo) return pseudo;
    }
    // Legacy DOM or pseudo exposed in text (old .topic-author, or .tablesForum__authorLink
    // previously injected by addTopic for JvCare-obfuscated rows).
    const authorLink = topicElement.querySelector(JVC_SEL.topicAuthor);
    if (!authorLink) return null;
    const text = authorLink.textContent.trim();
    // Not-logged-in new DOM: the cell shows "+N" (participant count). Not a real pseudo -> skip.
    if (!text || /^\+\d+$/.test(text)) return null;
    return text;
}

function jvcGetTopicIdFromElement(topicElement) {
    if (!topicElement) return null;
    const dataId = topicElement.getAttribute?.('data-id');
    if (dataId) return dataId;
    const id = topicElement.id || '';
    const m = id.match(/^topic-(\d+)$/);
    return m ? m[1] : null;
}

function jvcGetMessageIdFromElement(messageElement) {
    if (!messageElement) return null;
    const dataId = messageElement.getAttribute?.('data-id');
    if (dataId) return dataId;
    // Self id (hybrid component) then fallback to nearest ancestor carrying
    // the id (new DOM fallback variant wraps .messageUser in <div id="message-X">).
    const source = messageElement.id ? messageElement : messageElement.closest?.('[id^="message-"]');
    const id = source?.id || '';
    const m = id.match(/^message-(\d+)$/);
    return m ? m[1] : null;
}

function jvcFindMessageById(id, root) {
    root = root || document;
    return root.querySelector(`#message-${id}, .bloc-message-forum[data-id="${id}"], .messageUser[data-id="${id}"]`);
}

function jvcFindTopicById(id, root) {
    root = root || document;
    return root.querySelector(`#topic-${id}, [data-id="${id}"]`);
}

// Decodes window.jvc.forumsAppPayload (base64 JSON) once and caches the result.
let _jvcForumsAppPayloadCache;
function jvcGetForumsAppPayload() {
    if (_jvcForumsAppPayloadCache !== undefined) return _jvcForumsAppPayloadCache;
    try {
        const root = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window);
        const raw = root?.jvc?.forumsAppPayload;
        if (!raw) { _jvcForumsAppPayloadCache = null; return null; }
        _jvcForumsAppPayloadCache = JSON.parse(atob(raw));
    } catch {
        _jvcForumsAppPayloadCache = null;
    }
    return _jvcForumsAppPayloadCache;
}

function toAbsoluteUrl(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return new URL(url, window.location.origin).href;
}

// Use page's native fetch for same-origin JVC requests (bypasses Cloudflare challenge)
// GM.xmlHttpRequest gets blocked by Cloudflare, but native fetch goes through the browser pipeline
const pageFetch = (typeof unsafeWindow !== 'undefined' && unsafeWindow.fetch)
    ? unsafeWindow.fetch.bind(unsafeWindow)
    : fetch;

function loadPageScript(url) {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
    });
}

// String utilities
function normalizeDiacritic(str) {
    return str.normalize("NFD").replace(/\p{Diacritic}/gu, '');
}

function normalizeCompatibility(str) {
    return str.normalize('NFKC');
}

function removeSurrogatePairs(str) {
    // eslint-disable-next-line no-useless-escape
    return str.replace(/[^\p{L}\p{N}\p{P}\p{Z}=\{\^\$\}\+\*\\<>|`£°~€]/gu, '');
}

function escapeRegexPatterns(str) {
    return str.replaceAll(/[-[\]{}()+?.,\\^$|#]/g, '\\$&');
}

function handleGenericChar(str) {
    return str.replaceAll('*', '.*?');
}

function capitalize(str) {
    if (str.length === 0) return str;
    const regex = new RegExp(/\p{L}/, 'u');
    const i = str.search(regex);
    if (i < 0) return str;
    return str.substring(0, i) + str.charAt(i).toUpperCase() + str.slice(i + 1);
}

function removeDoubleSpaces(str) {
    return str.replaceAll(/ +(?= )/g, '');
}

function isMatch(str, pattern) {
    return str.match(pattern) !== null;
}

// Array utilities
function sortNormalize(array) {
    return array.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

// Collection utilities (Map & Set)
function hasAny(collection) {
    return collection.size > 0;
}

function mapAnyValue(map, callback) {
    return [...map.values()].some(callback);
}

function mapAddIncrement(map, key) {
    map.set(key.toLowerCase(), (map.get(key.toLowerCase()) ?? 0) + 1);
}

function mapAddArrayIncrement(map, array) {
    array.forEach(key => mapAddIncrement(map, key));
}

function mapSortByValueThenKey(map, descValue = false) {
    if (descValue) {
        return new Map([...map]
            .sort((a, b) => {
                if (a[1] > b[1]) return -1;
                if (a[1] < b[1]) return 1;
                if (a[0].toLowerCase() > b[0].toLowerCase()) return 1;
                if (a[0].toLowerCase() < b[0].toLowerCase()) return -1;
                return 0;
            }));
    }

    return new Map([...map]
        .sort((a, b) => {
            if (a[1] > b[1]) return 1;
            if (a[1] < b[1]) return -1;
            if (a[0].toLowerCase() > b[0].toLowerCase()) return 1;
            if (a[0].toLowerCase() < b[0].toLowerCase()) return -1;
            return 0;
        }));
}


function mergeArrays(array1, array2) {
    if (array1 instanceof Map || array2 instanceof Map) {
        return new Map([...new Set([...array1, ...array2])]);
    }
    else if (array1 instanceof Set || array2 instanceof Set) {
        return new Set([...array1, ...array2]);
    }
    else {
        return [...new Set([...array1, ...array2])];
    }
}

function normalizeValue(value) {
    return normalizeDiacritic(value.toString().toUpperCase());
}

function buildEntityRegex(array, withBoundaries) {
    if (!array?.length) return null;

    const cacheKey = `E|${withBoundaries ? 1 : 0}|${array.join('\0')}`;
    if (regexCache.has(cacheKey)) return regexCache.get(cacheKey);

    function transformGenericChars(str) {
        const genCharsRegex = /^(?<leadingGenericGrp>\*?)(?<expressionGrp>.*?)(?<trailingGenericGrp>\*?)$/gi;
        const matches = genCharsRegex.exec(str);
        if (!matches?.groups?.expressionGrp) return null;

        const leadingGeneric = matches.groups.leadingGenericGrp ? `(?:${handleGenericChar(matches.groups.leadingGenericGrp)})` : '';
        const trailingGeneric = matches.groups.trailingGenericGrp ? `(?:${handleGenericChar(matches.groups.trailingGenericGrp)})` : '';

        const expression = handleGenericChar(matches.groups.expressionGrp);
        return `${leadingGeneric}${expression}${trailingGeneric}`;
    }

    // \b ne fonctionne pas avec les caractères spéciaux
    const bStart = withBoundaries ? '(?<=\\W|^)' : '';
    const bEnd = withBoundaries ? '(?=\\W|$)' : '';

    const regexMap = array.filter(e => e?.length).map((e) => {
        let word = normalizeDiacritic(escapeRegexPatterns(e));
        word = transformGenericChars(word);
        return `${bStart}${word}${bEnd}`;
    });

    const regex = regexMap.join('|');

    const result = new RegExp(regex, 'gi');
    regexCache.set(cacheKey, result);
    return result;
}

function buildArrayRegex(array) {
    if (!array?.length) return null;

    const cacheKey = `A|${array.join('\0')}`;
    if (regexCache.has(cacheKey)) return regexCache.get(cacheKey);

    const bStart = '(?<=\\W|^)';
    const bEnd = '(?=\\W|$)';
    let regexMap = array.map((e) => normalizeDiacritic(escapeRegexPatterns(e)));
    const result = new RegExp(`${bStart}(${regexMap.join('|')})${bEnd}`, 'gi');
    regexCache.set(cacheKey, result);
    return result;
}

function invalidateRegexCache() {
    regexCache.clear();
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function plural(nb) {
    return nb > 1 ? 's' : '';
}

function preferDarkTheme() {
    // Adjust text contrast for Dark Reader and JVC new Dark Theme
    // N.B : JVC qui troll en switchant le thème tout seul en fonction des réglages de Dark Reader
    // Bien sûr les attributs sont pas toujours les mêmes ni même cohérents sinon c'est pas drôle

    const darkReaderEnabled = document.documentElement.getAttribute('data-darkreader-scheme') === 'dark';
    const jvcLightThemeEnabled = document.documentElement.classList.contains('theme-light');
    const jvcDarkThemeEnabled = document.documentElement.classList.contains('theme-dark');
    const preferDarkColorScheme = window?.matchMedia('(prefers-color-scheme: dark)').matches;

    if (darkReaderEnabled) return true; // Dark reader has priority over everything
    if (jvcLightThemeEnabled) return false; // Next priority is jvc light theme enabled (if dark reader is enabled but off on jvc)
    if (jvcDarkThemeEnabled) return true; // Next priority is jvc dark theme enabled
    if (preferDarkColorScheme) return true; // Finally we check prefered color scheme if all above are false
    return false;
}

function addStyles(enableJvRespawnRefinedTheme, hideAvatarBorder) {
    const deboucledCss = GM_getResourceText('DEBOUCLED_CSS');
    GM_addStyle(deboucledCss);

    if (preferDarkTheme()) {
        const sweetAlertDarkCss = GM_getResourceText('SWEETALERTDARK_CSS');
        GM_addStyle(sweetAlertDarkCss);
    }

    if (enableJvRespawnRefinedTheme) {
        const jvRespawnRefinedCss = GM_getResourceText('JVRESPAWNREFINED_CSS');
        GM_addStyle(jvRespawnRefinedCss);
    }

    if (hideAvatarBorder) {
        const avatarBorderHiddenCss = '.challenge-border-avatar { display: none; }';
        GM_addStyle(avatarBorderHiddenCss);
    }

    const liteYoutubeCss = GM_getResourceText('LITEYOUTUBE_CSS');
    GM_addStyle(liteYoutubeCss);
}

function addSvg(svgHtml) {
    const container = document.querySelector('#deboucled-svg-container');
    let svgElement = document.createElement('svg');
    container.appendChild(svgElement);
    svgElement.outerHTML = svgHtml;
}

function decryptJvCare(jvCareClass) {
    let base16 = '0A12B34C56D78E9F', url = '', s = jvCareClass.split(' ')[1];
    for (let i = 0; i < s.length; i += 2) {
        url += String.fromCharCode(base16.indexOf(s.charAt(i)) * 16 + base16.indexOf(s.charAt(i + 1)));
    }
    return url;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function group(items, fn) {
    return items.reduce((prev, next) => {
        const prop = fn(next);
        return {
            ...prev,
            [prop]: prev[prop] ? [...prev[prop], next] : [next],
        };
    }, {});
}

function groupBy(arr, criteria) {
    const newObj = arr.reduce(function (acc, currentValue) {
        if (!acc[currentValue[criteria]]) {
            acc[currentValue[criteria]] = [];
        }
        acc[currentValue[criteria]].push(currentValue);
        return acc;
    }, {});
    return newObj;
}

function removeRepeatingCharacters(str) {
    /*
    return str.split('').filter(function (char, index, strArray) {
        return index >= 1 && strArray[index - 1] === char;
    }).join('');
    */
    //const vowels = ['A', 'E', 'I', 'O', 'U', 'Y'];
    let res = '';
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        //if ((vowels.includes(char) || !isNaN(char)) && i >= 1 && char === str[i - 1]) continue;
        //else if (!vowels.includes(char) && i >= 2 && char === str[i - 1] && char === str[i - 2]) continue;
        if (i >= 1 && str[i] === str[i - 1]) continue;
        res += char;
    }
    return res;
}

function replaceNumbersSimilarToCharacters(str) {
    let res = str;
    res = res.replaceAll('0', 'O');
    res = res.replaceAll('1', 'I');
    res = res.replaceAll('3', 'E');
    res = res.replaceAll('4', 'A');
    res = res.replaceAll('5', 'S');
    res = res.replaceAll('7', 'T');
    return res;
}

function calcStringDistanceScore(str1, str2) {
    let result = 100 - 100 * distance(str1, str2) / Math.max(str1.length, str2.length);
    return Math.round(result);
}

async function awaitElements(target, selector) {
    return new Promise(resolve => {
        if (target.querySelectorAll(selector).length !== 0) {
            return resolve(target.querySelectorAll(selector));
        }
        const observer = new MutationObserver(() => {
            if (target.querySelectorAll(selector).length !== 0) {
                resolve(target.querySelectorAll(selector));
                observer.disconnect();
            }
        });
        observer.observe(target, { childList: true, subtree: true });
    });
}

function getWordBoundsAtPosition(str, position) {
    const isSpace = (c) => /\s/.exec(c);
    let start = position - 1;
    let end = position;

    while (start >= 0 && !isSpace(str[start])) {
        start -= 1;
    }
    start = Math.max(0, start + 1);

    while (end < str.length && !isSpace(str[end])) {
        end += 1;
    }
    end = Math.max(start, end);

    return [start, end];
}

function getCaretCoordinates(element, position) {
    // https://www.npmjs.com/package/textarea-caret
    // - "Tu es un bon langage ?" - "Oui je ne donne pas la position du curseur." - ent

    let properties = [
        'direction',
        'boxSizing',
        'width',
        'height',
        'overflowX',
        'overflowY',
        'borderTopWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderLeftWidth',
        'borderStyle',
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
        'fontStyle',
        'fontVariant',
        'fontWeight',
        'fontStretch',
        'fontSize',
        'fontSizeAdjust',
        'lineHeight',
        'fontFamily',
        'textAlign',
        'textTransform',
        'textIndent',
        'textDecoration',
        'letterSpacing',
        'wordSpacing',
        'tabSize',
        'MozTabSize'
    ];

    let isBrowser = (typeof window !== 'undefined');
    let isFirefox = (isBrowser && window.mozInnerScreenX !== null);

    let div = document.createElement('div');
    div.id = 'input-textarea-caret-position-mirror-div';
    document.body.appendChild(div);

    let style = div.style;
    let computed = window.getComputedStyle ? window.getComputedStyle(element) : element.currentStyle;
    let isInput = element.nodeName === 'INPUT';

    style.whiteSpace = 'pre-wrap';
    if (!isInput) style.wordWrap = 'break-word';

    style.position = 'absolute';
    style.visibility = 'hidden';

    properties.forEach(function (prop) {
        if (isInput && prop === 'lineHeight') {
            style.lineHeight = computed.height;
        } else {
            style[prop] = computed[prop];
        }
    });

    if (isFirefox) {
        if (element.scrollHeight > parseInt(computed.height)) style.overflowY = 'scroll';
    } else {
        style.overflow = 'hidden';
    }

    div.textContent = element.value.substring(0, position);
    if (isInput) div.textContent = div.textContent.replace(/\s/g, '\u00a0');

    let span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    let coordinates = {
        top: span.offsetTop + parseInt(computed.borderTopWidth),
        left: span.offsetLeft + parseInt(computed.borderLeftWidth),
        height: parseInt(computed.lineHeight)
    };

    document.body.removeChild(div);

    return coordinates;
}

function getTextChildren(contentElement) {
    return [...contentElement.childNodes].filter(c => c.nodeType === Node.TEXT_NODE && c.textContent.trim() !== '');
}

async function fetchHtml(url, handle410 = false) {
    return pageFetch(toAbsoluteUrl(url))
        .then(function (response) {
            if (response.ok) return response.text();
            if (handle410 && (response.status === 410 || response.status === 404)) return response.text();
            throw Error(response.statusText);
        }).then(function (res) {
            return domParser.parseFromString(res, 'text/html');
        }).catch(function (err) {
            console.warn(err);
            return undefined;
        });
}

async function fetchJson(url, timeout = 1500) {
    return fetchWithTimeout(url, timeout)
        .then(function (response) {
            if (response?.status !== 200) throw Error(response?.statusText || `HTTP ${response?.status}`);
            return response?.responseText;
        })
        .then(function (text) {
            return JSON.parse(text);
        })
        .catch(function (err) {
            console.warn(err);
            return undefined;
        });
}

async function fetchJsonWithParams(url, params, timeout = 1500) {
    return fetchJson(url + '?' + new URLSearchParams(params), timeout);
}

function gmXhr(details) {
    return new Promise((resolve) => {
        const origOnload = details.onload;
        const origOnerror = details.onerror;
        const origOntimeout = details.ontimeout;
        GM.xmlHttpRequest({
            ...details,
            onload: (response) => { if (origOnload) origOnload(response); resolve(response); },
            onerror: (response) => { if (origOnerror) origOnerror(response); resolve(undefined); },
            ontimeout: (response) => { if (origOntimeout) origOntimeout(response); resolve(undefined); }
        });
    });
}

async function fetchWithTimeout(resource, timeout) {
    const res = await gmXhr({
        method: 'GET',
        url: resource,
        timeout: timeout,
        onerror: (response) => { console.error('fetch error', response); },
        ontimeout: (response) => { console.warn('fetch timeout', response); }
    });
    return res;
}

function formatDateToFrenchFormat(date, withSugar = false) {
    let dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    let timeOptions = { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return `${withSugar ? 'Le ' : ''}${date.toLocaleDateString('fr-FR', dateOptions)}${withSugar ? ' à' : ''} ${date.toLocaleTimeString('fr-FR', timeOptions)}`;
}

function getUUIDv4() {
    if ((typeof (window.crypto) !== 'undefined' && typeof (window.crypto.randomUUID) !== 'undefined')) {
        return window.crypto.randomUUID();
    }
    else if ((typeof (window.crypto) !== 'undefined' && typeof (window.crypto.getRandomValues) !== 'undefined')) {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
    else {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

function dateIsToday(date) {
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function stringifyError(error) {
    return JSON.stringify(error, ['message', 'name', 'stack', 'fileName', 'arguments', 'type', 'columnNumber', 'lineNumber']);
}

function buildRandomStr(maxLength) {
    return (Math.random() + 1).toString(36).substring(maxLength);
}

function prependEvent(element, event, fn, options = {}) {
    if (!element) {
        console.warn('prependEvent : element is null');
        return;
    }

    const { stopPropagation = false, executeOriginal = false } = options;

    const wrappedFn = async (e) => {
        if (stopPropagation) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }

        try {
            await fn(e);

            if (executeOriginal) {
                setTimeout(() => {
                    const newEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        clientX: e.clientX,
                        clientY: e.clientY
                    });

                    element.removeEventListener(event, wrappedFn, { capture: true });
                    element.dispatchEvent(newEvent);
                }, 1000);
            }
        } catch (error) {
            console.error('prependEvent : erreur dans la fonction utilisateur', error);
        }
    };

    element.addEventListener(event, wrappedFn, { capture: true });
}

function setTextAreaValue(textarea, value) {
    const prototype = Object.getPrototypeOf(textarea);
    const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
    nativeSetter.call(textarea, value);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) {
        return 'à l\'instant';
    } else if (diffMinutes < 60) {
        return `il y a ${diffMinutes} min`;
    } else if (diffHours < 24) {
        return `il y a ${diffHours}h`;
    } else {
        const diffDays = Math.floor(diffHours / 24);
        return `il y a ${diffDays}j`;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
