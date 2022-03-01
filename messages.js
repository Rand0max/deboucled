
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

    let dbcBlacklistButton = buildDeboucledBlacklistButton(author, () => { location.reload() });

    let jvcBlacklistButton = messageElement.querySelector('span.picto-msg-tronche');
    let logged = (jvcBlacklistButton !== null);
    if (logged) insertAfter(dbcBlacklistButton, jvcBlacklistButton);
    else messageElement.querySelector('div.bloc-options-msg').appendChild(dbcBlacklistButton);

    if (!optionShowJvcBlacklistButton && logged) jvcBlacklistButton.style.display = 'none';
}

function highlightBlacklistedAuthor(messageElement, authorElement) {
    const pictoCross = messageElement?.querySelector('span.picto-msg-croix');
    const author = authorElement.textContent.trim().toLowerCase();
    if (pictoCross || (userPseudo && userPseudo.toLowerCase() === author)) return;
    authorElement.classList.toggle('deboucled-blacklisted', true);
}

function addBoucledAuthorButton(nearbyElement, author, optionBoucledUseJvarchive) {
    if (!nearbyElement) return;
    let boucledButton = buildBoucledAuthorButton(author, optionBoucledUseJvarchive);
    insertAfter(boucledButton, nearbyElement);
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
            addBoucledAuthorButton(mpBloc, author, messageOptions.optionBoucledUseJvarchive);
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
                let optionShowJvcBlacklistButton = GM_getValue(storage_optionShowJvcBlacklistButton, storage_optionShowJvcBlacklistButton_default);
                upgradeJvcBlacklistButton(messageElement, author, optionShowJvcBlacklistButton);
                let mpBloc = messageElement.querySelector('div.bloc-mp-pseudo');
                addBoucledAuthorButton(mpBloc, author, messageOptions.optionBoucledUseJvarchive);
            }
            else {
                createJvChatBlacklistButton(messageElement, authorElement, author);
            }
        }

        if (messageOptions.optionEnhanceQuotations) {
            highlightSpecialAuthors(author, authorElement, isSelf);
            highlightQuotedAuthor(messageContent);
        }

        if (!messageOptions.optionBlSubjectIgnoreMessages || isSelf) return;
        handleBlSubjectIgnoreMessages(messageElement);
    }

    enableJvChatAndTopicLiveEvents(handleLiveMessage);
}

function enableJvChatAndTopicLiveEvents(handleCallback) {
    // JvChat
    addEventListener('jvchat:newmessage', function (event) {
        const messageElement = document.querySelector(`.jvchat-message[jvchat-id="${event.detail.id}"]`);
        const authorElement = messageElement.querySelector('h5.jvchat-author');
        if (!authorElement) return;
        handleCallback(messageElement, authorElement);
    });
    addEventListener('jvchat:activation', function () {
        hiddenMessages = 0;
        hiddenAuthorArray.clear();
        updateMessagesHeader();
    });

    // TopicLive
    addEventListener('topiclive:newmessage', function (event) {
        const messageElement = document.querySelector(`.bloc-message-forum[data-id="${event.detail.id}"]`);
        if (!messageElement) return;
        const authorElement = messageElement.querySelector('a.bloc-pseudo-msg, span.bloc-pseudo-msg');
        if (!authorElement) return;
        handleCallback(messageElement, authorElement, event);
    });
}

function getParagraphChildren(element, allowBlockQuote = false) {
    const allowedTags = ['P', 'STRONG', 'U', 'I', 'EM', 'B'];
    if (allowBlockQuote) allowedTags.push('BLOCKQUOTE');
    return [...element.children].filter(c => allowedTags.includes(c.tagName) && c.textContent.trim() !== '');
}

function getMessageContentWithoutQuotes(messageElement) {
    let content = '';
    getParagraphChildren(messageElement).forEach(c => { content = `${content}\n${c.textContent}` });
    return content.trim();
}

function fixMessageUrls(messageContent) {
    if (!messageContent) return;

    function parseElement(element, regex, replaceCallback) {
        getParagraphChildren(element).forEach(child => parseElement(child, regex, replaceCallback));

        const textChildren = getTextChildren(element);
        textChildren.forEach(textNode => {
            if (!textNode.textContent?.length) return;
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
        (m) => `<a href="${m}" target="_blank" class="xXx"><img class="img-shack" src="${m}" alt="${m}" width="68" height="51"></a>`);

    // Puis on traite les urls normales
    const urlRegex = new RegExp(/\b(?:https?:\/\/)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]+/, 'gi');
    parseElement(
        messageContent,
        urlRegex,
        (m) => `<a class="xXx" href="${m}" title="${m}" target="_blank">${m}</a>`);
}

function highlightQuotedAuthor(messageContent) {
    if (!messageContent) return;

    let currentUserPseudo = userPseudo ?? GM_getValue(storage_lastUsedPseudo, storage_lastUsedPseudo_default);
    currentUserPseudo = currentUserPseudo?.toLowerCase();

    const isSelf = (match) => (currentUserPseudo?.length && (match === currentUserPseudo || match === `@${currentUserPseudo}`));
    const getProfilMatch = (match) => match?.startsWith('@') ? match.substring(1) : match;
    function buildProfilHighlightAnchor(match, self = '') {
        const profilMatch = getProfilMatch(match);
        return `<a class="deboucled-highlighted${self}" href="/profil/${profilMatch.toLowerCase()}?mode=infos" target="_blank" title="Voir le profil de ${profilMatch}">${match}</a>`;
    }

    function replaceAllTextQuotes(element, regex, replaceCallback, alternateCallback) {
        getParagraphChildren(element, true).forEach(child => {
            replaceAllTextQuotes(child, regex, replaceCallback, alternateCallback)
        });
        const textChildren = getTextChildren(element);
        textChildren.forEach(textNode => {
            if (!textNode.textContent?.length) return;
            if (alternateCallback) alternateCallback(textNode);

            const newText = textNode.textContent?.replaceAll(regex, replaceCallback);
            if (textNode.textContent === newText) return;

            let newNode = document.createElement('a');
            textNode.parentElement.insertBefore(newNode, textNode);
            textNode.remove(); // Toujours remove avant de changer l'outerHTML pour éviter le bug avec Chrome
            newNode.outerHTML = newText;
        });
    }

    // On met en surbrillance bleue tous les pseudos cités avec l'@arobase (sauf le compte de l'utilisateur)
    const allowedPseudo = '[\\w\\-_\\[\\]]'; // lettres & chiffres & -_[]
    const quotedAtAuthorsRegex = new RegExp(`\\B@${allowedPseudo}+`, 'gi');
    replaceAllTextQuotes(
        messageContent,
        quotedAtAuthorsRegex,
        (match) => isSelf(match.toLowerCase()) ? match : buildProfilHighlightAnchor(match));


    // On met en surbrillance bleue tous les pseudos cités avec le bouton "standard" (sauf le compte de l'utilisateur)
    const quotedAuthorsFullRegex = new RegExp(`(?!le\\s[0-9]{1,2}\\s[a-zéù]{3,10}\\s[0-9]{4}\\sà\\s[0-9]{2}:[0-9]{2}:[0-9]{2}\\s:)(?<author>${allowedPseudo}+)(?=\\sa\\sécrit\\s:)`, 'gi');
    const quotedAuthorsPartRegex = new RegExp(/le\s[0-9]{1,2}\s[a-zéù]{3,10}\s[0-9]{4}\sà\s[0-9]{2}:[0-9]{2}:[0-9]{2}\s(?!:)/, 'gi');
    replaceAllTextQuotes(
        messageContent,
        quotedAuthorsFullRegex,
        (match) => isSelf(match.toLowerCase()) ? match : buildProfilHighlightAnchor(match),
        (n) => {
            // S'il s'agit d'une citation où le pseudo est en html on vire le html et on fusionne le texte
            if (!n.textContent.match(quotedAuthorsFullRegex) && n.textContent.match(quotedAuthorsPartRegex)) {
                n.textContent = `${n.textContent}${n.nextSibling.textContent}${n.nextSibling.nextSibling.textContent}`;
                n.nextSibling.nextSibling.remove();
                n.nextSibling.remove();
            }
        });

    if (currentUserPseudo?.length) {
        // On met en surbrillance verte les citations du compte de l'utilisateur avec ou sans @arobase
        const quotedSelfRegex = new RegExp(`\\B@${currentUserPseudo}\\b|(?<!\\w|@)${currentUserPseudo}\\b`, 'gi');
        replaceAllTextQuotes(
            messageContent,
            quotedSelfRegex,
            (match) => buildProfilHighlightAnchor(match, ' self'));
    }
}

function handleMessageSetTopicAuthor(author, authorElement) {
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

