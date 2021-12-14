
///////////////////////////////////////////////////////////////////////////////////////
// MAIN PAGE
///////////////////////////////////////////////////////////////////////////////////////

function getEntityTitle(entity) {
    switch (entity) {
        case entitySubject:
            return 'Sujets';
        case entityAuthor:
            return 'Auteurs';
        case entityTopicId:
            return 'Topics';
    }
    return '';
}

function toggleDeboucledDarkTheme(enabled) {
    document.body.classList.toggle('deboucled-dark-theme', enabled);
}

function addSvgs() {
    const spiralSvg = '<svg width="24px" viewBox="0 0 24 24" style="display: none;"><symbol id="spirallogo"><path d="M12.71,12.59a1,1,0,0,1-.71-.3,1,1,0,0,0-1.41,0,1,1,0,0,1-1.42,0,1,1,0,0,1,0-1.41,3.08,3.08,0,0,1,4.24,0,1,1,0,0,1,0,1.41A1,1,0,0,1,12.71,12.59Z"/><path d="M12.71,14a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42h0a1,1,0,0,1,1.41-1.41,2,2,0,0,1,0,2.83A1,1,0,0,1,12.71,14Z"/><path d="M9.88,16.83a1,1,0,0,1-.71-.29,4,4,0,0,1,0-5.66,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,2,2,0,0,0,0,2.83,1,1,0,0,1,0,1.42A1,1,0,0,1,9.88,16.83Z"/><path d="M12.71,18a5,5,0,0,1-3.54-1.46,1,1,0,1,1,1.42-1.42,3.07,3.07,0,0,0,4.24,0,1,1,0,0,1,1.41,0,1,1,0,0,1,0,1.42A5,5,0,0,1,12.71,18Z"/><path d="M15.54,16.83a1,1,0,0,1-.71-1.71,4,4,0,0,0,0-5.66,1,1,0,0,1,1.41-1.41,6,6,0,0,1,0,8.49A1,1,0,0,1,15.54,16.83Z"/><path d="M7.05,9.76a1,1,0,0,1-.71-1.71,7,7,0,0,1,9.9,0,1,1,0,1,1-1.41,1.41,5,5,0,0,0-7.07,0A1,1,0,0,1,7.05,9.76Z"/><path d="M7.05,19.66a1,1,0,0,1-.71-.3,8,8,0,0,1,0-11.31,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,6,6,0,0,0,0,8.49,1,1,0,0,1-.71,1.71Z"/><path d="M12.71,22a9,9,0,0,1-6.37-2.64,1,1,0,0,1,0-1.41,1,1,0,0,1,1.42,0,7,7,0,0,0,9.9,0,1,1,0,0,1,1.41,1.41A8.94,8.94,0,0,1,12.71,22Z"/><path d="M18.36,19.66a1,1,0,0,1-.7-.3,1,1,0,0,1,0-1.41,8,8,0,0,0,0-11.31,1,1,0,0,1,0-1.42,1,1,0,0,1,1.41,0,10,10,0,0,1,0,14.14A1,1,0,0,1,18.36,19.66Z"/><path d="M4.22,6.93a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42,11,11,0,0,1,15.56,0,1,1,0,0,1,0,1.42,1,1,0,0,1-1.41,0,9,9,0,0,0-12.73,0A1,1,0,0,1,4.22,6.93Z"/></symbol></svg>';
    addSvg(spiralSvg, '#forum-main-col');

    const forbiddenSvg = '<svg style="display: none;"><symbol id="forbiddenlogo"><g><ellipse stroke-width="20" ry="70" rx="70" cy="80" cx="80" /><line y2="37.39011" x2="122.60989" y1="122.60989" x1="37.39011" stroke-width="20" /></g></symbol></svg>';
    addSvg(forbiddenSvg, '#forum-main-col');

    const previewSvg = '<svg viewBox="0 0 30 30" width="30px" height="30px" style="display: none;"><symbol id="previewlogo"><path fill="#b6c9d6" d="M2.931,28.5c-0.382,0-0.742-0.149-1.012-0.419c-0.558-0.558-0.558-1.466,0-2.024l14.007-13.353 l1.375,1.377L3.935,28.089C3.673,28.351,3.313,28.5,2.931,28.5z"/><path fill="#788b9c" d="M15.917,13.403l0.685,0.686L3.589,27.727C3.413,27.903,3.18,28,2.931,28 c-0.249,0-0.482-0.097-0.658-0.273c-0.363-0.363-0.363-0.953-0.017-1.3L15.917,13.403 M15.934,12.005L1.565,25.704 c-0.754,0.754-0.754,1.977,0,2.731C1.943,28.811,2.437,29,2.931,29c0.494,0,0.988-0.189,1.365-0.566L18,14.073L15.934,12.005 L15.934,12.005z"/><g><path fill="#d1edff" d="M19,20.5c-5.238,0-9.5-4.262-9.5-9.5s4.262-9.5,9.5-9.5s9.5,4.262,9.5,9.5S24.238,20.5,19,20.5z"/><path fill="#788b9c" d="M19,2c4.963,0,9,4.037,9,9s-4.037,9-9,9s-9-4.037-9-9S14.037,2,19,2 M19,1C13.477,1,9,5.477,9,11 s4.477,10,10,10s10-4.477,10-10S24.523,1,19,1L19,1z"/></g></symbol></svg>';
    addSvg(previewSvg, '#forum-main-col');

    const githubSvg = '<svg viewBox="0 0 16 16" height="32" width="32" style="display: none;"><symbol id="githublogo"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></symbol></svg>';
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

    let privateMessagesRegex = /^(\/messages-prives\/boite-reception\.php(\?folder=0)?)$/i;
    if (url.match(privateMessagesRegex)) return 'privatemessages';

    return 'unknown';
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
    let optionAntiVinz = GM_getValue(storage_optionAntiVinz, storage_optionAntiVinz_default);

    let topicsToRemove = [];
    let finalTopics = [];
    finalTopics.push(topics[0]); // header
    topics.slice(1).forEach(function (topic) {
        if (isTopicBlacklisted(topic, optionAllowDisplayThreshold, optionDisplayThreshold, optionAntiVinz)) {
            topicsToRemove.push(topic);
            hiddenTotalTopics++;
        }
        else finalTopics.push(topic);
    });
    if (canFillTopics) {
        const filledTopics = await fillTopics(topics, optionAllowDisplayThreshold, optionDisplayThreshold, optionAntiVinz);
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

function highlightBlacklistMatches(element, matches) {
    let content = element.textContent;

    // Supprime les surrogate pairs car c'est ingérable
    // Surrogate pairs = grosse merde = JS = calvitie foudroyante
    // eslint-disable-next-line no-useless-escape
    const regex = /[^\p{L}\p{N}\p{P}\p{Z}{\^\$}]/gu;
    const pureMatches = matches.map(m => m.replace(regex, '').trim()).filter(m => m !== '');

    let index = -1;
    pureMatches.every(match => {
        const normMatch = match.normalizeDiacritic();
        const normContent = content.normalizeDiacritic();
        index = normContent.indexOf(normMatch, index + 1);
        if (index <= -1) return false;
        const realMatchContent = content.slice(index, index + normMatch.length);
        const newContent = `<span class="deboucled-blacklisted">${realMatchContent}</span>`;
        content = `${content.slice(0, index)}${newContent}${content.slice(index + match.length, content.length)}`;
        index += newContent.length;
        return true;
    });

    if (element.nodeType == Node.TEXT_NODE) {
        let newNode = document.createElement('span');
        element.parentElement.insertBefore(newNode, element);
        newNode.outerHTML = content;
        element.remove();
    }
    else {
        element.innerHTML = content;
    }
}

function handleMessageBlacklistMatches(messageElement) {
    const getParagraphChildren = (contentElement) => [...contentElement.children].filter(c => c.tagName === 'P' && c.textContent.trim() !== '');
    const getTextChildren = (contentElement) => [...contentElement.childNodes].filter(c => c.nodeType === Node.TEXT_NODE && c.textContent.trim() !== '');
    function highlightMatches(textChild) {
        const matches = getSubjectBlacklistMatches(textChild.textContent);
        if (!matches?.length) return false;
        highlightBlacklistMatches(textChild, matches);
        return true;
    }

    // Un message contient une balise p pour chaque ligne
    // Un p peut contenir du texte ou du html (img, a, etc)
    let paragraphChildren = getParagraphChildren(messageElement);
    let hasMatch = false;
    paragraphChildren.forEach(paragraph => {
        const textChildren = getTextChildren(paragraph); // on ne s'intéresse qu'au texte
        textChildren.forEach(textChild => { hasMatch = highlightMatches(textChild) ? true : hasMatch });
    })
    return hasMatch;
}

function handleBlSubjectIgnoreMessages(messageElement) {
    let contentElement = messageElement.querySelector('.txt-msg.text-enrichi-forum');
    if (!contentElement) return;

    let hasAnyMatch = handleMessageBlacklistMatches(contentElement);
    if (!hasAnyMatch) return;

    const blocContenu = contentElement.parentElement;
    blocContenu.style.display = 'none';

    let divWrapper = document.createElement('div');
    divWrapper.className = 'deboucled-matches-wrapper deboucled-message-wrapper';
    blocContenu.parentElement.appendChild(divWrapper);
    let spanEye = document.createElement('span');
    spanEye.className = 'deboucled-eye-logo deboucled-display-matches';
    divWrapper.appendChild(spanEye);
    divWrapper.appendChild(blocContenu);

    divWrapper.onclick = function () {
        this.firstChild.remove();
        this.removeAttribute('class');
        blocContenu.removeAttribute('style');
        divWrapper.onclick = null;
    }
}

function handleMessage(message, optionBoucledUseJvarchive, optionHideMessages, optionBlSubjectIgnoreMessages) {
    let authorElement = message.querySelector('a.bloc-pseudo-msg, span.bloc-pseudo-msg');
    if (!authorElement) return;
    let author = authorElement.textContent.trim();

    if (getAuthorBlacklistMatches(author)?.length) {
        if (optionHideMessages) {
            removeMessage(message);
            hiddenMessages++;
            hiddenAuthorArray.add(author);
            return; // si on a supprimé le message on se casse, plus rien à faire
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

    if (!optionBlSubjectIgnoreMessages) return;
    handleBlSubjectIgnoreMessages(message);
}

function handleTopicHeader() {
    let titleElement = document.querySelector('#bloc-title-forum');
    if (!titleElement) return;
    const subjectMatches = getSubjectBlacklistMatches(titleElement.textContent);
    if (!subjectMatches?.length) return;
    highlightBlacklistMatches(titleElement, subjectMatches);
}

function handleTopicMessages() {
    let optionHideMessages = GM_getValue(storage_optionHideMessages, storage_optionHideMessages_default);
    let optionBoucledUseJvarchive = GM_getValue(storage_optionBoucledUseJvarchive, storage_optionBoucledUseJvarchive_default);
    let optionBlSubjectIgnoreMessages = GM_getValue(storage_optionBlSubjectIgnoreMessages, storage_optionBlSubjectIgnoreMessages_default);

    handleTopicHeader();

    handleJvChatAndTopicLive(optionHideMessages, optionBoucledUseJvarchive, optionBlSubjectIgnoreMessages);

    let allMessages = getAllMessages(document);
    allMessages.forEach(function (message) {
        handleMessage(message, optionBoucledUseJvarchive, optionHideMessages, optionBlSubjectIgnoreMessages);
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

function handlePrivateMessage(privateMessageElement, author) {
    if (getAuthorBlacklistMatches(author)?.length) {
        privateMessageElement.remove(); //style.display = 'none';
        hiddenPrivateMessages++;
        return privateMessageElement;
    }
    return null;
}

async function handlePrivateMessages() {
    let optionBlAuthorIgnoreMp = GM_getValue(storage_optionBlAuthorIgnoreMp, storage_optionBlAuthorIgnoreMp_default);
    if (!optionBlAuthorIgnoreMp) return;

    const privateMessageElements = document.querySelectorAll('.list-msg > .row-mp:not(.row-head)');

    let hiddenPrivateMessageArray = [];
    for (const privateMessageElem of privateMessageElements) {
        const mpId = privateMessageElem.querySelector('.conv_select').getAttribute('value');
        let author = '';
        const participants = privateMessageElem.querySelector('.pm-list-participants');
        if (participants) {
            const mpHash = participants.getAttribute('data-hash');
            author = await getPrivateMessageAuthor(mpId, mpHash);
        }
        else {
            author = privateMessageElem.querySelector('.exp-msg > div > span').textContent.trim();
        }
        if (!author) continue;

        const hiddenMp = handlePrivateMessage(privateMessageElem, author);
        if (hiddenMp) hiddenPrivateMessageArray.push(mpId);
    }
    if (hiddenPrivateMessageArray.length > 0) {
        saveTotalHidden();
        await sendPrivateMessagesToSpam(hiddenPrivateMessageArray, true);
    }
}

async function handlePrivateMessageNotifs() {
    let optionBlAuthorIgnoreMp = GM_getValue(storage_optionBlAuthorIgnoreMp, storage_optionBlAuthorIgnoreMp_default);
    if (!optionBlAuthorIgnoreMp) return;

    const mpElem = document.querySelector('.jv-nav-account-mp > div > .jv-nav-dropdown-container-content');
    if (!mpElem) return; // not connected
    let privateMessageElements = await awaitElements(mpElem, '.jv-nav-dropdown-item');

    let hiddenPrivateMessageArray = [];
    for (const privateMessageElem of privateMessageElements) {
        const mpId = privateMessageElem.getAttribute('data-id')
        const author = privateMessageElem.querySelector('.jv-nav-dropdown-author').textContent.trim();
        const hiddenMp = handlePrivateMessage(privateMessageElem, author);
        if (hiddenMp) hiddenPrivateMessageArray.push(mpId);
    }

    if (hiddenPrivateMessageArray.length > 0) {
        /*
        // Gérer la bulle de notif ?
        const hasNotifElement = document.querySelector('.jv-account-number-mp.js-menu-dropdown.has-notif');
        if (!hasNotifElement) return;
        */
        saveTotalHidden();
        await sendPrivateMessagesToSpam(hiddenPrivateMessageArray, false);
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

    let jvArchiveButton = document.createElement('a');
    jvArchiveButton.className = 'btn btn-primary';
    jvArchiveButton.href = `${jvarchiveUrl}${window.location.pathname.slice(0, -4)}`;
    jvArchiveButton.alt = 'JvArchive';
    jvArchiveButton.target = '_blank';
    jvArchiveButton.style.marginLeft = '15px';
    jvArchiveButton.textContent = 'Consulter JvArchive';

    insertAfter(jvArchiveButton, homepageButton);
}

async function init() {
    let firstLaunch = await initStorage();
    const enableJvcDarkTheme = GM_getValue(storage_optionEnableJvcDarkTheme, storage_optionEnableJvcDarkTheme_default);
    addStyles(enableJvcDarkTheme);
    addSvgs();
    const enableDeboucledDarkTheme = GM_getValue(storage_optionEnableDeboucledDarkTheme, storage_optionEnableDeboucledDarkTheme_default);
    toggleDeboucledDarkTheme(enableDeboucledDarkTheme);
    buildSettingsPage();
    addSettingButton(firstLaunch);
}

async function entryPoint() {
    //let start = performance.now();
    let currentPageType = getCurrentPageType(`${window.location.pathname}${window.location.search}`);
    switch (currentPageType) {
        case 'topiclist': {
            await init();
            createTopicListOverlay();
            const finalTopics = await handleTopicList(true);
            await handleTopicListOptions(finalTopics);
            addRightBlocMatches();
            addRightBlocStats();
            toggleTopicOverlay(false);
            handlePrivateMessageNotifs();
            break;
        }
        case 'topicmessages': {
            await init();
            handleTopicMessages();
            break;
        }
        case 'search': {
            await init();
            await handleSearch();
            break;
        }
        case 'privatemessages': {
            await init();
            await handlePrivateMessages();
            break;
        }
        case 'error': {
            handleError();
            break;
        }
        default:
            break;
    }
    //let end = performance.now();
    //console.log(`total time = ${end - start} ms`);
}


entryPoint();

addEventListener('instantclick:newpage', entryPoint);
