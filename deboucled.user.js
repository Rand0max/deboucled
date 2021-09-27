// ==UserScript==
// @name        Déboucled
// @namespace   deboucledjvcom
// @version     1.6.4
// @downloadURL https://github.com/Rand0max/deboucled/raw/master/deboucled.user.js
// @updateURL   https://github.com/Rand0max/deboucled/raw/master/deboucled.meta.js
// @author      Rand0max
// @description Censure les topics eclatax et vous sort de la boucle
// @include     http://www.jeuxvideo.com/forums/*
// @include     https://www.jeuxvideo.com/forums/*
// @include     http://m.jeuxvideo.com/forums/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_getResourceText
// @resource    DEBOUCLED_CSS https://raw.githubusercontent.com/Rand0max/deboucled/master/deboucled.css
// ==/UserScript==

/*
* todo : "Handle mp and stickers" : handle blacklist for mp and stickers in messages
* todo : "Hiding mode option" : show blacklisted elements in red (not hidden) or in light gray (?)
* todo : "Wildcard subject" : use wildcard for subjects blacklist
* todo : "Reversed/Highlight option" : highlight elements of interest
* todo : "Zap mode" : select author/word directly in the main page to blacklist
* todo : "Backup & Restore" : allow user to backup and restore settings with json file
*/


///////////////////////////////////////////////////////////////////////////////////////
// VARIABLES
///////////////////////////////////////////////////////////////////////////////////////

let subjectBlacklistArray = [];
let authorBlacklistArray = [];
let topicIdBlacklistMap = new Map();
let subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
let authorsBlacklistReg = makeRegex(authorBlacklistArray, false);

let hiddenTotalTopics = 0;
let hiddenSubjects = 0;
let hiddenTopicsIds = 0;
let hiddenMessages = 0;
let hiddenAuthors = 0;
let hiddenAuthorArray = new Set();

const deboucledVersion = '1.6.4'
const topicByPage = 25;

const entitySubject = 'subject';
const entityAuthor = 'author';
const entityTopicId = 'topicid';


///////////////////////////////////////////////////////////////////////////////////////
// STORAGE
///////////////////////////////////////////////////////////////////////////////////////

const storage_init = 'deboucled_init';
const storage_blacklistedTopicIds = 'deboucled_blacklistedTopicIds';
const storage_blacklistedSubjects = 'deboucled_blacklistedSubjects';
const storage_blacklistedAuthors = 'deboucled_blacklistedAuthors';
const storage_optionBoucledUseJvarchive = 'deboucled_optionBoucledUseJvarchive';
const storage_optionHideMessages = 'deboucled_optionHideMessages';
const storage_optionAllowDisplayThreshold = 'deboucled_optionAllowDisplayThreshold';
const storage_optionDisplayThreshold = 'deboucled_optionDisplayThreshold';
const storage_optionDisplayBlacklistTopicButton = 'deboucled_optionDisplayBlacklistTopicButton';
const storage_totalHiddenTopicIds = 'deboucled_totalHiddenTopicIds';
const storage_totalHiddenSubjects = 'deboucled_totalHiddenSubjects';
const storage_totalHiddenAuthors = 'deboucled_totalHiddenAuthors';
const storage_totalHiddenMessages = 'deboucled_totalHiddenMessages';


function initStorage() {
    if (GM_getValue(storage_init, false)) {
        loadFromStorage();
        return false;
    }
    else {
        saveToStorage();
        GM_setValue(storage_init, true);
        return true;
    }
}

function loadFromStorage() {
    subjectBlacklistArray = [...new Set(subjectBlacklistArray.concat(JSON.parse(GM_getValue(storage_blacklistedSubjects))))];
    authorBlacklistArray = [...new Set(authorBlacklistArray.concat(JSON.parse(GM_getValue(storage_blacklistedAuthors))))];
    topicIdBlacklistMap = new Map([...topicIdBlacklistMap, ...JSON.parse(GM_getValue(storage_blacklistedTopicIds))]);

    subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
    authorsBlacklistReg = makeRegex(authorBlacklistArray, false);

    saveToStorage();
}

function saveToStorage() {
    GM_setValue(storage_blacklistedSubjects, JSON.stringify([...new Set(subjectBlacklistArray)]));
    GM_setValue(storage_blacklistedAuthors, JSON.stringify([...new Set(authorBlacklistArray)]));
    GM_setValue(storage_blacklistedTopicIds, JSON.stringify([...topicIdBlacklistMap]));

    subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
    authorsBlacklistReg = makeRegex(authorBlacklistArray, false);

    refreshEntityCounts();
}

function removeTopicIdBlacklist(topicId) {
    if (topicIdBlacklistMap.has(topicId)) {
        topicIdBlacklistMap.delete(topicId);
        saveToStorage();
    }
}

function addEntityBlacklist(array, key) {
    if (array.indexOf(key) === -1) {
        array.push(key);
        saveToStorage();
    }
}

function removeEntityBlacklist(array, key) {
    let index = array.indexOf(key);
    if (index > -1) {
        array.splice(index, 1);
        saveToStorage();
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


///////////////////////////////////////////////////////////////////////////////////////
// EXTENSIONS
///////////////////////////////////////////////////////////////////////////////////////

if (typeof String.prototype.normalizeDiacritic !== "function") {
    String.prototype.normalizeDiacritic = function () {
        return this.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    };
}

if (typeof String.prototype.escapeRegexPattern !== "function") {
    String.prototype.escapeRegexPattern = function () {
        return this.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    };
}

function makeRegex(array, withBoundaries) {
    let map = withBoundaries
        ? array.map((e) => `\\b${e.escapeRegexPattern().normalizeDiacritic()}\\b`)
        : array.map((e) => e.escapeRegexPattern().normalizeDiacritic());
    let regex = map.join('|');
    return new RegExp(regex, 'gi');
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function isPlural(nb) {
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


///////////////////////////////////////////////////////////////////////////////////////
// TOPICS
///////////////////////////////////////////////////////////////////////////////////////

function getAllTopics(doc) {
    let allTopics = doc.querySelectorAll('.topic-list.topic-list-admin > li:not(.dfp__atf)');
    return [...allTopics];
}

function addTopicIdBlacklist(topicId, topicSubject, refreshTopicList) {
    if (!topicIdBlacklistMap.has(topicId)) {
        topicIdBlacklistMap.set(topicId, topicSubject);
        saveToStorage();
        if (refreshTopicList) {
            let topic = document.querySelector('[data-id="' + topicId + '"]');
            if (topic === undefined) return;
            removeTopic(topic);
            updateTopicsHeader();
        }
    }
}

async function fillTopics(topics) {
    let actualTopics = topics.length - hiddenTotalTopics - 1;
    let pageBrowse = 1;
    let domParser = new DOMParser();

    while (actualTopics < topicByPage && pageBrowse <= 10) {
        pageBrowse++;
        await getPageContent(pageBrowse).then((res) => {
            let nextDoc = domParser.parseFromString(res, "text/html");
            let nextPageTopics = getAllTopics(nextDoc);

            nextPageTopics.slice(1).forEach(function (topic) {
                if (isTopicBlacklisted(topic)) {
                    hiddenTotalTopics++;
                    return;
                }
                if (actualTopics < topicByPage && !topicExists(topics, topic)) {
                    addTopic(topic);
                    actualTopics++;
                }
            });
        });
    }
}

function updateTopicsHeader() {
    let subjectHeader = document.querySelector('.topic-head > span:nth-child(1)');
    subjectHeader.textContent = `SUJET (${hiddenTotalTopics} ignoré${isPlural(hiddenTotalTopics)})`;

    let lastMessageHeader = document.querySelector('.topic-head > span:nth-child(4)');
    lastMessageHeader.style.width = '5.3rem';
}

function removeTopic(element) {
    element.remove();
    hiddenTotalTopics++;
}

function addTopic(element) {
    if (element.getElementsByClassName("xXx text-user topic-author").length === 0) // jvcare
    {
        let topicAuthorSpan = element.children[1];
        let author = topicAuthorSpan.textContent.trim();
        topicAuthorSpan.outerHTML = `<a href="https://www.jeuxvideo.com/profil/${author.toLowerCase()}?mode=infos" target="_blank" class="xXx text-user topic-author">${author}</a>`;

        let topicDateSpan = element.children[3];
        let topicUrl = element.children[0].lastElementChild.getAttribute('href').trim();
        let topicDate = topicDateSpan.firstElementChild.textContent.trim();
        topicDateSpan.innerHTML = `<a href="${topicUrl}" class="xXx lien-jv">${topicDate}</a>`;
    }
    document.getElementsByClassName("topic-list topic-list-admin")[0].appendChild(element);
}

function topicExists(topics, element) {
    /*
    * Le temps de charger la page certains sujets peuvent se retrouver à la page précédente.
    * Cela peut provoquer des doublons à l'affichage.
    */
    let topicId = element.getAttribute("data-id");
    if (topicId === null) return false;
    return topics.some((elem) => elem.getAttribute("data-id") === topicId);
}

function getTopicMessageCount(element) {
    let messageCountElement = element.querySelector('.topic-count');
    return parseInt(messageCountElement?.textContent.trim() ?? "0");
}

function isTopicBlacklisted(element, optionAllowDisplayThreshold, optionDisplayThreshold) {
    if (!element.hasAttribute('data-id')) return true;

    let topicId = element.getAttribute('data-id');
    if (topicIdBlacklistMap.has(topicId)) {
        hiddenTopicsIds++;
        return true;
    }

    if (optionAllowDisplayThreshold && getTopicMessageCount(element) >= optionDisplayThreshold) return false;

    let titleTag = element.getElementsByClassName("lien-jv topic-title");
    if (titleTag !== undefined && titleTag.length > 0) {
        let title = titleTag[0].textContent;
        if (isSubjectBlacklisted(title)) {
            hiddenSubjects++;
            return true;
        }
    }

    let authorTag = element.getElementsByClassName("topic-author");
    if (authorTag !== undefined && authorTag.length > 0) {
        let author = authorTag[0].textContent.trim();
        if (isAuthorBlacklisted(author)) {
            hiddenAuthors++;
            return true;
        }
    }

    return false;
}

function isSubjectBlacklisted(subject) {
    if (subjectBlacklistArray.length === 0) return false;
    return subject.match(subjectsBlacklistReg);
}

function isAuthorBlacklisted(author) {
    if (authorBlacklistArray.length === 0) return false;
    return author.match(authorsBlacklistReg);
}


///////////////////////////////////////////////////////////////////////////////////////
// MESSAGES
///////////////////////////////////////////////////////////////////////////////////////

function getAllMessages(doc) {
    let allMessages = doc.querySelectorAll('.conteneur-messages-pagi > div.bloc-message-forum');
    return [...allMessages];
}

function updateMessagesHeader() {
    if (hiddenMessages <= 0) return;
    let paginationElement = document.querySelector('div.bloc-pagi-default');

    let ignoredMessageHeader = document.createElement('div');
    ignoredMessageHeader.setAttribute('class', 'titre-bloc deboucled-ignored-messages');
    let pr = isPlural(hiddenMessages);
    ignoredMessageHeader.textContent = `${hiddenMessages} message${pr} ignoré${pr}`;

    let ignoredAuthors = document.createElement('span');
    ignoredAuthors.setAttribute('class', 'titre-bloc deboucled-messages-ignored-authors');
    ignoredAuthors.style.display = 'none';
    ignoredAuthors.textContent = [...hiddenAuthorArray].join(', ');

    let toggleIgnoredAuthors = document.createElement('a');
    toggleIgnoredAuthors.setAttribute('class', 'titre-bloc deboucled-toggle-ignored-authors');
    toggleIgnoredAuthors.setAttribute('href', '#');
    toggleIgnoredAuthors.textContent = '(voir)';
    toggleIgnoredAuthors.addEventListener('click', function (e) {
        if (ignoredAuthors.style.display === 'inline') {
            ignoredAuthors.style.display = 'none';
            toggleIgnoredAuthors.textContent = '(voir)';
        }
        else {
            ignoredAuthors.style.display = 'inline';
            toggleIgnoredAuthors.textContent = '(cacher)';
        }
    });

    insertAfter(ignoredMessageHeader, paginationElement);
    ignoredMessageHeader.appendChild(toggleIgnoredAuthors);
    ignoredMessageHeader.appendChild(ignoredAuthors);
}

function removeMessage(element) {
    element.previousElementSibling.remove();
    element.remove();
}

function upgradeJvcBlacklistButton(messageElement, author) {
    let isSelf = messageElement.querySelector('span.picto-msg-croix') !== null;
    if (isSelf) return;

    let blacklistButton = messageElement.querySelector('span.picto-msg-tronche');
    let mustRefresh = (blacklistButton === null);

    if (mustRefresh) {
        blacklistButton = document.createElement('span');
        messageElement.querySelector('div.bloc-options-msg').appendChild(blacklistButton);
    }

    blacklistButton.setAttribute('title', 'Blacklister avec Déboucled');
    blacklistButton.setAttribute('class', 'picto-msg-tronche deboucled-blacklist-author-button');

    blacklistButton.addEventListener('click', function () {
        addEntityBlacklist(authorBlacklistArray, author);
        refreshAuthorKeys()
        if (mustRefresh) location.reload();
    });
}

function highlightBlacklistedAuthor(messageElement, authorElement) {
    let isSelf = messageElement.querySelector('span.picto-msg-croix') !== null;
    if (isSelf) return;
    authorElement.style.color = 'rgb(230, 0, 0)';
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
    boucledAuthorAnchor.setAttribute('class', 'xXx lien-jv deboucled-author-boucled-button');
    boucledAuthorAnchor.setAttribute('href', redirectUrl);
    boucledAuthorAnchor.setAttribute('target', '_blank');
    boucledAuthorAnchor.setAttribute('title', 'Pseudo complètement boucled ?');
    boucledAuthorAnchor.innerHTML = '<svg width="16px" viewBox="0 0 24 24"><use href="#spirallogo"/></svg></a>';

    insertAfter(boucledAuthorAnchor, mpBloc);
}


///////////////////////////////////////////////////////////////////////////////////////
// SETTINGS
///////////////////////////////////////////////////////////////////////////////////////

function buildSettingPage() {
    let bgView = document.createElement('div');
    bgView.setAttribute("id", "deboucled-settings-bg-view");
    bgView.setAttribute("class", "deboucled-settings-bg-view");
    bgView.innerHTML = '<div></div>';
    document.body.prepend(bgView);
    document.getElementById('deboucled-settings-bg-view').style.display = 'none';

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
    function addToggleOption(title, optionId, defaultValue) {
        let html = "";
        html += '<tr>';
        html += `<td>${title}</td>`;
        html += '<td>';
        html += '<label class="deboucled-switch">';
        let checked = GM_getValue(optionId, defaultValue) ? 'checked' : '';
        html += `<input type="checkbox" id="${optionId}" ${checked}>`;
        html += '<span class="deboucled-toggle-slider round"></span>';
        html += '</label>';
        html += '</td>';
        html += '</tr>';
        return html;
    }
    function addRangeOption(title, optionId, defaultValue, minValue, maxValue, enabled) {
        let html = "";
        html += `<tr id="${optionId}-container" class="${enabled ? '' : 'deboucled-disabled'}">`;
        html += `<td>${title}</td>`;
        html += '<td class="deboucled-option-cell deboucled-option-table-subcell">';
        let value = GM_getValue(optionId, defaultValue);
        html += `<input type="range" id="${optionId}" min="${minValue}" max="${maxValue}" value="${value}" step="10" class="deboucled-range-slider">`;
        html += '</div>';
        html += '<td>';
        html += `<span id="${optionId}-value">${value}</span>`;
        html += '</td>';
        html += '</tr>';
        return html;
    }

    function addEntitySettingSection(entity, header, hint, sectionIsActive) {
        let html = "";
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">${header}</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-${entity}-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<table class="deboucled-option-table-entities">';
        html += '<tr>';
        html += '<td>';
        html += `<input type="text" id="deboucled-${entity}-input-key" class="deboucled-input-key" placeholder="${hint}" >`;
        html += `<span id="deboucled-${entity}-input-button" class="btn btn-actu-new-list-forum deboucled-add-button">Ajouter</span>`;
        html += `<input type="search" id="deboucled-${entity}-search-key" class="deboucled-input-search" style="float: right;" placeholder="Rechercher..." >`;
        html += '</td>';
        html += '</tr>';
        html += '<td style="padding-top: 12px;padding-bottom: 0;">';
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
    function addOptionsSection(sectionIsActive) {
        let html = "";
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">OPTIONS</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-options-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += `<span class="deboucled-version">v${deboucledVersion}</span>`;
        html += '<table class="deboucled-option-table">';
        html += addToggleOption('Utiliser JvArchive pour "Pseudo boucled"', storage_optionBoucledUseJvarchive, false);
        html += addToggleOption('Cacher les messages des pseudos blacklist', storage_optionHideMessages, true);
        html += addToggleOption('Afficher les boutons "Blacklist le topic"', storage_optionDisplayBlacklistTopicButton, true);
        html += addToggleOption('Autoriser l\'affichage du topic à partir d\'un seuil', storage_optionAllowDisplayThreshold, false);
        let allowDisplayThreshold = GM_getValue(storage_optionAllowDisplayThreshold, false);
        html += addRangeOption('Nombre de messages minimum', storage_optionDisplayThreshold, 100, 10, 1000, allowDisplayThreshold);
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
    settingsHtml += addEntitySettingSection(entitySubject, 'BLACKLIST SUJETS', 'Mot-clé', true);
    settingsHtml += addEntitySettingSection(entityAuthor, 'BLACKLIST AUTEURS', 'Pseudo', false);
    settingsHtml += addEntitySettingSection(entityTopicId, 'BLACKLIST TOPICS', 'TopicId', false);
    settingsHtml += addStatsSection(false);

    let settingsView = document.createElement('div');
    settingsView.setAttribute("id", "deboucled-settings-view");
    settingsView.setAttribute('class', 'deboucled-settings-view');
    settingsView.innerHTML = settingsHtml;
    document.body.prepend(settingsView);
    document.getElementById('deboucled-settings-view').style.display = 'none';

    function addToggleEvent(id, callback) {
        const toggleSlider = document.getElementById(id)
        toggleSlider.addEventListener('change', (e) => {
            GM_setValue(id, e.currentTarget.checked);
            if (callback !== undefined) callback();
        });
    }
    function addRangeEvent(id) {
        const rangeSlider = document.getElementById(id)
        rangeSlider.oninput = function () {
            GM_setValue(id, this.value);
            document.getElementById(`${id}-value`).innerHTML = this.value;
        };
    }

    addToggleEvent(storage_optionHideMessages);
    addToggleEvent(storage_optionBoucledUseJvarchive);
    addToggleEvent(storage_optionDisplayBlacklistTopicButton);
    addToggleEvent(storage_optionAllowDisplayThreshold, function () {
        document.querySelectorAll(`[id = ${storage_optionDisplayThreshold}-container]`).forEach(function (el) {
            el.classList.toggle("deboucled-disabled");
        })
    });
    addRangeEvent(storage_optionDisplayThreshold);

    addCollapsibleEvents();

    buildSettingEntities();

    refreshEntityCounts();
}

function addCollapsibleEvents() {
    const activeClass = 'deboucled-collapsible-active';
    document.querySelectorAll('.deboucled-collapsible').forEach(function (el) {
        el.addEventListener('click', function () {
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
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
}

function buildSettingEntities() {
    const regexSubject = /^[A-zÀ-ú0-9_@./#&+-\?\*\[\]\(\) ]*$/i;
    const regexAuthor = /^[A-zÀ-ú0-9-_\[\]]*$/i;
    const regexTopicId = /^[0-9]+$/i;

    createAddEntityEvent(entitySubject, regexSubject, function (key) { addEntityBlacklist(subjectBlacklistArray, key); refreshSubjectKeys(); });
    createAddEntityEvent(entityAuthor, regexAuthor, function (key) { addEntityBlacklist(authorBlacklistArray, key); refreshAuthorKeys(); });
    createAddEntityEvent(entityTopicId, regexTopicId, function (key) { addTopicIdBlacklist(key, key, false); refreshTopicIdKeys(); });

    createSearchEntitiesEvent(entitySubject, regexSubject, refreshSubjectKeys);
    createSearchEntitiesEvent(entityAuthor, regexAuthor, refreshAuthorKeys);
    createSearchEntitiesEvent(entityTopicId, regexTopicId, refreshTopicIdKeys);

    refreshSubjectKeys();
    refreshAuthorKeys();
    refreshTopicIdKeys();
}

function refreshSubjectKeys(filter) {
    writeEntityKeys(entitySubject, subjectBlacklistArray, filter, function (node) {
        removeEntityBlacklist(subjectBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, ''));
        refreshSubjectKeys();
        refreshCollapsibleContentHeight(entitySubject);
    });
}

function refreshAuthorKeys(filter) {
    writeEntityKeys(entityAuthor, authorBlacklistArray, filter, function (node) {
        removeEntityBlacklist(authorBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, ''));
        refreshAuthorKeys();
        refreshCollapsibleContentHeight(entityAuthor);
    });
}

function refreshTopicIdKeys(filter) {
    writeEntityKeys(entityTopicId, topicIdBlacklistMap, filter, function (node) {
        removeTopicIdBlacklist(node.getAttribute('id').replace(/<[^>]*>/g, ''));
        refreshTopicIdKeys();
        refreshCollapsibleContentHeight(entityTopicId);
    });
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
        let key = document.getElementById(`deboucled-${entity}-input-key`).value;
        if (key === '' || !key.match(keyRegex)) return;
        addCallback(key);
        document.getElementById(`deboucled-${entity}-input-key`).value = '';
        refreshCollapsibleContentHeight(entity);
    }

    document.getElementById(`deboucled-${entity}-input-key`).addEventListener('keydown', function (event) {
        if (!keyIsAllowed(event.key, event.ctrlKey) && !event.key.match(keyRegex)) event.preventDefault();
        if (event.key !== "Enter") return;
        addEntity(entity, keyRegex, addCallback);
    });

    document.getElementById(`deboucled-${entity}-input-button`).addEventListener('click', function (e) {
        addEntity(entity, keyRegex, addCallback);
    });
}

function createSearchEntitiesEvent(entity, keyRegex, refreshCallback) {
    document.getElementById(`deboucled-${entity}-search-key`).addEventListener('keydown', function (event) {
        if (!keyIsAllowed(event.key, event.ctrlKey) && !event.key.match(keyRegex)) event.preventDefault();
    });
    document.getElementById(`deboucled-${entity}-search-key`).addEventListener('input', function (event) {
        refreshCallback(event.target.value.toUpperCase());
        refreshCollapsibleContentHeight(entity);
    });
}

function writeEntityKeys(entity, array, filter, removeCallback) {
    let html = '<ul class="deboucled-entity-list">';
    let keys = array;
    if (filter) keys = keys.filter(k => k.toUpperCase().includes(filter));
    keys.forEach(function (value, key) {
        html += `<li class="key deboucled-entity-element" id="${key}"><input type="submit" class="deboucled-${entity}-button-delete-key" value="X">${value}</li>`;
    });
    document.getElementById(`deboucled-${entity}List`).innerHTML = html + '</ul>';

    document.querySelectorAll(`.deboucled-${entity}-button-delete-key`).forEach(input => input.addEventListener('click', function (e) {
        removeCallback(this.parentNode);
    }));
}

function refreshEntityCounts() {
    let subjectCount = document.getElementById(`deboucled-${entitySubject}-entity-count`);
    if (subjectCount !== null) subjectCount.textContent = `${subjectBlacklistArray.length} sujet${isPlural(subjectBlacklistArray.length)} blacklist`;

    let authorCount = document.getElementById(`deboucled-${entityAuthor}-entity-count`);
    if (authorCount !== null) authorCount.textContent = `${authorBlacklistArray.length} pseudo${isPlural(authorBlacklistArray.length)} blacklist`;

    let topicCount = document.getElementById(`deboucled-${entityTopicId}-entity-count`)
    if (topicCount !== null) topicCount.textContent = `${topicIdBlacklistMap.size} topic${isPlural(topicIdBlacklistMap.size)} blacklist`;
}

function refreshCollapsibleContentHeight(entity) {
    let content = document.getElementById(`deboucled-${entity}-collapsible-content`);
    if (content === null) return;
    content.style.maxHeight = content.scrollHeight + 'px';
}

function addSettingButton(firstLaunch) {
    let optionButton = document.createElement("span");
    optionButton.innerHTML = `<span id="deboucled-option-button" style="margin-right:5px;min-width:80px" class="btn btn-actu-new-list-forum ${firstLaunch ? 'blinking' : ''}">Déboucled</span>`;
    document.getElementsByClassName('bloc-pre-right')[0].prepend(optionButton);
    document.getElementById('deboucled-option-button').addEventListener('click', function () {
        document.getElementById('deboucled-settings-bg-view').style.display = 'block';
        document.getElementById('deboucled-settings-view').style.display = 'block';
        clearEntityInputs();
    });

    window.addEventListener('click', function (e) {
        if (!document.getElementById('deboucled-settings-bg-view').contains(e.target)) return;
        document.getElementById('deboucled-settings-bg-view').style.display = 'none';
        document.getElementById('deboucled-settings-view').style.display = 'none';
    });
}

function clearEntityInputs() {
    document.querySelectorAll('.deboucled-input-key').forEach(el => el.value = '');
}


///////////////////////////////////////////////////////////////////////////////////////
// MAIN PAGE
///////////////////////////////////////////////////////////////////////////////////////

function getCurrentPageType(url) {
    if (document.querySelector('.img-erreur') !== null) return 'error';

    let topicListRegex = /\/forums\/0-[0-9]+-0-1-0-[0-9]+-0-.*/i;
    if (url.match(topicListRegex)) return 'topiclist';

    let topicMessagesRegex = /\/forums\/42-[0-9]+-[0-9]+-[0-9]+-0-1-0-.*/i;
    if (url.match(topicMessagesRegex)) return 'topicmessages';

    return 'unknown';
}

async function getPageContent(page) {
    let urlRegex = /(\/forums\/0-[0-9]+-0-1-0-)(?<pageid>[0-9]+)(-0-.*)/i;

    let currentPath = window.location.pathname;
    let matches = urlRegex.exec(currentPath);
    var currentPageId = parseInt(matches.groups.pageid);

    let nextPageId = currentPageId + ((page - 1) * topicByPage);
    let nextPageUrl = currentPath.replace(urlRegex, `$1${nextPageId}$3`);

    const response = await fetch(nextPageUrl);
    return await response.text();
}

function addIgnoreButtons() {
    const forbiddenSvg = '<svg style="display: none;"><symbol id="forbiddenlogo"><g><ellipse opacity="0.6" stroke-width="20" stroke="red" ry="70" rx="70" cy="80" cx="80" fill="none" /><line opacity="0.6" stroke="red" y2="37.39011" x2="122.60989" y1="122.60989" x1="37.39011" stroke-width="20" fill="none" /></g></symbol></svg>';
    addSvg(forbiddenSvg, '.topic-list.topic-list-admin');

    let topics = getAllTopics(document);

    let header = topics[0];
    let spanHead = document.createElement("span");
    spanHead.setAttribute('class', 'deboucled-topic-blacklist');
    spanHead.setAttribute('style', 'width:1.75rem');
    header.appendChild(spanHead);

    topics.slice(1).forEach(function (topic) {
        let span = document.createElement("span");
        span.setAttribute("class", "deboucled-topic-blacklist");
        let topicId = topic.getAttribute('data-id');
        let topicSubject = topic.querySelector('span:nth-child(1) > a:nth-child(2)').textContent.trim();
        let anchor = document.createElement("a");
        anchor.setAttribute("href", "#");
        anchor.setAttribute("title", "Blacklist le topic");
        anchor.onclick = function () { addTopicIdBlacklist(topicId, topicSubject, true); refreshTopicIdKeys(); };
        anchor.innerHTML = '<svg viewBox="2 2 160 160" class="deboucled-logo-forbidden"><use href="#forbiddenlogo"/></svg>';
        span.appendChild(anchor)
        topic.appendChild(span);
    });
}

async function handleTopicList() {
    init();

    let topics = getAllTopics(document);
    if (topics.length === 0) return;

    let optionAllowDisplayThreshold = GM_getValue(storage_optionAllowDisplayThreshold, false);
    let optionDisplayThreshold = GM_getValue(storage_optionDisplayThreshold, 100);

    topics.slice(1).forEach(function (topic) {
        if (isTopicBlacklisted(topic, optionAllowDisplayThreshold, optionDisplayThreshold)) removeTopic(topic);
    });
    await fillTopics(topics);

    updateTopicsHeader();

    let optionDisplayBlacklistTopicButton = GM_getValue(storage_optionDisplayBlacklistTopicButton, true);
    if (optionDisplayBlacklistTopicButton) addIgnoreButtons();

    saveTotalHidden();
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
        upgradeJvcBlacklistButton(message, author);
        addBoucledAuthorButton(message, author, optionBoucledUseJvarchive);
    }
}

function handleTopicMessages() {
    init();

    const spiralSvg = '<svg width="24px" viewBox="0 0 24 24"><symbol id="spirallogo"><defs><style>.cls-1{fill:#999;}</style></defs><path class="cls-1" d="M12.71,12.59a1,1,0,0,1-.71-.3,1,1,0,0,0-1.41,0,1,1,0,0,1-1.42,0,1,1,0,0,1,0-1.41,3.08,3.08,0,0,1,4.24,0,1,1,0,0,1,0,1.41A1,1,0,0,1,12.71,12.59Z"/><path class="cls-1" d="M12.71,14a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42h0a1,1,0,0,1,1.41-1.41,2,2,0,0,1,0,2.83A1,1,0,0,1,12.71,14Z"/><path class="cls-1" d="M9.88,16.83a1,1,0,0,1-.71-.29,4,4,0,0,1,0-5.66,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,2,2,0,0,0,0,2.83,1,1,0,0,1,0,1.42A1,1,0,0,1,9.88,16.83Z"/><path class="cls-1" d="M12.71,18a5,5,0,0,1-3.54-1.46,1,1,0,1,1,1.42-1.42,3.07,3.07,0,0,0,4.24,0,1,1,0,0,1,1.41,0,1,1,0,0,1,0,1.42A5,5,0,0,1,12.71,18Z"/><path class="cls-1" d="M15.54,16.83a1,1,0,0,1-.71-1.71,4,4,0,0,0,0-5.66,1,1,0,0,1,1.41-1.41,6,6,0,0,1,0,8.49A1,1,0,0,1,15.54,16.83Z"/><path class="cls-1" d="M7.05,9.76a1,1,0,0,1-.71-1.71,7,7,0,0,1,9.9,0,1,1,0,1,1-1.41,1.41,5,5,0,0,0-7.07,0A1,1,0,0,1,7.05,9.76Z"/><path class="cls-1" d="M7.05,19.66a1,1,0,0,1-.71-.3,8,8,0,0,1,0-11.31,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,6,6,0,0,0,0,8.49,1,1,0,0,1-.71,1.71Z"/><path class="cls-1" d="M12.71,22a9,9,0,0,1-6.37-2.64,1,1,0,0,1,0-1.41,1,1,0,0,1,1.42,0,7,7,0,0,0,9.9,0,1,1,0,0,1,1.41,1.41A8.94,8.94,0,0,1,12.71,22Z"/><path class="cls-1" d="M18.36,19.66a1,1,0,0,1-.7-.3,1,1,0,0,1,0-1.41,8,8,0,0,0,0-11.31,1,1,0,0,1,0-1.42,1,1,0,0,1,1.41,0,10,10,0,0,1,0,14.14A1,1,0,0,1,18.36,19.66Z"/><path class="cls-1" d="M4.22,6.93a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42,11,11,0,0,1,15.56,0,1,1,0,0,1,0,1.42,1,1,0,0,1-1.41,0,9,9,0,0,0-12.73,0A1,1,0,0,1,4.22,6.93Z"/></symbol></svg>';
    addSvg(spiralSvg, '.conteneur-messages-pagi');

    let optionHideMessages = GM_getValue(storage_optionHideMessages, true);
    let optionBoucledUseJvarchive = GM_getValue(storage_optionBoucledUseJvarchive, false);

    let allMessages = getAllMessages(document);
    allMessages.forEach(function (message) {
        handleMessage(message, optionBoucledUseJvarchive, optionHideMessages);
    });

    updateMessagesHeader();
    saveTotalHidden();
}

function init() {
    let firstLaunch = initStorage();
    addCss();
    buildSettingPage();
    addSettingButton(firstLaunch);
}

async function callMe() {
    let currentPageType = getCurrentPageType(window.location.pathname);
    switch (currentPageType) {
        case 'topiclist':
            await handleTopicList();
            break;
        case 'topicmessages':
            handleTopicMessages();
            break;
        default:
            break;
    }
}

callMe();

addEventListener("instantclick:newpage", callMe);
