///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED POSTING
///////////////////////////////////////////////////////////////////////////////////////


// /!\ A REVOIR /!\
function setFormDisabled(textarea, disabled) {
    if (disabled) {
        textarea.setAttribute("disabled", "true");
    } else {
        textarea.removeAttribute("disabled");
    }
}


async function handleDecensuredPost() {
    const textarea = getMessageTextarea();
    if (!textarea) return;

    const realMessage = textarea.value.trim();
    if (!realMessage) return;

    const fakeMessageInput = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_MESSAGE_FAKE_TEXTAREA);
    let fakeMessage = fakeMessageInput ? fakeMessageInput.value.trim() : '';

    if (!fakeMessage) {
        const currentTitle = getTitleFromTopicPage('fake');
        if (currentTitle) {
            fakeMessage = getRandomMessageForTitle(currentTitle);
        } else {
            fakeMessage = getRandomPlatitudeMessage();
        }

        if (fakeMessageInput) {
            fakeMessageInput.value = fakeMessage;
            fakeMessageInput.classList.add('auto-generated');
        }
    }

    try {
        await validatePendingMessageQuotes();

        const processedContent = await processContent(realMessage, fakeMessage);
        if (!processedContent) {
            logDecensuredError(new Error('Échec du traitement du contenu'), 'handleDecensuredPost', true);
            return;
        }

        const jvcResponse = await postDecensuredMessageToJvc(processedContent.fake);
        const messageId = extractMessageId(jvcResponse);

        if (messageId && jvcResponse.redirectUrl) {
            const success = await saveToDecensuredApi(messageId, realMessage, processedContent.fake);

            const redirectUrl = jvcResponse.redirectUrl.startsWith('http')
                ? jvcResponse.redirectUrl
                : window.location.origin + jvcResponse.redirectUrl;

            if (jvChatActive) {
                if (success) addAlertbox("success", "Message Décensured posté avec succès.");
                else addAlertbox("warning", "Message posté sur JVC mais pas sauvegardé avec Décensured.");
            }
            else {
                if (success) addAlertbox("success", "Message Décensured posté avec succès ! Redirection en cours...");
                else addAlertbox("warning", "Message posté sur JVC mais pas sauvegardé avec Décensured. Redirection en cours...");
                setTimeout(() => performRedirection(redirectUrl), 1000);
            }

        } else {
            setTextAreaValue(textarea, realMessage);
            logDecensuredError(new Error('Échec du posting sur JVC'), 'handleDecensuredPost', true);
        }

    } catch (error) {
        setTextAreaValue(textarea, realMessage);
        logDecensuredError(error, 'handleDecensuredPost', true);
    }
}

function buildFormData(form, messageContent) {
    let formData = new FormData(form);

    formData.set("message_topic", messageContent);
    formData.set("text", messageContent);

    const topicId = getCurrentTopicId();
    const forumId = getForumId ? getForumId() : window.location.pathname.match(/\/forums\/(\d+)-/)?.[1];

    if (topicId) formData.set("topicId", topicId);
    if (forumId) formData.set("forumId", forumId);
    formData.set("group", "1");
    formData.set("messageId", "undefined");

    const jvcPayload = getForumPayload();
    if (jvcPayload) {
        if (jvcPayload.formSession) {
            Object.entries(jvcPayload.formSession).forEach(([key, value]) => {
                formData.set(key, value);
            });
        }
        if (jvcPayload.ajaxToken) {
            formData.set("ajax_hash", jvcPayload.ajaxToken);
        }
    }

    document.querySelectorAll('input[type="hidden"]').forEach(input => {
        if (input.name && input.value) {
            formData.set(input.name, input.value);
        }
    });

    const fs_custom_input = Array.from(form.elements).find(e => /^fs_[a-f0-9]{40}$/i.test(e.name));
    if (fs_custom_input && !formData.has(fs_custom_input.name)) {
        formData.set(fs_custom_input.name, fs_custom_input.value);
    }

    if (!formData.has("ajax_hash")) {
        const ajaxHashInput = document.querySelector('input[name="ajax_hash"], #ajax_hash_liste_messages');
        if (ajaxHashInput) {
            formData.set("ajax_hash", ajaxHashInput.value);
        } else {
            logDecensuredError(new Error('Aucun ajax_hash trouvé'), 'prepareFormData');
        }
    }

    return formData;
}

function buildMultipartBody(formData) {
    const boundary = "----deboucledformboundary" + Math.random().toString(16).slice(2);
    let body = "";
    for (let [key, value] of formData.entries()) {
        body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
    }
    body += `--${boundary}--\r\n`;
    return { body, boundary };
}

function submitForm(bodyData, textarea) {
    return new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: 'POST',
            url: DECENSURED_CONFIG.URLS.POST_MESSAGE,
            headers: {
                'Accept': 'application/json',
                'Accept-Language': 'fr',
                'x-requested-with': 'XMLHttpRequest',
                'Content-Type': `multipart/form-data; boundary=${bodyData.boundary}`,
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            },
            data: bodyData.body,
            timeout: DECENSURED_CONFIG.POST_TIMEOUT,
            onload: (response) => handleFormResponse(response, textarea, resolve, reject),
            onerror: () => {
                setFormDisabled(textarea, false);
                reject(new Error('Erreur réseau'));
            },
            ontimeout: () => {
                setFormDisabled(textarea, false);
                reject(new Error('Timeout'));
            }
        });
    });
}

function handleFormResponse(response, textarea, resolve, reject) {
    setFormDisabled(textarea, false);

    if (response.status < 200 || response.status >= 300) {
        reject(new Error(`Erreur HTTP ${response.status}: ${response.responseText}`));
        return;
    }

    try {
        const res = JSON.parse(response.responseText);

        if (res.errors) {
            const errorMsg = res.errors.session
                ? `Erreur de session JVC: ${res.errors.session}`
                : 'Erreurs JVC: ' + JSON.stringify(res.errors);
            reject(new Error(errorMsg));
            return;
        }

        const messageId = extractMessageId(res);
        if (!messageId) {
            reject(new Error('Réponse JVC sans messageId'));
            return;
        }

        setTextAreaValue(textarea, '');

        const event = new CustomEvent('jvchat:postmessage', {
            detail: {
                id: messageId,
                content: textarea.value,
                username: userPseudo
            }
        });
        dispatchEvent(event);

        resolve(res);

    } catch {
        reject(new Error('Erreur parsing réponse: ' + response.responseText));
    }
}

function getPayloadFromScripts(doc) {
    const scripts = doc.getElementsByTagName('script');
    let rawPayloadString = null;

    for (let i = 0; i < scripts.length; i++) {
        const scriptContent = scripts[i].textContent || scripts[i].innerText;

        if (scriptContent) {
            const match = scriptContent.match(/window\.jvc\.forumsAppPayload\s*=\s*['"]([^'"]+)['"]/);
            if (match && match[1]) {
                rawPayloadString = match[1];
                break;
            }

            const jvcVarMatch = scriptContent.match(/jvc\.forumsAppPayload\s*=\s*['"]([^'"]+)['"]/);
            if (jvcVarMatch && jvcVarMatch[1]) {
                rawPayloadString = jvcVarMatch[1];
                break;
            }
        }
    }

    if (rawPayloadString) {
        try {
            const decodedPayload = JSON.parse(atob(rawPayloadString));
            return decodedPayload;
        } catch (e) {
            logDecensuredError(e, 'getGcToken - Erreur parsing payload JVC');
            return null;
        }
    }
    return null;
}

function getForumPayload() {
    if (window.jvc && window.jvc.forumsAppPayload) {
        try {
            return JSON.parse(atob(window.jvc.forumsAppPayload));
        } catch (e) {
            logDecensuredError(e, 'getForumPayload - Erreur parsing window.jvc.forumsAppPayload');
        }
    }
    if (unsafeWindow.jvc && unsafeWindow.jvc.forumsAppPayload) {
        try {
            return JSON.parse(atob(unsafeWindow.jvc.forumsAppPayload));
        } catch (e) {
            logDecensuredError(e, 'getForumPayload - Erreur parsing unsafeWindow.jvc.forumsAppPayload');
        }
    }

    return getPayloadFromScripts(document);
}

async function postDecensuredMessageToJvc(messageContent) {
    const textarea = getMessageTextarea();
    if (!textarea) return;

    const form = findElement(DECENSURED_CONFIG.SELECTORS.MESSAGE_FORM);
    if (!form) {
        throw new Error('Impossible de trouver le formulaire de post JVC');
    }

    setFormDisabled(textarea, true);

    try {
        const formData = buildFormData(form, messageContent);
        const body = buildMultipartBody(formData);

        return await submitForm(body, textarea);

    } catch (error) {
        setFormDisabled(textarea, false);
        logDecensuredError(error, 'postDecensuredMessageToJvc');
        throw error;
    }
}

function extractMessageId(jvcResponse) {
    if (!jvcResponse) return null;

    if (jvcResponse.messageId || jvcResponse.id) {
        return jvcResponse.messageId || jvcResponse.id;
    }

    if (jvcResponse.redirectUrl) {
        const match = jvcResponse.redirectUrl.match(/#post_(\d+)$/);
        if (match) return match[1];
    }

    return null;
}

function performRedirection(redirectUrl) {
    window.location.href = redirectUrl;
    window.location.reload();
}

async function saveToDecensuredApi(messageId, realMessage, fakeContent) {
    const topicId = getCurrentTopicId();
    const username = userPseudo;
    const messageUrl = `${window.location.origin}/forums/message/${messageId}`;
    const topicUrl = window.location.origin + window.location.pathname;
    const topicTitle = getTitleFromTopicPage('fake');

    return await createDecensuredMessage(
        messageId,
        username,
        messageUrl,
        fakeContent,
        realMessage,
        topicId,
        topicUrl,
        topicTitle
    );
}

async function createTopicAndMessage(topicId, topicUrl, pendingTopic, messageElement) {
    const topicApiResult = await createDecensuredTopic({
        topic_id: topicId,
        real_title: pendingTopic.realTitle,
        fake_title: pendingTopic.fakeTitle,
        jvc_topic_url: topicUrl
    });

    if (!topicApiResult) return false;

    const messageId = getMessageId(messageElement);
    if (!messageId) return false;

    const messageApiResult = await createDecensuredTopicMessage(
        topicId, messageId, topicUrl, pendingTopic.realTitle,
        pendingTopic.processedContent.fake, pendingTopic.realMessage
    );

    if (messageApiResult) {
        await applyDecensuredFormattingToNewTopic(messageElement, {
            message_real_content: pendingTopic.realMessage
        });
    }

    return messageApiResult;
}

async function processNewTopicCreation() {
    const pendingTopicJson = await store.get(storage_pendingDecensuredTopic, storage_pendingDecensuredTopic_default);
    if (!pendingTopicJson) return;

    let pendingTopic;
    try {
        pendingTopic = JSON.parse(pendingTopicJson);
    } catch (error) {
        logDecensuredError(error, 'processNewTopicCreation - Erreur parsing pendingTopic');
        await store.delete(storage_pendingDecensuredTopic);
        return;
    }

    const timeElapsed = Date.now() - pendingTopic.timestamp;
    if (timeElapsed > DECENSURED_CONFIG.PENDING_TOPIC_TIMEOUT) {
        await store.delete(storage_pendingDecensuredTopic);
        return;
    }

    const topicId = extractTopicIdFromUrl(window.location.pathname);
    const topicUrl = cleanTopicUrl(window.location.href);
    const username = userPseudo;

    if (!topicId || !username) return;

    const messages = document.querySelectorAll('.conteneur-messages-pagi > div.bloc-message-forum');
    if (messages.length !== 1) return;

    const firstMessage = messages[0];
    const authorElement = firstMessage.querySelector('.text-user, .bloc-pseudo-msg');
    const authorName = authorElement ? authorElement.textContent.trim() : '';

    if (authorName !== username) return;

    const success = await createTopicAndMessage(topicId, topicUrl, pendingTopic, firstMessage);

    if (success) {
        addAlertbox('success', 'Topic Décensured créé avec succès !');

        formatTopicAsDecensured(
            pendingTopic.realTitle,
            pendingTopic.fakeTitle,
            { indicatorType: 'default' }
        );

        const decensuredMsg = {
            message_real_content: pendingTopic.realMessage
        };
        await applyDecensuredFormattingToNewTopic(firstMessage, decensuredMsg);
    } else {
        addAlertbox('warning', 'Topic créé sur JVC mais échec de l\'enregistrement Décensured');
    }

    await store.delete(storage_pendingDecensuredTopic);
}

async function handleTopicDecensuredCreationFlow() {
    try {
        await handleDecensuredTopicCreation();

        setTimeout(async () => {
            await triggerNativeTopicCreation();
        }, DECENSURED_CONFIG.ANIMATION_DELAY);
    } catch (error) {
        logDecensuredError(error, 'handleTopicDecensuredCreationFlow - Erreur dans handleTopicDecensuredCreationFlow');
        throw error;
    }
}

async function triggerNativeTopicCreation() {
    const originalPostButton = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_ORIGINAL_TOPIC_POST_BUTTON);
    if (!originalPostButton) {
        logDecensuredError(new Error('Bouton de post original introuvable'), 'triggerNativeTopicCreation');
        return;
    }

    const elements = getTopicFormElements();
    if (elements.titleInput && !elements.titleInput.value.trim()) {
        console.warn('⚠️ Le titre est vide, tentative de récupération...');
        const pendingTopicJson = await store.get(storage_pendingDecensuredTopic, storage_pendingDecensuredTopic_default);
        if (pendingTopicJson) {
            try {
                const pendingTopic = JSON.parse(pendingTopicJson);
                setTextAreaValue(elements.titleInput, pendingTopic.fakeTitle);
            } catch (error) {
                logDecensuredError(error, 'triggerNativeTopicCreation - Erreur lors de la récupération du titre');
            }
        }
    }

    originalPostButton.style.visibility = 'hidden';
    originalPostButton.style.display = '';
    originalPostButton.click();
    setTimeout(() => {
        originalPostButton.style.display = 'none';
        originalPostButton.style.visibility = '';
    }, DECENSURED_CONFIG.TRIGGER_NATIVE_CREATION_DELAY);
}

async function handleDecensuredTopicCreation() {
    const elements = getTopicFormElements();
    if (!elements.titleInput || !elements.messageTextarea) {
        throw new Error('Impossible de trouver les éléments du formulaire');
    }

    const fakeMessageInput = document.querySelector(DECENSURED_CONFIG.SELECTORS.DEBOUCLED_DECENSURED_TOPIC_FAKE_TEXTAREA);
    const realTitleInput = document.querySelector('#deboucled-decensured-topic-real-title');

    const jvcTitleValue = elements.titleInput.value.trim();
    const realTitleValue = realTitleInput ? realTitleInput.value.trim() : '';
    const initialRealMessage = elements.messageTextarea.value.trim();
    const initialFakeMessage = fakeMessageInput ? fakeMessageInput.value.trim() : '';

    let finalRealTitle, finalFakeTitle, finalFakeMessage;

    if (realTitleValue) {
        finalRealTitle = realTitleValue;

        if (jvcTitleValue || initialFakeMessage) {
            finalFakeTitle = jvcTitleValue || getRandomPlatitudeTitle();
            finalFakeMessage = initialFakeMessage.length > 0 ? initialFakeMessage : getRandomPlatitudeMessage();
        } else {
            const randomTopicData = getRandomTopicWithMessage();
            finalFakeTitle = randomTopicData.title;
            finalFakeMessage = randomTopicData.message;
        }
    } else {
        throw new Error('Le titre réel est obligatoire en mode Topic masqué');
    }

    if (!initialRealMessage) {
        throw new Error('Le message est obligatoire');
    }

    const processedContent = await processContent(initialRealMessage, finalFakeMessage);

    const topicData = {
        realTitle: finalRealTitle,
        fakeTitle: finalFakeTitle,
        realMessage: initialRealMessage,
        processedContent: processedContent,
        timestamp: Date.now()
    };

    await store.set(storage_pendingDecensuredTopic, JSON.stringify(topicData));

    setTextAreaValue(elements.messageTextarea, finalFakeMessage);

    setTextAreaValue(elements.titleInput, finalFakeTitle);

    if (fakeMessageInput && !initialFakeMessage) {
        fakeMessageInput.value = finalFakeMessage;
    }

    return { success: true, fakeTitle: finalFakeTitle, fakeMessage: finalFakeMessage };
}
