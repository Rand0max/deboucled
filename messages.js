
///////////////////////////////////////////////////////////////////////////////////////
// MESSAGES
///////////////////////////////////////////////////////////////////////////////////////

function getAllMessages(doc) {
    if (!doc) doc = document;
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
    toggleIgnoredAuthors.textContent = '(afficher)';
    toggleIgnoredAuthors.onclick = function () {
        if (ignoredAuthors.style.display === 'inline') {
            ignoredAuthors.style.display = 'none';
            toggleIgnoredAuthors.textContent = '(afficher)';
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
        let pr = plural(hiddenMessages);
        ignoredMessageHeader.firstChild.textContent = `${hiddenMessages} message${pr} ignoré${pr}`;

        let ignoredAuthors = document.querySelector('#deboucled-ignored-messages-authors-header');
        if (ignoredAuthors) {
            ignoredAuthors.textContent = [...hiddenAuthorArray].join(', ');
        }
    }
}

function removeMessage(element) {
    function removeElement(elem) {
        /* 
        Technique pour être compatible avec JVCGhost et JvArchive Compagnon :
         - on masque le message au lieu de le supprimer
         - on le met tout à la fin de la liste des messages pour ne pas casser le css jvc
        */

        elem.style.display = 'none';
        elem.setAttribute('blacklisted', true);
        const parent = elem.parentElement;
        parent.removeChild(elem);
        parent.appendChild(elem);

        //elem.remove();
    }
    if (element.previousElementSibling) removeElement(element.previousElementSibling);
    else if (element.nextElementSibling) removeElement(element.nextElementSibling);
    removeElement(element);
}

function buildDeboucledBlacklistButton(author, callbackAfter, className = 'deboucled-blacklist-author-button') {
    let dbcBlacklistButton = document.createElement('span');
    dbcBlacklistButton.setAttribute('title', 'Blacklister avec Déboucled');
    dbcBlacklistButton.setAttribute('class', `picto-msg-tronche ${className}`);
    dbcBlacklistButton.onclick = function () {
        addEntityBlacklist(authorBlacklistArray, author);
        refreshAuthorKeys();
        if (callbackAfter) callbackAfter();
    };
    return dbcBlacklistButton;
}

function upgradeJvcBlacklistButton(messageElement, author, optionShowJvcBlacklistButton) {
    let isSelf = messageElement.querySelector('span.picto-msg-croix');
    if (isSelf) return;

    let dbcBlacklistButton = buildDeboucledBlacklistButton(author, () => { location.reload(); });

    let jvcBlacklistButton = messageElement.querySelector('span.picto-msg-tronche');
    let logged = (jvcBlacklistButton !== null);
    if (logged) insertAfter(dbcBlacklistButton, jvcBlacklistButton);
    else messageElement.querySelector('div.bloc-options-msg')?.appendChild(dbcBlacklistButton);

    if (!optionShowJvcBlacklistButton && logged) jvcBlacklistButton.style.display = 'none';
}

function addAuthorButtons(nearbyElement, author, optionBoucledUseJvarchive) {
    if (!nearbyElement) return;
    let boucledButton = buildBoucledAuthorButton(author, optionBoucledUseJvarchive);
    insertAfter(boucledButton, nearbyElement);

    let jvArchiveProfilButton = buildJvArchiveProfilButton(author);
    insertAfter(jvArchiveProfilButton, boucledButton);

    let filterAuthorButton = buildFilterAuthorMessageButton(author);
    insertAfter(filterAuthorButton, jvArchiveProfilButton);
}

function buildAuthorBadges(authorElement, author, messageOptions, title) {
    let authorMarkedLoop = false;
    if (messageOptions.optionAntiLoopAiMode !== 0) {
        const isTopicAuthor = author.toLowerCase() === currentTopicAuthor;
        const topicLoop = getTopicLoop(isTopicAuthor ? title : undefined, author);
        if (topicLoop.isAuthorLoop) {
            authorMarkedLoop = true;
            markAuthorLoop(topicLoop.loopAuthor, authorElement, true, 'deboucled-badge-message');
        }
    }
    if (messageOptions.optionDisplayBadges) {
        buildAuthorBlacklistBadges(author, authorElement.parentElement, authorMarkedLoop ? ['boucledauthors'] : [], 'deboucled-badge-message');
    }
}

function handleJvChatAndTopicLive(messageOptions) {
    function removeLiveMessage(messageElement, author, topicLiveEvent) {
        if (topicLiveEvent) topicLiveEvent.detail.cancel();
        else removeMessage(messageElement);
        hiddenMessages++;
        hiddenAuthorArray.add(author);
        if (!topicLiveEvent) updateMessagesHeader();
        saveTotalHidden();
    }

    function handleBlacklistedAuthor(messageElement, authorElement, author, topicLiveEvent) {
        if (messageOptions.optionHideMessages) {
            removeLiveMessage(messageElement, author, topicLiveEvent);
            return true;
        }
        else {
            highlightBlacklistedAuthor(messageElement, authorElement);
            let mpBloc = messageElement.querySelector('div.bloc-mp-pseudo');
            addAuthorButtons(mpBloc, author, messageOptions.optionBoucledUseJvarchive);
        }
        return false;
    }

    function createJvChatBlacklistButton(messageElement, authorElement, author) {
        let isSelf = messageElement.querySelector('span.picto-msg-croix');
        if (isSelf) return;

        let dbcBlacklistButton = buildDeboucledBlacklistButton(author, () => handleBlacklistedAuthor(messageElement, authorElement, author));
        dbcBlacklistButton.classList.toggle('jvchat-picto', true);

        let jvchatTooltip = messageElement.querySelector('.jvchat-tooltip');
        jvchatTooltip.prepend(dbcBlacklistButton);
    }

    function handleLiveMessage(messageElement, authorElement, topicLiveEvent) {
        const messageContent = messageElement.querySelector('.txt-msg.text-enrichi-forum');
        const author = authorElement.textContent.trim();
        const isSelf = userPseudo?.toLowerCase() === author.toLowerCase();

        if (getAuthorBlacklistMatches(author)?.length) {
            if (handleBlacklistedAuthor(messageElement, authorElement, author, topicLiveEvent)) {
                return; // si on a supprimé le message on se casse, plus rien à faire
            }
        }
        else {
            if (topicLiveEvent) {
                let optionShowJvcBlacklistButton = store.get(storage_optionShowJvcBlacklistButton, storage_optionShowJvcBlacklistButton_default);
                upgradeJvcBlacklistButton(messageElement, author, optionShowJvcBlacklistButton);
                let mpBloc = messageElement.querySelector('div.bloc-mp-pseudo');
                addAuthorButtons(mpBloc, author, messageOptions.optionBoucledUseJvarchive);
            }
            else {
                createJvChatBlacklistButton(messageElement, authorElement, author);
            }
        }

        handleMessageAssignTopicAuthor(author, authorElement);
        buildAuthorBadges(authorElement, author, messageOptions);

        if (messageOptions.optionEnhanceQuotations) {
            highlightSpecialAuthors(author, authorElement, isSelf);
            highlightQuotedAuthor(messageContent, messageElement);
            if (topicLiveEvent) enhanceBlockquotes(messageContent);
        }

        if (!messageOptions.optionBlSubjectIgnoreMessages || isSelf) return;
        handleBlSubjectIgnoreMessages(messageElement);
    }

    async function handlePostLiveMessage(postMessageDetail) {
        const quoteMessages = findQuotedMessagesFromContent(postMessageDetail.messageContent);
        if (!quoteMessages?.length) return;

        const currentUrl = `${window.location.origin}${window.location.pathname}`;

        quoteMessages.forEach(qm => {
            const quotedMessageId = qm.quoteMessageElement.getAttribute('jvchat-id');
            const messageQuote = {
                userId: userId,
                quotedMessageId: quotedMessageId,
                quotedUsername: getAuthorFromMessageElem(qm.quoteMessageElement).toLowerCase(),
                quotedMessageUrl: `https://www.jeuxvideo.com/forums/message/${quotedMessageId}`,
                newMessageId: postMessageDetail.messageId,
                newMessageUsername: postMessageDetail.messageUsername?.toLowerCase() ?? 'anonymous',
                newMessageContent: getRawTypedMessage(postMessageDetail.messageContent),
                newMessageUrl: `https://www.jeuxvideo.com/forums/message/${postMessageDetail.messageId}`, //`${currentUrl}#post_${postMessageDetail.messageId}`,
                topicId: currentTopicId,
                topicUrl: currentUrl,
                topicTitle: getTopicTitle(),
                status: 'validated',
                lastUpdateDate: new Date()
            }
            sendMessageQuote(messageQuote);
        });
    }

    enableJvChatAndTopicLiveEvents(handleLiveMessage, handlePostLiveMessage);
}

function enableJvChatAndTopicLiveEvents(newMessageCallback, postMessageCallback) {
    // JvChat
    addEventListener('jvchat:newmessage', function (event) {
        const messageElement = document.querySelector(`.jvchat-message[jvchat-id="${event.detail.id}"]`);
        const authorElement = messageElement.querySelector('h5.jvchat-author');
        if (!authorElement) return;
        newMessageCallback(messageElement, authorElement);
    });
    addEventListener('jvchat:activation', function () {
        hiddenMessages = 0;
        hiddenAuthorArray.clear();
        updateMessagesHeader();
    });
    addEventListener('jvchat:postmessage', function (event) {
        if (!event.detail) return;
        const postedMessageDetail = { messageId: event.detail.id, messageContent: event.detail.content, messageUsername: event.detail.username };
        postMessageCallback(postedMessageDetail);
    });

    // TopicLive
    addEventListener('topiclive:newmessage', function (event) {
        const messageElement = document.querySelector(`.bloc-message-forum[data-id="${event.detail.id}"]`);
        if (!messageElement) return;
        const authorElement = messageElement.querySelector('a.bloc-pseudo-msg, span.bloc-pseudo-msg');
        if (!authorElement) return;
        newMessageCallback(messageElement, authorElement, event);
    });
}

/*
function enableDecensuredEvents() {
    addEventListener('decensured:active', () => {
        decensuredActive = true;
        document.querySelectorAll('p.deboucled-decensured-message').forEach(e => e.remove());
        const decensuredSponsoring = document.querySelector('#card-header-decensured');
        if (decensuredSponsoring) decensuredSponsoring.remove();
    });
}
*/

function getParagraphChildren(element, allowBlockQuote = false) {
    if (!element?.children?.length) return [];
    const allowedTags = ['P', 'STRONG', 'U', 'I', 'EM', 'B'];
    if (allowBlockQuote) allowedTags.push('BLOCKQUOTE');
    return [...element.children].filter(c => allowedTags.includes(c.tagName) && c.textContent.trim() !== '');
}

function getMessageContentWithoutQuotes(messageElement) {
    let content = '';
    getParagraphChildren(messageElement).forEach(c => { content = `${content}\n${c.textContent}`; });
    return content.trim();
}

function buildNoelshackMiniUrl(noelshackUrl) {
    const matchRegex = new RegExp(/https:\/\/www\.noelshack\.com\/(\d+)-(\d+)-(\d+)-(.*)/, 'i');
    const replacement = 'https://image.noelshack.com/minis/$1/$2/$3/$4';
    return noelshackUrl.replace(matchRegex, replacement);
}

function fixMessageUrls(messageContent) {
    if (!messageContent) return;

    function parseElement(element, regex, replaceCallback) {
        getParagraphChildren(element).forEach(child => parseElement(child, regex, replaceCallback));

        const textChildren = getTextChildren(element);
        textChildren.forEach(textNode => {
            if (!textNode.textContent?.length || !textNode.parentElement) return;
            const newText = textNode.textContent?.replaceAll(regex, replaceCallback);
            if (textNode.textContent === newText) return;

            let newNode = document.createElement('a');
            textNode.parentElement.insertBefore(newNode, textNode);
            textNode.remove(); // Toujours remove avant de changer l'outerHTML pour éviter le bug avec Chrome
            newNode.outerHTML = newText;
        });
    }

    // On traite d'abord les images car c'est des urls aussi
    const imageUrlRegex = new RegExp(/\bhttps:[/.\w\s-]*\.(?:jpg|jpeg|gif|png|svg|bmp|tif|tiff)\b/, 'gi');
    parseElement(
        messageContent,
        imageUrlRegex,
        (m) => `<a href="${m}" target="_blank" class="xXx"><img class="img-shack" src="${buildNoelshackMiniUrl(m)}" alt="${m}" width="68" height="51"></a>`);

    // Puis on traite les urls normales
    const urlRegex = new RegExp(/\b(?:https?:\/\/)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]+/, 'gi');
    parseElement(
        messageContent,
        urlRegex,
        (m) => `<a class="xXx" href="${m}" title="${m}" target="_blank">${m}</a>`);
}

function decensureTwitterLinks(messageContent) {
    if (!messageContent) return;

    const twitterDns = 'twitter.com';
    const newTwitterDns = 'x.com';

    const newTwitterLinks = messageContent.querySelectorAll(`a[href*="${newTwitterDns}/"][href*="/status/"]`);
    if (newTwitterLinks?.length) {
        newTwitterLinks.forEach(link => {
            link.href = link.href.replace(newTwitterDns, twitterDns);
            link.title = link.title.replace(newTwitterDns, twitterDns);
            link.textContent = link.textContent.replace(newTwitterDns, twitterDns);
        });
    }

    const twitterLinks = messageContent.querySelectorAll(`a[href*="${twitterDns}/"][href*="/status/"]`);
    if (!twitterLinks?.length) return;

    const widjetUrl = `https://platform.${twitterDns}/widgets.js`;

    let currentTwitterScript = document.querySelector(`script[src="${widjetUrl}"]`);
    if (currentTwitterScript) currentTwitterScript.remove();

    twitterLinks.forEach(link => {
        if (link.closest('.signature-msg') !== null || link.closest('.twitter-tweet') !== null) return;

        let tweetElement = document.createElement('blockquote');
        tweetElement.setAttribute('class', 'twitter-tweet');
        if (preferDarkTheme()) {
            tweetElement.setAttribute('data-theme', 'dark');
        }
        tweetElement.innerHTML = `<blockquote class="twitter-tweet"><a href="${link}"></a></blockquote>`;
        link.insertAdjacentElement('afterend', tweetElement);

        if (!currentTwitterScript) {
            currentTwitterScript = document.createElement('script');
            currentTwitterScript.setAttribute('src', widjetUrl);
            document.body.appendChild(currentTwitterScript);
        }
    });
}

function embedVocaroo(messageContent) {
    if (!messageContent) return;

    messageContent.querySelectorAll('a').forEach(a => {
        const url = a.href;
        const match = url.match(/^https:\/\/voca(?:roo\.com|\.ro)\/(?<id>.*)$/, 'i');
        if (!match) return;
        const iframe = document.createElement('iframe');
        iframe.width = 300;
        iframe.height = 60;
        iframe.frameBorder = 0;
        iframe.allow = 'autoplay';
        iframe.src = `https://vocaroo.com/embed/${match.groups.id}?autoplay=0`;
        a.insertAdjacentElement('afterend', iframe);
    });
}

function embedZupimages(messageContent) {
    if (!messageContent) return;

    messageContent.querySelectorAll('a').forEach(a => {
        const url = a.href;
        const match = url.match(/^https:\/\/(?:www\.)?zupimages\.net.*$/, 'i');
        if (!match) return;
        const img = document.createElement('img');
        img.src = url.replace('/viewer.php?id=', '/up/');
        img.alt = url;
        img.height = 60;
        a.innerHTML = '';
        a.append(img);
    });
}

function handleLongMessages(allMessages) {
    allMessages.forEach(m => {
        const txtMsg = m.querySelector('.txt-msg.text-enrichi-forum');
        if (!txtMsg) return;

        let blockquote = txtMsg.querySelector('.deboucled-blacklisted-blockquote') ?? txtMsg.querySelector('blockquote.blockquote-jv');
        if (blockquote && txtMsg.contains(blockquote)) {
            blockquote.parentElement.removeChild(blockquote); // on vire les citations le temps de créer le wrapper
        }
        else {
            blockquote = null;
        }

        const messageWrapper = document.createElement('span'); // wrapper pour le contenu du message
        messageWrapper.className = 'deboucled-message-content-wrapper';
        while (txtMsg.childNodes.length > 0) messageWrapper.appendChild(txtMsg.childNodes[0]);

        txtMsg.appendChild(messageWrapper);

        if (blockquote) messageWrapper.insertAdjacentElement('beforebegin', blockquote); // on réinsère les citations au début
    });

    const saveconsolelog = console.log;
    console.log = function () { };

    // eslint-disable-next-line no-undef
    new ShowMore('.deboucled-message-content-wrapper', {
        /*
        regex: {
            newLine: {
                match: null, // /(\r\n|\n|\r)/gm,
                replace: ""
            },
            space: {
                match: null, // /\s\s+/gm,
                replace: " "
            },
            br: {
                match: null, // /<br\s*\/?>/gim,
                replace: ""
            },
            html: {
                match: null, // /(<((?!b|\/b|!strong|\/strong)[^>]+)>)/gi,
                replace: ""
            }
        },
        */
        config: {
            type: 'text',
            element: 'div',
            limit: 1000,
            more: '→ lire la suite',
            less: '← réduire'
        }
    });

    console.log = saveconsolelog;
}

function handleQuotedAuthorBlacklist(messageContent) {
    if (!messageContent) return;

    const authorElements = [...messageContent.querySelectorAll('a.deboucled-highlighted:not(.self)')];
    if (!authorElements.length) return;

    authorElements.forEach(e => {
        const containerBlockquote = e.parentElement.parentElement;
        if (!containerBlockquote || containerBlockquote.classList.contains('deboucled-blockquote-container')) return;

        const author = e.textContent.trim().toLowerCase();
        if (!author?.length) return;

        const isSelf = userPseudo?.toLowerCase() === author.toLowerCase();
        const authorBlacklistedMatch = getAuthorBlacklistMatches(author, isSelf);
        if (!authorBlacklistedMatch?.length) return;

        e.classList.toggle('deboucled-blacklisted', true);
        hideMessageContent(e.parentElement, 'deboucled-blacklisted-blockquote');
    });
}

function findQuotedMessagesFromContent(messageContent) {
    const regex = new RegExp(/>\sLe\s(?<date>.*)\sà\s(?<hour>[0-9]+:[0-9]+:[0-9]+)\s(?<username>.*)\sa\sécrit\s:/, 'gmi');
    const matches = [...messageContent.matchAll(regex)];
    if (!matches.length) return;

    const quotedMessages = matches.map(m => {
        return {
            quoteDate: m.groups?.date?.trim(),
            quoteHour: m.groups?.hour?.trim(),
            quoteUsername: m.groups?.username?.trim()
        };
    });

    quotedMessages.forEach(qm => {
        const messagesFromAuthor = [...document.querySelectorAll('.jvchat-author')].filter(e => e.textContent?.trim()?.toLowerCase() === qm.quoteUsername.toLowerCase());
        if (!messagesFromAuthor.length) return;
        const messageMatch = messagesFromAuthor.find(m => {
            const mDate = m.parentElement.querySelector('.jvchat-date');
            return (mDate.getAttribute('to-quote') === `${qm.quoteDate} à ${qm.quoteHour}`);
        });
        if (!messageMatch) return;
        qm.quoteMessageElement = messageMatch.parentElement.parentElement.parentElement;
    });

    return quotedMessages.filter(qm => qm.quoteMessageElement);
}

// TODO : Refacto cette satanerie
function highlightQuotedAuthor(messageContent, messageElement) {
    if (!messageContent) return;

    let currentUserPseudo = userPseudo ?? store.get(storage_lastUsedPseudo, storage_lastUsedPseudo_default);
    currentUserPseudo = currentUserPseudo?.toLowerCase();

    const isSelf = (match) => (currentUserPseudo?.length && (match === currentUserPseudo || match === `@${currentUserPseudo}`));
    const getProfilMatch = (match) => match?.startsWith('@') ? match.substring(1) : match;
    function buildProfilHighlightAnchor(match, self = '') {
        const profilMatch = getProfilMatch(match);
        return `<a class="deboucled-highlighted${self}" href="/profil/${profilMatch.toLowerCase()}?mode=infos" target="_blank" title="Voir le profil de ${profilMatch}">${match}</a>`;
    }

    function replaceAllTextQuotes(element, containerElement, regex, replaceCallback, prepareCallback, depth = 0) {
        getParagraphChildren(element, true).forEach(child => {
            if (['P', 'BLOCKQUOTE'].includes(child.tagName)) depth++;
            replaceAllTextQuotes(child, containerElement, regex, replaceCallback, prepareCallback, depth);
        });
        const textChildren = getTextChildren(element);
        textChildren.forEach(textNode => {
            if (!textNode.textContent?.length || !textNode.parentElement) return;
            if (prepareCallback) prepareCallback(textNode);

            const newContent = textNode.textContent?.replaceAll(regex, replaceCallback);
            if (textNode.textContent === newContent) return; // si on a rien à modifier on se casse

            if (depth <= 2 && containerElement) containerElement.classList.toggle('deboucled-message-quoted', true);

            let newNode = document.createElement('a');
            textNode.parentElement.insertBefore(newNode, textNode);
            textNode.remove(); // Toujours remove avant de changer l'outerHTML pour éviter le bug avec Chrome
            newNode.outerHTML = newContent;
        });
    }

    // On met en surbrillance grise tous les pseudos cités avec l'@arobase (sauf le compte de l'utilisateur)
    const allowedPseudo = '[\\w\\-_\\[\\]]'; // lettres & chiffres & -_[]
    const quotedAtAuthorsRegex = new RegExp(`\\B@${allowedPseudo}+`, 'gi');
    replaceAllTextQuotes(
        messageContent,
        undefined,
        quotedAtAuthorsRegex,
        (match) => isSelf(match.toLowerCase()) ? match : buildProfilHighlightAnchor(match));

    // On met en surbrillance grise tous les pseudos cités avec le bouton "standard" (sauf le compte de l'utilisateur)
    const quotedAuthorsFullRegex = new RegExp(`(?!le\\s[0-9]{1,2}\\s[a-zéùû]{3,10}\\s[0-9]{4}\\sà\\s[0-9]{2}:[0-9]{2}:[0-9]{2}\\s:)(?<author>${allowedPseudo}+)(?=\\sa\\sécrit\\s:)`, 'gi');
    const quotedAuthorsPartRegex = new RegExp(/le\s[0-9]{1,2}\s[a-zéùû]{3,10}\s[0-9]{4}\sà\s[0-9]{2}:[0-9]{2}:[0-9]{2}\s(?!:)/, 'gi');
    replaceAllTextQuotes(
        messageContent,
        undefined,
        quotedAuthorsFullRegex,
        (match) => isSelf(match.toLowerCase()) ? match : buildProfilHighlightAnchor(match),
        (n) => {
            const nodeContent = n.textContent.removeDoubleSpaces();
            // S'il s'agit d'une citation où le pseudo est en html on vire le html et on fusionne le texte
            if (!nodeContent.match(quotedAuthorsFullRegex) && nodeContent.match(quotedAuthorsPartRegex)) {
                n.textContent = `${nodeContent}${n.nextSibling?.textContent}${n.nextSibling?.nextSibling?.textContent}`;
                n.nextSibling?.nextSibling?.remove();
                n.nextSibling?.remove();
            }
        });

    if (currentUserPseudo?.length) {
        // On met en surbrillance verte les citations du compte de l'utilisateur avec ou sans @arobase
        const selfPseudo = currentUserPseudo.escapeRegexPatterns();
        const quotedSelfRegex = new RegExp(`\\B@${selfPseudo}\\b|(?<!\\w|@)${selfPseudo}\\b`, 'gi');
        replaceAllTextQuotes(
            messageContent,
            messageElement,
            quotedSelfRegex,
            (match) => buildProfilHighlightAnchor(match, ' self'),
            (n) => {
                if (['STRONG', 'B', 'I', 'EM', 'U'].includes(n.parentElement?.tagName) &&
                    n.parentElement.textContent.match(quotedSelfRegex)) {
                    n.parentElement.outerHTML = n.parentElement.textContent;
                }
            });
    }
}

function handleMessageAssignTopicAuthor(author, authorElement) {
    if (currentTopicId && topicAuthorMap.has(currentTopicId) && author?.toLowerCase() === topicAuthorMap.get(currentTopicId)) {
        let crownElem = document.createElement('span');
        crownElem.className = 'deboucled-crown-logo';
        crownElem.title = 'Auteur du topic';
        authorElement.prepend(crownElem);
    }
}

function highlightSpecialAuthors(author, authorElement, isSelf) {
    if (deboucledPseudos.includes(author?.toLowerCase()) || isSelf) {
        authorElement.classList.toggle('deboucled-randomax-pseudo', true);
    }
}

function fixMessageJvCare(messageElement) {
    const avatar = messageElement.querySelector('.user-avatar-msg');
    if (avatar && avatar.hasAttribute('data-src') && avatar.hasAttribute('src')) {
        avatar.setAttribute('src', avatar.getAttribute('data-src'));
        avatar.removeAttribute('data-src');
    }
    messageElement.querySelectorAll('.JvCare').forEach(function (m) {
        let anchor = document.createElement('a');
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('href', decryptJvCare(m.getAttribute('class')));
        anchor.className = m.className.split(' ').splice(2).join(' ');
        anchor.innerHTML = m.innerHTML;
        m.outerHTML = anchor.outerHTML;
    });
    return messageElement;
}

async function enhanceBlockquotes(messageContent) {
    const bqContainers = messageContent.querySelectorAll('blockquote > blockquote');
    if (!bqContainers?.length) return; // ne concerne que les citations imbriquées

    function toggleQuoteDisplay(btn, index) {
        let nextBq = btn.parentNode.nextSibling;
        btn.classList.toggle('opened');
        const isOpened = btn.classList.contains('opened');
        nextBq.style.display = isOpened ? 'block' : 'none';
        btn.textContent = isOpened ? 'fermer' : 'ouvrir';
        btn.setAttribute('blockquote-number', `(${index})`);
    }

    function createBlockquoteButton(index) {
        let btn = document.createElement('button');
        btn.className = 'btn deboucled-blockquote-button';
        btn.textContent = 'ouvrir';
        btn.setAttribute('blockquote-number', `(${index})`);
        btn.onclick = () => toggleQuoteDisplay(btn, index);
        return btn;
    }

    bqContainers.forEach((e) => e.classList.add('deboucled-blockquote-container'));

    const blockquotes = messageContent.querySelectorAll('.blockquote-jv');
    blockquotes.forEach((bq) => {
        if (bq.parentNode.parentNode.classList.contains('bloc-contenu')) return;
        bq.style.display = 'none';
        let numberNestedBq = bq.querySelectorAll('blockquote').length;
        const blockquoteButton = createBlockquoteButton(numberNestedBq + 1);
        if (!bq.previousElementSibling) bq.parentElement.prepend(document.createElement('p'));
        if (bq.previousElementSibling) bq.previousElementSibling.append(blockquoteButton);
    });


    let nestedQuotes = await awaitElements(messageContent, '.nested-quote-toggle-box');
    nestedQuotes.forEach((e) => e.remove());
}

/*
function getLocationMessageId() {
    const locationHash = window.location.hash;
    if (!locationHash?.length) return;

    const reg = new RegExp(/^#post_(?<id>[0-9]+)$/);
    const match = locationHash.match(reg);
    if (!match) return;
    
    return parseInt(match.groups?.id);
}
*/
