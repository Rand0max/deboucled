// ==UserScript==
// @name        Déboucled
// @namespace   deboucledjvcom
// @version     1.24.9
// @downloadURL https://github.com/Rand0max/deboucled/raw/master/deboucled.user.js
// @updateURL   https://github.com/Rand0max/deboucled/raw/master/deboucled.meta.js
// @author      Rand0max
// @description Censure les topics et les auteurs éclatax et vous sort de la boucle
// @icon        https://image.noelshack.com/fichiers/2021/38/6/1632606701-deboucled.png
// @match       http://www.jeuxvideo.com/forums/*
// @match       https://www.jeuxvideo.com/forums/*
// @match       http://m.jeuxvideo.com/forums/*
// @match       https://m.jeuxvideo.com/forums/*
// @match       http://www.jeuxvideo.com/recherche/forums/*
// @match       https://www.jeuxvideo.com/recherche/forums/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_getResourceText
// @resource    DEBOUCLED_CSS https://raw.githubusercontent.com/Rand0max/deboucled/master/deboucled.css
// @resource    CHARTS_CSS https://unpkg.com/charts.css/dist/charts.min.css
// @require     https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js
// @run-at      document-end
// ==/UserScript==


///////////////////////////////////////////////////////////////////////////////////////
// VARIABLES
///////////////////////////////////////////////////////////////////////////////////////

let subjectBlacklistArray = [];
let authorBlacklistArray = [];
let topicIdBlacklistMap = new Map();
let subjectsBlacklistReg = buildRegex(subjectBlacklistArray, true);
let authorsBlacklistReg = buildRegex(authorBlacklistArray, false);

let pocTopicMap = new Map();

let hiddenTotalTopics = 0;
let hiddenSubjects = 0;
let hiddenTopicsIds = 0;
let hiddenMessages = 0;
let hiddenAuthors = 0;
let hiddenAuthorArray = new Set();
let deboucledTopicStatsMap = new Map();

let matchedSubjects = new Map();
let matchedAuthors = new Map();
let matchedTopics = new Map();

let stopHighlightModeratedTopics = false;
let moderatedTopics = new Map();
let sortModeSubject = 0;
let sortModeAuthor = 0;
let sortModeTopicId = 0;

const deboucledVersion = '1.24.9'
const defaultTopicCount = 25;

const entitySubject = 'subject';
const entityAuthor = 'author';
const entityTopicId = 'topicid';

const domParser = new DOMParser();


///////////////////////////////////////////////////////////////////////////////////////
// STORAGE
///////////////////////////////////////////////////////////////////////////////////////

const localstorage_pocTopics = 'deboucled_pocTopics';

const storage_init = 'deboucled_init', storage_init_default = false;
const storage_blacklistedTopicIds = 'deboucled_blacklistedTopicIds', storage_blacklistedTopicIds_default = '[]';
const storage_blacklistedSubjects = 'deboucled_blacklistedSubjects', storage_blacklistedSubjects_default = '[]';
const storage_blacklistedAuthors = 'deboucled_blacklistedAuthors', storage_blacklistedAuthors_default = '[]';
const storage_optionEnableDarkTheme = 'deboucled_optionEnableDarkTheme', storage_optionEnableDarkTheme_default = false;
const storage_optionBoucledUseJvarchive = 'deboucled_optionBoucledUseJvarchive', storage_optionBoucledUseJvarchive_default = false;
const storage_optionHideMessages = 'deboucled_optionHideMessages', storage_optionHideMessages_default = true;
const storage_optionAllowDisplayThreshold = 'deboucled_optionAllowDisplayThreshold', storage_optionAllowDisplayThreshold_default = false;
const storage_optionDisplayThreshold = 'deboucled_optionDisplayThreshold', storage_optionDisplayThreshold_default = 100;
const storage_optionDisplayBlacklistTopicButton = 'deboucled_optionDisplayBlacklistTopicButton', storage_optionDisplayBlacklistTopicButton_default = true;
const storage_optionShowJvcBlacklistButton = 'deboucled_optionShowJvcBlacklistButton', storage_optionShowJvcBlacklistButton_default = false;
const storage_optionFilterResearch = 'deboucled_optionFilterResearch', storage_optionFilterResearch_default = true;
const storage_optionDetectPocMode = 'deboucled_optionDetectPocMode', storage_optionDetectPocMode_default = 0;
const storage_optionPrevisualizeTopic = 'deboucled_optionPrevisualizeTopic', storage_optionPrevisualizeTopic_default = true;
const storage_optionDisplayBlackTopic = 'deboucled_optionDisplayBlackTopic', storage_optionDisplayBlackTopic_default = true;
const storage_optionDisplayTopicCharts = 'deboucled_optionDisplayTopicCharts', storage_optionDisplayTopicCharts_default = true;
const storage_optionDisplayTopicMatches = 'deboucled_optionDisplayTopicMatches', storage_optionDisplayTopicMatches_default = true;
const storage_optionClickToShowTopicMatches = 'deboucled_optionClickToShowTopicMatches', storage_optionClickToShowTopicMatches_default = false;
const storage_optionRemoveUselessTags = 'deboucled_optionRemoveUselessTags', storage_optionRemoveUselessTags_default = false;
const storage_optionMaxTopicCount = 'deboucled_optionMaxTopicCount', storage_optionMaxTopicCount_default = defaultTopicCount;

const storage_totalHiddenTopicIds = 'deboucled_totalHiddenTopicIds';
const storage_totalHiddenSubjects = 'deboucled_totalHiddenSubjects';
const storage_totalHiddenAuthors = 'deboucled_totalHiddenAuthors';
const storage_totalHiddenMessages = 'deboucled_totalHiddenMessages';
const storage_TopicStats = 'deboucled_TopicStats';

const storage_Keys = [storage_init, storage_blacklistedTopicIds, storage_blacklistedSubjects, storage_blacklistedAuthors, storage_optionEnableDarkTheme, storage_optionBoucledUseJvarchive, storage_optionHideMessages, storage_optionAllowDisplayThreshold, storage_optionDisplayThreshold, storage_optionDisplayBlacklistTopicButton, storage_optionShowJvcBlacklistButton, storage_optionFilterResearch, storage_optionDetectPocMode, storage_optionPrevisualizeTopic, storage_optionDisplayBlackTopic, storage_optionDisplayTopicCharts, storage_optionDisplayTopicMatches, storage_optionClickToShowTopicMatches, storage_optionRemoveUselessTags, storage_optionMaxTopicCount, storage_totalHiddenTopicIds, storage_totalHiddenSubjects, storage_totalHiddenAuthors, storage_totalHiddenMessages, storage_TopicStats];

const storage_Keys_Blacklists = [storage_blacklistedTopicIds, storage_blacklistedSubjects, storage_blacklistedAuthors];


async function initStorage() {
    let isInit = GM_getValue(storage_init, storage_init_default);
    if (isInit) {
        await loadStorage();
        return false;
    }
    else {
        await saveStorage();
        GM_setValue(storage_init, true);
        return true;
    }
}

async function loadStorage() {
    subjectBlacklistArray = [...new Set(JSON.parse(GM_getValue(storage_blacklistedSubjects, storage_blacklistedSubjects_default)))];
    authorBlacklistArray = [...new Set(JSON.parse(GM_getValue(storage_blacklistedAuthors, storage_blacklistedAuthors_default)))];
    topicIdBlacklistMap = new Map([...JSON.parse(GM_getValue(storage_blacklistedTopicIds, storage_blacklistedTopicIds_default))]);

    subjectsBlacklistReg = buildRegex(subjectBlacklistArray, true);
    authorsBlacklistReg = buildRegex(authorBlacklistArray, false);

    let topicStats = GM_getValue(storage_TopicStats);
    if (topicStats) deboucledTopicStatsMap = new Map([...JSON.parse(topicStats)]);

    await loadLocalStorage();

    await saveStorage();
}

async function saveStorage() {
    GM_setValue(storage_blacklistedSubjects, JSON.stringify([...new Set(subjectBlacklistArray)]));
    GM_setValue(storage_blacklistedAuthors, JSON.stringify([...new Set(authorBlacklistArray)]));
    GM_setValue(storage_blacklistedTopicIds, JSON.stringify([...topicIdBlacklistMap]));

    subjectsBlacklistReg = buildRegex(subjectBlacklistArray, true);
    authorsBlacklistReg = buildRegex(authorBlacklistArray, false);

    await saveLocalStorage();

    refreshEntityCounts();
}

async function loadLocalStorage() {
    let optionDetectPocMode = GM_getValue(storage_optionDetectPocMode, storage_optionDetectPocMode_default);
    if (optionDetectPocMode === 0) return;

    const storagePocTopics = await localforage.getItem(localstorage_pocTopics);
    if (storagePocTopics) pocTopicMap = new Map([...JSON.parse(storagePocTopics)]);
}

async function saveLocalStorage() {
    let optionDetectPocMode = GM_getValue(storage_optionDetectPocMode, storage_optionDetectPocMode_default);
    if (optionDetectPocMode === 0) return;
    await localforage.setItem(localstorage_pocTopics, JSON.stringify([...pocTopicMap]));
}

async function removeTopicIdBlacklist(topicId) {
    if (topicIdBlacklistMap.has(topicId)) {
        topicIdBlacklistMap.delete(topicId);
        await saveStorage();
    }
}

async function addEntityBlacklist(array, key) {
    if (array.indexOf(key) === -1) {
        array.push(key);
        await saveStorage();
    }
}

async function removeEntityBlacklist(array, key) {
    let index = array.indexOf(key);
    if (index > -1) {
        array.splice(index, 1);
        await saveStorage();
    }
}

function incrementTotalHidden(settingKey, value) {
    let currentValue = parseInt(GM_getValue(settingKey, '0'));
    GM_setValue(settingKey, currentValue + value);
}

function saveTotalHidden() {
    incrementTotalHidden(storage_totalHiddenTopicIds, hiddenTopicsIds);
    incrementTotalHidden(storage_totalHiddenSubjects, hiddenSubjects);
    incrementTotalHidden(storage_totalHiddenAuthors, hiddenAuthors);
    incrementTotalHidden(storage_totalHiddenMessages, hiddenMessages);
}

function backupStorage() {
    function blobToFile(blob, fileName) {
        let file = new File([blob], fileName);
        file.lastModifiedDate = new Date();
        file.name = fileName;
        return file;
    }

    const onlyBlacklists = document.querySelector('#deboucled-impexp-blonly').checked;

    let map = new Map();
    GM_listValues().forEach(key => {
        if (onlyBlacklists && !storage_Keys_Blacklists.includes(key)) return;
        map.set(key, JSON.parse(GM_getValue(key)));
    });
    let json = JSON.stringify(Object.fromEntries(map));
    var file = blobToFile(new Blob([json], { type: 'application/json' }), 'deboucled');
    var anchor = document.createElement('a');
    anchor.download = 'deboucled-settings.json';
    anchor.href = window.URL.createObjectURL(file);
    anchor.style.display = 'none';
    anchor.click();
}

function restoreStorage(fileContent) {
    const onlyBlacklists = document.querySelector('#deboucled-impexp-blonly').checked;

    // On parse le JSON du fichier pour en faire un objet
    let settingsObj = JSON.parse(fileContent);

    // On parcours les clés/valeurs
    for (const [key, value] of Object.entries(settingsObj)) {
        // Si une clé est inconnue on ignore
        if (!storage_Keys.includes(key)) continue;

        // Si on importe uniquement les blacklists
        if (onlyBlacklists && !storage_Keys_Blacklists.includes(key)) continue;

        // Type object = array/map donc il faut déserialiser
        if (typeof (value) === 'object') {
            GM_setValue(key, JSON.stringify(value));
        }
        else {
            // Valeur normale (boolean/string/int/etc)
            GM_setValue(key, value);
        }
    }

    showRestoreCompleted()
}

function showRestoreCompleted() {
    document.querySelectorAll('#deboucled-impexp-message').forEach(function (e) {
        setTimeout(() => { e.classList.toggle('active'); }, 5000);
        e.classList.toggle('active');
    });
}

function loadFile(fileEvent) {
    var file = fileEvent.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function (e) {
        let content = e.target.result;
        restoreStorage(content);
    };
    reader.readAsText(file);
}

async function importFromTotalBlacklist() {
    var blacklistFromTbl = localStorage.getItem('blacklisted');
    if (!blacklistFromTbl) {
        alert('Aucune blacklist détectée dans TotalBlacklist.');
        return;
    }
    const blacklistFromTblArray = JSON.parse(blacklistFromTbl).filter(function (val) { return val !== 'forums' });
    authorBlacklistArray = [...new Set(authorBlacklistArray.concat(blacklistFromTblArray))];
    await saveStorage()
    refreshAuthorKeys();
    showRestoreCompleted();
    alert(`${blacklistFromTblArray.length} pseudos TotalBlacklist ont été importés dans Déboucled avec succès.`);
}


///////////////////////////////////////////////////////////////////////////////////////
// EXTENSIONS
///////////////////////////////////////////////////////////////////////////////////////

String.prototype.normalizeDiacritic = function () {
    return this.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

String.prototype.escapeRegexPattern = function () {
    return this.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');
}

String.prototype.handleGenericChar = function () {
    return this.replace('*', '.*');
}

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.removeDoubleSpaces = function () {
    return this.replace(/ +(?= )/g, '');
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


function normalizeValue(value) {
    return value.toString().toUpperCase().normalizeDiacritic();
}

function buildRegex(array, withBoundaries) {
    // \b ne fonctionne pas avec les caractères spéciaux
    let bStart = withBoundaries ? '(?<=\\W|^)' : '';
    let bEnd = withBoundaries ? '(?=\\W|$)' : '';
    let map = array.map((e) => {
        let word = e.escapeRegexPattern().handleGenericChar().normalizeDiacritic();
        return `${bStart}${word}${bEnd}`;
    })
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
    const deboucledCss = GM_getResourceText('DEBOUCLED_CSS');
    GM_addStyle(deboucledCss);
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


///////////////////////////////////////////////////////////////////////////////////////
// RIGHT COLUMN - STATS/CHARTS
///////////////////////////////////////////////////////////////////////////////////////

function addRightBlocMatches() {
    let optionDisplayTopicMatches = GM_getValue(storage_optionDisplayTopicMatches, storage_optionDisplayTopicMatches_default);
    if (!optionDisplayTopicMatches || (!matchedTopics.hasAny() && !matchedSubjects.hasAny() && !matchedAuthors.hasAny())) return;

    let html = '';
    html += '<div class="card card-jv-forum card-forum-margin">';
    html += `<div class="card-header">CORRESPONDANCES<span class="deboucled-card-header-right">${hiddenTotalTopics} ignoré${plural(hiddenTotalTopics)}</span></div>`;
    html += '<div class="card-body">';
    html += '<div class="scrollable">';
    html += '<div class="scrollable-wrapper">';
    html += '<div id="deboucled-matches-content" class="scrollable-content bloc-info-forum">';

    function formatMatches(matches) {
        let formatMatch = (str) => str.replace(',', '').removeDoubleSpaces().trim().capitalize();
        let matchesSorted = matches.sortByValueThenKey(true);
        let matchesHtml = '';
        let index = 0;
        matchesSorted.forEach((occ, match) => {
            const className = `deboucled-match${index < matchesSorted.size - 1 ? ' match-after' : ''}`;
            matchesHtml += `<span class="${className}" deboucled-data-tooltip="${occ} fois">${formatMatch(match)}</span>`;
            index++;
        });
        return matchesHtml;
    }

    let optionClickToShowTopicMatches = GM_getValue(storage_optionClickToShowTopicMatches, storage_optionClickToShowTopicMatches_default);

    function addMatches(matches, entity, title) {
        let matchesHtml = '';
        matchesHtml += `<h4 class="titre-info-fofo">${title}</h4>`;
        if (optionClickToShowTopicMatches) {
            matchesHtml += `<div id="deboucled-matches-${entity}-wrapper" class="deboucled-matches-wrapper">`;
            matchesHtml += `<span class="deboucled-eye-logo deboucled-display-matches"></span>`;
            matchesHtml += `<div id="deboucled-matched-${entity}" style="display:none;">${formatMatches(matches)}</div>`;
        }
        else {
            matchesHtml += `<div id="deboucled-matches-${entity}-wrapper">`;
            matchesHtml += `<div id="deboucled-matched-${entity}">${formatMatches(matches)}</div>`;
        }
        matchesHtml += '</div>';
        return matchesHtml;
    }

    if (matchedSubjects.hasAny()) html += addMatches(matchedSubjects, entitySubject, 'Sujets');
    if (matchedAuthors.hasAny()) html += addMatches(matchedAuthors, entityAuthor, 'Auteurs');
    if (matchedTopics.hasAny()) html += addMatches(matchedTopics, entityTopicId, 'Topics');

    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    let matches = document.createElement('div');
    document.querySelector('#forum-right-col').append(matches);
    matches.outerHTML = html;

    if (!optionClickToShowTopicMatches) return;

    function addMatchesToggleEvent(entity) {
        const wrapper = document.querySelector(`#deboucled-matches-${entity}-wrapper`);
        wrapper.onclick = function () {
            this.firstChild.remove();
            this.removeAttribute('class');
            document.querySelector(`#deboucled-matched-${entity}`).removeAttribute('style');
            wrapper.onclick = null;
        }
    }
    if (matchedSubjects.hasAny()) addMatchesToggleEvent(entitySubject);
    if (matchedAuthors.hasAny()) addMatchesToggleEvent(entityAuthor);
    if (matchedTopics.hasAny()) addMatchesToggleEvent(entityTopicId);
}

function addRightBlocStats() {
    let optionDisplayTopicCharts = GM_getValue(storage_optionDisplayTopicCharts, storage_optionDisplayTopicCharts_default);
    if (!optionDisplayTopicCharts || !deboucledTopicStatsMap.hasAny() || !deboucledTopicStatsMap.anyValue((v) => v > 0)) return;

    const calcAverage = arr => arr.reduce((p, c) => p + c, 0) / arr.length;
    const average = Math.round(calcAverage([...deboucledTopicStatsMap.values()]));

    let html = '';
    html += '<div class="card card-jv-forum card-forum-margin" style="max-height: 130px;">';
    html += `<div class="card-header">TENDANCE DE FILTRAGE<span class="deboucled-card-header-right">Moyenne : ${average}</span></div>`;
    html += '<div class="card-body" style="max-height: 130px;">';
    html += '<div class="scrollable">';
    html += '<div class="scrollable-wrapper">';
    html += '<div id="deboucled-chart-content" class="scrollable-content bloc-info-forum">';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    let chart = document.createElement('div');
    document.querySelector('#forum-right-col').append(chart);
    chart.outerHTML = html;

    buildStatsChart();
}

function buildStatsChart() {

    function addChartStyles() {
        const css = GM_getResourceText('CHARTS_CSS');
        let html = '';
        html += `<style>${css}</style>`;
        html += `<style>#deboucled-stats-chart {--color-1: linear-gradient(rgba(240, 50, 50, 0.8), rgba(240, 50, 50, 0.3));} .data {font: bold 16px/0px sans-serif;color: #999999;height: 100%;text-align: center;white-space: nowrap;} .data-datetime {font-size: 11px;font-weight: normal;font-family: monospace;} .charts-css.area tbody tr th {width: 47px;font: bold 10px/10px sans-serif;color: #999999;} .charts-css.area:not(.reverse):not(.reverse-data) tbody tr td {-webkit-box-pack: center;-ms-flex-pack: center;justify-content: center;-webkit-box-align: center;-ms-flex-align: center;align-items: center;} .charts-css.area:not(.reverse):not(.reverse-data) tbody tr td .data {-webkit-transform: initial;transform: initial;}</style>`;
        return html;
    }
    function formatDateToGroup(d) {
        var dateOptions = { day: '2-digit', month: '2-digit', year: '2-digit' };
        return d.toLocaleDateString(undefined, dateOptions);
    }
    function formatDateToDisplay(d) {
        var timeOptions = { hour12: false, hour: '2-digit', minute: '2-digit' };
        return d.toLocaleTimeString(undefined, timeOptions);
    }
    function buildChartTableHtml() {
        const maxValues = 73;
        const selectedStats = [...deboucledTopicStatsMap].splice(Math.max(deboucledTopicStatsMap.size - maxValues, 0), maxValues);

        const statsWithDate = [...selectedStats].map(function (v) {
            let d = new Date(v[0]);
            return { key: formatDateToGroup(d), value: v[1], datetime: d };
        });
        const groupedByDate = groupBy(statsWithDate, 'key');

        let chartTableHtml = '';
        chartTableHtml += addChartStyles();
        chartTableHtml += '<table class="charts-css area show-data-on-hover show-labels" id="deboucled-stats-chart" style="width: 340px; height: 75px;">';

        chartTableHtml += '<thead>';
        for (const [rowKey, stats] of Object.entries(groupedByDate)) {
            chartTableHtml += `<th scope="col">${rowKey}</th>`;
        }
        chartTableHtml += '</thead>';

        const selectedValues = selectedStats.map((v) => v[1]);
        const coefValue = Math.max(...selectedValues) + 2;
        let previousValue = Math.max(selectedValues[0] - 1, 0);

        chartTableHtml += '<tbody>'
        for (const [rowKey, stats] of Object.entries(groupedByDate)) {
            let firstEntry = true;
            for (const [statKey, stat] of Object.entries(stats)) {
                chartTableHtml += `<tr${firstEntry ? '' : ' class="hide-label"'}>`;
                chartTableHtml += `<th scope="row">${rowKey}</th>`;
                chartTableHtml += `<td style="--start: ${previousValue / coefValue}; --size: ${stat.value / coefValue}">`;
                chartTableHtml += `<span class="data data-datetime">${formatDateToDisplay(stat.datetime)}</span>`;
                chartTableHtml += `<span class="data">${stat.value}</span>`;
                chartTableHtml += '</td>';
                chartTableHtml += '</tr>';
                previousValue = stat.value;
                firstEntry = false;
            }
        }
        chartTableHtml += '</tbody>';
        chartTableHtml += '</table>';
        return chartTableHtml;
    }
    function iframeOnLoad() {
        const iframeProcessed = document.querySelector('iframe#deboucled-iframe-chart').contentWindow.document.body;
        if (!iframeProcessed) return;
        const labels = iframeProcessed.querySelectorAll('tr:not(.hide-label) > th[scope="row"]');
        if (labels.length <= 1) return;
        for (let i = 0; i < labels.length - 1; i++) {
            let label = labels[i];
            let nextLabel = labels[i + 1];
            // Hide overlapped headers
            if (label.getBoundingClientRect().right > nextLabel.getBoundingClientRect().left) {
                label.parentElement.classList.toggle('hide-label', true);
            }
        }
    }

    const iframe = buildChartIframe(buildChartTableHtml(), iframeOnLoad);
    document.querySelector('#deboucled-chart-content').append(iframe);
}

function buildChartIframe(bodyHtml, onloadFunction) {
    let iframe = document.createElement('iframe');
    iframe.onload = onloadFunction;
    iframe.id = 'deboucled-iframe-chart';
    iframe.style = 'width: 100%; height: 100%;';
    iframe.border = 'none';
    iframe.scrolling = 'no';
    iframe.overflowY = 'hidden';
    iframe.margin = '0';
    iframe.srcdoc = bodyHtml;
    return iframe;
}

function updateTopicHiddenAtDate() {
    deboucledTopicStatsMap.set(Date.now(), hiddenTotalTopics);
    const maxElem = 100; // on ne garde que les 100 dernières stats
    if (deboucledTopicStatsMap.size > maxElem) {
        deboucledTopicStatsMap = new Map([...deboucledTopicStatsMap].slice(deboucledTopicStatsMap.size - maxElem));
    }
    GM_setValue(storage_TopicStats, JSON.stringify([...deboucledTopicStatsMap]));
}


///////////////////////////////////////////////////////////////////////////////////////
// TOPICS
///////////////////////////////////////////////////////////////////////////////////////

function getAllTopics(doc) {
    let allTopics = doc.querySelectorAll('.topic-list.topic-list-admin > li:not(.dfp__atf):not(.message)');
    return [...allTopics];
}

async function fillTopics(topics, optionAllowDisplayThreshold, optionDisplayThreshold) {
    let actualTopics = topics.length - hiddenTotalTopics - 1;
    let pageBrowse = 1;
    let filledTopics = [];

    const maxTopicCount = parseInt(GM_getValue(storage_optionMaxTopicCount, storage_optionMaxTopicCount_default));

    while (actualTopics < maxTopicCount && pageBrowse <= 10) {
        pageBrowse++;
        await getForumPageContent(pageBrowse).then((res) => {
            let nextDoc = domParser.parseFromString(res, 'text/html');
            let nextPageTopics = getAllTopics(nextDoc);

            nextPageTopics.slice(1).forEach(function (topic) {
                if (isTopicBlacklisted(topic, optionAllowDisplayThreshold, optionDisplayThreshold)) {
                    hiddenTotalTopics++;
                    return;
                }
                if (actualTopics < maxTopicCount && !topicExists(topics, topic)) {
                    addTopic(topic, topics);
                    actualTopics++;
                    filledTopics.push(topic);
                }
            });
        });
    }
    return filledTopics;
}

function createTopicListOverlay() {
    let topicTable = document.querySelector('.topic-list.topic-list-admin');
    if (!topicTable) return;

    topicTable.style.opacity = '0.3';

    const wrapperDiv = document.createElement('div');
    wrapperDiv.id = 'deboucled-topic-list-wrapper';
    topicTable.parentElement.insertBefore(wrapperDiv, topicTable);
    wrapperDiv.appendChild(topicTable);

    const overylayDiv = document.createElement('div');
    overylayDiv.className = 'deboucled-overlay active';
    wrapperDiv.appendChild(overylayDiv);

    const spinnerDiv = document.createElement('div');
    spinnerDiv.className = 'deboucled-overlay-spinner active';
    wrapperDiv.appendChild(spinnerDiv);
}

function toggleTopicOverlay(active) {
    document.querySelector('.deboucled-overlay').classList.toggle('active', active);
    document.querySelector('.deboucled-overlay-spinner').classList.toggle('active', active);
    document.querySelector('.topic-list.topic-list-admin').removeAttribute('style');
}

async function addTopicIdBlacklist(topicId, topicSubject, refreshTopicList) {
    if (!topicIdBlacklistMap.has(topicId)) {
        topicIdBlacklistMap.set(topicId, topicSubject);
        await saveStorage();

        if (!refreshTopicList) return;
        let topic = document.querySelector('[data-id="' + topicId + '"]');
        if (!topic) return;
        removeTopic(topic);
        hiddenTotalTopics++;
        updateTopicsHeader();
    }
}

function updateTopicsHeader() {
    //let optionDisplayTopicMatches = GM_getValue(storage_optionDisplayTopicMatches, storage_optionDisplayTopicMatches_default);
    //if (optionDisplayTopicMatches) return; // on n'affiche pas le nb de topics ignorés sur le header si le détail à droite est affiché.

    let subjectHeader = document.querySelector('.topic-head > span:nth-child(1)');
    subjectHeader.innerHTML = `SUJET<span class="deboucled-topic-subject">(${hiddenTotalTopics} ignoré${plural(hiddenTotalTopics)})</span>`;

    let lastMessageHeader = document.querySelector('.topic-head > span:nth-child(4)');
    lastMessageHeader.style.width = '5.3rem';
}

function removeTopic(element) {
    removeSiblingMessages(element);
    element.remove();
}

function removeSiblingMessages(element) {
    let sibling = element.nextElementSibling;
    while (sibling && sibling.classList.contains('message')) {
        const elemToRemove = sibling;
        sibling = sibling.nextElementSibling;
        elemToRemove.remove();
    }
}

function addTopic(element, topics) {
    if (!element.querySelector('.xXx.text-user.topic-author')) {
        // jvcare supprime le lien vers le profil et le lien dans la date du topic
        let topicAuthorSpan = element.children[1];
        let author = topicAuthorSpan.textContent.trim();
        topicAuthorSpan.outerHTML = `<a href="https://www.jeuxvideo.com/profil/${author.toLowerCase()}?mode=infos" target="_blank" class="xXx text-user topic-author">${author}</a>`;

        let topicDateSpan = element.children[3];
        let topicUrl = decryptJvCare(topicDateSpan.firstElementChild.className);
        let topicDate = topicDateSpan.firstElementChild.textContent.trim();
        topicDateSpan.innerHTML = `<a href="${topicUrl}" class="xXx lien-jv">${topicDate}</a>`;
    }
    document.querySelector('.topic-list.topic-list-admin').appendChild(element);
    topics.push(element); // on rajoute le nouveau topic à la liste en cours de remplissage pour éviter de le reprendre sur les pages suivantes
}

function topicExists(topics, element) {
    /*
    * Le temps de charger la page certains sujets peuvent se retrouver à la page précédente.
    * Cela peut provoquer des doublons à l'affichage.
    */
    let topicId = element.getAttribute('data-id');
    if (topicId === null) return false;
    return topics.some((elem) => elem.getAttribute('data-id') === topicId);
}

function getTopicMessageCount(element) {
    let messageCountElement = element.querySelector('.topic-count');
    return parseInt(messageCountElement?.textContent.trim() ?? "0");
}

function isTopicBlacklisted(element, optionAllowDisplayThreshold, optionDisplayThreshold) {
    if (!element.hasAttribute('data-id')) return true;

    let topicId = element.getAttribute('data-id');
    if (topicIdBlacklistMap.has(topicId) && topicId !== '67697509') {
        matchedTopics.set(topicIdBlacklistMap.get(topicId), 1);
        hiddenTopicsIds++;
        return true;
    }

    // Seuil d'affichage valable uniquement pour les BL sujets et auteurs
    if (optionAllowDisplayThreshold && getTopicMessageCount(element) >= optionDisplayThreshold) return false;

    let titleTag = element.querySelector('.lien-jv.topic-title');
    if (titleTag) {
        let title = titleTag.textContent;
        const subjectBlacklisted = isSubjectBlacklisted(title);
        if (subjectBlacklisted) {
            matchedSubjects.addArrayIncrement(subjectBlacklisted);
            hiddenSubjects++;
            return true;
        }
    }

    let authorTag = element.querySelector('.topic-author');
    if (authorTag) {
        let author = authorTag.textContent.trim();
        const authorBlacklisted = isAuthorBlacklisted(author);
        if (authorBlacklisted) {
            matchedAuthors.addArrayIncrement(authorBlacklisted);
            hiddenAuthors++;
            return true;
        }
    }

    return false;
}

function isSubjectBlacklisted(subject) {
    if (subjectBlacklistArray.length === 0) return false;
    return subject.normalizeDiacritic().match(subjectsBlacklistReg);
}

function isAuthorBlacklisted(author) {
    if (authorBlacklistArray.length === 0) return false;
    const authorL = author.toLowerCase();
    return authorL !== 'rand0max' && authorL.normalizeDiacritic().match(authorsBlacklistReg);
}

async function isTopicPoC(element, optionDetectPocMode) {
    if (!element.hasAttribute('data-id')) return false;
    let topicId = element.getAttribute('data-id');

    if (pocTopicMap.has(topicId)) {
        return pocTopicMap.get(topicId);
    }

    let titleElem = element.querySelector('.lien-jv.topic-title');
    if (!titleElem) return false;

    const title = titleElem.textContent.trim().normalizeDiacritic();
    const isTitlePocRegex = /(pos(t|te|tez|to|too|tou)(")?$)|(pos(t|te|tez).*ou.*(cancer|quand|kan))|paustaouk|postukhan|postookan|pose.*toucan/i;
    let isTitlePoc = isTitlePocRegex.test(title);

    if (optionDetectPocMode === 1 && !isTitlePoc) {
        // Inutile de continuer si le titre n'est pas détecté PoC et qu'on n'est pas en deep mode
        return false;
    }

    function topicCallback(r) {
        const doc = domParser.parseFromString(r, "text/html");

        const firstMessageElem = doc.querySelector('.txt-msg');
        const firstMessage = firstMessageElem.textContent.trim().toLowerCase().normalizeDiacritic();

        const isMessagePocRegex = /pos(t|te|tez) ou/i;
        const maladies = ['cancer', 'torsion', 'testiculaire', 'tumeur', 'cholera', 'sida', 'corona', 'coronavirus', 'covid', 'covid19', 'cerf', 'serf', 'phimosis', 'trisomie', 'diarrhee', 'charcot', 'lyme', 'avc', 'cirrhose', 'diabete', 'parkinson', 'alzheimer', 'mucoviscidose', 'lepre', 'tuberculose'];
        const isMessagePoc = isMessagePocRegex.test(firstMessage) || (isTitlePoc && maladies.some(s => firstMessage.includes(s)));

        pocTopicMap.set(topicId, isMessagePoc);

        return isMessagePoc;
    }

    const url = titleElem.getAttribute('href');

    let isPoc = await fetch(url).then(function (response) {
        if (!response.ok) throw Error(response.statusText);
        return response.text();
    }).then(function (r) {
        return topicCallback(r);
    }).catch(function (err) {
        console.warn(err);
        return false;
    });

    return isPoc;
}

function markTopicPoc(element) {
    let titleElem = element.querySelector('.lien-jv.topic-title');
    titleElem.innerHTML = '<span class="deboucled-title-poc">[PoC] </span>' + titleElem.innerHTML;
}

function addIgnoreButtons(topics) {
    let header = topics[0];
    let spanHead = document.createElement("span");
    spanHead.setAttribute('class', 'deboucled-topic-blacklist');
    spanHead.setAttribute('style', 'width: 1.75rem');
    header.appendChild(spanHead);

    topics.slice(1).forEach(function (topic) {
        let span = document.createElement('span');
        span.setAttribute('class', 'deboucled-topic-blacklist');
        let topicId = topic.getAttribute('data-id');
        let topicSubject = topic.querySelector('span:nth-child(1) > a:nth-child(2)').textContent.trim();
        let anchor = document.createElement('a');
        anchor.setAttribute('role', 'button');
        anchor.setAttribute('title', 'Blacklist le topic');
        anchor.setAttribute('class', 'deboucled-svg-forbidden-red');
        anchor.onclick = function () { addTopicIdBlacklist(topicId, topicSubject, true); refreshTopicIdKeys(); };
        anchor.innerHTML = '<svg viewBox="0 0 160 160" id="deboucled-forbidden-logo" class="deboucled-logo-forbidden"><use href="#forbiddenlogo"/></svg>';
        span.appendChild(anchor)
        topic.appendChild(span);
    });
}

function addPrevisualizeTopicEvent(topics) {

    function prepareMessagePreview(page) {
        let messagePreview = page.querySelector('.bloc-message-forum');
        messagePreview.querySelector('.bloc-options-msg').remove(); // remove buttons

        // JvCare
        const avatar = messagePreview.querySelector('.user-avatar-msg');
        if (avatar && avatar.hasAttribute('data-srcset') && avatar.hasAttribute('src')) {
            avatar.setAttribute('src', avatar.getAttribute('data-srcset'));
            avatar.removeAttribute('data-srcset');
        }
        messagePreview.querySelectorAll('.JvCare').forEach(function (m) {
            let anchor = document.createElement('a');
            anchor.setAttribute('target', '_blank');
            anchor.setAttribute('href', decryptJvCare(m.getAttribute('class')));
            anchor.className = m.className.split(' ').splice(2).join(' ');
            anchor.innerHTML = m.innerHTML;
            m.outerHTML = anchor.outerHTML;
        });

        const text = messagePreview.querySelector('.txt-msg.text-enrichi-forum');
        if (!text) return messagePreview;

        // Adjust text contrast for Dark Reader
        const preferDark = document.documentElement.getAttribute('data-darkreader-scheme');
        //window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (preferDark === 'dark') {
            text.classList.toggle('deboucled-preview-content-text-light', true);
        }
        else {
            text.classList.toggle('deboucled-preview-content-text-dark', true);
        }

        return messagePreview;
    }

    async function previewTopicCallback(topicUrl) {
        return await fetch(topicUrl).then(function (response) {
            if (!response.ok) throw Error(response.statusText);
            return response.text();
        }).then(function (r) {
            const html = domParser.parseFromString(r, 'text/html');
            return prepareMessagePreview(html);
        }).catch(function (err) {
            console.error(err);
            return null;
        });
    }

    async function onPreviewHover(topicUrl, previewDiv) {
        if (previewDiv.querySelector('.bloc-message-forum')) return;
        const topicContent = await previewTopicCallback(topicUrl);
        if (!topicContent) return;
        previewDiv.firstChild.remove();
        previewDiv.appendChild(topicContent);
    };

    topics.slice(1).forEach(function (topic) {
        let topicTitle = topic.querySelector('.topic-title');
        topicTitle.classList.add('deboucled-topic-title');

        let topicUrl = topicTitle.getAttribute('href');

        let anchor = document.createElement('a');
        anchor.setAttribute('href', topicUrl);
        anchor.setAttribute('class', 'deboucled-topic-preview-col');
        anchor.innerHTML = '<svg viewBox="0 0 30 30" id="deboucled-preview-logo" class="deboucled-logo-preview"><use href="#previewlogo"/></svg>';
        let topicImg = topic.querySelector('.topic-img');
        insertAfter(anchor, topicImg);

        let previewDiv = document.createElement('div');
        previewDiv.className = 'deboucled-preview-content bloc-message-forum';
        previewDiv.innerHTML = '<img class="deboucled-spinner" src="http://s3.noelshack.com/uploads/images/20188032684831_loading.gif" alt="Loading" />';
        previewDiv.onclick = function (e) { e.preventDefault(); }
        anchor.appendChild(previewDiv);

        anchor.onclick = () => onPreviewHover(topicUrl, previewDiv);
        anchor.onmouseenter = () => onPreviewHover(topicUrl, previewDiv);
    });
}

function addBlackTopicLogo(topics) {
    topics.slice(1).forEach(function (topic) {
        const topicImg = topic.querySelector('.topic-img');
        const topicCount = topic.querySelector('.topic-count');
        if (!topicImg || !topicCount) return;
        if (topicImg.title.toLowerCase() !== 'topic hot') return;
        const nbMessage = parseInt(topicCount.textContent);
        if (nbMessage < 100) return;
        let span = document.createElement('span');
        span.className = 'topic-img deboucled-topic-black-logo';
        insertAfter(span, topicImg);
        topicImg.remove();
    });
}

async function topicIsModerated(topicId) {
    async function isModerated(url) {
        return await fetch(url).then(function (response) {
            return response.status === 410;
        }).catch(function () {
            return false;
        });
    }
    let url42 = `/forums/42-1-${topicId}-1-0-1-0-topic.htm`;
    return await isModerated(url42);

    //if (await isModerated(url42)) return true;
    //let url1 = `/forums/1-1-${topicId}-1-0-1-0-topic.htm`;
    //return await isModerated(url1);
}

function removeUselessTags(topics) {
    const regex = /(\[?a+y+a+\]?|(\{|\[|\()+\w*alerte?\w*(\}|\]|\))+|alerte?)\s?:?/gi;
    topics.slice(1).forEach(function (topic) {
        const titleElem = topic.querySelector('.lien-jv.topic-title');
        let newTitle = titleElem.textContent.replace(regex, '').removeDoubleSpaces().trim().capitalize();
        titleElem.textContent = newTitle;
    });
}


///////////////////////////////////////////////////////////////////////////////////////
// MESSAGES
///////////////////////////////////////////////////////////////////////////////////////

function getAllMessages(doc) {
    let allMessages = doc.querySelectorAll('.conteneur-messages-pagi > div.bloc-message-forum');
    return [...allMessages];
}

function buildMessagesHeader() {
    if (hiddenMessages <= 0 || hiddenAuthorArray.length === 0) return;

    let ignoredMessageHeader = document.createElement('div');
    ignoredMessageHeader.id = 'deboucled-ignored-messages-header';
    ignoredMessageHeader.className = 'titre-bloc deboucled-ignored-messages';
    let pr = plural(hiddenMessages);
    ignoredMessageHeader.textContent = `${hiddenMessages} message${pr} ignoré${pr}`;

    let ignoredAuthors = document.createElement('span');
    ignoredAuthors.id = 'deboucled-ignored-messages-authors-header';
    ignoredAuthors.className = 'titre-bloc deboucled-messages-ignored-authors';
    ignoredAuthors.style.display = 'none';
    ignoredAuthors.textContent = [...hiddenAuthorArray].join(', ');

    let toggleIgnoredAuthors = document.createElement('a');
    toggleIgnoredAuthors.className = 'titre-bloc deboucled-toggle-ignored-authors';
    toggleIgnoredAuthors.setAttribute('role', 'button');
    toggleIgnoredAuthors.textContent = '(voir)';
    toggleIgnoredAuthors.onclick = function () {
        if (ignoredAuthors.style.display === 'inline') {
            ignoredAuthors.style.display = 'none';
            toggleIgnoredAuthors.textContent = '(voir)';
        }
        else {
            ignoredAuthors.style.display = 'inline';
            toggleIgnoredAuthors.textContent = '(cacher)';
        }
    };

    let paginationElement = document.querySelector('div.bloc-pagi-default');
    insertAfter(ignoredMessageHeader, paginationElement);
    ignoredMessageHeader.appendChild(toggleIgnoredAuthors);
    ignoredMessageHeader.appendChild(ignoredAuthors);
}

function updateMessagesHeader() {
    let ignoredMessageHeader = document.querySelector('#deboucled-ignored-messages-header');
    if (!ignoredMessageHeader) {
        buildMessagesHeader();
        return;
    }

    if (hiddenMessages <= 0 || hiddenAuthorArray.length === 0) {
        ignoredMessageHeader.style.display = 'none';
    }
    else {
        ignoredMessageHeader.removeAttribute('style');
        if (ignoredMessageHeader) {
            let pr = plural(hiddenMessages);
            ignoredMessageHeader.firstChild.textContent = `${hiddenMessages} message${pr} ignoré${pr}`;
        }

        let ignoredAuthors = document.querySelector('#deboucled-ignored-messages-authors-header');
        if (ignoredAuthors) {
            ignoredAuthors.textContent = [...hiddenAuthorArray].join(', ');
        }
    }
}

function removeMessage(element) {
    if (element.previousElementSibling) element.previousElementSibling.hidden = true;
    else if (element.nextElementSibling) element.nextElementSibling.hidden = true;
    element.hidden = true;
}

function upgradeJvcBlacklistButton(messageElement, author, optionShowJvcBlacklistButton) {
    let isSelf = messageElement.querySelector('span.picto-msg-croix') !== null;
    if (isSelf) return;

    let dbcBlacklistButton = document.createElement('span');
    dbcBlacklistButton.setAttribute('title', 'Blacklister avec Déboucled');
    dbcBlacklistButton.setAttribute('class', 'picto-msg-tronche deboucled-blacklist-author-button');
    dbcBlacklistButton.onclick = function () {
        addEntityBlacklist(authorBlacklistArray, author);
        refreshAuthorKeys()
        location.reload();
    };

    let jvcBlacklistButton = messageElement.querySelector('span.picto-msg-tronche');
    let logged = (jvcBlacklistButton !== null);
    if (logged) insertAfter(dbcBlacklistButton, jvcBlacklistButton);
    else messageElement.querySelector('div.bloc-options-msg').appendChild(dbcBlacklistButton);

    if (!optionShowJvcBlacklistButton && logged) jvcBlacklistButton.style.display = 'none';
}

function highlightBlacklistedAuthor(messageElement, authorElement) {
    let isSelf = messageElement.querySelector('span.picto-msg-croix');
    if (isSelf) return;
    authorElement.classList.toggle('deboucled-blacklisted', true);
}

function addBoucledAuthorButton(messageElement, author, optionBoucledUseJvarchive) {
    let backToForumElement = document.querySelector('div.group-two > a:nth-child(2)');
    if (backToForumElement === null) return;

    let mpBloc = messageElement.querySelector('div.bloc-mp-pseudo');
    if (mpBloc === null) return;

    let forumUrl = backToForumElement.getAttribute('href');
    let redirectUrl = `/recherche${forumUrl}?search_in_forum=${author}&type_search_in_forum=auteur_topic`;
    if (optionBoucledUseJvarchive) redirectUrl = `https://jvarchive.com/topic/recherche?search=${author}&searchType=auteur_topic_exact`;

    let boucledAuthorAnchor = document.createElement('a');
    boucledAuthorAnchor.setAttribute('class', 'xXx lien-jv deboucled-author-boucled-button deboucled-svg-spiral-gray');
    boucledAuthorAnchor.setAttribute('href', redirectUrl);
    boucledAuthorAnchor.setAttribute('target', '_blank');
    boucledAuthorAnchor.setAttribute('title', 'Pseudo complètement boucled ?');
    boucledAuthorAnchor.innerHTML = '<svg width="16px" viewBox="0 0 24 24" id="deboucled-spiral-logo"><use href="#spirallogo"/></svg></a>';

    insertAfter(boucledAuthorAnchor, mpBloc);
}

function handleJvChatAndTopicLive(optionHideMessages, optionBoucledUseJvarchive) {
    function handleLiveMessage(message, authorElement, upgradeMessage) {
        let author = authorElement.textContent.trim();
        if (isAuthorBlacklisted(author)) {
            if (optionHideMessages) {
                removeMessage(message);
                hiddenMessages++;
                hiddenAuthorArray.add(author);
            }
            else {
                highlightBlacklistedAuthor(message, authorElement);
                addBoucledAuthorButton(message, author, optionBoucledUseJvarchive);
            }
            updateMessagesHeader();
            saveTotalHidden();
        }
        else if (upgradeMessage) {
            let optionShowJvcBlacklistButton = GM_getValue(storage_optionShowJvcBlacklistButton, storage_optionShowJvcBlacklistButton_default);
            upgradeJvcBlacklistButton(message, author, optionShowJvcBlacklistButton);
            addBoucledAuthorButton(message, author, optionBoucledUseJvarchive);
        }
    }

    if (optionHideMessages) { // pour JvChat on ne changera pas le message de toute façon
        addEventListener('jvchat:newmessage', function (event) {
            let message = document.querySelector(`.jvchat-message[jvchat-id="${event.detail.id}"]`);
            let authorElem = message.querySelector('h5.jvchat-author');
            if (!authorElem) return;
            handleLiveMessage(message, authorElem, false);
        });
        addEventListener('jvchat:activation', function (event) {
            hiddenMessages = 0;
            hiddenAuthorArray.clear();
            updateMessagesHeader();
        });
    }

    addEventListener('topiclive:newmessage', function (event) {
        let message = document.querySelector(`.bloc-message-forum[data-id="${event.detail.id}"]`);
        if (!message) return;
        let authorElement = message.querySelector('a.bloc-pseudo-msg, span.bloc-pseudo-msg');
        if (!authorElement) return;
        let author = authorElement.textContent.trim();
        handleLiveMessage(message, author, true);
    });
}

function addMessageQuoteEvent() {
    function getAuthorFromCitationBtn(e) {
        return e.querySelector('.bloc-pseudo-msg.text-user').textContent.trim();
    }

    function getDateFromCitationBtn(e) {
        return e.querySelector('.bloc-date-msg').textContent.trim();
    }

    const textArea = document.querySelector('#message_topic');

    document.querySelectorAll('.picto-msg-quote').forEach(function (btn) {
        btn.addEventListener('click', (e) => {
            const parentHeader = btn.parentElement.parentElement;
            if (!parentHeader) return;
            setTimeout(() => {
                const author = getAuthorFromCitationBtn(parentHeader);
                const date = getDateFromCitationBtn(parentHeader);

                const regex = new RegExp(`> Le\\s+?${date}\\s+?:`);
                textArea.value = textArea.value.replace(regex, `> Le ${date} ${author} a écrit : `);
            }, 200);
        });
    });
}


///////////////////////////////////////////////////////////////////////////////////////
// SETTINGS
///////////////////////////////////////////////////////////////////////////////////////

function buildSettingsPage() {
    let bgView = document.createElement('div');
    bgView.setAttribute('id', 'deboucled-settings-bg-view');
    bgView.setAttribute('class', 'deboucled-settings-bg-view');
    bgView.innerHTML = '<div></div>';
    document.body.prepend(bgView);
    document.querySelector('#deboucled-settings-bg-view').style.display = 'none';

    function buildTooltip(hint, firstElem = false) {
        return `deboucled-data-tooltip="${hint}"${firstElem ? ' data-tooltip-location="bottom"' : ''}`;
    }
    function addStat(title, content) {
        let html = "";
        html += '<tr>';
        html += '<td style="text-align: right;">';
        html += `<span class="deboucled-stat-title">${title}</span>`;
        html += '</td>';
        html += '<td>';
        html += `<span class="deboucled-stat-value">${content}</span>`;
        html += '</td>';
        html += '</tr>';
        return html;
    }
    function addToggleOption(title, optionId, defaultValue, hint, enabled = true, isSubCell = false, firstElem = false) {
        let html = "";
        html += `<tr id="${optionId}-container"${enabled ? '' : 'class="deboucled-disabled"'}>`;
        html += `<td class="deboucled-td-left${isSubCell ? ' deboucled-option-table-subcell' : ''}" ${buildTooltip(hint, firstElem)}>${title}</td>`;
        html += '<td class="deboucled-td-right">';
        html += '<label class="deboucled-switch">';
        let checked = GM_getValue(optionId, defaultValue) ? 'checked' : '';
        html += `<input type="checkbox" id="${optionId}" ${checked}></input>`;
        html += '<span class="deboucled-toggle-slider round"></span>';
        html += '</label>';
        html += '</td>';
        html += '</tr>';
        return html;
    }
    function addRangeOption(title, optionId, defaultValue, minValue, maxValue, step, hint, enabled, isSubCell = false) {
        let html = "";
        html += `<tr id="${optionId}-container"${enabled ? '' : 'class="deboucled-disabled"'}>`;
        html += `<td class="deboucled-td-left${isSubCell ? ' deboucled-option-table-subcell' : ''}" ${buildTooltip(hint)}>${title}</td>`;
        html += '<td class="deboucled-td-right" style="padding-top: 7px;">';
        let value = parseInt(GM_getValue(optionId, defaultValue));
        html += `<input type="range" id="${optionId}" min="${minValue}" max="${maxValue}" value="${value}" step="${step}" class="deboucled-range-slider">`;
        html += `<span class="deboucled-range-title-value" id="${optionId}-value">${value}</span>`;
        html += '</tr>';
        return html;
    }
    function addDropdownOption(title, optionId, hint, defaultValue, values) {
        let html = "";
        html += '<tr>';
        html += `<td class="deboucled-td-left" ${buildTooltip(hint)} style="vertical-align: top;">${title}</td>`;
        html += '<td class="deboucled-td-right">';
        html += '<span class="deboucled-dropdown select">';
        html += `<select class="deboucled-dropdown" id="${optionId}">`;
        let selectedOption = GM_getValue(optionId, defaultValue);
        values.forEach(function (value, key) {
            let selected = selectedOption === key ? ' selected' : '';
            html += `<option class="deboucled-dropdown-option" value="${key}"${selected}>${value}</option>`;
        })
        html += '</select>';
        html += '</span>';
        html += '</td>';
        html += '</tr>';
        return html;
    }
    function addImportExportButtons() {
        let html = "";
        html += '<tr>';
        html += '<td class="deboucled-td-left" rowspan="2">Restaurer/sauvegarder les préférences</td>';
        html += '<td class="deboucled-td-left">';
        html += `<label for="deboucled-import-button" class="btn deboucled-button deboucled-setting-button">Restaurer</label>`;
        html += `<input type="file" accept="application/JSON" id="deboucled-import-button" style="display: none;"></input>`;
        html += `<span id="deboucled-export-button" class="btn deboucled-button deboucled-setting-button">Sauvegarder</span>`;
        html += `<span id="deboucled-import-tbl" class="btn deboucled-button deboucled-setting-button" style="min-width: 10rem;">Importer TotalBlacklist</span>`;
        html += '</td>';
        html += '<td class="deboucled-td-right" style="white-space: nowrap;">';
        html += `<span id="deboucled-impexp-message" class="deboucled-setting-impexp-message" style="display: block; text-align: center;">Restauration terminée</span>`;
        html += `<span id="deboucled-impexp-message" class="deboucled-setting-impexp-message">⚠ Veuillez rafraichir la page ⚠</span>`;
        html += '</td>';
        html += '</tr>';
        html += '<tr>';
        html += '<td class="deboucled-td-left">';
        html += '<label class="deboucled-switch little">';
        html += '<input type="checkbox" id="deboucled-impexp-blonly"></input>';
        html += '<span class="deboucled-toggle-slider little round"></span>';
        html += '</label>';
        html += `<span class="deboucled-toggle-title-right">Uniquement les blacklists</span>`;
        html += '</td>';
        html += '</tr>';
        return html;
    }

    function addOptionsSection(sectionIsActive) {
        let html = "";
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">OPTIONS</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-options-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';

        let jvcLogo = '<span class="deboucled-jvc-logo"></span>';
        html += `<a class="deboucled-about-link-jvc" href="https://www.jeuxvideo.com/forums/42-51-67697509-1-0-1-0-officiel-nouveau-script-deboucled-censure-les-topics-et-la-boucle-du-forum.htm" target="_blank" title="Topic officiel JVC">${jvcLogo}</a>`;

        let githubLogo = '<span class="deboucled-svg-github"><svg width="20px" viewBox="0 0 16 16" id="deboucled-github-logo"><use href="#githublogo"/></svg></span>';
        html += `<a class="deboucled-about-link-github" href="https://github.com/Rand0max/deboucled" target="_blank" title="Github Officiel Déboucled">${githubLogo}</a>`;

        html += `<span class="deboucled-about-version">v${deboucledVersion}</span>`;

        html += '<table class="deboucled-option-table">';

        html += addToggleOption('Cacher les messages des <span style="color: rgb(230, 0, 0)">pseudos blacklist</span>', storage_optionHideMessages, storage_optionHideMessages_default, 'Permet de masquer complètement les messages d\'un pseudo dans les topics.', undefined, undefined, true);

        let spiralLogo = '<span class="deboucled-svg-spiral-black"><svg width="16px" viewBox="0 2 24 24" id="deboucled-spiral-logo"><use href="#spirallogo"/></svg></span>';
        html += addToggleOption(`Utiliser <i>JvArchive</i> pour <i>Pseudo boucled</i> ${spiralLogo}`, storage_optionBoucledUseJvarchive, storage_optionBoucledUseJvarchive_default, 'Quand vous cliquez sur le bouton en spirale à côté du pseudo, un nouvel onglet sera ouvert avec la liste des topics soit avec JVC soit avec JvArchive.');

        html += addToggleOption('Autoriser l\'affichage du topic à partir d\'un seuil', storage_optionAllowDisplayThreshold, storage_optionAllowDisplayThreshold_default, 'Autoriser l\'affichage des topics même si le sujet est blacklist, à partir d\'un certain nombre de messages.');

        let allowDisplayThreshold = GM_getValue(storage_optionAllowDisplayThreshold, storage_optionAllowDisplayThreshold_default);
        html += addRangeOption('Nombre de messages minimum', storage_optionDisplayThreshold, storage_optionDisplayThreshold_default, 10, 1000, 10, 'Nombre de messages minimum dans le topic pour forcer l\'affichage.', allowDisplayThreshold, true);

        let pocLogo = '<span class="deboucled-poc-logo"></span>'
        html += addDropdownOption(`Protection contre les <i>PoC</i> ${pocLogo} <span style="opacity: 0.3;font-style: italic;font-size: xx-small;">(beta)</span>`,
            storage_optionDetectPocMode,
            'Protection contre les topics &quot;post ou cancer&quot; et les dérivés.\n• Désactivé : aucune protection\n• Mode simple (rapide) : recherche dans le contenu uniquement si le titre contient un indice\n• Mode approfondi (plus lent) : recherche systématiquement dans le contenu et le titre',
            storage_optionDetectPocMode_default,
            ['Désactivé', 'Mode simple', 'Mode approfondi ⚠']);

        html += addToggleOption('Effacer les <i>balises abusives</i> du titre des topics', storage_optionRemoveUselessTags, storage_optionRemoveUselessTags_default, 'Effacer du titre des topics les balises inutiles et répétitives comme [ALERTE], ou l\'usage abusif du &quot;AYA&quot; et ses dérivés.\n\nExemple : &quot;[ALERTE] cet exemple incroyable AYAAAA&quot; => &quot;Cet exemple incroyable&quot;');

        html += addRangeOption('Nombre de topics à afficher sur la page', storage_optionMaxTopicCount, storage_optionMaxTopicCount_default, defaultTopicCount, 50, 1, 'Nombre de topics à afficher sur la page (25 par défaut).', true, false);

        html += addImportExportButtons();

        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addCustomisationSection(sectionIsActive) {
        let html = "";
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">PERSONNALISATION</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-customisation-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';

        html += '<table class="deboucled-option-table">';

        let darkLogo = '<span class="deboucled-dark-logo"></span>'
        html += addToggleOption(`Utiliser le <i>thème sombre</i> ${darkLogo} pour Déboucled`, storage_optionEnableDarkTheme, storage_optionEnableDarkTheme_default, 'Permet de basculer entre le thème normal et le thème sombre pour le script Déboucled.', undefined, undefined, true);

        let forbiddenLogo = '<span class="deboucled-svg-forbidden-black"><svg viewBox="0 0 180 180" id="deboucled-forbidden-logo" class="deboucled-logo-forbidden"><use href="#forbiddenlogo"/></svg></span>';
        html += addToggleOption(`Afficher les boutons pour <i>Blacklist le topic</i> ${forbiddenLogo}`, storage_optionDisplayBlacklistTopicButton, storage_optionDisplayBlacklistTopicButton_default, 'Afficher ou non le bouton rouge à droite des sujets pour ignorer les topics souhaités.');

        let blackTopicLogo = '<span class="topic-img deboucled-topic-black-logo" style="display: inline-block; vertical-align: middle;"></span>'
        html += addToggleOption(`Afficher le pictogramme pour les <i>topics noirs</i> ${blackTopicLogo}`, storage_optionDisplayBlackTopic, storage_optionDisplayBlackTopic_default, 'Afficher les topics de plus de 100 messages avec le pictogramme noir (en plus du jaune, rouge, résolu, épinglé etc).');

        let previewLogo = '<span><svg width="16px" viewBox="0 0 30 30" id="deboucled-preview-logo"><use href="#previewlogo"/></svg></span>';
        html += addToggleOption(`Afficher les boutons pour avoir un <i>aperçu du topic</i> ${previewLogo}`, storage_optionPrevisualizeTopic, storage_optionPrevisualizeTopic_default, 'Afficher ou non l\'icone \'loupe\' à côté du sujet pour prévisualiser le topic au survol.');

        let blJvcLogo = '<span class="picto-msg-tronche deboucled-blacklist-jvc-button" style="width: 13px;height: 13px;background-size: 13px;"></span>'
        html += addToggleOption(`Afficher le bouton <i>Blacklist pseudo</i> ${blJvcLogo} de JVC`, storage_optionShowJvcBlacklistButton, storage_optionShowJvcBlacklistButton_default, 'Afficher ou non le bouton blacklist original de JVC à côté du nouveau bouton blacklist de Déboucled.');

        let matchesLogo = '<span class="deboucled-list-logo"></span>'
        html += addToggleOption(`Afficher les <i>détails du filtrage</i> ${matchesLogo} des topics`, storage_optionDisplayTopicMatches, storage_optionDisplayTopicMatches_default, 'Afficher ou non le tableau des détails de filtrage des topics sur la droite de la page.');

        let optionDisplayTopicMatches = GM_getValue(storage_optionDisplayTopicMatches, storage_optionDisplayTopicMatches_default);
        let eyeLogo = '<span class="deboucled-eye-logo"></span>'
        html += addToggleOption(`Cliquer sur l'oeil ${eyeLogo} pour <i>afficher les détails</i>`, storage_optionClickToShowTopicMatches, storage_optionClickToShowTopicMatches_default, 'Affiche par défaut l\'icone en oeil, nécéssite de cliquer pour afficher le détail du filtrage par catégorie.', optionDisplayTopicMatches, true);

        let statsLogo = '<span class="deboucled-chart-logo"></span>'
        html += addToggleOption(`Afficher la <i>tendance de filtrage</i> ${statsLogo} des topics`, storage_optionDisplayTopicCharts, storage_optionDisplayTopicCharts_default, 'Afficher ou non le graphique des tendances de filtrage de topics sur la droite de la page.');

        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addEntitySettingSection(entity, header, hint, messageHint, sectionIsActive) {
        let html = "";
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">${header}</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-${entity}-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<table class="deboucled-option-table-entities">';
        html += '<tr>';
        html += '<td>';
        html += `<input type="text" id="deboucled-${entity}-input-key" class="deboucled-input-key" placeholder="${hint}" >`;
        html += `<span id="deboucled-${entity}-input-button" class="btn deboucled-button deboucled-add-button">Ajouter</span>`;
        if (messageHint) html += `<span class="deboucled-entity-message-hint">${messageHint}</span>`;
        html += `<input type="search" id="deboucled-${entity}-search-key" class="deboucled-input-search" style="float: right;" placeholder="Rechercher..." >`;
        html += '</td>';
        html += '</tr>';
        html += '<td style="padding-top: 12px;padding-bottom: 0;">';
        html += `<a id="deboucled-${entity}-sortmode" class="deboucled-sort-button deboucled-sort-undefined-logo" role="button" title="Tri par défaut"></a>`;
        html += `<span id="deboucled-${entity}-entity-count" class="deboucled-entity-count"></span>`;
        html += '</td>';
        html += '<tr>';
        html += '<td colspan="2">';
        html += `<div id="deboucled-${entity}List" style="margin-top:10px;"></div>`;
        html += '</td>';
        html += '</tr>';
        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addStatsSection(sectionIsActive) {
        let html = "";
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">STATISTIQUES</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-options-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<table class="deboucled-option-table">';
        let totalHiddenSubjects = GM_getValue(storage_totalHiddenSubjects, '0');
        let totalHiddenAuthors = GM_getValue(storage_totalHiddenAuthors, '0');
        let totalHiddenTopicIds = GM_getValue(storage_totalHiddenTopicIds, '0');
        let totalHiddenMessages = GM_getValue(storage_totalHiddenMessages, '0');
        let totalHidden = parseInt(totalHiddenSubjects + totalHiddenAuthors + totalHiddenTopicIds + totalHiddenMessages);
        html += addStat('Sujets ignorés', totalHiddenSubjects);
        html += addStat('Pseudos ignorés', totalHiddenAuthors);
        html += addStat('Topics ignorés', totalHiddenTopicIds);
        html += addStat('Messages ignorés', totalHiddenMessages);
        html += addStat('Total ignorés', totalHidden);
        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }

    let settingsHtml = "";
    settingsHtml += addOptionsSection(false);
    settingsHtml += addCustomisationSection(false);
    settingsHtml += addEntitySettingSection(entitySubject, 'BLACKLIST SUJETS', 'Mot-clé', 'Utilisez le caractère étoile * pour remplacer n\'importe quelle expression.', true);
    settingsHtml += addEntitySettingSection(entityAuthor, 'BLACKLIST AUTEURS', 'Pseudo', undefined, false);
    settingsHtml += addEntitySettingSection(entityTopicId, 'BLACKLIST TOPICS', 'TopicId', undefined, false);
    settingsHtml += addStatsSection(false);

    let settingsView = document.createElement('div');
    settingsView.setAttribute('id', 'deboucled-settings-view');
    settingsView.setAttribute('class', 'deboucled-settings-view');
    settingsView.innerHTML = settingsHtml;
    document.body.prepend(settingsView);

    document.querySelector('.deboucled-about-version').onclick = () => alert('Paix sur la boucle nonobstant.');

    function addToggleEvent(id, callback = undefined) {
        const toggleSlider = document.querySelector('#' + id);
        toggleSlider.onchange = (e) => {
            const checked = e.currentTarget.checked;
            GM_setValue(id, checked);
            if (callback) callback(checked);
        };
    }
    function addRangeEvent(id) {
        const rangeSlider = document.querySelector('#' + id);
        rangeSlider.oninput = function () {
            GM_setValue(id, parseInt(this.value));
            document.querySelector(`#${id}-value`).innerHTML = this.value;
        };
    }
    function addSelectEvent(id) {
        const select = document.querySelector('#' + id);
        select.onchange = (e) => {
            GM_setValue(id, parseInt(e.currentTarget.value));
        };
    }

    addToggleEvent(storage_optionEnableDarkTheme, toggleDarkTheme);
    addToggleEvent(storage_optionHideMessages);
    addToggleEvent(storage_optionBoucledUseJvarchive);
    addToggleEvent(storage_optionDisplayBlacklistTopicButton);
    addToggleEvent(storage_optionDisplayBlackTopic);
    addToggleEvent(storage_optionPrevisualizeTopic);
    addToggleEvent(storage_optionShowJvcBlacklistButton);
    addToggleEvent(storage_optionDisplayTopicCharts);
    addToggleEvent(storage_optionDisplayTopicMatches, function () {
        document.querySelectorAll(`[id = ${storage_optionClickToShowTopicMatches}-container]`).forEach(function (el) {
            el.classList.toggle("deboucled-disabled");
        })
    });
    addToggleEvent(storage_optionClickToShowTopicMatches);
    addToggleEvent(storage_optionAllowDisplayThreshold, function () {
        document.querySelectorAll(`[id = ${storage_optionDisplayThreshold}-container]`).forEach(function (el) {
            el.classList.toggle("deboucled-disabled");
        })
    });
    addToggleEvent(storage_optionRemoveUselessTags);
    addRangeEvent(storage_optionDisplayThreshold);
    addRangeEvent(storage_optionMaxTopicCount);
    addSelectEvent(storage_optionDetectPocMode);

    addImportExportEvent();

    addCollapsibleEvents();

    buildSettingEntities();

    refreshEntityCounts();

    addHighlightModeratedButton();

    addSortEvent();
}

function addSortEvent() {
    function switchSortMode(sortModeEntity, element) {
        switch (sortModeEntity) {
            case 0:
                element.classList.toggle('deboucled-sort-undefined-logo', false);
                element.classList.toggle('deboucled-sort-alpha-logo', true);
                element.title = 'Tri par ordre alphabétique';
                return 1;
            case 1:
                element.classList.toggle('deboucled-sort-alpha-logo', false);
                element.classList.toggle('deboucled-sort-reversealpha-logo', true);
                element.title = 'Tri par ordre alphabétique inversé';
                return 2;
            case 2:
                element.classList.toggle('deboucled-sort-reversealpha-logo', false);
                element.classList.toggle('deboucled-sort-undefined-logo', true);
                element.title = 'Tri par défaut';
                return 0;
        }
    }
    document.querySelector(`#deboucled-${entitySubject}-sortmode`).onclick = function () {
        sortModeSubject = switchSortMode(sortModeSubject, this);
        refreshSubjectKeys();
    };
    document.querySelector(`#deboucled-${entityAuthor}-sortmode`).onclick = function () {
        sortModeAuthor = switchSortMode(sortModeAuthor, this);
        refreshAuthorKeys();
    };
    document.querySelector(`#deboucled-${entityTopicId}-sortmode`).onclick = function () {
        sortModeTopicId = switchSortMode(sortModeTopicId, this);
        refreshTopicIdKeys();
    };
}

function addImportExportEvent() {
    document.querySelector('#deboucled-export-button').onclick = () => backupStorage();
    document.querySelector('#deboucled-import-button').onchange = (fe) => loadFile(fe);
    document.querySelector('#deboucled-import-tbl').onclick = () => importFromTotalBlacklist();
}

function addCollapsibleEvents() {
    const activeClass = 'deboucled-collapsible-active';
    document.querySelectorAll('.deboucled-collapsible').forEach(function (el) {
        el.onclick = function () {
            // collapse every active panel
            document.querySelectorAll('.' + activeClass).forEach(function (activeEl) {
                if (activeEl === el) return;
                activeEl.classList.toggle(activeClass, false);
                var content = activeEl.nextElementSibling;
                content.removeAttribute('style');
            });

            // toggle current panel
            this.classList.toggle(activeClass);
            let content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.removeAttribute('style');
            }
            else {
                let view = document.querySelector('#deboucled-settings-view');
                view.style.overflowY = 'scroll';
                content.style.maxHeight = content.scrollHeight + 'px';
                view.removeAttribute('style');
            }
        };
    });
}

function buildSettingEntities() {
    //const regexAllowedSubject = /^[A-z0-9\u0020-\u007E\u00A1-\u02AF]*$/i;
    const regexAllowedSubject = /^[A-z0-9\u0020-\u007E\u2018-\u201F\u00A1-\u02AF\u{1F300}-\u{1FAD6}]*$/iu;
    const regexAllowedAuthor = /^[A-z\u00C0-\u02AF0-9-_\[\]\*]*$/iu;
    const regexAllowedTopicId = /^[0-9]+$/i;

    createAddEntityEvent(entitySubject, regexAllowedSubject, function (key) { addEntityBlacklist(subjectBlacklistArray, key); refreshSubjectKeys(); });
    createAddEntityEvent(entityAuthor, regexAllowedAuthor, function (key) { addEntityBlacklist(authorBlacklistArray, key); refreshAuthorKeys(); });
    createAddEntityEvent(entityTopicId, regexAllowedTopicId, function (key) { addTopicIdBlacklist(key, key, false); refreshTopicIdKeys(); });

    createSearchEntitiesEvent(entitySubject, regexAllowedSubject, refreshSubjectKeys);
    createSearchEntitiesEvent(entityAuthor, regexAllowedAuthor, refreshAuthorKeys);
    createSearchEntitiesEvent(entityTopicId, regexAllowedSubject, refreshTopicIdKeys); // On peut filter sur le titre du topic

    refreshSubjectKeys();
    refreshAuthorKeys();
    refreshTopicIdKeys();
}

function writeEntityKeys(entity, entries, filterCallback, removeCallback, entityClassCallback, sortCallback) {
    if (filterCallback) entries = filterCallback(entries);
    if (sortCallback) entries = sortCallback(entries);

    let html = '<ul class="deboucled-entity-list">';
    entries.forEach(function (value, key) {
        let cls = entityClassCallback ? entityClassCallback(key) : '';
        html += `<li class="deboucled-entity-key deboucled-entity-element${cls}" id="${key}"><input type="submit" class="deboucled-${entity}-button-delete-key" value="X">${value}</li>`;
    });
    html += '</ul>';
    document.querySelector(`#deboucled-${entity}List`).innerHTML = html;

    document.querySelectorAll(`.deboucled-${entity}-button-delete-key`).forEach(function (input) {
        input.onclick = function () { removeCallback(this.parentNode) };
    });
}

function refreshSubjectKeys(filter = null) {
    let sortCallback = null;
    switch (sortModeSubject) {
        case 1:
            sortCallback = (array) => array.sort();
            break;
        case 2:
            sortCallback = (array) => array.sort().reverse();
            break;
    }

    writeEntityKeys(
        entitySubject,
        [...subjectBlacklistArray],
        filter ? (array) => array.filter((value) => normalizeValue(value).includes(filter)) : null,
        async function (node) {
            await removeEntityBlacklist(subjectBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, ''));
            refreshSubjectKeys();
            refreshCollapsibleContentHeight(entitySubject);
            clearSearchInputs();
        },
        null,
        sortCallback
    );
}

function refreshAuthorKeys(filter = null) {
    let sortCallback = null;
    switch (sortModeAuthor) {
        case 1:
            sortCallback = (array) => array.sort();
            break;
        case 2:
            sortCallback = (array) => array.sort().reverse();
            break;
    }

    writeEntityKeys(
        entityAuthor,
        [...authorBlacklistArray],
        filter ? (array) => array.filter((value) => normalizeValue(value).includes(filter)) : null,
        async function (node) {
            await removeEntityBlacklist(authorBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, ''));
            refreshAuthorKeys();
            refreshCollapsibleContentHeight(entityAuthor);
            clearSearchInputs();
        },
        null,
        sortCallback
    );
}

function refreshTopicIdKeys(filter = null) {
    let sortCallback = null;
    switch (sortModeTopicId) {
        case 1:
            sortCallback = (map) => new Map([...map].sort((a, b) => String(a[1]).localeCompare(b[1])));
            break;
        case 2:
            sortCallback = (map) => new Map([...map].sort((a, b) => String(b[1]).localeCompare(a[1])));
            break;
    }

    writeEntityKeys(
        entityTopicId,
        new Map(topicIdBlacklistMap),
        filter ? (map) => new Map([...map].filter((value, key) => normalizeValue(value).includes(filter) || normalizeValue(key).includes(filter))) : null,
        async function (node) {
            await removeTopicIdBlacklist(node.getAttribute('id').replace(/<[^>]*>/g, ''));
            refreshTopicIdKeys();
            refreshCollapsibleContentHeight(entityTopicId);
            clearSearchInputs();
        },
        function (key) {
            return moderatedTopics.has(key) && moderatedTopics.get(key) ? ' deboucled-entity-moderated-key' : '';
        },
        sortCallback
    );
}

function keyIsAllowed(key, ctrlKey) {
    // Génial le JS qui gère même pas ça nativement :)
    if (key === 'Enter') return true;
    if (key === 'Backspace') return true;
    if (key === 'Delete') return true;
    if (key === 'Control') return true;
    if (key === 'Insert') return true;
    if (key === 'Alt') return true;
    if (key === 'AltGraph') return true;
    if (key === 'Shift') return true;
    if (key === 'CapsLock') return true;
    if (key === 'Home') return true;
    if (key === 'End') return true;
    if (key === 'ArrowLeft') return true;
    if (key === 'ArrowRight') return true;
    if (key === 'ArrowUp') return true;
    if (key === 'ArrowDown') return true;
    if (key === 'ArrowDown') return true;
    if (ctrlKey && (key === 'a' || key === 'c' || key === 'v' || key === 'x')) return true;
    return false;
}

function createAddEntityEvent(entity, keyRegex, addCallback) {
    function addEntity(entity, keyRegex, addCallback) {
        let input = document.querySelector(`#deboucled-${entity}-input-key`);
        let key = input.value;
        if (key === '' || !key.match(keyRegex)) return;
        addCallback(key);
        input.value = '';
        refreshCollapsibleContentHeight(entity);
    }

    document.querySelector(`#deboucled-${entity}-input-key`).onkeydown = function (event) {
        if (!keyIsAllowed(event.key, event.ctrlKey) && !event.key.match(keyRegex)) event.preventDefault();
        if (event.key !== "Enter") return;
        addEntity(entity, keyRegex, addCallback);
    };

    document.querySelector(`#deboucled-${entity}-input-button`).onclick = function () {
        addEntity(entity, keyRegex, addCallback);
    };
}

function createSearchEntitiesEvent(entity, keyRegex, refreshCallback) {
    document.querySelector(`#deboucled-${entity}-search-key`).onkeydown = function (event) {
        if (!keyIsAllowed(event.key, event.ctrlKey) && !event.key.match(keyRegex)) event.preventDefault();
    };
    document.querySelector(`#deboucled-${entity}-search-key`).oninput = function (event) {
        refreshCallback(normalizeValue(event.target.value));
        refreshCollapsibleContentHeight(entity);
    };
}

function refreshEntityCounts() {
    let subjectCount = document.querySelector(`#deboucled-${entitySubject}-entity-count`);
    if (subjectCount) subjectCount.textContent = `${subjectBlacklistArray.length} sujet${plural(subjectBlacklistArray.length)} blacklist`;

    let authorCount = document.querySelector(`#deboucled-${entityAuthor}-entity-count`);
    if (authorCount) authorCount.textContent = `${authorBlacklistArray.length} pseudo${plural(authorBlacklistArray.length)} blacklist`;

    let topicCount = document.querySelector(`#deboucled-${entityTopicId}-entity-count`)
    if (topicCount) topicCount.textContent = `${topicIdBlacklistMap.size} topic${plural(topicIdBlacklistMap.size)} blacklist`;
}

function refreshCollapsibleContentHeight(entity) {
    let content = document.querySelector(`#deboucled-${entity}-collapsible-content`);
    if (content) content.style.maxHeight = content.scrollHeight + 'px';
}

function addSettingButton(firstLaunch) {
    function createDeboucledButton() {
        let button = document.createElement('button');
        button.setAttribute('id', 'deboucled-option-button');
        button.setAttribute('class', `btn deboucled-button deboucled-option-button${firstLaunch ? ' blinking' : ''}`);
        button.innerHTML = 'Déboucled';
        return button;
    }
    const blocsPreRight = document.querySelectorAll('.bloc-pre-right');
    blocsPreRight.forEach(e => { e.prepend(createDeboucledButton()); });

    let optionOnclick = function (e) {
        e.preventDefault();
        clearEntityInputs();
        showSettings();
    };
    document.querySelectorAll('#deboucled-option-button').forEach(e => { e.onclick = optionOnclick });

    window.onclick = function (e) {
        if (!document.querySelector('#deboucled-settings-bg-view').contains(e.target)) return;
        hideSettings();
    };
    window.onkeydown = function (e) {
        if (!document.querySelector('#deboucled-settings-bg-view').contains(e.target) && e.key !== 'Escape') return;
        hideSettings();
    };
}

function addSearchFilterToggle() {
    let optionFilterResearch = GM_getValue(storage_optionFilterResearch, storage_optionFilterResearch_default);

    let toggleElem = document.createElement('label');
    toggleElem.className = 'deboucled-switch';
    toggleElem.style.marginBottom = '2px';
    toggleElem.title = 'Filter les résultats avec Déboucled';
    toggleElem.innerHTML = `<input type="checkbox" id="deboucled-search-filter-toggle" ${optionFilterResearch ? 'checked' : ''}><span class="deboucled-toggle-slider round red"></span>`;
    document.querySelector('.form-rech-forum').appendChild(toggleElem);

    document.querySelector('#deboucled-search-filter-toggle').onchange = (e) => {
        GM_setValue(storage_optionFilterResearch, e.currentTarget.checked);
        location.reload();
    };

    return optionFilterResearch;
}

function showSettings() {
    let bgView = document.querySelector('#deboucled-settings-bg-view');
    bgView.style.display = 'block'

    let view = document.querySelector('#deboucled-settings-view');
    view.classList.add('visible');
    view.clientWidth; // force display
    view.classList.add('active');
}

function hideSettings() {
    let bgView = document.querySelector('#deboucled-settings-bg-view');
    bgView.style.display = 'none';

    let view = document.querySelector('#deboucled-settings-view');
    view.classList.remove('active');
    setTimeout(() => view.classList.remove('visible'), 200); // wait transition (flemme d'utiliser l'event)
}

function clearEntityInputs() {
    document.querySelectorAll('.deboucled-input-key').forEach(el => { el.value = '' });
}

function clearSearchInputs() {
    document.querySelectorAll('.deboucled-input-search').forEach(el => { el.value = '' });
}

function addHighlightModeratedButton() {
    const buttonText = '410 ?';
    const buttonStopText = 'STOP';
    let anchor = document.createElement('a');
    anchor.className = 'titre-bloc deboucled-entity-moderated-button';
    anchor.setAttribute('role', 'button');
    anchor.innerHTML = buttonText;
    anchor.onclick = function () {
        if (this.textContent === buttonStopText) {
            stopHighlightModeratedTopics = true;
            this.innerHTML = buttonText;
        }
        else {
            this.innerHTML = `<b>${buttonStopText}</b>`;
            highlightModeratedTopics();
            stopHighlightModeratedTopics = false;
            this.innerHTML = buttonText;
        }
    };
    const labelCount = document.querySelector('#deboucled-topicid-entity-count');
    insertAfter(anchor, labelCount);
}

async function highlightModeratedTopics() {
    const entityRoot = document.querySelector('#deboucled-topicidList').firstElementChild;
    let entities = [...entityRoot.querySelectorAll('.deboucled-entity-key.deboucled-entity-element')];
    for (const entity of entities) {
        if (stopHighlightModeratedTopics) break;

        let key = entity.id;
        if (!moderatedTopics.has(key)) {
            entity.style.backgroundColor = '#69ceff70';
            let isModerated = await topicIsModerated(key);
            await sleep(500);
            entity.removeAttribute('style');
            moderatedTopics.set(key, isModerated);
        }
        entity.classList.toggle('deboucled-entity-moderated-key', moderatedTopics.get(key));
    }
}


///////////////////////////////////////////////////////////////////////////////////////
// MAIN PAGE
///////////////////////////////////////////////////////////////////////////////////////

function toggleDarkTheme(enabled) {
    document.body.classList.toggle('deboucled-dark-theme', enabled);
}

function addSvgs() {
    const spiralSvg = '<svg width="24px" viewBox="0 0 24 24" style="display: none;"><symbol id="spirallogo"><path d="M12.71,12.59a1,1,0,0,1-.71-.3,1,1,0,0,0-1.41,0,1,1,0,0,1-1.42,0,1,1,0,0,1,0-1.41,3.08,3.08,0,0,1,4.24,0,1,1,0,0,1,0,1.41A1,1,0,0,1,12.71,12.59Z"/><path d="M12.71,14a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42h0a1,1,0,0,1,1.41-1.41,2,2,0,0,1,0,2.83A1,1,0,0,1,12.71,14Z"/><path d="M9.88,16.83a1,1,0,0,1-.71-.29,4,4,0,0,1,0-5.66,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,2,2,0,0,0,0,2.83,1,1,0,0,1,0,1.42A1,1,0,0,1,9.88,16.83Z"/><path d="M12.71,18a5,5,0,0,1-3.54-1.46,1,1,0,1,1,1.42-1.42,3.07,3.07,0,0,0,4.24,0,1,1,0,0,1,1.41,0,1,1,0,0,1,0,1.42A5,5,0,0,1,12.71,18Z"/><path d="M15.54,16.83a1,1,0,0,1-.71-1.71,4,4,0,0,0,0-5.66,1,1,0,0,1,1.41-1.41,6,6,0,0,1,0,8.49A1,1,0,0,1,15.54,16.83Z"/><path d="M7.05,9.76a1,1,0,0,1-.71-1.71,7,7,0,0,1,9.9,0,1,1,0,1,1-1.41,1.41,5,5,0,0,0-7.07,0A1,1,0,0,1,7.05,9.76Z"/><path d="M7.05,19.66a1,1,0,0,1-.71-.3,8,8,0,0,1,0-11.31,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,6,6,0,0,0,0,8.49,1,1,0,0,1-.71,1.71Z"/><path d="M12.71,22a9,9,0,0,1-6.37-2.64,1,1,0,0,1,0-1.41,1,1,0,0,1,1.42,0,7,7,0,0,0,9.9,0,1,1,0,0,1,1.41,1.41A8.94,8.94,0,0,1,12.71,22Z"/><path d="M18.36,19.66a1,1,0,0,1-.7-.3,1,1,0,0,1,0-1.41,8,8,0,0,0,0-11.31,1,1,0,0,1,0-1.42,1,1,0,0,1,1.41,0,10,10,0,0,1,0,14.14A1,1,0,0,1,18.36,19.66Z"/><path d="M4.22,6.93a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42,11,11,0,0,1,15.56,0,1,1,0,0,1,0,1.42,1,1,0,0,1-1.41,0,9,9,0,0,0-12.73,0A1,1,0,0,1,4.22,6.93Z"/></symbol></svg>';
    addSvg(spiralSvg, '#forum-main-col');

    const forbiddenSvg = '<svg style="display: none;"><symbol id="forbiddenlogo"><g><ellipse stroke-width="20" ry="70" rx="70" cy="80" cx="80" /><line y2="37.39011" x2="122.60989" y1="122.60989" x1="37.39011" stroke-width="20" /></g></symbol></svg>';
    addSvg(forbiddenSvg, '#forum-main-col');

    const previewSvg = '<svg viewBox="0 0 30 30" width="30px" height="30px"><symbol id="previewlogo"><path fill="#b6c9d6" d="M2.931,28.5c-0.382,0-0.742-0.149-1.012-0.419c-0.558-0.558-0.558-1.466,0-2.024l14.007-13.353 l1.375,1.377L3.935,28.089C3.673,28.351,3.313,28.5,2.931,28.5z"/><path fill="#788b9c" d="M15.917,13.403l0.685,0.686L3.589,27.727C3.413,27.903,3.18,28,2.931,28 c-0.249,0-0.482-0.097-0.658-0.273c-0.363-0.363-0.363-0.953-0.017-1.3L15.917,13.403 M15.934,12.005L1.565,25.704 c-0.754,0.754-0.754,1.977,0,2.731C1.943,28.811,2.437,29,2.931,29c0.494,0,0.988-0.189,1.365-0.566L18,14.073L15.934,12.005 L15.934,12.005z"/><g><path fill="#d1edff" d="M19,20.5c-5.238,0-9.5-4.262-9.5-9.5s4.262-9.5,9.5-9.5s9.5,4.262,9.5,9.5S24.238,20.5,19,20.5z"/><path fill="#788b9c" d="M19,2c4.963,0,9,4.037,9,9s-4.037,9-9,9s-9-4.037-9-9S14.037,2,19,2 M19,1C13.477,1,9,5.477,9,11 s4.477,10,10,10s10-4.477,10-10S24.523,1,19,1L19,1z"/></g></symbol></svg>';
    addSvg(previewSvg, '#forum-main-col');

    const githubSvg = '<svg viewBox="0 0 16 16" height="32" width="32"><symbol id="githublogo"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></symbol></svg>';
    addSvg(githubSvg, '#forum-main-col');
}

function getCurrentPageType(url) {
    if (document.querySelector('.img-erreur') !== null) return 'error';

    let topicListRegex = /^\/forums\/0-[0-9]+-0-1-0-[0-9]+-0-.*\.htm$/i;
    if (url.match(topicListRegex)) return 'topiclist';

    let topicMessagesRegex = /^\/forums\/(42|1)-[0-9]+-[0-9]+-[0-9]+-0-1-0-.*\.htm$/i;
    if (url.match(topicMessagesRegex)) return 'topicmessages';

    let searchRegex = /^\/recherche\/forums\/0-[0-9]+-0-1-0-[0-9]+-0-.*/i;
    if (url.match(searchRegex)) return 'search';

    return 'unknown';
}

function getSearchType(urlSearch) {
    let searchRegex = /(\?search_in_forum=)(?<searchvalue>.*)(&type_search_in_forum=)(?<searchtype>.*)/i;
    let matches = searchRegex.exec(urlSearch);
    return matches.groups.searchtype.trim().toLowerCase();
}

async function getForumPageContent(page) {
    let urlRegex = /(\/forums\/0-[0-9]+-0-1-0-)(?<pageid>[0-9]+)(-0-.*)/i;

    let currentPath = window.location.pathname;
    let matches = urlRegex.exec(currentPath);
    var currentPageId = parseInt(matches.groups.pageid);

    let nextPageId = currentPageId + ((page - 1) * defaultTopicCount);
    let nextPageUrl = currentPath.replace(urlRegex, `$1${nextPageId}$3`);

    const response = await fetch(nextPageUrl);
    return await response.text();
}

async function handleTopicList(canFillTopics) {
    let topics = getAllTopics(document);
    if (topics.length === 0) return;

    let optionAllowDisplayThreshold = GM_getValue(storage_optionAllowDisplayThreshold, storage_optionAllowDisplayThreshold_default);
    let optionDisplayThreshold = GM_getValue(storage_optionDisplayThreshold, storage_optionDisplayThreshold_default);

    let topicsToRemove = [];
    let finalTopics = [];
    finalTopics.push(topics[0]); // header
    topics.slice(1).forEach(function (topic) {
        if (isTopicBlacklisted(topic, optionAllowDisplayThreshold, optionDisplayThreshold)) {
            topicsToRemove.push(topic);
            hiddenTotalTopics++;
        }
        else finalTopics.push(topic);
    });
    if (canFillTopics) {
        const filledTopics = await fillTopics(topics, optionAllowDisplayThreshold, optionDisplayThreshold);
        finalTopics = finalTopics.concat(filledTopics);
    }
    topicsToRemove.forEach(removeTopic);

    updateTopicsHeader();
    saveTotalHidden();
    if (canFillTopics) updateTopicHiddenAtDate();

    return finalTopics;
}

async function handleTopicListOptions(topics) {
    let optionDisplayBlacklistTopicButton = GM_getValue(storage_optionDisplayBlacklistTopicButton, storage_optionDisplayBlacklistTopicButton_default);
    if (optionDisplayBlacklistTopicButton) addIgnoreButtons(topics);

    let optionPrevisualizeTopic = GM_getValue(storage_optionPrevisualizeTopic, storage_optionPrevisualizeTopic_default);
    if (optionPrevisualizeTopic) addPrevisualizeTopicEvent(topics);

    let optionDisplayBlackTopic = GM_getValue(storage_optionDisplayBlackTopic, storage_optionDisplayBlackTopic_default);
    if (optionDisplayBlackTopic) addBlackTopicLogo(topics);

    let optionRemoveUselessTags = GM_getValue(storage_optionRemoveUselessTags, storage_optionRemoveUselessTags_default);
    if (optionRemoveUselessTags) removeUselessTags(topics);

    await handlePoc(topics);
}

async function handlePoc(finalTopics) {
    // 0 = désactivé ; 1 = recherche simple ; 2 = recherche approfondie
    let optionDetectPocMode = GM_getValue(storage_optionDetectPocMode, storage_optionDetectPocMode_default);
    if (optionDetectPocMode === 0) return;

    // On gère les PoC à la fin pour pas figer la page pendant le traitement
    await Promise.all(finalTopics.slice(1).map(async function (topic) {
        let poc = await isTopicPoC(topic, optionDetectPocMode);
        if (poc) markTopicPoc(topic);
    }));

    await saveLocalStorage();
}

function handleMessage(message, optionBoucledUseJvarchive, optionHideMessages) {
    let authorElement = message.querySelector('a.bloc-pseudo-msg, span.bloc-pseudo-msg');
    if (authorElement === null) return;
    let author = authorElement.textContent.trim();

    if (isAuthorBlacklisted(author)) {
        if (optionHideMessages) {
            removeMessage(message);
            hiddenMessages++;
            hiddenAuthorArray.add(author);
        }
        else {
            highlightBlacklistedAuthor(message, authorElement);
            addBoucledAuthorButton(message, author, optionBoucledUseJvarchive);
        }
    }
    else {
        let optionShowJvcBlacklistButton = GM_getValue(storage_optionShowJvcBlacklistButton, storage_optionShowJvcBlacklistButton_default);
        upgradeJvcBlacklistButton(message, author, optionShowJvcBlacklistButton);
        addBoucledAuthorButton(message, author, optionBoucledUseJvarchive);
    }
}

function handleTopicHeader() {
    let titleElement = document.querySelector('#bloc-title-forum');
    if (!titleElement) return;
    const subjectMatches = isSubjectBlacklisted(titleElement.textContent);
    if (!subjectMatches) return;
    function highlightMatch(titleElem, match) {
        let content = titleElem.innerHTML;
        const m = match.trim();
        const index = content.normalizeDiacritic().indexOf(m); // manip pour correctement remplacer les mots avec des accents
        const realMatch = content.slice(index, index + m.length);
        content = `${content.slice(0, index)}<span class="deboucled-blacklisted">${realMatch}</span>${content.slice(index + m.length, content.length)}`;
        titleElem.innerHTML = content;
    }
    subjectMatches.forEach(m => highlightMatch(titleElement, m));
}

function handleTopicMessages() {
    let optionHideMessages = GM_getValue(storage_optionHideMessages, storage_optionHideMessages_default);
    let optionBoucledUseJvarchive = GM_getValue(storage_optionBoucledUseJvarchive, storage_optionBoucledUseJvarchive_default);

    handleTopicHeader();

    handleJvChatAndTopicLive(optionHideMessages, optionBoucledUseJvarchive);

    let allMessages = getAllMessages(document);
    allMessages.forEach(function (message) {
        handleMessage(message, optionBoucledUseJvarchive, optionHideMessages);
    });

    buildMessagesHeader();
    saveTotalHidden();
    addMessageQuoteEvent();
}

async function handleSearch() {
    let optionFilterResearch = addSearchFilterToggle();
    if (optionFilterResearch) await handleTopicList(false);

    let topics = getAllTopics(document);
    if (topics.length === 0) return;
    await handleTopicListOptions(topics);
}

function handleError() {
    let homepageButton = document.querySelector('.btn-secondary');
    if (!homepageButton) return;

    const forumRegex = /^\/forums\/(42|1)-(?<forumid>[0-9]+)-[0-9]+-[0-9]+-0-1-0-.*\.htm$/i;
    const currentUrl = window.location.pathname;
    const matches = forumRegex.exec(currentUrl);
    if (!matches) return;

    const forumId = parseInt(matches.groups.forumid.trim());
    const forumUrl = `/forums/0-${forumId}-0-1-0-1-0-forum.htm`;

    homepageButton.textContent = 'Retour au forum';
    homepageButton.href = forumUrl;

    let jvArchiveButton = document.createElement('a');
    jvArchiveButton.className = 'btn btn-primary';
    jvArchiveButton.href = `https://jvarchive.com${window.location.pathname.slice(0, -4)}`;
    jvArchiveButton.alt = 'JvArchive';
    jvArchiveButton.target = '_blank';
    jvArchiveButton.style.marginLeft = '15px';
    jvArchiveButton.textContent = 'Consulter JvArchive';

    insertAfter(jvArchiveButton, homepageButton);
}

async function init(isTopicMessages = false) {
    let firstLaunch = await initStorage();
    addCss();
    addSvgs();
    const enableDarkTheme = GM_getValue(storage_optionEnableDarkTheme, storage_optionEnableDarkTheme_default);
    toggleDarkTheme(enableDarkTheme);
    buildSettingsPage();
    addSettingButton(firstLaunch);
}

async function callMe() {
    let currentPageType = getCurrentPageType(window.location.pathname);
    switch (currentPageType) {
        case 'topiclist': {
            await init();
            createTopicListOverlay();
            const finalTopics = await handleTopicList(true);
            await handleTopicListOptions(finalTopics);
            addRightBlocMatches();
            addRightBlocStats();
            toggleTopicOverlay(false);
            break;
        }
        case 'topicmessages': {
            await init(true);
            handleTopicMessages();
            break;
        }
        case 'search': {
            await init();
            await handleSearch();
            break;
        }
        case 'error': {
            handleError();
            break;
        }
        default:
            break;
    }
}

callMe();

addEventListener('instantclick:newpage', callMe);
