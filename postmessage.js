
///////////////////////////////////////////////////////////////////////////////////////
// POST MESSAGE
///////////////////////////////////////////////////////////////////////////////////////

function getAuthorFromMessageElem(messageElement) {
    return messageElement?.querySelector('.bloc-pseudo-msg.text-user,.bloc-pseudo-msg.text-modo,.bloc-pseudo-msg.text-admin,.jvchat-author')?.textContent?.trim() ?? '';
}

function getDateFromMessageElem(messageElement) {
    return messageElement.querySelector('.bloc-date-msg')?.textContent?.trim() ?? '';
}

function getRawTypedMessage(text) {
    if (!text?.length) {
        const textArea = document.querySelector('#message_topic');
        if (!textArea?.value?.length) return '';
        text = textArea.value;
    }
    const regex = new RegExp(/^[^>].*/, 'gmi');
    return text.match(regex)?.join('\n')?.trim() ?? text.trim();
}

function prepareMessageQuoteInfo(messageElement) {
    const currentUserPseudo = userPseudo ?? store.get(storage_lastUsedPseudo, userId);
    return {
        userId: userId,
        quotedMessageId: messageElement.getAttribute('data-id') ?? messageElement.getAttribute('jvchat-id'),
        quotedUsername: getAuthorFromMessageElem(messageElement).toLowerCase(),
        quotedMessageUrl: messageElement.querySelector('.bloc-date-msg .lien-jv')?.href,
        newMessageId: 0, // filled after redirect
        newMessageUsername: currentUserPseudo?.toLowerCase() ?? 'anonymous',
        newMessageContent: '', // filled at validation
        newMessageUrl: '', // filled after redirect
        topicId: currentTopicId,
        topicUrl: window.location.origin + window.location.pathname,
        topicTitle: getTopicTitle(),
        status: 'pending',
        lastUpdateDate: new Date()
    }
}

function fixNoelshackDirectUrl() {
    let message = document.querySelector('#message_topic').value;
    if (message.match(/https:\/\/www\.noelshack\.com\/\d+-\d+-\d+-.*\..*/i)) {
        message = buildNoelshackDirectUrl(message);
        document.querySelector('#message_topic').value = message      
    }    
}

async function validatePendingMessageQuotes() {
    fixNoelshackDirectUrl()
    const rawMessage = getRawTypedMessage();    
    const newStatus = rawMessage?.length ? 'validated' : 'canceled'; // Citation vide
    messageQuotesPendingArray
        .filter(mqp =>
            mqp.status === 'pending'
            && mqp.topicId === currentTopicId)
        .forEach(mqp => {
            mqp.newMessageContent = rawMessage;
            mqp.status = newStatus;
            mqp.lastUpdateDate = new Date();
        });
    await saveLocalStorage();
}

async function cleanupPendingMessageQuotes() {
    const datenow = new Date();
    messageQuotesPendingArray = messageQuotesPendingArray
        .filter((q) => { // On ne garde que les statuts pending de moins de 3 jours
            const dateExpireRange = new Date(datenow.setMinutes(datenow.getMinutes() - pendingMessageQuoteExpire.totalMinutes()));
            return (q.status !== 'validated' && q.lastUpdateDate > dateExpireRange) && q.status !== 'canceled';
        });

    await saveLocalStorage();
}

/*
async function postNewMessage() {
    const textArea = document.querySelector('#message_topic');
    if (!textArea) return;

    const formElement = document.querySelector('.form-post-message');
    if (!formElement) return;

    const formData = new FormData(formElement);

    let checkRes;
    await GM.xmlHttpRequest({
        method: 'POST',
        url: location.href,
        data: formData,
        headers: { 'Content-Type': 'application/json' },
        onload: (response) => { checkRes = response.responseText; },
        onerror: (response) => { console.error("error : %o", response); }
    });

    return checkRes;
}
*/

async function buildQuoteMessage(messageElement, selection) {
    const textArea = document.querySelector('#message_topic');
    if (!textArea) return;

    const newQuoteHeader = `> Le ${getDateFromMessageElem(messageElement)} '''${getAuthorFromMessageElem(messageElement)}''' a écrit : `;

    if (selection?.length) {
        const currentContent = textArea.value.length === 0 ? '' : `${textArea.value.trim()}\n\n`;
        const quotedText = selection.replaceAll('\n', '\n> ');
        textArea.value = `${currentContent}${newQuoteHeader}\n> ${quotedText}\n\n`;
        textArea.dispatchEvent(new Event('change'));
        textArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        textArea.focus({ preventScroll: true });
        textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    }
    else {
        setTimeout(() => {
            const date = getDateFromMessageElem(messageElement);
            const regex = new RegExp(`> Le\\s+?${date}\\s+?:`);
            textArea.value = textArea.value.replace(regex, newQuoteHeader);
        }, 600);
    }

    if (getAuthorFromMessageElem(messageElement).toLowerCase() !== userPseudo?.toLowerCase()) {
        messageQuotesPendingArray.push(prepareMessageQuoteInfo(messageElement));
        await saveLocalStorage();
    }
}

async function suggestAuthors(authorHint) {
    // Min 3 char & must be logged in
    if (authorHint?.length < 3 || !userPseudo) return undefined;

    const url = `/sso/ajax_suggest_pseudo.php?pseudo=${authorHint.trim()}`;

    let suggestions = await fetchJson(url);
    return suggestions ? [...suggestions.alias.map(s => s.pseudo)] : undefined;
}

function getTextSelection() {
    return window.getSelection ? window.getSelection() : document.selection;
}

function getSelectionOffset(container, pointerEvent) {
    const selectionRect = getTextSelection().getRangeAt(0).getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const selectionOffsetLeft = selectionRect.left - containerRect.left + selectionRect.width - 9;
    const eventOffsetLeft = pointerEvent.pageX - container.offsetLeft - 7;
    const offsetLeft = eventOffsetLeft > selectionOffsetLeft ? selectionOffsetLeft : eventOffsetLeft;
    const offsetTop = selectionRect.top - containerRect.top + selectionRect.height + 10; // mouseEvent.pageY - container.offsetTop + 14
    return { offsetLeft: offsetLeft, offsetTop: offsetTop };
}

function addMessagePartialQuoteEvents(allMessages) {
    function buildPartialQuoteButton(message) {
        const blocContenu = message.querySelector('.bloc-contenu');
        if (!blocContenu) return;
        const partialQuoteButton = document.createElement('div');
        partialQuoteButton.className = 'deboucled-quote';
        partialQuoteButton.innerHTML = '<a class="deboucled-partial-quote-logo"></a>';
        blocContenu.appendChild(partialQuoteButton);
        return partialQuoteButton;
    }

    const clearAllQuoteButtons = () => document.querySelectorAll('.deboucled-quote').forEach(e => e.classList.toggle('active', false));

    document.onselectionchange = async function () {
        await sleep(100);
        const selection = getTextSelection().toString();
        if (!selection?.length) clearAllQuoteButtons();
    };

    allMessages.forEach((message) => {
        const partialQuoteButton = buildPartialQuoteButton(message); // Partial quote

        async function partialQuoteEvent(pointerEvent) {
            const selection = getTextSelection().toString();
            if (!selection?.length) return;

            partialQuoteButton.onclick = () => buildQuoteMessage(message, selection);

            const selectionOffset = getSelectionOffset(message, pointerEvent);
            partialQuoteButton.style.left = `${selectionOffset.offsetLeft}px`;
            partialQuoteButton.style.top = `${selectionOffset.offsetTop}px`;

            clearAllQuoteButtons();
            await sleep(100);
            partialQuoteButton.classList.toggle('active', true);
        }

        message.onpointerup = (pe) => partialQuoteEvent(pe); // Pointer events = mouse + touch + pen
        message.oncontextmenu = (pe) => partialQuoteEvent(pe); // TouchEnd/MouseUp/PointerUp does not fire on mobile (in despite of)
    });
}

function addMessageQuoteEvents(allMessages) {
    allMessages.forEach((message) => {
        const quoteButton = message.querySelector('.picto-msg-quote');
        if (quoteButton) quoteButton.addEventListener('click', () => buildQuoteMessage(message)); // Full quote
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
    autocompleteElement.innerHTML = '<ul class="autocomplete-jv-list"></ul>';
    textArea.parentElement.appendChild(autocompleteElement);

    // Vide et masque les suggestions
    const clearAutocomplete = (elem) => {
        elem.innerHTML = '';
        elem.parentElement.classList.toggle('on', false);
    };

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

    const getFocusedChild = (table) => table.querySelector('.deboucled-author-suggestion.selected');

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
            .forEach(s => s.onpointerover = () => {
                unselectSuggestions(autocompleteTable);
                focusTableChild(s);
            });

        // On place correctement la table
        let caret = getCaretCoordinates(textArea, textArea.selectionEnd);
        const sLeft = `left:${caret.left + 3}px !important;`;
        const sTop = `top:${caret.top + (toolbar ? toolbar.scrollHeight + 15 : 50)}px !important;`;
        const sWidth = 'width: auto !important;';
        autocompleteElement.style = `${sLeft} ${sTop} ${sWidth}`;
        autocompleteElement.classList.toggle('on', true);

        if (!getFocusedChild(autocompleteTable)) focusTableChild(autocompleteTable.firstElementChild);
    });

    // Gestion des flèches haut/bas pour changer la sélection et entrée/tab pour valider
    textArea.addEventListener('keydown', (e) => {
        if (!autocompleteElement.classList.contains('on')) return;

        const autocompleteTable = autocompleteElement.querySelector('.autocomplete-jv-list');
        if (!autocompleteTable) return;

        let focusedChild = getFocusedChild(autocompleteTable);

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


// paste image noelshack

const textArea = document.querySelector('#message_topic');
const textAreaMP = document.querySelector('textarea#message');

textArea?.addEventListener('drop', handleDrop);
textArea?.addEventListener('paste', handlePaste);
textAreaMP?.addEventListener('drop', handleDrop);
textAreaMP?.addEventListener('paste', handlePaste);

document.querySelector('.picto-msg-crayon')?.addEventListener('click', () => {
    setTimeout(() => {
        document.querySelectorAll('textarea[name="text_commentaire"]').forEach(function (el) {
            console.log(el)
            el.addEventListener('paste', handlePaste);
            el.addEventListener('drop', handleDrop);
          });
    }, 100);
   
});

async function handleDrop(event) {
    const dataTransfer = event.dataTransfer;
    if (dataTransfer.types && Array.from(dataTransfer.types).includes('Files')) {
        event.preventDefault();
        event.stopPropagation();
        const files = dataTransfer.files;
        await uploadFiles(files, event.target);
    }
}

async function handlePaste(event) {
    const clipboardData = event.clipboardData;
    if (clipboardData.types.includes('Files')) {
        event.preventDefault();
        const files = clipboardData.files;
        await uploadFiles(files, event.target);
    }
}

async function uploadFiles(files, element) {
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        if (file.type.includes("image")) {
            if (file.type === "image/webp") {
                file = await convertWebPToJPEG(file);
            }
            const imageUrl = await uploadFile(file);
            if (imageUrl) {
                updateTextArea(imageUrl, element);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            if (i >= 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
}

async function uploadFile(file) {
    const formData = new FormData();
    formData.append('publication', '0');
    formData.append('domain', 'https://www.jeuxvideo.com');
    formData.append('fichier', file);

    const response = await sendRequest(formData);

    try {
        const data = JSON.parse(response.responseText);
        return data.url || null;
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
    }
}

function updateTextArea(imageUrl, element) {
    imageUrl = " " + imageUrl + " ";
    const position = element.selectionStart;
    const before = element.value.substring(0, position);
    console.log(before)
    const after = element.value.substring(position, element.value.length);
    element.value = before + imageUrl + after;
    element.selectionStart = element.selectionEnd = position + imageUrl.length;
    const changeEvent = new Event('change', { bubbles: true });
    element.dispatchEvent(changeEvent);
}

async function convertWebPToJPEG(webpBlob) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(webpBlob);

    return new Promise((resolve) => {
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0, img.width, img.height);
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg');
        };
    });
}

function sendRequest(formData) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://www.noelshack.com/webservice/envoi.json',
            data: formData,
            onload: function(response) {
                resolve(response);
            },
            onerror: function(error) {
                console.error(error);
                reject(error);
            }
        });
    });
}

