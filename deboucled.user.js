// ==UserScript==
// @name        Déboucled
// @namespace   deboucledjvcom
// @version     1.3.2
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
// @todo        "Handle mp and stickers" : handle blacklist for mp and stickers in messages
// @todo        "Hiding mode option" : show blacklisted elements in red (not hidden) or in light gray (?)
// @todo        "Wildcard subject" : use wildcard for subjects blacklist
// @todo        "Reversed/Highlight option" : highlight elements of interest
// @todo        "Zap mode" : select author/word directly in the main page to blacklist
// @todo        "Whitelist threshold" : allow topic in blacklist if the number of messages reach a threshold
// @todo        "Backup & Restore" : allow user to backup and restore settings with json file
// ==/UserScript==


let subjectBlacklistArray = [];
let authorBlacklistArray = [];
let topicIdBlacklistMap = new Map();
let subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
let authorsBlacklistReg = makeRegex(authorBlacklistArray, false);
let hiddenTopics = 0;
let hiddenMessages = 0;
const topicByPage = 25;
const entitySubject = 'subject';
const entityAuthor = 'author';
const entityTopicId = 'topicid';
const storage_init = 'deboucled_init';
const storage_blacklistedTopicIds = 'deboucled_blacklistedTopicIds';
const storage_blacklistedSubjects = 'deboucled_blacklistedSubjects';
const storage_blacklistedAuthors = 'deboucled_blacklistedAuthors';


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
    topicIdBlacklistMap = new Map([...topicIdBlacklistMap, ...JSON.parse(GM_getValue(storage_blacklistedTopicIds))]);
    subjectBlacklistArray = [...new Set(subjectBlacklistArray.concat(JSON.parse(GM_getValue(storage_blacklistedSubjects))))];
    authorBlacklistArray = [...new Set(authorBlacklistArray.concat(JSON.parse(GM_getValue(storage_blacklistedAuthors))))];

    subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
    authorsBlacklistReg = makeRegex(authorBlacklistArray, false);

    saveToStorage();
}

function saveToStorage() {
    GM_setValue(storage_blacklistedTopicIds, JSON.stringify([...topicIdBlacklistMap]));
    GM_setValue(storage_blacklistedSubjects, JSON.stringify([...new Set(subjectBlacklistArray)]));
    GM_setValue(storage_blacklistedAuthors, JSON.stringify([...new Set(authorBlacklistArray)]));

    subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
    authorsBlacklistReg = makeRegex(authorBlacklistArray, false);
}

function makeRegex(array, withBoundaries) {
    let map = withBoundaries ? array.map((e) => `\\b${escapeRegExp(e)}\\b`) : array.map((e) => escapeRegExp(e));
    let regex = map.join('|');
    return new RegExp(regex, 'gi');
}

function escapeRegExp(str) {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function getAllTopics(doc) {
    let allTopics = doc.querySelectorAll('.topic-list.topic-list-admin > li:not(.dfp__atf)');
    return [...allTopics];
}

function getAllMessages(doc) {
    let allMessages = doc.querySelectorAll('.conteneur-messages-pagi > div.bloc-message-forum');
    return [...allMessages];
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

async function fillTopics(topics) {
    let actualTopics = topics.length - hiddenTopics - 1;
    let pageBrowse = 1;
    let domParser = new DOMParser();

    while (actualTopics < topicByPage && pageBrowse <= 10) {
        pageBrowse++;
        await getPageContent(pageBrowse).then((res) => {
            let nextDoc = domParser.parseFromString(res, "text/html");
            let nextPageTopics = getAllTopics(nextDoc);

            nextPageTopics.slice(1).forEach(function (topic) {
                if (isTopicBlacklisted(topic)) {
                    hiddenTopics++;
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
    subjectHeader.textContent = `SUJET (${hiddenTopics} ignoré${isPlural(hiddenTopics)})`;

    let lastMessageHeader = document.querySelector('.topic-head > span:nth-child(4)');
    lastMessageHeader.style.width = '5.3rem';
}

function updateMessagesHeader() {
    if (hiddenMessages <= 0) return;
    let paginationElement = document.querySelector('div.bloc-pagi-default');
    let messageHeader = document.createElement('div');
    messageHeader.setAttribute('class', 'titre-bloc deboucled-ignored-messages'); // titre-head-bloc
    let pr = isPlural(hiddenMessages);
    messageHeader.textContent = `${hiddenMessages} message${pr} ignoré${pr}`;
    insertAfter(messageHeader, paginationElement);
}

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function isPlural(nb) {
    return nb > 1 ? 's' : '';
}

function removeTopic(element) {
    //element.getElementsByClassName("lien-jv topic-title")[0].style.color = "white";
    //element.style.backgroundColor = "red";
    //element.style.display = "none";
    element.remove();
    hiddenTopics++;
}

function removeMessage(element) {
    element.previousElementSibling.remove();
    element.remove();
    hiddenMessages++;
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
    return topics.some((elem) => elem.getAttribute("data-id") == topicId);
}

function isTopicBlacklisted(element) {
    if (!element.hasAttribute('data-id')) return true;

    let topicId = element.getAttribute('data-id');
    if (topicIdBlacklistMap.has(topicId)) return true;

    let titleTag = element.getElementsByClassName("lien-jv topic-title");
    if (titleTag != undefined && titleTag.length > 0) {
        let title = titleTag[0].textContent;
        if (isSubjectBlacklisted(title)) return true;
    }

    let authorTag = element.getElementsByClassName("topic-author");
    if (authorTag != undefined && authorTag.length > 0) {
        let author = authorTag[0].textContent.trim();
        if (isAuthorBlacklisted(author)) return true;
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

function getCurrentPageType(url) {
    if (document.querySelector('.img-erreur') != null) return 'error';

    let topicListRegex = /\/forums\/0-[0-9]+-0-1-0-[0-9]+-0-.*/i;
    if (url.match(topicListRegex)) return 'topiclist';

    let topicMessagesRegex = /\/forums\/42-[0-9]+-[0-9]+-[0-9]+-0-1-0-.*/i;
    if (url.match(topicMessagesRegex)) return 'topicmessages';

    return 'unknown';
}

async function getPageContent(page) {
    let urlRegex = /(\/forums\/0-[0-9]+-0-1-0-)(?<pageid>[0-9]+)(-0-.*)/i;
    //let topicRegex = /\/forums\/42-(?<forumid>[0-9]+)-(?<topicid>[0-9]+)-(?<pageid>[0-9]+)-0-1-0-(?<topicname>.*).htm.*/i;

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
    spanHead.setAttribute("class", "topic-count");
    spanHead.setAttribute("style", "width:1.75rem");
    header.appendChild(spanHead);

    topics.slice(1).forEach(function (topic) {
        let span = document.createElement("span");
        span.setAttribute("class", "topic-count");
        let topicId = topic.getAttribute('data-id');
        let topicSubject = topic.querySelector('span:nth-child(1) > a:nth-child(2)').textContent.trim();
        let anchor = document.createElement("a");
        anchor.setAttribute("href", "#");
        anchor.setAttribute("title", "Blacklist le topic");
        anchor.onclick = function () { addTopicIdBlacklist(topicId, topicSubject, true); refreshTopicIdKeys(); };
        anchor.innerHTML = '<svg viewBox="2 2 160 160" width="13"><use href="#forbiddenlogo"/></svg>';
        span.appendChild(anchor)
        topic.appendChild(span);
    });
}

function addCss() {
    const globalCss = GM_getResourceText("DEBOUCLED_CSS");
    GM_addStyle(globalCss);
}

function buildSettingPage() {
    let bgView = document.createElement('div');
    bgView.setAttribute("id", "deboucled-bg-view");
    bgView.setAttribute("style", "width:100%;height:100%;z-index:999998;background:transparent;overflow-y: auto;position:fixed");
    bgView.innerHTML = '<div></div>';
    document.body.prepend(bgView);
    document.getElementById('deboucled-bg-view').style.display = 'none';

    let deboucledHtml = "";
    deboucledHtml += '<div class="deboucled-bloc-header">BLACKLIST SUJETS</div>';
    deboucledHtml += '<div class="deboucled-bloc">';
    deboucledHtml += `<input type="text" id="deboucled-${entitySubject}-input-key" class="deboucled-input" placeholder="Mot-clé" >`;
    deboucledHtml += `<span id="deboucled-${entitySubject}-input-button" class="btn btn-actu-new-list-forum deboucled-add-button">Ajouter</span>`;
    deboucledHtml += '<br>';
    deboucledHtml += `<div id="deboucled-${entitySubject}List" style="margin-top:10px;"></div>`;
    deboucledHtml += '</div>';
    deboucledHtml += '<div class="deboucled-bloc-header">BLACKLIST AUTEURS</div>';
    deboucledHtml += '<div class="deboucled-bloc">';
    deboucledHtml += `<input type="text" id="deboucled-${entityAuthor}-input-key" class="deboucled-input" placeholder="Pseudo" >`;
    deboucledHtml += `<span id="deboucled-${entityAuthor}-input-button" class="btn btn-actu-new-list-forum deboucled-add-button">Ajouter</span>`;
    deboucledHtml += '<br>';
    deboucledHtml += `<div id="deboucled-${entityAuthor}List" style="margin-top:10px;"></div>`;
    deboucledHtml += '</div>';
    deboucledHtml += '<div class="deboucled-bloc-header">BLACKLIST TOPICS</div>';
    deboucledHtml += '<div class="deboucled-bloc">';
    deboucledHtml += `<input type="text" id="deboucled-${entityTopicId}-input-key" class="deboucled-input" placeholder="TopicId" >`;
    deboucledHtml += `<span id="deboucled-${entityTopicId}-input-button" class="btn btn-actu-new-list-forum deboucled-add-button">Ajouter</span>`;
    deboucledHtml += '<br>';
    deboucledHtml += `<div id="deboucled-${entityTopicId}List" style="margin-top:10px;"></div>`;
    deboucledHtml += '</div>';

    let deboucledView = document.createElement('div');
    deboucledView.setAttribute("id", "deboucled-view");
    deboucledView.setAttribute("style", "width:60%;margin-left:20%;top:110px;max-height:calc(100vh - 150px);overflow-y:auto;position:fixed;z-index:999999;background:transparent;border-style:solid;border-color:dimgray;border-radius:4px;border-width:thin;");
    deboucledView.innerHTML = deboucledHtml;
    document.body.prepend(deboucledView);
    document.getElementById('deboucled-view').style.display = 'none';

    buildSettingEntities();
}

function buildSettingEntities() {
    createAddEntityEvent(entitySubject, /^[A-zÀ-ú0-9_@./#&+-\?\*\[\]\(\) ]*$/i, function (key) { addEntityBlacklist(subjectBlacklistArray, key); refreshSubjectKeys(); });
    createAddEntityEvent(entityAuthor, /^[A-zÀ-ú0-9-_\[\]]*$/i, function (key) { addEntityBlacklist(authorBlacklistArray, key); refreshAuthorKeys(); });
    createAddEntityEvent(entityTopicId, /^[0-9]+$/i, function (key) { addTopicIdBlacklist(key, key, false); refreshTopicIdKeys(); });

    refreshSubjectKeys();
    refreshAuthorKeys();
    refreshTopicIdKeys();
}

function refreshSubjectKeys() {
    writeEntityKeys(entitySubject, subjectBlacklistArray, function (node) { removeEntityBlacklist(subjectBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, '')); refreshSubjectKeys(); });
}

function refreshAuthorKeys() {
    writeEntityKeys(entityAuthor, authorBlacklistArray, function (node) { removeEntityBlacklist(authorBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, '')); refreshAuthorKeys(); });
}

function refreshTopicIdKeys() {
    writeEntityKeys(entityTopicId, topicIdBlacklistMap, function (node) { removeTopicIdBlacklist(node.getAttribute('id').replace(/<[^>]*>/g, '')); refreshTopicIdKeys(); });
}

function createAddEntityEvent(entity, keyRegex, addCallback) {
    document.getElementById(`deboucled-${entity}-input-key`).addEventListener('keydown', function (event) {
        if (event.key != "Enter") return;
        let key = document.getElementById(`deboucled-${entity}-input-key`).value;
        if (key == "" || !key.match(keyRegex)) return;
        addCallback(key);
        document.getElementById(`deboucled-${entity}-input-key`).value = "";
    });

    document.getElementById(`deboucled-${entity}-input-button`).addEventListener('click', function (e) {
        let key = document.getElementById(`deboucled-${entity}-input-key`).value;
        if (key == "" || !key.match(keyRegex)) return;
        addCallback(key);
        document.getElementById(`deboucled-${entity}-input-key`).value = "";
        removeCallback(this.parentNode);
    });
}

function writeEntityKeys(entity, array, removeCallback) {
    let html = '<ul style="margin:0;margin-left:-2px;padding:0;list-style:none;">';
    array.forEach(function (value, key) {
        html += `<li class="key" id="${key}" style="border: 1px solid #d6d6d6;border-radius: 3px;display: inline-block;height:20px"><input type="submit" class="deboucled-${entity}-button-delete-key" value="X">${value}</li>`;
    });
    document.getElementById(`deboucled-${entity}List`).innerHTML = html + '</ul>';

    document.querySelectorAll(`.deboucled-${entity}-button-delete-key`).forEach(input => input.addEventListener('click', function (e) {
        removeCallback(this.parentNode);
    }));
}

function addSettingButton(firstLaunch) {
    let optionButton = document.createElement("span");
    optionButton.innerHTML = `<span id="deboucled-option-button" style="margin-right:5px;min-width:80px" class="btn btn-actu-new-list-forum ${firstLaunch ? 'blinking' : ''}">Déboucled</span>`;
    document.getElementsByClassName('bloc-pre-right')[0].prepend(optionButton);
    document.getElementById('deboucled-option-button').addEventListener('click', function () {
        document.getElementById('deboucled-bg-view').style.display = 'block';
        document.getElementById('deboucled-view').style.display = 'block';
        clearEntityInputs();
    });

    window.addEventListener('click', function (e) {
        if (!document.getElementById('deboucled-bg-view').contains(e.target)) return;
        document.getElementById('deboucled-bg-view').style.display = 'none';
        document.getElementById('deboucled-view').style.display = 'none';
    });
}

function clearEntityInputs() {
    document.querySelectorAll('.deboucled-input').forEach(i => i.value = "");
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

function addBoucledAuthorButton(messageElement, author) {
    let backToForumElement = document.querySelector('div.group-two > a:nth-child(2)');
    if (backToForumElement === null) return;

    let mpBloc = messageElement.querySelector('div.bloc-mp-pseudo');
    if (mpBloc === null) return;

    let forumUrl = backToForumElement.getAttribute('href');
    let boucledAuthorAnchor = document.createElement('a');
    boucledAuthorAnchor.setAttribute('class', 'xXx lien-jv deboucled-author-boucled-button');
    boucledAuthorAnchor.setAttribute('href', `/recherche${forumUrl}?search_in_forum=${author}&type_search_in_forum=auteur_topic`);
    boucledAuthorAnchor.setAttribute('target', '_blank');
    boucledAuthorAnchor.setAttribute('title', 'Pseudo complètement boucled ?');
    boucledAuthorAnchor.innerHTML = '<svg width="18px" viewBox="0 0 24 24"><use href="#spirallogo"/></svg></a>';

    insertAfter(boucledAuthorAnchor, mpBloc);
}

function addSvg(svgHtml, selector) {
    let svgElement = document.createElement('svg');
    svgElement.innerHTML = svgHtml;
    let selection = document.querySelector(selector)
    if (selection !== null) select.appendChild(svgElement);
}

async function handleTopicList() {
    init();
    let topics = getAllTopics(document);
    if (topics.length === 0) return;
    topics.slice(1).forEach(function (topic) {
        if (isTopicBlacklisted(topic)) { removeTopic(topic); }
    });
    await fillTopics(topics);

    updateTopicsHeader();

    addIgnoreButtons();
}

function handleTopicMessages() {
    init();

    const spiralSvg = '<svg width="24px" viewBox="0 0 24 24"><symbol id="spirallogo"><defs><style>.cls-1{fill:#999;}</style></defs><path class="cls-1" d="M12.71,12.59a1,1,0,0,1-.71-.3,1,1,0,0,0-1.41,0,1,1,0,0,1-1.42,0,1,1,0,0,1,0-1.41,3.08,3.08,0,0,1,4.24,0,1,1,0,0,1,0,1.41A1,1,0,0,1,12.71,12.59Z"/><path class="cls-1" d="M12.71,14a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42h0a1,1,0,0,1,1.41-1.41,2,2,0,0,1,0,2.83A1,1,0,0,1,12.71,14Z"/><path class="cls-1" d="M9.88,16.83a1,1,0,0,1-.71-.29,4,4,0,0,1,0-5.66,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,2,2,0,0,0,0,2.83,1,1,0,0,1,0,1.42A1,1,0,0,1,9.88,16.83Z"/><path class="cls-1" d="M12.71,18a5,5,0,0,1-3.54-1.46,1,1,0,1,1,1.42-1.42,3.07,3.07,0,0,0,4.24,0,1,1,0,0,1,1.41,0,1,1,0,0,1,0,1.42A5,5,0,0,1,12.71,18Z"/><path class="cls-1" d="M15.54,16.83a1,1,0,0,1-.71-1.71,4,4,0,0,0,0-5.66,1,1,0,0,1,1.41-1.41,6,6,0,0,1,0,8.49A1,1,0,0,1,15.54,16.83Z"/><path class="cls-1" d="M7.05,9.76a1,1,0,0,1-.71-1.71,7,7,0,0,1,9.9,0,1,1,0,1,1-1.41,1.41,5,5,0,0,0-7.07,0A1,1,0,0,1,7.05,9.76Z"/><path class="cls-1" d="M7.05,19.66a1,1,0,0,1-.71-.3,8,8,0,0,1,0-11.31,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,6,6,0,0,0,0,8.49,1,1,0,0,1-.71,1.71Z"/><path class="cls-1" d="M12.71,22a9,9,0,0,1-6.37-2.64,1,1,0,0,1,0-1.41,1,1,0,0,1,1.42,0,7,7,0,0,0,9.9,0,1,1,0,0,1,1.41,1.41A8.94,8.94,0,0,1,12.71,22Z"/><path class="cls-1" d="M18.36,19.66a1,1,0,0,1-.7-.3,1,1,0,0,1,0-1.41,8,8,0,0,0,0-11.31,1,1,0,0,1,0-1.42,1,1,0,0,1,1.41,0,10,10,0,0,1,0,14.14A1,1,0,0,1,18.36,19.66Z"/><path class="cls-1" d="M4.22,6.93a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42,11,11,0,0,1,15.56,0,1,1,0,0,1,0,1.42,1,1,0,0,1-1.41,0,9,9,0,0,0-12.73,0A1,1,0,0,1,4.22,6.93Z"/></symbol></svg>';
    addSvg(spiralSvg, '.conteneur-messages-pagi');

    let allMessages = getAllMessages(document);
    allMessages.forEach(function (message) {
        let authorElement = message.querySelector('a.bloc-pseudo-msg, span.bloc-pseudo-msg');
        if (authorElement === null) return;
        let author = authorElement.textContent.trim();

        if (isAuthorBlacklisted(author)) {
            removeMessage(message);
        }
        else {
            upgradeJvcBlacklistButton(message, author);
            addBoucledAuthorButton(message, author);
        }
    });

    updateMessagesHeader();
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
