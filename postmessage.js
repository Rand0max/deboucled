
///////////////////////////////////////////////////////////////////////////////////////
// POST MESSAGE
///////////////////////////////////////////////////////////////////////////////////////

function buildQuoteMessage(messageElement, selection) {
    const textArea = document.querySelector('#message_topic');
    if (!textArea) return;

    const getAuthorFromCitationBtn = (e) => e.querySelector('.bloc-pseudo-msg.text-user').textContent.trim();
    const getDateFromCitationBtn = (e) => e.querySelector('.bloc-date-msg').textContent.trim();
    const getQuoteHeader = (e) => `> Le ${getDateFromCitationBtn(e)} '''${getAuthorFromCitationBtn(e)}''' a écrit : `;

    if (selection?.length) {
        const currentContent = textArea.value.length === 0 ? '' : `${textArea.value.trim()}\n\n`;
        const quotedText = selection.replaceAll('\n', '\n> ');
        textArea.value = `${currentContent}${getQuoteHeader(messageElement)}\n> ${quotedText}\n\n`;
        textArea.dispatchEvent(new Event('change'));
        textArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    else {
        setTimeout(() => {
            const date = getDateFromCitationBtn(messageElement);
            const regex = new RegExp(`> Le\\s+?${date}\\s+?:`);
            textArea.value = textArea.value.replace(regex, getQuoteHeader(messageElement));
        }, 600);
    }
}

async function suggestAuthors(authorHint) {
    // Min 3 char & must be logged in
    if (authorHint?.length < 3 || !userPseudo) return undefined;

    const url = `/sso/ajax_suggest_pseudo.php?pseudo=${authorHint.trim()}`;

    let suggestions = await fetch(url)
        .then(function (response) {
            if (!response.ok) throw Error(response.statusText);
            return response.text();
        }).then(function (r) {
            return JSON.parse(r);
        }).catch(function (err) {
            console.warn(err);
            return undefined;
        });

    return suggestions ? [...suggestions.alias.map(s => s.pseudo)] : undefined;
}

function getTextSelection() {
    return window.getSelection ? window.getSelection() : document.selection
}

function getSelectionOffset(container, mouseEvent, touchEvent) {
    const selectionRect = getTextSelection().getRangeAt(0).getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const selectionOffsetLeft = selectionRect.left - containerRect.left + selectionRect.width - 9;

    const mouseOffsetLeft = mouseEvent ? mouseEvent.pageX : 0;
    const touchOffsetLeft = touchEvent ? touchEvent.changedTouches[0].pageX : 0;
    const eventOffsetLeft = (touchOffsetLeft > mouseOffsetLeft ? touchOffsetLeft : mouseOffsetLeft) - container.offsetLeft - 7;

    const offsetLeft = eventOffsetLeft > selectionOffsetLeft ? selectionOffsetLeft : eventOffsetLeft;
    const offsetTop = selectionRect.top - containerRect.top + selectionRect.height + 10; // mouseEvent.pageY - container.offsetTop + 14

    return { offsetLeft: offsetLeft, offsetTop: offsetTop };
}

function addMessageQuoteEvents(allMessages) {
    function buildPartialQuoteButton(message) {
        const partialQuoteButton = document.createElement('div');
        partialQuoteButton.className = 'deboucled-quote';
        partialQuoteButton.innerHTML = '<a class="deboucled-partial-quote-logo"></a>';
        message.appendChild(partialQuoteButton);
        return partialQuoteButton;
    }

    const clearAllQuoteButtons = () => document.querySelectorAll('.deboucled-quote').forEach(e => e.classList.toggle('active', false));

    document.onselectionchange = async function () {
        await sleep(100);
        const selection = getTextSelection().toString();
        if (selection?.length === 0) clearAllQuoteButtons();
    };

    allMessages.forEach((message) => {
        const partialQuoteButton = buildPartialQuoteButton(message); // Partial quote

        async function partialQuoteEvent(mouseEvent, touchEvent) {
            const selection = getTextSelection().toString();
            if (selection?.length === 0) return;

            partialQuoteButton.onclick = () => buildQuoteMessage(message, selection);

            const selectionOffset = getSelectionOffset(message, mouseEvent, touchEvent);
            partialQuoteButton.style.left = `${selectionOffset.offsetLeft}px`;
            partialQuoteButton.style.top = `${selectionOffset.offsetTop}px`;

            clearAllQuoteButtons();
            await sleep(100);
            partialQuoteButton.classList.toggle('active', true);
        }

        message.onmouseup = (me) => partialQuoteEvent(me, undefined);
        message.ontouchend = (te) => partialQuoteEvent(undefined, te);

        const quoteButton = message.querySelector('.picto-msg-quote');
        if (quoteButton) quoteButton.onclick = () => buildQuoteMessage(message); // Full quote
    });
}

function addAuthorSuggestionEvent() {
    const textArea = document.querySelector('#message_topic');
    if (!textArea) return;

    const toolbar = document.querySelector('.jv-editor-toolbar');

    // Création du container pour les suggestions
    const autocompleteElement = document.createElement('div');
    autocompleteElement.id = 'deboucled-author-autocomplete';
    autocompleteElement.className = 'autocomplete-jv';
    autocompleteElement.innerHTML = '<ul class="autocomplete-jv-list"></ul>'
    textArea.parentElement.appendChild(autocompleteElement);

    // Vide et masque les suggestions
    const clearAutocomplete = (elem) => {
        elem.innerHTML = '';
        elem.parentElement.classList.toggle('on', false);
    }

    // Choix d'une suggestion dans la liste
    function autocompleteOnClick(event) {
        let val = textArea.value;
        const [bStart, bEnd] = getWordBoundsAtPosition(val, textArea.selectionEnd);
        const choosedAuthor = `@${event.target.innerText} `;
        textArea.value = `${val.substring(0, bStart)}${choosedAuthor}${val.substring(bEnd, val.length).trim()}`;
        clearAutocomplete(this);
        textArea.focus();
        textArea.selectionStart = bStart + choosedAuthor.length;
        textArea.selectionEnd = textArea.selectionStart;
    }

    // Récupère le mot au curseur
    function getWordAtCaret(clearCallback) {
        const [bStart, bEnd] = getWordBoundsAtPosition(textArea.value, textArea.selectionEnd);
        let wordAtCaret = textArea.value.substring(bStart, bEnd)?.trim();
        if (!wordAtCaret?.startsWith('@')) {
            clearCallback();
            return undefined;
        }
        wordAtCaret = wordAtCaret.substring(1); // on vire l'arobase pour la recherche
        return wordAtCaret;
    }

    // Efface la sélection de suggestion
    function unselectSuggestions(container) {
        container.querySelectorAll('.deboucled-author-suggestion.selected')
            .forEach(s => s?.classList.toggle('selected', false));
    }

    // Sélection d'une suggestion
    function focusTableChild(element) {
        if (!element) return;
        element.focus();
        element.classList.toggle('selected', true);
    }

    // Afficher les suggestions pendant la saisie
    textArea.addEventListener('input', async () => {
        const autocompleteTable = autocompleteElement.querySelector('.autocomplete-jv-list');
        if (!autocompleteTable) return;

        autocompleteTable.onclick = autocompleteOnClick;

        const clearCallback = () => clearAutocomplete(autocompleteTable);

        const wordAtCaret = getWordAtCaret(clearCallback);
        if (!wordAtCaret?.length) { clearCallback(); return; }

        const suggestions = await suggestAuthors(wordAtCaret);
        if (!suggestions?.length) { clearCallback(); return; }

        // On construit les éléments de la table avec les suggestions
        autocompleteTable.innerHTML = suggestions.map(s => `<li class="deboucled-author-suggestion">${s}</li>`).join('');
        autocompleteTable.querySelectorAll('.deboucled-author-suggestion')
            .forEach(s => s.onmouseover = () => {
                unselectSuggestions(autocompleteTable);
                s.classList.toggle('selected', true);
            })

        // On place correctement la table
        var caret = getCaretCoordinates(textArea, textArea.selectionEnd);
        const sLeft = `left:${caret.left + 3}px !important;`;
        const sTop = `top:${caret.top + (toolbar ? toolbar.scrollHeight + 15 : 50)}px !important;`;
        const sWidth = 'width: auto !important;';
        autocompleteElement.style = `${sLeft} ${sTop} ${sWidth}`;
        autocompleteElement.classList.toggle('on', true);
    });

    // Gestion des flèches haut/bas pour changer la sélection et entrée/tab pour valider
    textArea.addEventListener('keydown', (e) => {
        if (!autocompleteElement.classList.contains('on')) return;

        const autocompleteTable = autocompleteElement.querySelector('.autocomplete-jv-list');
        if (!autocompleteTable) return;

        let focusedChild = autocompleteTable.querySelector('.deboucled-author-suggestion.selected');

        switch (e.key) {
            case 'Enter':
            case 'Tab':
                if (focusedChild) focusedChild.click();
                e.preventDefault();
                break;
            case 'ArrowDown':
                unselectSuggestions(autocompleteTable);
                if (focusedChild) focusTableChild(focusedChild.nextElementSibling);
                else focusTableChild(autocompleteTable.firstElementChild);
                e.preventDefault();
                break;
            case 'ArrowUp':
                unselectSuggestions(autocompleteTable);
                if (focusedChild) focusTableChild(focusedChild.previousElementSibling);
                else focusTableChild(autocompleteTable.lastElementChild);
                e.preventDefault();
                break;
        }
    });

    // Pour changer la sélection de la suggestion au toucher
    autocompleteElement.addEventListener('touchmove', (e) => {
        if (!autocompleteElement.classList.contains('on')) return;
        const autocompleteTable = autocompleteElement.querySelector('.autocomplete-jv-list');
        if (!autocompleteTable) return;
        unselectSuggestions(autocompleteTable);
        focusTableChild(e.target);
    });
}

