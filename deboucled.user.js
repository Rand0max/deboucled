// ==UserScript==
// @name        Déboucled
// @namespace   deboucledjvcom
// @version     1.12.10
// @downloadURL https://github.com/Rand0max/deboucled/raw/master/deboucled.user.js
// @updateURL   https://github.com/Rand0max/deboucled/raw/master/deboucled.meta.js
// @author      Rand0max
// @description Censure les topics éclatax et vous sort de la boucle
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
// @require     https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js
// ==/UserScript==


///////////////////////////////////////////////////////////////////////////////////////
// VARIABLES
///////////////////////////////////////////////////////////////////////////////////////

let subjectBlacklistArray = [];
let authorBlacklistArray = [];
let topicIdBlacklistMap = new Map();
let subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
let authorsBlacklistReg = makeRegex(authorBlacklistArray, false);

let pocTopicMap = new Map();

let hiddenTotalTopics = 0;
let hiddenSubjects = 0;
let hiddenTopicsIds = 0;
let hiddenMessages = 0;
let hiddenAuthors = 0;
let hiddenAuthorArray = new Set();

const deboucledVersion = '1.12.10'
const topicByPage = 25;

const entitySubject = 'subject';
const entityAuthor = 'author';
const entityTopicId = 'topicid';

const domParser = new DOMParser();


///////////////////////////////////////////////////////////////////////////////////////
// STORAGE
///////////////////////////////////////////////////////////////////////////////////////

const localstorage_pocTopics = 'deboucled_pocTopics';

const storage_init = 'deboucled_init';
const storage_blacklistedTopicIds = 'deboucled_blacklistedTopicIds';
const storage_blacklistedSubjects = 'deboucled_blacklistedSubjects';
const storage_blacklistedAuthors = 'deboucled_blacklistedAuthors';
const storage_optionBoucledUseJvarchive = 'deboucled_optionBoucledUseJvarchive';
const storage_optionHideMessages = 'deboucled_optionHideMessages';
const storage_optionAllowDisplayThreshold = 'deboucled_optionAllowDisplayThreshold';
const storage_optionDisplayThreshold = 'deboucled_optionDisplayThreshold';
const storage_optionDisplayBlacklistTopicButton = 'deboucled_optionDisplayBlacklistTopicButton';
const storage_optionShowJvcBlacklistButton = 'deboucled_optionShowJvcBlacklistButton';
const storage_optionFilterResearch = 'deboucled_optionFilterResearch';
const storage_optionDetectPocMode = 'deboucled_optionDetectPocMode';
const storage_optionPrevisualizeTopic = 'deboucled_optionPrevisualizeTopic';
const storage_optionDisplayBlackTopic = 'deboucled_optionDisplayBlackTopic';
const storage_totalHiddenTopicIds = 'deboucled_totalHiddenTopicIds';
const storage_totalHiddenSubjects = 'deboucled_totalHiddenSubjects';
const storage_totalHiddenAuthors = 'deboucled_totalHiddenAuthors';
const storage_totalHiddenMessages = 'deboucled_totalHiddenMessages';

const storage_Keys = [storage_init, storage_blacklistedTopicIds, storage_blacklistedSubjects, storage_blacklistedAuthors, storage_optionBoucledUseJvarchive, storage_optionHideMessages, storage_optionAllowDisplayThreshold, storage_optionDisplayThreshold, storage_optionDisplayBlacklistTopicButton, storage_optionShowJvcBlacklistButton, storage_optionFilterResearch, storage_optionDetectPocMode, storage_optionPrevisualizeTopic, storage_optionDisplayBlackTopic, storage_totalHiddenTopicIds, storage_totalHiddenSubjects, storage_totalHiddenAuthors, storage_totalHiddenMessages];


async function initStorage() {
    let isInit = GM_getValue(storage_init, false);
    if (isInit) {
        await loadStorage();
        return false;
    }
    else {
        saveStorage();
        GM_setValue(storage_init, true);
        return true;
    }
}

async function loadStorage() {
    subjectBlacklistArray = [...new Set(subjectBlacklistArray.concat(JSON.parse(GM_getValue(storage_blacklistedSubjects))))];
    authorBlacklistArray = [...new Set(authorBlacklistArray.concat(JSON.parse(GM_getValue(storage_blacklistedAuthors))))];
    topicIdBlacklistMap = new Map([...topicIdBlacklistMap, ...JSON.parse(GM_getValue(storage_blacklistedTopicIds))]);

    subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
    authorsBlacklistReg = makeRegex(authorBlacklistArray, false);

    await loadLocalStorage();

    await saveStorage();
}

async function saveStorage() {
    GM_setValue(storage_blacklistedSubjects, JSON.stringify([...new Set(subjectBlacklistArray)]));
    GM_setValue(storage_blacklistedAuthors, JSON.stringify([...new Set(authorBlacklistArray)]));
    GM_setValue(storage_blacklistedTopicIds, JSON.stringify([...topicIdBlacklistMap]));

    subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
    authorsBlacklistReg = makeRegex(authorBlacklistArray, false);

    await saveLocalStorage();

    refreshEntityCounts();
}

async function loadLocalStorage() {
    const storagePocTopics = await localforage.getItem(localstorage_pocTopics);
    if (storagePocTopics) pocTopicMap = new Map([...pocTopicMap, ...JSON.parse(storagePocTopics)]);
}

async function saveLocalStorage() {
    await localforage.setItem(localstorage_pocTopics, JSON.stringify([...pocTopicMap]));
}

function removeTopicIdBlacklist(topicId) {
    if (topicIdBlacklistMap.has(topicId)) {
        topicIdBlacklistMap.delete(topicId);
        saveStorage();
    }
}

function addEntityBlacklist(array, key) {
    if (array.indexOf(key) === -1) {
        array.push(key);
        saveStorage();
    }
}

function removeEntityBlacklist(array, key) {
    let index = array.indexOf(key);
    if (index > -1) {
        array.splice(index, 1);
        saveStorage();
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

    let map = new Map();
    GM_listValues().forEach(key => {
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

function restoreStorage(fileContent) {
    // On parse le JSON du fichier pour en faire un objet
    let settingsObj = JSON.parse(fileContent);

    // On parcours les clés/valeurs
    for (const [key, value] of Object.entries(settingsObj)) {
        // Si une clé est inconnue on ignore
        if (!storage_Keys.includes(key)) continue;

        // Type object = array/map donc il faut déserialiser
        if (typeof (value) === 'object') {
            GM_setValue(key, JSON.stringify(value));
        }
        else {
            // Valeur normale (boolean/string/int/etc)
            GM_setValue(key, value);
        }
    }

    let msg = document.getElementById('deboucled-impexp-message');
    setTimeout(() => { msg.classList.toggle('active'); }, 5000);
    msg.classList.toggle('active');
}


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
        saveStorage();
        if (refreshTopicList) {
            let topic = document.querySelector('[data-id="' + topicId + '"]');
            if (topic === undefined) return;
            removeTopic(topic);
            updateTopicsHeader();
        }
    }
}

async function fillTopics(topics, optionAllowDisplayThreshold, optionDisplayThreshold) {
    let actualTopics = topics.length - hiddenTotalTopics - 1;
    let pageBrowse = 1;
    let filledTopics = [];

    while (actualTopics < topicByPage && pageBrowse <= 10) {
        pageBrowse++;
        await getPageContent(pageBrowse).then((res) => {
            let nextDoc = domParser.parseFromString(res, "text/html");
            let nextPageTopics = getAllTopics(nextDoc);

            nextPageTopics.slice(1).forEach(function (topic) {
                if (isTopicBlacklisted(topic, optionAllowDisplayThreshold, optionDisplayThreshold)) {
                    hiddenTotalTopics++;
                    return;
                }
                if (actualTopics < topicByPage && !topicExists(topics, topic)) {
                    addTopic(topic, topics);
                    actualTopics++;
                    filledTopics.push(topic);
                }
            });
        });
    }
    return filledTopics;
}

function updateTopicsHeader() {
    let subjectHeader = document.querySelector('.topic-head > span:nth-child(1)');
    subjectHeader.textContent = `SUJET (${hiddenTotalTopics} ignoré${plural(hiddenTotalTopics)})`;

    let lastMessageHeader = document.querySelector('.topic-head > span:nth-child(4)');
    lastMessageHeader.style.width = '5.3rem';
}

function removeTopic(element) {
    element.remove();
    hiddenTotalTopics++;
}

function addTopic(element, topics) {
    if (element.getElementsByClassName("xXx text-user topic-author").length === 0) {
        // jvcare supprime le lien vers le profil et le lien dans la date du topic
        let topicAuthorSpan = element.children[1];
        let author = topicAuthorSpan.textContent.trim();
        topicAuthorSpan.outerHTML = `<a href="https://www.jeuxvideo.com/profil/${author.toLowerCase()}?mode=infos" target="_blank" class="xXx text-user topic-author">${author}</a>`;

        let topicDateSpan = element.children[3];
        let topicUrl = element.children[0].lastElementChild.getAttribute('href').trim();
        let topicDate = topicDateSpan.firstElementChild.textContent.trim();
        topicDateSpan.innerHTML = `<a href="${topicUrl}" class="xXx lien-jv">${topicDate}</a>`;
    }
    document.getElementsByClassName("topic-list topic-list-admin")[0].appendChild(element);
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

    if (optionAllowDisplayThreshold && getTopicMessageCount(element) >= optionDisplayThreshold) return false;

    let topicId = element.getAttribute('data-id');
    if (topicIdBlacklistMap.has(topicId)) {
        hiddenTopicsIds++;
        return true;
    }

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
    return subject.normalizeDiacritic().match(subjectsBlacklistReg);
}

function isAuthorBlacklisted(author) {
    if (authorBlacklistArray.length === 0) return false;
    return author.normalizeDiacritic().match(authorsBlacklistReg);
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
    //const isTitlePocRegex = /pos(t|te|tez|tou)(")?$/i;
    const isTitlePocRegex = /(pos(t|te|tez|to|too|tou)(")?$)|(pos(t|te|tez).*ou.*(cancer|quand|kan))|paustaouk|postukhan|postookan/i;
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
        const maladies = ['cancer', 'torsion', 'testiculaire', 'cholera', 'sida', 'corona', 'coronavirus', 'covid', 'covid19'];
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
            return messagePreview;
        }

        async function previewTopicCallback() {
            return await fetch(topicUrl).then(function (response) {
                if (!response.ok) throw Error(response.statusText);
                return response.text();
            }).then(function (r) {
                const html = domParser.parseFromString(r, "text/html");
                return prepareMessagePreview(html);
            }).catch(function (err) {
                console.error(err);
                return null;
            });
        }

        anchor.onmouseenter = async function () {
            if (previewDiv.querySelector('.bloc-message-forum')) return;
            const topicContent = await previewTopicCallback();
            previewDiv.firstChild.remove();
            previewDiv.appendChild(topicContent);
        };
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
    let pr = plural(hiddenMessages);
    ignoredMessageHeader.textContent = `${hiddenMessages} message${pr} ignoré${pr}`;

    let ignoredAuthors = document.createElement('span');
    ignoredAuthors.setAttribute('class', 'titre-bloc deboucled-messages-ignored-authors');
    ignoredAuthors.style.display = 'none';
    ignoredAuthors.textContent = [...hiddenAuthorArray].join(', ');

    let toggleIgnoredAuthors = document.createElement('a');
    toggleIgnoredAuthors.setAttribute('class', 'titre-bloc deboucled-toggle-ignored-authors');
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

    insertAfter(ignoredMessageHeader, paginationElement);
    ignoredMessageHeader.appendChild(toggleIgnoredAuthors);
    ignoredMessageHeader.appendChild(ignoredAuthors);
}

function removeMessage(element) {
    element.previousElementSibling.remove();
    element.remove();
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
    boucledAuthorAnchor.setAttribute('class', 'xXx lien-jv deboucled-author-boucled-button deboucled-svg-spiral-gray');
    boucledAuthorAnchor.setAttribute('href', redirectUrl);
    boucledAuthorAnchor.setAttribute('target', '_blank');
    boucledAuthorAnchor.setAttribute('title', 'Pseudo complètement boucled ?');
    boucledAuthorAnchor.innerHTML = '<svg width="16px" viewBox="0 0 24 24" id="deboucled-spiral-logo"><use href="#spirallogo"/></svg></a>';

    insertAfter(boucledAuthorAnchor, mpBloc);
}

function handleJvChat() {
    addEventListener("jvchat:newmessage", function (event) {
        // L'id du message est stocké dans event.detail.id
        // L'attribut event.detail.isEdit est mis à "true" s'il s'agit d'un message édité
        let message = document.querySelector(`.jvchat-message[jvchat-id="${event.detail.id}"]`);
        let authorElem = message.querySelector('h5.jvchat-author');
        if (authorElem === null) return;
        let author = authorElem.textContent.trim();
        if (isAuthorBlacklisted(author)) message.parentElement.style.display = 'none';
    });
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
    function addToggleOption(title, optionId, defaultValue, hint) {
        let html = "";
        html += '<tr>';
        html += `<td title="${hint}">${title}</td>`;
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
    function addRangeOption(title, optionId, defaultValue, minValue, maxValue, enabled, hint) {
        let html = "";
        html += `<tr id="${optionId}-container" class="${enabled ? '' : 'deboucled-disabled'}">`;
        html += `<td class="deboucled-option-cell deboucled-option-table-subcell" style="padding-left: 5px;" title="${hint}">${title}</td>`;
        html += '<td class="deboucled-option-cell deboucled-option-table-subcell" style="padding-top: 7px;">';
        let value = GM_getValue(optionId, defaultValue);
        html += `<input type="range" id="${optionId}" min="${minValue}" max="${maxValue}" value="${value}" step="10" class="deboucled-range-slider">`;
        html += '<td>';
        html += `<span id="${optionId}-value">${value}</span>`;
        html += '</td>';
        html += '</tr>';
        return html;
    }
    function addDropdownOption(title, optionId, hint, defaultValue, values) {
        let html = "";
        html += '<tr>';
        html += `<td title="${hint}" style="vertical-align: top;">${title}</td>`;
        html += '<td>';
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
        html += '<td>Restaurer/sauvegarder les préférences</td>';
        html += '<td>';
        html += `<label for="deboucled-import-button" class="btn btn-actu-new-list-forum deboucled-setting-button">Restaurer</label>`;
        html += `<input type="file" accept="application/JSON" id="deboucled-import-button" style="display: none;"></input>`;
        html += `<span id="deboucled-export-button" class="btn btn-actu-new-list-forum deboucled-setting-button">Sauvegarder</span>`;
        html += '</td>';
        html += '<td>';
        html += `<span id="deboucled-impexp-message" class="deboucled-setting-impexp-message">Restauration terminée ⚠ Veuillez rafraichir la page ⚠</span>`;
        html += '</td>';
        html += '</tr>';
        return html;
    }

    function addOptionsSection(sectionIsActive) {
        let html = "";
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">OPTIONS</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-options-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content" style="margin-bottom: 0;">';
        html += `<span class="deboucled-version">v${deboucledVersion}</span>`;
        html += '<table class="deboucled-option-table">';

        let spiral = '<span class="deboucled-svg-spiral-black"><svg width="16px" viewBox="0 2 24 24" id="deboucled-spiral-logo"><use href="#spirallogo"/></svg></span>';
        html += addToggleOption(`Utiliser <i>JvArchive</i> pour <i>Pseudo boucled</i> ${spiral}`, storage_optionBoucledUseJvarchive, false, 'Quand vous cliquez sur le bouton en spirale à côté du pseudo, un nouvel onglet sera ouvert avec la liste des topics soit avec JVC soit avec JvArchive.');

        html += addToggleOption('Cacher les messages des <span style="color: rgb(230, 0, 0)">pseudos blacklist</span>', storage_optionHideMessages, true, 'Permet de masquer complètement les messages d\'un pseudo dans les topics.');

        let forbidden = '<span class="deboucled-svg-forbidden-black"><svg viewBox="0 0 180 180" id="deboucled-forbidden-logo" class="deboucled-logo-forbidden"><use href="#forbiddenlogo"/></svg></span>';
        html += addToggleOption(`Afficher les boutons pour <i>Blacklist le topic</i> ${forbidden}`, storage_optionDisplayBlacklistTopicButton, true, 'Afficher ou non le bouton rouge à droite des sujets pour ignorer les topics voulu.');

        let blackTopic = '<span class="topic-img deboucled-topic-black-logo" style="display: inline-block; vertical-align: middle;"></span>'
        html += addToggleOption(`Afficher le pictogramme pour les <i>topics noirs</i> ${blackTopic}`, storage_optionDisplayBlackTopic, true, 'Afficher les topics de plus de 100 messages avec le pictogramme noir (en plus du jaune, rouge, résolu, épinglé etc).');

        let preview = '<span><svg width="16px" viewBox="0 0 30 30" id="deboucled-preview-logo"><use href="#previewlogo"/></svg></span>';
        html += addToggleOption(`Afficher les boutons pour avoir un <i>aperçu du topic</i> ${preview}`, storage_optionPrevisualizeTopic, true, 'Afficher ou non l\'icone \'loupe\' à côté du sujet pour prévisualiser le topic.');

        let blJvc = '<span class="picto-msg-tronche deboucled-blacklist-jvc-button" style="width: 13px;height: 13px;background-size: 13px;"></span>'
        html += addToggleOption(`Afficher le bouton <i>Blacklist pseudo</i> ${blJvc} de JVC`, storage_optionShowJvcBlacklistButton, false, 'Afficher ou non le bouton blacklist original de JVC à côté du nouveau bouton blacklist de Déboucled.');

        let poc = '<span class="deboucled-poc-logo"></span>'
        html += addDropdownOption(`Protection contre les <i>PoC</i> ${poc} <span style="opacity: 0.3;font-style: italic;font-size: xx-small;">(beta)</span>`,
            storage_optionDetectPocMode,
            'Protection contre les topics &quot;post ou cancer&quot; et les dérivés.\n• Désactivé : aucune protection\n• Mode simple (rapide) : recherche dans le message uniquement si le titre contient un indice\n• Mode approfondi (plus lent) : recherche systématiquement dans le message et le titre',
            0,
            ['Désactivé', 'Mode simple', 'Mode approfondi']);

        html += addToggleOption('Autoriser l\'affichage du topic à partir d\'un seuil', storage_optionAllowDisplayThreshold, false, 'Autoriser l\'affichage des topics même si le sujet est blacklist, à partir d\'un certain nombre de messages.');

        let allowDisplayThreshold = GM_getValue(storage_optionAllowDisplayThreshold, false);
        html += addRangeOption('Nombre de messages minimum', storage_optionDisplayThreshold, 100, 10, 1000, allowDisplayThreshold, 'Nombre de messages minimum dans le topic pour forcer l\'affichage.');

        html += addImportExportButtons();

        html += '</table>';
        html += '</div>';
        html += '</div>';
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

    document.querySelector('.deboucled-version').onclick = function () { alert('En dépit des boucleurs --> ent :)'); };

    function addToggleEvent(id, callback = undefined) {
        const toggleSlider = document.getElementById(id);
        toggleSlider.onchange = (e) => {
            GM_setValue(id, e.currentTarget.checked);
            if (callback) callback();
        };
    }
    function addRangeEvent(id) {
        const rangeSlider = document.getElementById(id);
        rangeSlider.oninput = function () {
            GM_setValue(id, parseInt(this.value));
            document.getElementById(`${id}-value`).innerHTML = this.value;
        };
    }
    function addSelectEvent(id) {
        const select = document.getElementById(id);
        select.onchange = (e) => {
            GM_setValue(id, parseInt(e.currentTarget.value));
        };
    }

    addToggleEvent(storage_optionHideMessages);
    addToggleEvent(storage_optionBoucledUseJvarchive);
    addToggleEvent(storage_optionDisplayBlacklistTopicButton);
    addToggleEvent(storage_optionDisplayBlackTopic);
    addToggleEvent(storage_optionPrevisualizeTopic);
    addToggleEvent(storage_optionShowJvcBlacklistButton);
    addToggleEvent(storage_optionAllowDisplayThreshold, function () {
        document.querySelectorAll(`[id = ${storage_optionDisplayThreshold}-container]`).forEach(function (el) {
            el.classList.toggle("deboucled-disabled");
        })
    });
    addRangeEvent(storage_optionDisplayThreshold);
    addSelectEvent(storage_optionDetectPocMode);

    addImportExportEvent();

    addCollapsibleEvents();

    buildSettingEntities();

    refreshEntityCounts();
}

function addImportExportEvent() {
    document.getElementById('deboucled-export-button').onclick = backupStorage;
    document.getElementById('deboucled-import-button').onchange = loadFile;
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
                let view = document.getElementById('deboucled-settings-view');
                view.style.overflowY = 'scroll';
                content.style.maxHeight = content.scrollHeight + 'px';
                view.removeAttribute('style');
            }
        };
    });
}

function buildSettingEntities() {
    const regexAllowedSubject = /^[A-z0-9\u0020-\u007E\u00A1-\u02AF]*$/i;
    const regexAllowedAuthor = /^[A-z\u00C0-\u02AF0-9-_\[\]]*$/i;
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

function writeEntityKeys(entity, array, filter, removeCallback) {

    let entries = array;
    if (filter) {
        if (entries instanceof Array) {
            entries = entries.filter((value) => normalizeValue(value).includes(filter));
        }
        else if (entries instanceof Map) {
            entries = new Map([...entries].filter((value, key) => normalizeValue(value).includes(filter) || normalizeValue(key).includes(filter)));
        }
    }

    let html = '<ul class="deboucled-entity-list">';
    entries.forEach(function (value, key) {
        html += `<li class="key deboucled-entity-element" id="${key}"><input type="submit" class="deboucled-${entity}-button-delete-key" value="X">${value}</li>`;
    });
    document.getElementById(`deboucled-${entity}List`).innerHTML = html + '</ul>';

    document.querySelectorAll(`.deboucled-${entity}-button-delete-key`).forEach(input => input.onclick = function () {
        removeCallback(this.parentNode);
    });
}

function refreshSubjectKeys(filter = null) {
    writeEntityKeys(entitySubject, subjectBlacklistArray, filter, function (node) {
        removeEntityBlacklist(subjectBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, ''));
        refreshSubjectKeys();
        refreshCollapsibleContentHeight(entitySubject);
        clearSearchInputs();
    });
}

function refreshAuthorKeys(filter = null) {
    writeEntityKeys(entityAuthor, authorBlacklistArray, filter, function (node) {
        removeEntityBlacklist(authorBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, ''));
        refreshAuthorKeys();
        refreshCollapsibleContentHeight(entityAuthor);
        clearSearchInputs();
    });
}

function refreshTopicIdKeys(filter = null) {
    writeEntityKeys(entityTopicId, topicIdBlacklistMap, filter, function (node) {
        removeTopicIdBlacklist(node.getAttribute('id').replace(/<[^>]*>/g, ''));
        refreshTopicIdKeys();
        refreshCollapsibleContentHeight(entityTopicId);
        clearSearchInputs();
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
        let input = document.getElementById(`deboucled-${entity}-input-key`);
        let key = input.value;
        if (key === '' || !key.match(keyRegex)) return;
        addCallback(key);
        input.value = '';
        refreshCollapsibleContentHeight(entity);
    }

    document.getElementById(`deboucled-${entity}-input-key`).onkeydown = function (event) {
        if (!keyIsAllowed(event.key, event.ctrlKey) && !event.key.match(keyRegex)) event.preventDefault();
        if (event.key !== "Enter") return;
        addEntity(entity, keyRegex, addCallback);
    };

    document.getElementById(`deboucled-${entity}-input-button`).onclick = function () {
        addEntity(entity, keyRegex, addCallback);
    };
}

function createSearchEntitiesEvent(entity, keyRegex, refreshCallback) {
    document.getElementById(`deboucled-${entity}-search-key`).onkeydown = function (event) {
        if (!keyIsAllowed(event.key, event.ctrlKey) && !event.key.match(keyRegex)) event.preventDefault();
    };
    document.getElementById(`deboucled-${entity}-search-key`).oninput = function (event) {
        refreshCallback(normalizeValue(event.target.value));
        refreshCollapsibleContentHeight(entity);
    };
}

function refreshEntityCounts() {
    let subjectCount = document.getElementById(`deboucled-${entitySubject}-entity-count`);
    if (subjectCount !== null) subjectCount.textContent = `${subjectBlacklistArray.length} sujet${plural(subjectBlacklistArray.length)} blacklist`;

    let authorCount = document.getElementById(`deboucled-${entityAuthor}-entity-count`);
    if (authorCount !== null) authorCount.textContent = `${authorBlacklistArray.length} pseudo${plural(authorBlacklistArray.length)} blacklist`;

    let topicCount = document.getElementById(`deboucled-${entityTopicId}-entity-count`)
    if (topicCount !== null) topicCount.textContent = `${topicIdBlacklistMap.size} topic${plural(topicIdBlacklistMap.size)} blacklist`;
}

function refreshCollapsibleContentHeight(entity) {
    let content = document.getElementById(`deboucled-${entity}-collapsible-content`);
    if (content === null) return;
    content.style.maxHeight = content.scrollHeight + 'px';
}

function addSettingButton(firstLaunch) {
    let optionButton = document.createElement("button");
    optionButton.setAttribute('id', 'deboucled-option-button');
    optionButton.setAttribute('class', `btn btn-actu-new-list-forum deboucled-option-button${firstLaunch ? ' blinking' : ''}`);
    optionButton.innerHTML = 'Déboucled';
    document.querySelector('.bloc-pre-right').prepend(optionButton);
    optionButton.onclick = function (e) {
        e.preventDefault();
        clearEntityInputs();
        showSettings();
    };

    window.onclick = function (e) {
        if (!document.getElementById('deboucled-settings-bg-view').contains(e.target)) return;
        hideSettings();
    };
    window.onkeydown = function (e) {
        if (!document.getElementById('deboucled-settings-bg-view').contains(e.target) && e.key !== 'Escape') return;
        hideSettings();
    };
}

function addSearchFilterToggle() {
    let optionFilterResearch = GM_getValue(storage_optionFilterResearch, true);

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
    let bgView = document.getElementById('deboucled-settings-bg-view');
    bgView.style.display = 'block'

    let view = document.getElementById('deboucled-settings-view');
    view.classList.add('visible');
    view.clientWidth; // force display
    view.classList.add('active');
}

function hideSettings() {
    let bgView = document.getElementById('deboucled-settings-bg-view');
    bgView.style.display = 'none';

    let view = document.getElementById('deboucled-settings-view');
    view.classList.remove('active');
    setTimeout(() => view.classList.remove('visible'), 200); // wait transition (flemme d'utiliser l'event)
}

function clearEntityInputs() {
    document.querySelectorAll('.deboucled-input-key').forEach(el => { el.value = '' });
}

function clearSearchInputs() {
    document.querySelectorAll('.deboucled-input-search').forEach(el => { el.value = '' });
}


///////////////////////////////////////////////////////////////////////////////////////
// MAIN PAGE
///////////////////////////////////////////////////////////////////////////////////////

function addSvgs() {
    const spiralSvg = '<svg width="24px" viewBox="0 0 24 24" style="display: none;"><symbol id="spirallogo"><path d="M12.71,12.59a1,1,0,0,1-.71-.3,1,1,0,0,0-1.41,0,1,1,0,0,1-1.42,0,1,1,0,0,1,0-1.41,3.08,3.08,0,0,1,4.24,0,1,1,0,0,1,0,1.41A1,1,0,0,1,12.71,12.59Z"/><path d="M12.71,14a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42h0a1,1,0,0,1,1.41-1.41,2,2,0,0,1,0,2.83A1,1,0,0,1,12.71,14Z"/><path d="M9.88,16.83a1,1,0,0,1-.71-.29,4,4,0,0,1,0-5.66,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,2,2,0,0,0,0,2.83,1,1,0,0,1,0,1.42A1,1,0,0,1,9.88,16.83Z"/><path d="M12.71,18a5,5,0,0,1-3.54-1.46,1,1,0,1,1,1.42-1.42,3.07,3.07,0,0,0,4.24,0,1,1,0,0,1,1.41,0,1,1,0,0,1,0,1.42A5,5,0,0,1,12.71,18Z"/><path d="M15.54,16.83a1,1,0,0,1-.71-1.71,4,4,0,0,0,0-5.66,1,1,0,0,1,1.41-1.41,6,6,0,0,1,0,8.49A1,1,0,0,1,15.54,16.83Z"/><path d="M7.05,9.76a1,1,0,0,1-.71-1.71,7,7,0,0,1,9.9,0,1,1,0,1,1-1.41,1.41,5,5,0,0,0-7.07,0A1,1,0,0,1,7.05,9.76Z"/><path d="M7.05,19.66a1,1,0,0,1-.71-.3,8,8,0,0,1,0-11.31,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,6,6,0,0,0,0,8.49,1,1,0,0,1-.71,1.71Z"/><path d="M12.71,22a9,9,0,0,1-6.37-2.64,1,1,0,0,1,0-1.41,1,1,0,0,1,1.42,0,7,7,0,0,0,9.9,0,1,1,0,0,1,1.41,1.41A8.94,8.94,0,0,1,12.71,22Z"/><path d="M18.36,19.66a1,1,0,0,1-.7-.3,1,1,0,0,1,0-1.41,8,8,0,0,0,0-11.31,1,1,0,0,1,0-1.42,1,1,0,0,1,1.41,0,10,10,0,0,1,0,14.14A1,1,0,0,1,18.36,19.66Z"/><path d="M4.22,6.93a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42,11,11,0,0,1,15.56,0,1,1,0,0,1,0,1.42,1,1,0,0,1-1.41,0,9,9,0,0,0-12.73,0A1,1,0,0,1,4.22,6.93Z"/></symbol></svg>';
    addSvg(spiralSvg, '#forum-main-col');

    const forbiddenSvg = '<svg style="display: none;"><symbol id="forbiddenlogo"><g><ellipse stroke-width="20" ry="70" rx="70" cy="80" cx="80" /><line y2="37.39011" x2="122.60989" y1="122.60989" x1="37.39011" stroke-width="20" /></g></symbol></svg>';
    addSvg(forbiddenSvg, '#forum-main-col');

    const previewSvg = '<svg viewBox="0 0 30 30" width="30px" height="30px"><symbol id="previewlogo"><path fill="#b6c9d6" d="M2.931,28.5c-0.382,0-0.742-0.149-1.012-0.419c-0.558-0.558-0.558-1.466,0-2.024l14.007-13.353 l1.375,1.377L3.935,28.089C3.673,28.351,3.313,28.5,2.931,28.5z"/><path fill="#788b9c" d="M15.917,13.403l0.685,0.686L3.589,27.727C3.413,27.903,3.18,28,2.931,28 c-0.249,0-0.482-0.097-0.658-0.273c-0.363-0.363-0.363-0.953-0.017-1.3L15.917,13.403 M15.934,12.005L1.565,25.704 c-0.754,0.754-0.754,1.977,0,2.731C1.943,28.811,2.437,29,2.931,29c0.494,0,0.988-0.189,1.365-0.566L18,14.073L15.934,12.005 L15.934,12.005z"/><g><path fill="#d1edff" d="M19,20.5c-5.238,0-9.5-4.262-9.5-9.5s4.262-9.5,9.5-9.5s9.5,4.262,9.5,9.5S24.238,20.5,19,20.5z"/><path fill="#788b9c" d="M19,2c4.963,0,9,4.037,9,9s-4.037,9-9,9s-9-4.037-9-9S14.037,2,19,2 M19,1C13.477,1,9,5.477,9,11 s4.477,10,10,10s10-4.477,10-10S24.523,1,19,1L19,1z"/></g></symbol></svg>';
    addSvg(previewSvg, '#forum-main-col');
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
    return matches.groups.searchtype.trim();
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

async function handleTopicList(canFillTopics) {
    let topics = getAllTopics(document);
    if (topics.length === 0) return;

    let optionAllowDisplayThreshold = GM_getValue(storage_optionAllowDisplayThreshold, false);
    let optionDisplayThreshold = GM_getValue(storage_optionDisplayThreshold, 100);

    let finalTopics = [];
    finalTopics.push(topics[0]); // header
    topics.slice(1).forEach(function (topic) {
        if (isTopicBlacklisted(topic, optionAllowDisplayThreshold, optionDisplayThreshold)) removeTopic(topic);
        else finalTopics.push(topic);
    });
    if (canFillTopics) {
        finalTopics = finalTopics.concat(await fillTopics(topics, optionAllowDisplayThreshold, optionDisplayThreshold));
    }

    updateTopicsHeader();

    let optionDisplayBlacklistTopicButton = GM_getValue(storage_optionDisplayBlacklistTopicButton, true);
    if (optionDisplayBlacklistTopicButton) addIgnoreButtons(finalTopics);

    let optionPrevisualizeTopic = GM_getValue(storage_optionPrevisualizeTopic, true);
    if (optionPrevisualizeTopic) addPrevisualizeTopicEvent(finalTopics);

    let optionDisplayBlackTopic = GM_getValue(storage_optionDisplayBlackTopic, true);
    if (optionDisplayBlackTopic) addBlackTopicLogo(finalTopics);

    saveTotalHidden();

    await handlePoc(finalTopics);
}

async function handlePoc(finalTopics) {
    // 0 = désactivé ; 1 = recherche simple ; 2 = recherche approfondie
    let optionDetectPocMode = GM_getValue(storage_optionDetectPocMode, 0);
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
        let optionShowJvcBlacklistButton = GM_getValue(storage_optionShowJvcBlacklistButton, false);
        upgradeJvcBlacklistButton(message, author, optionShowJvcBlacklistButton);
        addBoucledAuthorButton(message, author, optionBoucledUseJvarchive);
    }
}

function handleTopicMessages() {
    let optionHideMessages = GM_getValue(storage_optionHideMessages, true);
    let optionBoucledUseJvarchive = GM_getValue(storage_optionBoucledUseJvarchive, false);

    if (optionHideMessages) handleJvChat();

    let allMessages = getAllMessages(document);
    allMessages.forEach(function (message) {
        handleMessage(message, optionBoucledUseJvarchive, optionHideMessages);
    });

    updateMessagesHeader();
    saveTotalHidden();
}

async function handleSearch() {
    let optionFilterResearch = addSearchFilterToggle();
    if (!optionFilterResearch) return;

    let searchType = getSearchType(window.location.search);
    switch (searchType) {
        /*
        case 'titre_topic':
            break;
        case 'auteur_topic':
            break;
        */
        case 'texte_message':
            // Not implemented yet
            break;
        default:
            await handleTopicList(false);
            break;
    }
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
}

async function init() {
    let firstLaunch = await initStorage();
    addCss();
    addSvgs();
    buildSettingPage();
    addSettingButton(firstLaunch);
}

async function callMe() {
    let currentPageType = getCurrentPageType(window.location.pathname);
    switch (currentPageType) {
        case 'topiclist':
            await init();
            await handleTopicList(true);
            break;
        case 'topicmessages':
            await init();
            handleTopicMessages();
            break;
        case 'search':
            await init();
            await handleSearch();
            break;
        case 'error':
            handleError();
            break;
        default:
            break;
    }
}

callMe();

addEventListener("instantclick:newpage", callMe);
