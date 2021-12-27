
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
        Technique pour être compatible avec JVC Ghost :
         - on masque le message au lieu de le supprimer
         - on le met tout à la fin de la liste des messages pour ne pas casser le css jvc

        --> Problème de compatibilité avec TopicLive qui place les messages à la fin.
        
        elem.style.display = 'none';
        const parent = elem.parentElement;
        parent.removeChild(elem);
        parent.appendChild(elem);
        */

        elem.remove();
    }
    if (element.previousElementSibling) removeElement(element.previousElementSibling);
    else if (element.nextElementSibling) removeElement(element.nextElementSibling);
    removeElement(element);
}

function buildDeboucledBlacklistButton(author, callbackAfter) {
    let dbcBlacklistButton = document.createElement('span');
    dbcBlacklistButton.setAttribute('title', 'Blacklister avec Déboucled');
    dbcBlacklistButton.setAttribute('class', 'picto-msg-tronche deboucled-blacklist-author-button');
    dbcBlacklistButton.onclick = function () {
        addEntityBlacklist(authorBlacklistArray, author);
        refreshAuthorKeys()
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
    let isSelf = messageElement.querySelector('span.picto-msg-croix');
    if (isSelf) return;
    authorElement.classList.toggle('deboucled-blacklisted', true);
}

function addBoucledAuthorButton(messageElement, author, optionBoucledUseJvarchive) {
    let backToForumElement = document.querySelector('div.group-two > a:nth-child(2)');
    if (!backToForumElement) return;

    let mpBloc = messageElement.querySelector('div.bloc-mp-pseudo');
    if (!mpBloc) return;

    let forumUrl = backToForumElement.getAttribute('href');
    let redirectUrl = `/recherche${forumUrl}?search_in_forum=${author}&type_search_in_forum=auteur_topic`;
    if (optionBoucledUseJvarchive) redirectUrl = `${jvarchiveUrl}/topic/recherche?search=${author}&searchType=auteur_topic_exact`;

    let boucledAuthorAnchor = document.createElement('a');
    boucledAuthorAnchor.setAttribute('class', 'xXx lien-jv deboucled-author-boucled-button deboucled-svg-spiral-gray');
    boucledAuthorAnchor.setAttribute('href', redirectUrl);
    boucledAuthorAnchor.setAttribute('target', '_blank');
    boucledAuthorAnchor.setAttribute('title', 'Pseudo complètement boucled ?');
    boucledAuthorAnchor.innerHTML = '<svg width="16px" viewBox="0 0 24 24" id="deboucled-spiral-logo"><use href="#spirallogo"/></svg></a>';

    insertAfter(boucledAuthorAnchor, mpBloc);
}

function handleJvChatAndTopicLive(optionHideMessages, optionBoucledUseJvarchive, optionBlSubjectIgnoreMessages) {
    function removeLiveMessage(messageElement, author, topicLiveEvent) {
        if (topicLiveEvent) topicLiveEvent.detail.cancel();
        else removeMessage(messageElement);
        hiddenMessages++;
        hiddenAuthorArray.add(author);
        updateMessagesHeader();
        saveTotalHidden();
    }

    function handleBlacklistedAuthor(messageElement, authorElement, author, topicLiveEvent) {
        if (optionHideMessages) {
            removeLiveMessage(messageElement, author, topicLiveEvent);
            return true;
        }
        else {
            highlightBlacklistedAuthor(messageElement, authorElement);
            addBoucledAuthorButton(messageElement, author, optionBoucledUseJvarchive);
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
        let author = authorElement.textContent.trim();
        if (getAuthorBlacklistMatches(author)?.length) {
            if (handleBlacklistedAuthor(messageElement, authorElement, author, topicLiveEvent)) {
                return; // si on a supprimé le message on se casse, plus rien à faire
            }
        }
        else {
            if (topicLiveEvent) {
                let optionShowJvcBlacklistButton = GM_getValue(storage_optionShowJvcBlacklistButton, storage_optionShowJvcBlacklistButton_default);
                upgradeJvcBlacklistButton(messageElement, author, optionShowJvcBlacklistButton);
                addBoucledAuthorButton(messageElement, author, optionBoucledUseJvarchive);
            }
            else {
                createJvChatBlacklistButton(messageElement, authorElement, author);
            }
        }

        if (!optionBlSubjectIgnoreMessages) return;
        handleBlSubjectIgnoreMessages(messageElement);
    }

    // JvChat
    addEventListener('jvchat:newmessage', function (event) {
        let messageElement = document.querySelector(`.jvchat-message[jvchat-id="${event.detail.id}"]`);
        let authorElement = messageElement.querySelector('h5.jvchat-author');
        if (!authorElement) return;
        handleLiveMessage(messageElement, authorElement);
    });
    addEventListener('jvchat:activation', function () {
        hiddenMessages = 0;
        hiddenAuthorArray.clear();
        updateMessagesHeader();
    });

    // TopicLive
    addEventListener('topiclive:newmessage', function (event) {
        let messageElement = document.querySelector(`.bloc-message-forum[data-id="${event.detail.id}"]`);
        if (!messageElement) return;
        let authorElement = messageElement.querySelector('a.bloc-pseudo-msg, span.bloc-pseudo-msg');
        if (!authorElement) return;
        handleLiveMessage(messageElement, authorElement, event);
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
        btn.addEventListener('click', () => {
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

