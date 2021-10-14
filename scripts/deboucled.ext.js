// ==UserScript==
// @grant       GM_addStyle
// @grant       GM_getResourceText
// ==/UserScript==

///////////////////////////////////////////////////////////////////////////////////////
// EXTENSIONS
///////////////////////////////////////////////////////////////////////////////////////

String.prototype.normalizeDiacritic = function () {
    return this.normalize("NFD").replace(/\p{Diacritic}/gu, "");
};

String.prototype.escapeRegexPattern = function () {
    return this.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

function normalizeValue(value) {
    return value.toString().toUpperCase().normalizeDiacritic();
};

function makeRegex(array, withBoundaries) {
    let b = withBoundaries ? '\\b' : '';
    let map = array.map((e) => `${b}${e.escapeRegexPattern().normalizeDiacritic()}${b}`)
    let regex = map.join('|');
    return new RegExp(regex, 'gi');
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function plural(nb) {
    return nb > 1 ? 's' : '';
}

function addCss() {
    const globalCss = GM_getResourceText("DEBOUCLED_CSS");
    GM_addStyle(globalCss);
}

function addSvg(svgHtml, selector) {
    let svgElement = document.createElement('svg');
    svgElement.innerHTML = svgHtml;
    let selection = document.querySelector(selector)
    if (selection !== null) selection.appendChild(svgElement);
}

function decryptJvCare(jvCareClass) {
    let base16 = '0A12B34C56D78E9F', url = '', s = jvCareClass.split(' ')[1];
    for (let i = 0; i < s.length; i += 2) {
        url += String.fromCharCode(base16.indexOf(s.charAt(i)) * 16 + base16.indexOf(s.charAt(i + 1)));
    }
    return url;
}
