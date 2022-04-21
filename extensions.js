
///////////////////////////////////////////////////////////////////////////////////////
// EXTENSIONS
///////////////////////////////////////////////////////////////////////////////////////

String.prototype.normalizeDiacritic = function () {
    return this.normalize("NFD").replace(/\p{Diacritic}/gu, '');
}

String.prototype.normalizeCompatibility = function () {
    return this.normalize('NFKC');
}

String.prototype.removeSurrogatePairs = function () {
    // eslint-disable-next-line no-useless-escape
    return this.replace(/[^\p{L}\p{N}\p{P}\p{Z}=\{\^\$\}\+\*\\<>|`£°~€]/gu, '');
}

String.prototype.escapeRegexPatterns = function () {
    return this.replaceAll(/[-[\]{}()+?.,\\^$|#]/g, '\\$&');
}

String.prototype.handleGenericChar = function () {
    return this.replaceAll('*', '.*?');
}

String.prototype.capitalize = function () {
    if (this.length === 0) return this;
    const regex = new RegExp(/\p{L}/, 'u');
    const i = this.search(regex);
    if (i < 0) return this;
    return this.substring(0, i) + this.charAt(i).toUpperCase() + this.slice(i + 1);
}

String.prototype.removeDoubleSpaces = function () {
    return this.replaceAll(/ +(?= )/g, '');
}

String.prototype.isMatch = function (s) {
    return this.match(s) !== null
}

Array.prototype.sortNormalize = function () {
    return this.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

Set.prototype.addArray = function (array) {
    array.forEach(this.add, this);
}

Set.prototype.hasAny = function () {
    return this.size > 0;
}

Map.prototype.hasAny = function () {
    return this.size > 0;
}

Map.prototype.anyValue = function (callback) {
    return [...this.values()].some(callback);
}

Map.prototype.addIncrement = function (key) {
    this.set(key.toLowerCase(), (this.get(key.toLowerCase()) ?? 0) + 1);
}

Map.prototype.addArrayIncrement = function (array) {
    array.forEach(this.addIncrement, this);
}

Map.prototype.sortByValue = function (desc = false) {
    if (desc) return new Map([...this].sort((a, b) => String(b[1]).localeCompare(a[1])));
    return new Map([...this].sort((a, b) => String(a[1]).localeCompare(b[1])));
}

Map.prototype.sortByValueThenKey = function (descValue = false) {
    if (descValue) {
        return new Map([...this]
            .sort((a, b) => {
                if (a[1] > b[1]) return -1;
                if (a[1] < b[1]) return 1;
                if (a[0].toLowerCase() > b[0].toLowerCase()) return 1;
                if (a[0].toLowerCase() < b[0].toLowerCase()) return -1;
                return 0;
            }));
    }

    return new Map([...this]
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
    return value.toString().toUpperCase().normalizeDiacritic();
}

function buildEntityRegex(array, withBoundaries) {
    if (!array?.length) return null;

    function transformGenericChars(str) {
        const genCharsRegex = /^(?<leadingGeneric>\*?)(?<expression>.*?)(?<trailingGeneric>\*?)$/gi;
        const matches = genCharsRegex.exec(str);
        if (!matches.groups.expression) return null;
        const leadingGeneric = matches.groups.leadingGeneric ? `(?:${matches.groups.leadingGeneric.handleGenericChar()})` : '';
        const trailingGeneric = matches.groups.trailingGeneric ? `(?:${matches.groups.trailingGeneric.handleGenericChar()})` : '';
        const expression = matches.groups.expression.handleGenericChar();
        return `${leadingGeneric}(${expression})${trailingGeneric}`;
    }

    // \b ne fonctionne pas avec les caractères spéciaux
    let bStart = withBoundaries ? '(?<=\\W|^)' : '';
    let bEnd = withBoundaries ? '(?=\\W|$)' : '';

    let regexMap = array.filter(e => e?.length).map((e) => {
        let word = e.escapeRegexPatterns().normalizeDiacritic();
        word = transformGenericChars(word);
        return `${bStart}${word}${bEnd}`;
    });

    let regex = regexMap.join('|');
    return new RegExp(regex, 'gi');
}

function buildArrayRegex(array) {
    const bStart = '(?<=\\W|^)';
    const bEnd = '(?=\\W|$)';
    let regexMap = array.map((e) => e.escapeRegexPatterns().normalizeDiacritic());
    return new RegExp(`${bStart}(${regexMap.join('|')})${bEnd}`, 'gi');
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function plural(nb) {
    return nb > 1 ? 's' : '';
}

function addStyles(enablePeepoTheme, enableJvRespawnRefinedTheme) {
    const deboucledCss = GM_getResourceText('DEBOUCLED_CSS');
    GM_addStyle(deboucledCss);

    if (enablePeepoTheme) {
        const peepoDarkJvcV2Css = GM_getResourceText('PEEPODARKJVCV2_CSS');
        GM_addStyle(peepoDarkJvcV2Css);
    }

    if (enableJvRespawnRefinedTheme) {
        const jvRespawnRefinedCss = GM_getResourceText('JVRESPAWNREFINED_CSS');
        GM_addStyle(jvRespawnRefinedCss);
    }
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

function calculateStringDistance(str1, str2) {
    // eslint-disable-next-line no-undef
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
        observer.observe(target, {
            childList: true,
            subtree: true,
        });
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
    let isFirefox = (isBrowser && window.mozInnerScreenX != null);

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
        top: span.offsetTop + parseInt(computed['borderTopWidth']),
        left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
        height: parseInt(computed['lineHeight'])
    };

    document.body.removeChild(div);

    return coordinates;
}

function getTextChildren(contentElement) {
    return [...contentElement.childNodes].filter(c => c.nodeType === Node.TEXT_NODE && c.textContent.trim() !== '');
}

async function fetchHtml(url) {
    return fetch(url)
        .then(function (response) {
            if (!response.ok) throw Error(response.statusText);
            return response.text();
        }).then(function (res) {
            return domParser.parseFromString(res, 'text/html');
        }).catch(function (err) {
            console.warn(err);
            return undefined;
        });
}

async function fetchJson(url, timeout = 90000) {
    return fetchWithTimeout(url, { timeout: timeout })
        .then(function (response) {
            if (!response.ok) throw Error(response.statusText);
            return response.text();
        })
        .then(function (text) {
            return JSON.parse(text);
        })
        .catch(function (err) {
            console.warn(err);
            return undefined;
        });
}

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 8000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
        ...options,
        signal: controller.signal
    });
    clearTimeout(id);
    return response;
}

function formatDateToFrenchFormat(date) {
    var dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    var timeOptions = { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return `${date.toLocaleDateString('fr-FR', dateOptions)} ${date.toLocaleTimeString('fr-FR', timeOptions)}`;
}

function getUUIDv4() {
    if ((typeof (window.crypto) !== 'undefined' && typeof (window.crypto.randomUUID) !== 'undefined')) {
        return crypto.randomUUID();
    }
    else if ((typeof (window.crypto) !== 'undefined' && typeof (window.crypto.getRandomValues) !== 'undefined')) {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
    else {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
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

