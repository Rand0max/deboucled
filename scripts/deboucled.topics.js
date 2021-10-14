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
    const isTitlePocRegex = /(pos(t|te|tez|tou)(")?$)|(pos(t|te|tez).*ou.*(cancer|quand|kan))|paustaouk|postukhan|postookan/i;
    let isTitlePoc = isTitlePocRegex.test(title);

    if (optionDetectPocMode === 1 && !isTitlePoc) {
        // Inutile de continuer si le titre n'est pas détecté PoC et qu'on n'est pas en deep mode
        return false;
    }

    function topicCallback(r) {
        const doc = domParser.parseFromString(r, "text/html");

        const firstMessageElem = doc.querySelector('.txt-msg');
        const firstMessage = firstMessageElem.textContent.trim().normalizeDiacritic();

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
