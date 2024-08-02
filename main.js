
///////////////////////////////////////////////////////////////////////////////////////
// MAIN PAGE
///////////////////////////////////////////////////////////////////////////////////////

function getCurrentScriptVersion() {
    try {
        return GM_info.script.version;
    } catch (error) {
        try {
            return GM.info.script.version;
        } catch (error) {
            return '0.0.0';
        }
    }
}

async function suggestUpdate() {
    function toggleDeferUpdate(defer) {
        if (defer) store.set(storage_lastUpdateDeferredCheck, Date.now());
        else store.delete(storage_lastUpdateDeferredCheck);
    }

    const updateRes = await checkUpdate();
    if (updateRes?.length && mustRefresh(storage_lastUpdateDeferredCheck, checkUpdateDeferredExpire)) {
        if (confirm('Nouvelle version de Déboucled disponible. Voulez-vous l\'installer ?')) {
            toggleDeferUpdate(false);
            document.location.href = updateRes;
            //window.open(updateRes, '_blank').focus();
        }
        else {
            toggleDeferUpdate(true);
        }
    }
}

function filteringIsDisabled(forumId = undefined) {
    return disabledFilteringForumSet.has(forumId ?? currentForumId);
}

function getUserPseudo() {
    const pseudoElem = document.querySelector('.headerAccount__pseudo');
    if (!pseudoElem) return undefined;

    const pseudo = pseudoElem.textContent.trim();
    if (pseudo.toLowerCase() === 'mon compte' || pseudo.toLowerCase() === 'connexion') return undefined;

    const linkAccountElem = document.querySelector('.headerAccount__link');
    if (!linkAccountElem || !linkAccountElem.hasAttribute('data-account-id')) return undefined;

    return pseudo;
}

function getForumId() {
    const forumRegex = /^\/forums\/(?:0|1|42)-(?<forumid>[0-9]+)-[0-9]+-[0-9]+-0-[0-9]+-0-.*\.htm$/i;
    const currentUrl = window.location.pathname;
    const matches = forumRegex.exec(currentUrl);
    if (!matches) return null;
    const forumId = parseInt(matches.groups.forumid.trim());
    return forumId;
}

function sendFinalEvent() {
    const event = new CustomEvent('deboucled:loaded');
    dispatchEvent(event);
}

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

function getEntityRegex(entityType, fullList = true) {
    switch (entityType) {
        case entitySubject:
            return fullList ? subjectsBlacklistReg : userSubjectBlacklistReg;
        case entityAuthor:
            return fullList ? authorsBlacklistReg : userAuthorBlacklistReg;
    }
    return null;
}

function toggleDeboucledDarkTheme(enabled) {
    document.body.classList.toggle('deboucled-dark-theme', enabled);
}

function addSvgs() {
    let container = document.createElement('div');
    container.style.display = 'none';
    container.id = 'deboucled-svg-container';
    document.body.appendChild(container);

    const spiralSvg = '<svg width="24px" viewBox="0 0 24 24"><symbol id="spirallogo"><path d="M12.71,12.59a1,1,0,0,1-.71-.3,1,1,0,0,0-1.41,0,1,1,0,0,1-1.42,0,1,1,0,0,1,0-1.41,3.08,3.08,0,0,1,4.24,0,1,1,0,0,1,0,1.41A1,1,0,0,1,12.71,12.59Z"/><path d="M12.71,14a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42h0a1,1,0,0,1,1.41-1.41,2,2,0,0,1,0,2.83A1,1,0,0,1,12.71,14Z"/><path d="M9.88,16.83a1,1,0,0,1-.71-.29,4,4,0,0,1,0-5.66,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,2,2,0,0,0,0,2.83,1,1,0,0,1,0,1.42A1,1,0,0,1,9.88,16.83Z"/><path d="M12.71,18a5,5,0,0,1-3.54-1.46,1,1,0,1,1,1.42-1.42,3.07,3.07,0,0,0,4.24,0,1,1,0,0,1,1.41,0,1,1,0,0,1,0,1.42A5,5,0,0,1,12.71,18Z"/><path d="M15.54,16.83a1,1,0,0,1-.71-1.71,4,4,0,0,0,0-5.66,1,1,0,0,1,1.41-1.41,6,6,0,0,1,0,8.49A1,1,0,0,1,15.54,16.83Z"/><path d="M7.05,9.76a1,1,0,0,1-.71-1.71,7,7,0,0,1,9.9,0,1,1,0,1,1-1.41,1.41,5,5,0,0,0-7.07,0A1,1,0,0,1,7.05,9.76Z"/><path d="M7.05,19.66a1,1,0,0,1-.71-.3,8,8,0,0,1,0-11.31,1,1,0,0,1,1.42,0,1,1,0,0,1,0,1.41,6,6,0,0,0,0,8.49,1,1,0,0,1-.71,1.71Z"/><path d="M12.71,22a9,9,0,0,1-6.37-2.64,1,1,0,0,1,0-1.41,1,1,0,0,1,1.42,0,7,7,0,0,0,9.9,0,1,1,0,0,1,1.41,1.41A8.94,8.94,0,0,1,12.71,22Z"/><path d="M18.36,19.66a1,1,0,0,1-.7-.3,1,1,0,0,1,0-1.41,8,8,0,0,0,0-11.31,1,1,0,0,1,0-1.42,1,1,0,0,1,1.41,0,10,10,0,0,1,0,14.14A1,1,0,0,1,18.36,19.66Z"/><path d="M4.22,6.93a1,1,0,0,1-.71-.29,1,1,0,0,1,0-1.42,11,11,0,0,1,15.56,0,1,1,0,0,1,0,1.42,1,1,0,0,1-1.41,0,9,9,0,0,0-12.73,0A1,1,0,0,1,4.22,6.93Z"/></symbol></svg>';
    addSvg(spiralSvg);

    const forbiddenSvg = '<svg><symbol id="forbiddenlogo"><g><ellipse stroke-width="20" ry="70" rx="70" cy="80" cx="80" /><line y2="37.39011" x2="122.60989" y1="122.60989" x1="37.39011" stroke-width="20" /></g></symbol></svg>';
    addSvg(forbiddenSvg);

    const previewSvg = '<svg viewBox="0 0 30 30" width="30px" height="30px"><symbol id="previewlogo"><path fill="#b6c9d6" d="M2.931,28.5c-0.382,0-0.742-0.149-1.012-0.419c-0.558-0.558-0.558-1.466,0-2.024l14.007-13.353 l1.375,1.377L3.935,28.089C3.673,28.351,3.313,28.5,2.931,28.5z"/><path fill="#788b9c" d="M15.917,13.403l0.685,0.686L3.589,27.727C3.413,27.903,3.18,28,2.931,28 c-0.249,0-0.482-0.097-0.658-0.273c-0.363-0.363-0.363-0.953-0.017-1.3L15.917,13.403 M15.934,12.005L1.565,25.704 c-0.754,0.754-0.754,1.977,0,2.731C1.943,28.811,2.437,29,2.931,29c0.494,0,0.988-0.189,1.365-0.566L18,14.073L15.934,12.005 L15.934,12.005z"/><g><path fill="#d1edff" d="M19,20.5c-5.238,0-9.5-4.262-9.5-9.5s4.262-9.5,9.5-9.5s9.5,4.262,9.5,9.5S24.238,20.5,19,20.5z"/><path fill="#788b9c" d="M19,2c4.963,0,9,4.037,9,9s-4.037,9-9,9s-9-4.037-9-9S14.037,2,19,2 M19,1C13.477,1,9,5.477,9,11 s4.477,10,10,10s10-4.477,10-10S24.523,1,19,1L19,1z"/></g></symbol></svg>';
    addSvg(previewSvg);

    const githubSvg = '<svg viewBox="0 0 16 16" height="32" width="32"><symbol id="githublogo"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></symbol></svg>';
    addSvg(githubSvg);

    const refreshSvg = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><symbol id="refreshlogo"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></symbol></svg>';
    addSvg(refreshSvg);

    const smoothScrollSvg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" fill="#000" viewBox="0 0 460.088 460.088" style="enable-background:new 0 0 460.088 460.088;" xml:space="preserve"><symbol id="smoothscrolllogo"><path d="M25.555,139.872h257.526V88.761H25.555C11.442,88.761,0,100.203,0,114.316C0,128.429,11.442,139.872,25.555,139.872z"/><path d="M25.555,242.429h257.526v-51.111H25.555C11.442,191.318,0,202.76,0,216.874C0,230.988,11.442,242.429,25.555,242.429z"/><path d="M25.555,293.874v0.001C11.442,293.875,0,305.316,0,319.43s11.442,25.555,25.555,25.555h178.91c-2.021-6.224-3.088-12.789-3.088-19.523c0-11.277,2.957-22.094,8.48-31.588H25.555z"/><path d="M450.623,302.611c-12.62-12.621-33.083-12.621-45.704,0l-26.535,26.535V52.926c0-17.849-14.469-32.317-32.318-32.317s-32.318,14.469-32.318,32.317v276.22l-26.535-26.535c-12.621-12.62-33.083-12.621-45.704,0c-12.621,12.621-12.621,33.083,0,45.704l81.7,81.699c12.596,12.6,33.084,12.643,45.714,0l81.7-81.699C463.243,335.694,463.244,315.232,450.623,302.611z"/></symbol></svg>';
    addSvg(smoothScrollSvg);
}

function getCurrentPageType(url) {
    if (document.querySelector('.img-erreur') !== null) return 'error';

    let topicListRegex = /^\/forums\/0-[0-9]+-0-1-0-[0-9]+-0-.*\.htm$/i;
    if (url.match(topicListRegex)) return 'topiclist';

    let topicMessagesRegex = /^\/forums\/(42|1)-[0-9]+-[0-9]+-[0-9]+-0-1-0-.*\.htm$/i;
    if (url.match(topicMessagesRegex)) return 'topicmessages';

    let searchRegex = /^\/recherche\/forums\/0-[0-9]+-0-1-0-[0-9]+-0-.*/i;
    if (url.match(searchRegex)) return 'search';

    let privateMessagesRegex = /^\/messages-prives/i;
    if (url.match(privateMessagesRegex)) return 'privatemessages';

    let profilRegex = /^\/profil\/.*$/i;
    if (url.match(profilRegex)) return 'profil';

    let ssoRegex = /^\/sso/i;
    if (url.match(ssoRegex)) return 'sso';

    return 'unknown';
}

function buildTopicNewPageUri(newPageId) {
    let urlRegex = /^(\/forums\/(?:42|1)-[0-9]+-[0-9]+-)(?<pageid>[0-9]+)(-0-1-0-.*\.htm)$/i;
    let currentPath = window.location.pathname;
    let newPageUrl = currentPath.replace(urlRegex, `$1${newPageId}$3`);
    return newPageUrl;
}

async function getTopicPageContent(pageId) {
    return fetchHtml(buildTopicNewPageUri(pageId));
}

async function getForumPageContent(page) {
    let urlRegex = /(\/forums\/0-[0-9]+-0-1-0-)(?<pageid>[0-9]+)(-0-.*)/i;

    let currentPath = window.location.pathname;
    let matches = urlRegex.exec(currentPath);
    let currentPageId = parseInt(matches.groups.pageid);

    let nextPageId = currentPageId + ((page - 1) * defaultTopicCount);
    let nextPageUrl = currentPath.replace(urlRegex, `$1${nextPageId}$3`);

    return fetchHtml(nextPageUrl);
}

async function handlePendingMessageQuotes() {
    const validatedQuotes = messageQuotesPendingArray?.filter(mqp => mqp.status === 'validated');

    if (validatedQuotes?.length) {
        const currentUrlHash = window.location.hash;
        const match = currentUrlHash.match(/^#post_(?<messageid>[0-9]{10})/);
        const messageId = match?.groups?.messageid;
        if (!messageId?.length) return;

        validatedQuotes.forEach(q => {
            q.newMessageId = messageId;
            q.newMessageUrl = window.location.href;
            sendMessageQuote(q);
        });
    }

    await cleanupPendingMessageQuotes();
}

async function handleTopicList(canFillTopics, topicOptions) {
    let topics = getAllTopics(document);
    if (!topics?.length) return;

    parseHotTopicsData();

    let topicsToRemove = [];
    let finalTopics = [];
    finalTopics.push(topics[0]); // header

    for (let topic of topics.slice(1)) {
        const topicBlacklisted = await isTopicBlacklisted(topic, topicOptions);
        if (topicBlacklisted) {
            topicsToRemove.push(topic);
            hiddenTotalTopics++;
        }
        else finalTopics.push(topic);
    }
    if (canFillTopics) {
        const filledTopics = await fillTopics(topics, topicOptions);
        finalTopics = finalTopics.concat(filledTopics);
    }
    topicsToRemove.forEach(removeTopic);

    updateTopicsHeader();
    saveTotalHidden();
    if (canFillTopics) updateTopicHiddenAtDate();

    return finalTopics;
}

async function handleTopicListOptions(topics, topicOptions) {
    if (topicOptions.optionDisplayBlacklistTopicButton) addIgnoreButtons(topics);

    if (topicOptions.optionPrevisualizeTopic) addPrevisualizeTopicEvent(topics);

    if (topicOptions.optionDisplayBlackTopic || topicOptions.optionReplaceResolvedPicto)
        handleTopicPictos(topics, topicOptions.optionDisplayBlackTopic, topicOptions.optionReplaceResolvedPicto);

    if (topicOptions.optionRemoveUselessTags) removeUselessTags(topics);

    if (topicOptions.optionDisplayTitleSmileys) createTopicTitleSmileys(topics);

    await parseTopicListAuthors(topics, topicOptions.optionDisplayBadges);

    handlePoc(topics, topicOptions.optionDetectPocMode); // not necessary to await

    if (topicOptions.optionDisplayHotTopics) handleHotTopics(topics);

    if (topicOptions.optionDisplayTopicAvatar) handleTopicAvatars(topics);
}

async function parseTopicListAuthors(topics, optionDisplayBadges) {
    topics.slice(1).forEach(function (topic) {
        const author = topic.querySelector('.topic-author')?.textContent?.trim()?.toLowerCase();
        if (!author?.length) return;

        if (optionDisplayBadges) {
            const excludedLists = [];
            if (topic.querySelector('#deboucled_ai_boucledauthor,#deboucled_ai_boucledsubject')) excludedLists.push('boucledauthors');
            buildAuthorBlacklistBadges(author, topic.querySelector('.topic-subject'), excludedLists);
        }

        const topicId = getTopicId(topic);
        if (!topicId) return;

        topicAuthorMap.set(topicId, author);
    });

    await saveLocalStorage();
}

async function handleHotTopics(finalTopics) {
    if (!hotTopicsData?.length) return;

    const matchMediaMediumWidth = window.matchMedia('(min-width: 1000px) and (max-width: 1479px)')?.matches;

    finalTopics.slice(1).forEach(topic => {
        if (!isHotTopic(topic)) return;

        const titleElem = topic.querySelector('.lien-jv.topic-title');
        if (matchMediaMediumWidth) {
            markTopicHot(titleElem, false); // put the flag before the subject
        }
        else {
            titleElem.style.overflow = 'visible';
            markTopicHot(titleElem, true);
        }
    });
}

async function handlePoc(finalTopics, optionDetectPocMode) {
    // 0 = désactivé ; 1 = recherche simple ; 2 = recherche approfondie ; 3 = recherche simple automatique ; 4 = recherche approfondie automatique
    if (optionDetectPocMode === 0) return;

    // On gère les PoC à la fin pour ne pas figer la page pendant le traitement
    await Promise.all(finalTopics.slice(1).map(async function (topic) {
        let isPoc = await isTopicPoC(topic, optionDetectPocMode);
        if (!isPoc) return;

        const hideTopic = optionDetectPocMode === 3 || optionDetectPocMode === 4;
        if (hideTopic) {
            removeTopic(topic);
            hiddenTotalTopics++;
            updateTopicsHeader();
        }
        else {
            const titleElem = topic.querySelector('.lien-jv.topic-title');
            titleElem.style.width = 'auto';
            markTopicPoc(titleElem);
        }
    }));

    await saveLocalStorage();
}

function highlightBlacklistedAuthor(messageElement, authorElement, withTooltip = true) {
    const pictoCross = messageElement?.querySelector('span.picto-msg-croix');

    const author = authorElement.textContent.trim().toLowerCase();
    if (pictoCross || (userPseudo && userPseudo.toLowerCase() === author)) return;

    authorElement.classList.toggle('deboucled-blacklisted', true);

    if (!withTooltip) return;

    const blacklists = blacklistsIncludingEntity(author, entityAuthor);
    if (!blacklists.length) return;

    const blacklistHint = `Présent dans : ${blacklists.map(bl => `« ${bl.description} »`).join(', ')}.`;
    authorElement.setAttribute('deboucled-data-tooltip', blacklistHint);
    authorElement.setAttribute('data-tooltip-location', 'right');
}

function highlightBlacklistMatches(element, matches) {
    let content = element.textContent;

    // Supprime les surrogate pairs car c'est ingérable
    // Surrogate pairs = grosse merde = JS = calvitie foudroyante
    const pureMatches = matches.map(m => m.removeSurrogatePairs().trim()).filter(m => m !== '');

    const buildBlacklistHint = (match) => {
        const blacklists = blacklistsIncludingEntity(match, entitySubject);
        if (blacklists.length) return ` deboucled-data-tooltip="Présent dans : ${blacklists.map(bl => `« ${bl.description} »`).join(', ')}." data-tooltip-location="right" `;
        return '';
    };

    let index = -1;
    pureMatches.every(match => {
        const normMatch = match.normalizeDiacritic();
        const normContent = content.normalizeDiacritic();
        index = normContent.indexOf(normMatch, index + 1);
        if (index <= -1) return false;
        const realMatchContent = content.slice(index, index + normMatch.length);
        const newContent = `<span class="deboucled-blacklisted"${buildBlacklistHint(match)}>${realMatchContent}</span>`;
        content = `${content.slice(0, index)}${newContent}${content.slice(index + match.length, content.length)}`;
        index += newContent.length;
        return true;
    });

    if (element.nodeType === Node.TEXT_NODE) {
        let newNode = document.createElement('span');
        element.parentElement.insertBefore(newNode, element);
        element.remove();
        newNode.outerHTML = content;
    }
    else {
        element.innerHTML = content;
    }
}

function blacklistsIncludingEntity(entity, entityType, mustBeEnabled = true) {
    let blacklists = [];
    let normEntity = entity.normalizeDiacritic();
    if (entityType == entityAuthor) normEntity = normEntity.toLowerCase();

    const userBlacklistRegex = getEntityRegex(entityType, false);
    if (userBlacklistRegex && normEntity.match(userBlacklistRegex))
        blacklists.push({
            id: `custom_${entityType}`,
            description: `Liste noire ${getEntityTitle(entityType)}`,
            shortDescription: `Liste noire ${getEntityTitle(entityType)}`,
            enabled: true
        });

    preBoucleArray
        .filter(pb => pb.type === entityType)
        .filter(pb => !mustBeEnabled || pb.enabled)
        .forEach(pb => {
            if (normEntity.match(pb.regex))
                blacklists.push({
                    id: pb.id,
                    description: pb.title,
                    shortDescription: pb.shortTitle,
                    enabled: pb.enabled
                });
        });

    return blacklists;
}

function handleMessageBlacklistMatches(messageElement) {
    function highlightMatches(textChild) {
        const matches = getSubjectBlacklistMatches(textChild.textContent);
        if (!matches?.length) return false;
        matchedSubjects.addArrayIncrement(matches);
        hiddenSubjects++;
        highlightBlacklistMatches(textChild, matches);
        return true;
    }

    function highlightChildren(element) {
        let hasMatch = false;
        // Un message contient une balise p pour chaque ligne
        // Un p peut contenir du texte ou du html (img, a, etc ET strong, b, u, etc)
        let paragraphChildren = getParagraphChildren(element);
        paragraphChildren.forEach(paragraph => {
            const textChildren = getTextChildren(paragraph); // on ne s'intéresse qu'au texte
            textChildren.forEach(textChild => { hasMatch = highlightMatches(textChild) ? true : hasMatch; });
            hasMatch = highlightChildren(paragraph) ? true : hasMatch;
        });
        return hasMatch;
    }

    return highlightChildren(messageElement);
}

function hideMessageContent(contentElement, wrapperAltClass = '') {
    const blocContenu = contentElement?.parentElement;
    if (!blocContenu) return;
    blocContenu.style.display = 'none';

    let divWrapper = document.createElement('div');
    divWrapper.className = `deboucled-matches-wrapper deboucled-message-wrapper ${wrapperAltClass}`.trim();
    //blocContenu.parentElement.appendChild(divWrapper);
    blocContenu.insertAdjacentElement('afterend', divWrapper);

    let spanEye = document.createElement('span');
    const whiteEyeClass = preferDarkTheme() ? '-white' : '';
    spanEye.className = `deboucled-eye${whiteEyeClass}-logo deboucled-display-matches`;
    divWrapper.appendChild(spanEye);
    divWrapper.appendChild(blocContenu);

    divWrapper.onclick = function () {
        this.firstChild.remove();
        this.removeAttribute('class');
        blocContenu.removeAttribute('style');
        divWrapper.onclick = null;
    };
}

function handleBlSubjectIgnoreMessages(messageElement) {
    let contentElement = messageElement.querySelector('.txt-msg.text-enrichi-forum');
    if (!contentElement) return;

    let hasAnyMatch = handleMessageBlacklistMatches(contentElement);
    if (!hasAnyMatch) return;

    hideMessageContent(contentElement);
}

function handleMessage(messageElement, messageOptions, isFirstMessage = false) {
    const authorElement = messageElement.querySelector('a.bloc-pseudo-msg, span.bloc-pseudo-msg');
    if (!authorElement) return;

    const title = getTopicTitle();
    const author = authorElement.textContent.trim();
    const isSelf = userPseudo?.toLowerCase() === author.toLowerCase();
    const mpBloc = messageElement.querySelector('div.bloc-mp-pseudo');
    const messageContent = messageElement.querySelector('.txt-msg.text-enrichi-forum');

    function handleBlacklistedAuthor(authorMatch) {
        if (messageOptions.optionHideMessages && !isFirstMessage) {
            removeMessage(messageElement);
            hiddenMessages++;
            hiddenAuthorArray.add(author);
            matchedAuthors.addArrayIncrement(authorMatch);
            hiddenAuthors++;
            return true; // si on a supprimé le message on se casse, plus rien à faire
        }
        else {
            highlightBlacklistedAuthor(messageElement, authorElement);
            addAuthorButtons(mpBloc, author, messageOptions.optionBoucledUseJvarchive);
            if (!messageOptions.isWhitelistedTopic) hideMessageContent(messageContent);
            return false;
        }
    }

    const authorBlacklistedMatch = getAuthorBlacklistMatches(author, isSelf);
    if (authorBlacklistedMatch?.length) {
        if (handleBlacklistedAuthor(authorBlacklistedMatch)) return;
    }
    else if (messageOptions.optionAntiSpam && isContentYoutubeBlacklisted(messageContent)) {
        addEntityBlacklist(shadowent, author); // on rajoute automatiquement le spammeur à la BL
        buildBlacklistsRegex(entityAuthor);
        hiddenSpammers++;
        if (handleBlacklistedAuthor([author])) return;
    }
    else {
        let optionShowJvcBlacklistButton = store.get(storage_optionShowJvcBlacklistButton, storage_optionShowJvcBlacklistButton_default);
        upgradeJvcBlacklistButton(messageElement, author, optionShowJvcBlacklistButton);
        addAuthorButtons(mpBloc, author, messageOptions.optionBoucledUseJvarchive);
    }

    handleMessageAssignTopicAuthor(author, authorElement);
    buildAuthorBadges(authorElement, author, messageOptions, title);
    fixMessageUrls(messageContent);
    embedZupimages(messageContent);
    embedVocaroo(messageContent);

    if (messageOptions.optionDecensureTwitter) {
        decensureTwitterLinks(messageContent);
    }

    if (messageOptions.optionEnhanceQuotations) {
        highlightSpecialAuthors(author, authorElement, isSelf);
        highlightQuotedAuthor(messageContent, messageElement);
        enhanceBlockquotes(messageContent);
        if (messageOptions.optionHideMessages) handleQuotedAuthorBlacklist(messageContent);
    }

    if (messageOptions.optionBlSubjectIgnoreMessages && !isSelf) {
        handleBlSubjectIgnoreMessages(messageElement);
    }

    const topicFilteredAuthor = topicFilteredAuthorMap.get(currentTopicId);
    if (topicFilteredAuthor?.length && author.toLowerCase() !== topicFilteredAuthor.toLowerCase()) {
        messageElement.style.display = 'none';
    }
}

async function parseTopicAuthor(pageId) {
    if (!currentTopicId || topicAuthorMap.has(currentTopicId)) return topicAuthorMap.get(currentTopicId);

    if (!pageId) pageId = getTopicCurrentPageId();
    if (!pageId) return;

    let currentDoc = document;
    if (pageId !== 1) {
        currentDoc = await getTopicPageContent('1');
        if (!currentDoc) return;
    }

    let allMessages = getAllMessages(currentDoc);
    if (allMessages.length === 0) return;
    const firstMessage = allMessages[0];
    if (!firstMessage) return;

    const author = firstMessage.querySelector('.bloc-pseudo-msg')?.textContent.trim().toLowerCase();
    topicAuthorMap.set(currentTopicId, author);

    await saveLocalStorage();

    return author;
}

function handleTopicWhitelist() {
    const titleBlocElement = document.querySelector('.titre-bloc.titre-bloc-forum');
    if (!titleBlocElement) return false;
    if (!currentTopicId) return false;

    const topicIdIndex = topicIdWhitelistArray.indexOf(currentTopicId);
    const isWhitelisted = topicIdIndex >= 0;

    let whitelistButtonElement = document.createElement('span');
    const whiteEyeClass = preferDarkTheme() ? '-white' : '';
    whitelistButtonElement.className = isWhitelisted ? `deboucled-closed-eye${whiteEyeClass}-logo big` : `deboucled-eye${whiteEyeClass}-logo big`;
    whitelistButtonElement.setAttribute('deboucled-data-tooltip', isWhitelisted ? 'Masquer les messages blacklist' : 'Afficher les messages blacklist pour ce topic');
    whitelistButtonElement.setAttribute('data-tooltip-location', 'right');
    whitelistButtonElement.onclick = async () => {
        if (isWhitelisted) topicIdWhitelistArray.splice(topicIdIndex, 1);
        else topicIdWhitelistArray.push(currentTopicId);
        await saveStorage();
        location.reload();
    };
    titleBlocElement.prepend(whitelistButtonElement);

    return isWhitelisted;
}

function highlightTopicHeaderTitle() {
    let titleElement = document.querySelector('#bloc-title-forum');
    if (!titleElement) return;

    const subjectMatches = getSubjectBlacklistMatches(titleElement.textContent);
    if (!subjectMatches?.length) return;

    matchedSubjects.addArrayIncrement(subjectMatches);
    hiddenSubjects++;

    highlightBlacklistMatches(titleElement, subjectMatches);
}

function buildTopicHeaderBadges() {
    const titleElement = document.querySelector('#bloc-title-forum');
    if (!titleElement || !currentTopicAuthor?.length || !currentTopicId) return;

    if (getTopicPocStatus(currentTopicId)) {
        markTopicPoc(titleElement, false);
    }

    const optionAntiLoopAiMode = store.get(storage_optionAntiLoopAiMode, storage_optionAntiLoopAiMode_default);
    if (optionAntiLoopAiMode !== 0) {
        const title = titleElement.textContent.trim();
        const topicLoop = getTopicLoop(title, currentTopicAuthor);
        if (topicLoop.isSubjectLoop) markTopicLoop(topicLoop.loopSubject, titleElement, false);
    }
}

function createTopicHeaderSmileys() {
    const titleElement = document.querySelector('#bloc-title-forum');
    if (!titleElement) return;
    titleElement.innerHTML = titleElement.innerHTML.replace(smileyGifRegex, (e) => getSmileyImgHtml(e, true));
}

function handleTopicHeader(messageOptions) {
    highlightTopicHeaderTitle();
    buildTopicHeaderBadges();
    if (messageOptions.optionDisplayTitleSmileys) createTopicHeaderSmileys();
}

function displayTopicDeboucledMessage() {
    const topBlocPagi = document.querySelector('.bloc-pagi-default');
    if (!topBlocPagi) return;
    let topicDeboucledDiv = document.createElement('div');
    topicDeboucledDiv.className = 'bloc-message-forum deboucled-topic-deboucled-message';
    topicDeboucledDiv.textContent = 'Topic 100% déboucled !';
    insertAfter(topicDeboucledDiv, topBlocPagi);
}

function prepareTopicOptions() {
    return {
        optionAllowDisplayThreshold: store.get(storage_optionAllowDisplayThreshold, storage_optionAllowDisplayThreshold_default),
        optionDisplayThreshold: store.get(storage_optionDisplayThreshold, storage_optionDisplayThreshold_default),
        optionEnableTopicMsgCountThreshold: store.get(storage_optionEnableTopicMsgCountThreshold, storage_optionEnableTopicMsgCountThreshold_default),
        optionTopicMsgCountThreshold: store.get(storage_optionTopicMsgCountThreshold, storage_optionTopicMsgCountThreshold_default),
        optionAntiVinz: store.get(storage_optionAntiVinz, storage_optionAntiVinz_default),
        optionAntiLoopAiMode: store.get(storage_optionAntiLoopAiMode, storage_optionAntiLoopAiMode_default),
        optionDisplayHotTopics: store.get(storage_optionDisplayHotTopics, storage_optionDisplayHotTopics_default),
        optionDisplayBadges: store.get(storage_optionDisplayBadges, storage_optionDisplayBadges_default),
        optionDetectPocMode: store.get(storage_optionDetectPocMode, storage_optionDetectPocMode_default),
        optionDisplayBlacklistTopicButton: store.get(storage_optionDisplayBlacklistTopicButton, storage_optionDisplayBlacklistTopicButton_default),
        optionPrevisualizeTopic: store.get(storage_optionPrevisualizeTopic, storage_optionPrevisualizeTopic_default),
        optionDisplayBlackTopic: store.get(storage_optionDisplayBlackTopic, storage_optionDisplayBlackTopic_default),
        optionReplaceResolvedPicto: store.get(storage_optionReplaceResolvedPicto, storage_optionReplaceResolvedPicto_default),
        optionRemoveUselessTags: store.get(storage_optionRemoveUselessTags, storage_optionRemoveUselessTags_default),
        optionDisplayTitleSmileys: store.get(storage_optionDisplayTitleSmileys, storage_optionDisplayTitleSmileys_default),
        optionDisplayTopicAvatar: store.get(storage_optionDisplayTopicAvatar, storage_optionDisplayTopicAvatar_default),
        optionFilterHotTopics: store.get(storage_optionFilterHotTopics, storage_optionFilterHotTopics_default)
    };
}

function prepareMessageOptions(isWhitelistedTopic) {
    return {
        optionHideMessages: !isWhitelistedTopic && store.get(storage_optionHideMessages, storage_optionHideMessages_default),
        optionBoucledUseJvarchive: store.get(storage_optionBoucledUseJvarchive, storage_optionBoucledUseJvarchive_default),
        optionBlSubjectIgnoreMessages: !isWhitelistedTopic && store.get(storage_optionBlSubjectIgnoreMessages, storage_optionBlSubjectIgnoreMessages_default),
        optionEnhanceQuotations: store.get(storage_optionEnhanceQuotations, storage_optionEnhanceQuotations_default),
        optionAntiSpam: store.get(storage_optionAntiSpam, storage_optionAntiSpam_default),
        optionSmoothScroll: store.get(storage_optionSmoothScroll, storage_optionSmoothScroll_default),
        optionHideLongMessages: store.get(storage_optionHideLongMessages, storage_optionHideLongMessages_default),
        optionDisplayTitleSmileys: store.get(storage_optionDisplayTitleSmileys, storage_optionDisplayTitleSmileys_default),
        optionDecensureTwitter: store.get(storage_optionDecensureTwitter, storage_optionDecensureTwitter_default),
        optionAntiLoopAiMode: store.get(storage_optionAntiLoopAiMode, storage_optionAntiLoopAiMode_default),
        optionDisplayBadges: store.get(storage_optionDisplayBadges, storage_optionDisplayBadges_default),
        isWhitelistedTopic: isWhitelistedTopic
    };
}

async function handleTopicMessages() {
    currentTopicId = getCurrentTopicId();
    currentTopicPageId = getTopicCurrentPageId();
    currentTopicAuthor = await parseTopicAuthor();

    const isWhitelistedTopic = handleTopicWhitelist();

    const messageOptions = prepareMessageOptions(isWhitelistedTopic);

    handleTopicHeader(messageOptions);

    handleJvChatAndTopicLive(messageOptions);

    const allMessages = getAllMessages(document);

    const isFirstMessage = (index) => index === 0 && currentTopicPageId === 1;
    allMessages.forEach((message, index) => handleMessage(message, messageOptions, isFirstMessage(index)));

    updateFilteredMessages();

    if (hiddenSpammers > 0) refreshAuthorKeys();
    if (hiddenMessages === allMessages.length) displayTopicDeboucledMessage();

    addRightBlocMatches();
    saveTotalHidden();

    addMessageQuoteEvents(allMessages); // Always enhance standard quotes
    if (messageOptions.optionEnhanceQuotations) {
        addMessagePartialQuoteEvents(allMessages);
        addAuthorSuggestionEvent();
    }

    const smoothScrollCallback = () => createSmoothScroll((m) => handleMessage(m, messageOptions));
    if (messageOptions.optionSmoothScroll) {
        smoothScrollCallback();
    }
    else {
        buildEnableSmoothScrollButton(smoothScrollCallback);
    }

    if (messageOptions.optionHideLongMessages) handleLongMessages(allMessages);

    const postMessageElement = document.querySelector('.btn-poster-msg');
    prependEvent(postMessageElement, 'click', async () => await validatePendingMessageQuotes());

    autoRefreshPagination();
}

async function handleSearch() {
    const optionFilterResearch = addSearchFilterToggle();
    const topicOptions = prepareTopicOptions();
    if (optionFilterResearch) await handleTopicList(false, topicOptions);

    let topics = getAllTopics(document);
    if (!topics || topics.length <= 1) return; // first is header
    await handleTopicListOptions(topics, topicOptions);
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
    let optionBlAuthorIgnoreMp = store.get(storage_optionBlAuthorIgnoreMp, storage_optionBlAuthorIgnoreMp_default);
    if (!optionBlAuthorIgnoreMp) return;

    const privateMessageElements = document.querySelectorAll('.list-msg > .row-mp:not(.row-head)');

    let hiddenPrivateMessageArray = [];

    async function handlePrivateMessageElem(privateMessageElem) {
        const mpId = privateMessageElem.querySelector('.conv_select').getAttribute('value');
        let author = undefined;
        const participants = privateMessageElem.querySelector('.pm-list-participants');
        if (participants) {
            const mpHash = participants.getAttribute('data-hash');
            author = await getPrivateMessageAuthor(mpId, mpHash);
        }
        else {
            author = privateMessageElem.querySelector('.exp-msg > div > span').textContent.trim();
        }
        if (!author) return;
        const hiddenMp = handlePrivateMessage(privateMessageElem, author);
        if (hiddenMp) hiddenPrivateMessageArray.push(mpId);
    }

    let tasks = [...privateMessageElements].map(handlePrivateMessageElem);
    await Promise.all(tasks);

    if (hiddenPrivateMessageArray.length > 0) {
        saveTotalHidden();
        await sendPrivateMessagesToSpam(hiddenPrivateMessageArray, true);
    }
}

function buildBoucledAuthorButton(author, optionBoucledUseJvarchive, className = 'deboucled-svg-spiral-gray') {
    const backToForumElement = document.querySelector('div.group-two > a:nth-child(2)');
    const forumUrl = backToForumElement?.getAttribute('href');

    let redirectUrl = '';
    if (optionBoucledUseJvarchive || !forumUrl) redirectUrl = `${jvarchiveUrl}/topic/recherche?search=${author}&searchType=auteur_topic_exact`;
    else redirectUrl = `/recherche${forumUrl}?search_in_forum=${author}&type_search_in_forum=auteur_topic`;

    let boucledAuthorAnchor = document.createElement('a');
    boucledAuthorAnchor.setAttribute('class', `xXx lien-jv deboucled-author-boucled-button ${className}`);
    boucledAuthorAnchor.setAttribute('href', redirectUrl);
    boucledAuthorAnchor.setAttribute('target', '_blank');
    boucledAuthorAnchor.setAttribute('title', 'Pseudo complètement boucled ?');
    boucledAuthorAnchor.innerHTML = '<svg viewBox="0 0 24 24" id="deboucled-spiral-logo"><use href="#spirallogo"/></svg></a>';
    return boucledAuthorAnchor;
}

async function handleProfile(profileTab) {
    const infosPseudoElement = document.querySelector('.infos-pseudo-name > h1.infos-pseudo-label');
    if (!infosPseudoElement) return;
    const author = infosPseudoElement.textContent.trim();

    let blocOptionProfil = document.querySelector('.bloc-option-profil');
    if (!blocOptionProfil) {
        blocOptionProfil = document.createElement('div');
        blocOptionProfil.className = 'bloc-option-profil';
        insertAfter(blocOptionProfil, infosPseudoElement);
    }

    let boucledButton = buildBoucledAuthorButton(author, true, 'deboucled-svg-spiral-white');
    blocOptionProfil.append(boucledButton);

    let jvArchiveProfilButton = buildJvArchiveProfilButton(author);
    blocOptionProfil.append(jvArchiveProfilButton);

    const authorBlacklistMatches = getAuthorBlacklistMatches(author);
    if (authorBlacklistMatches?.length) {
        highlightBlacklistedAuthor(undefined, infosPseudoElement.firstElementChild ?? infosPseudoElement, false);
    }
    else if (!userPseudo || userPseudo.toLowerCase() !== author.toLowerCase()) {
        let dbcBlacklistButton = buildDeboucledBlacklistButton(author, () => { location.reload(); }, 'deboucled-blacklist-profil-button');
        blocOptionProfil.append(dbcBlacklistButton);
    }

    buildProfileBlacklistBadges(author, infosPseudoElement);

    if (profileTab.match(/^\?mode=infos$/i)) {
        await buildProfileStats(author);
        await buildProfileHistory(author);
    }
}

async function handlePrivateMessageNotifs() {
    let optionBlAuthorIgnoreMp = store.get(storage_optionBlAuthorIgnoreMp, storage_optionBlAuthorIgnoreMp_default);
    if (!optionBlAuthorIgnoreMp) return;

    const mpElem = document.querySelector('.headerAccount--pm > .headerAccount__dropdownContainer > .headerAccount__dropdownContainerContent');
    if (!mpElem) return; // not connected
    let privateMessageElements = await awaitElements(mpElem, '.headerAccount__dropdownItem');

    let hiddenPrivateMessageArray = [];
    for (const privateMessageElem of privateMessageElements) {
        const mpId = privateMessageElem.getAttribute('data-id');
        const author = privateMessageElem.querySelector('.headerAccount__dropdownSubInfo--author').textContent.trim();
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

    function goToJvArchiveButton(pathUrl) {
        let jvArchiveButton = document.createElement('a');
        jvArchiveButton.className = 'btn deboucled-goto-jvarchive btn-primary mb-5';
        jvArchiveButton.href = `${jvarchiveUrl}${pathUrl}`;
        jvArchiveButton.alt = 'JvArchive';
        jvArchiveButton.target = '_blank';
        jvArchiveButton.innerHTML = '<span class="deboucled-jvarchive-logo" style="margin-right:5px; vertical-align: sub;"></span>Consulter JvArchive';

        insertAfter(jvArchiveButton, homepageButton);
    }

    if (currentForumId) { // 410 d'un topic
        const forumUrl = `/forums/0-${currentForumId}-0-1-0-1-0-forum.htm`;
        homepageButton.textContent = 'Retour au forum';
        homepageButton.href = forumUrl;

        goToJvArchiveButton(window.location.pathname.slice(0, -4));
    }
    else { // 410 d'un message
        goToJvArchiveButton(window.location.pathname);
    }
}

function loadStyles() {
    const enableJvRespawnRefinedTheme = store.get(storage_optionEnableJvRespawnRefinedTheme, storage_optionEnableJvRespawnRefinedTheme_default);
    const hideAvatarBorder = store.get(storage_optionHideAvatarBorder, storage_optionHideAvatarBorder_default);
    addStyles(enableJvRespawnRefinedTheme, hideAvatarBorder);
}

async function updateCurrentUser() {
    initUserId();

    const lastUsedUserPseudo = store.get(storage_lastUsedPseudo, storage_lastUsedPseudo_default);
    userPseudo = getUserPseudo();
    if (userPseudo?.length && lastUsedUserPseudo.toLowerCase() !== userPseudo.toLowerCase()) {
        store.set(storage_lastUsedPseudo, userPseudo);
        await updateUser(true);
    }
}

async function init(currentPageType) {
    loadStyles();

    currentForumId = getForumId();

    await updateCurrentUser();

    await initStorage();

    if (currentPageType === 'sso' || currentPageType === 'error') return;

    addSvgs();

    const enableDeboucledDarkTheme = store.get(storage_optionEnableDeboucledDarkTheme, storage_optionEnableDeboucledDarkTheme_default);
    toggleDeboucledDarkTheme(enableDeboucledDarkTheme);

    const optionGetMessageQuotes = store.get(storage_optionGetMessageQuotes, storage_optionGetMessageQuotes_default);
    if (optionGetMessageQuotes) buildQuoteNotifications();

    buildSettingsPage();
    addSettingButton();
    addDisableFilteringButton();

    handlePendingMessageQuotes();

    buildExtras();
}

async function entryPoint() {
    while (!document.body) await sleep(100);

    let start = performance.now();
    try {
        const currentPageType = getCurrentPageType(`${window.location.pathname}${window.location.search}`);
        if (currentPageType === 'unknown') return;

        await init(currentPageType);

        switch (currentPageType) {
            case 'topiclist': {
                if (forumFilteringIsDisabled) break;
                createTopicListOverlay();
                const topicOptions = prepareTopicOptions();
                const finalTopics = await handleTopicList(true, topicOptions);
                if (!finalTopics || finalTopics.length < 2) break; // first is header
                await handleTopicListOptions(finalTopics, topicOptions);
                addRightBlocMatches();
                addRightBlocHotTopics();
                addRightBlocStats();
                toggleTopicOverlay(false);
                handlePrivateMessageNotifs();
                break;
            }
            case 'topicmessages': {
                if (forumFilteringIsDisabled) break;
                await handleTopicMessages();
                break;
            }
            case 'search': {
                await handleSearch();
                break;
            }
            case 'privatemessages': {
                await handlePrivateMessages();
                break;
            }
            case 'profil': {
                await handleProfile(window.location.search);
                break;
            }
            case 'error': {
                handleError();
                break;
            }
            default:
                break;
        }

        console.log('Déboucled loaded');

        const elapsed = performance.now() - start;
        //console.log(`Déboucled load : totaltime = ${elapsed}ms`);

        if (elapsed >= 3000) {
            console.warn(`Déboucled slow loading : totaltime = ${elapsed}ms`);
            await sendDiagnostic(elapsed);
        }

        updateUser();
        suggestUpdate();

        displaySecret();
        displayAnnouncement();
    } catch (error) {
        const elapsed = performance.now() - start;
        console.error(error);
        await sendDiagnostic(elapsed, error);
    }
    finally {
        sendFinalEvent();
    }
}

if (document.readyState === 'interactive' || document.readyState === 'complete') {
    entryPoint();
} else {
    addEventListener('DOMContentLoaded', entryPoint);
}
