
///////////////////////////////////////////////////////////////////////////////////////
// TOPICS
///////////////////////////////////////////////////////////////////////////////////////

function getAllTopics(doc) {
    let allTopics = doc.querySelectorAll('.topic-list.topic-list-admin > li:not(.dfp__atf):not(.message)');
    return [...allTopics];
}

async function fillTopics(topics, optionAllowDisplayThreshold, optionDisplayThreshold, optionAntiVinz) {
    let actualTopics = topics.length - hiddenTotalTopics - 1;
    let pageBrowse = 1;
    let filledTopics = [];
    const maxPages = 10;

    const maxTopicCount = parseInt(GM_getValue(storage_optionMaxTopicCount, storage_optionMaxTopicCount_default));

    while (actualTopics < maxTopicCount && pageBrowse <= maxPages) {
        pageBrowse++;
        await getForumPageContent(pageBrowse).then((res) => {
            let nextDoc = domParser.parseFromString(res, 'text/html');
            let nextPageTopics = getAllTopics(nextDoc);

            nextPageTopics.slice(1).forEach(function (topic) {
                if (isTopicBlacklisted(topic, optionAllowDisplayThreshold, optionDisplayThreshold, optionAntiVinz)) {
                    hiddenTotalTopics++;
                    return;
                }
                if (actualTopics < maxTopicCount && !topicExists(topics, topic)) {
                    addTopic(topic, topics);
                    actualTopics++;
                    filledTopics.push(topic);
                }
            });
        });
    }
    return filledTopics;
}

function createTopicListOverlay() {
    let topicTable = document.querySelector('.topic-list.topic-list-admin');
    if (!topicTable) return;

    topicTable.style.opacity = '0.3';

    const wrapperDiv = document.createElement('div');
    wrapperDiv.id = 'deboucled-topic-list-wrapper';
    topicTable.parentElement.insertBefore(wrapperDiv, topicTable);
    wrapperDiv.appendChild(topicTable);

    const overylayDiv = document.createElement('div');
    overylayDiv.className = 'deboucled-overlay active';
    wrapperDiv.appendChild(overylayDiv);

    const spinnerDiv = document.createElement('div');
    spinnerDiv.className = 'deboucled-overlay-spinner active';
    wrapperDiv.appendChild(spinnerDiv);
}

function toggleTopicOverlay(active) {
    document.querySelector('.deboucled-overlay').classList.toggle('active', active);
    document.querySelector('.deboucled-overlay-spinner').classList.toggle('active', active);
    document.querySelector('.topic-list.topic-list-admin').removeAttribute('style');
}

async function addTopicIdBlacklist(topicId, topicSubject, refreshTopicList) {
    if (!topicIdBlacklistMap.has(topicId)) {
        topicIdBlacklistMap.set(topicId, topicSubject);
        await saveStorage();

        if (!refreshTopicList) return;
        let topic = document.querySelector('[data-id="' + topicId + '"]');
        if (!topic) return;
        removeTopic(topic);
        hiddenTotalTopics++;
        updateTopicsHeader();
    }
}

function updateTopicsHeader() {
    //let optionDisplayTopicMatches = GM_getValue(storage_optionDisplayTopicMatches, storage_optionDisplayTopicMatches_default);
    //if (optionDisplayTopicMatches) return; // on n'affiche pas le nb de topics ignorés sur le header si le détail à droite est affiché.

    let subjectHeader = document.querySelector('.topic-head > span:nth-child(1)');
    subjectHeader.innerHTML = `SUJET<span class="deboucled-topic-subject">(${hiddenTotalTopics} ignoré${plural(hiddenTotalTopics)})</span>`;

    let lastMessageHeader = document.querySelector('.topic-head > span:nth-child(4)');
    lastMessageHeader.style.width = '5.3rem';
}

function removeTopic(element) {
    removeSiblingMessages(element);
    element.remove();
}

function removeSiblingMessages(element) {
    let sibling = element.nextElementSibling;
    while (sibling && sibling.classList.contains('message')) {
        const elemToRemove = sibling;
        sibling = sibling.nextElementSibling;
        elemToRemove.remove();
    }
}

function addTopic(element, topics) {
    if (!element.querySelector('.xXx.text-user.topic-author')) {
        // jvcare supprime le lien vers le profil et le lien dans la date du topic
        let topicAuthorSpan = element.children[1];
        let author = topicAuthorSpan.textContent.trim();
        topicAuthorSpan.outerHTML = `<a href="https://www.jeuxvideo.com/profil/${author.toLowerCase()}?mode=infos" target="_blank" class="xXx text-user topic-author">${author}</a>`;

        let topicDateSpan = element.children[3];
        let topicUrl = decryptJvCare(topicDateSpan.firstElementChild.className);
        let topicDate = topicDateSpan.firstElementChild.textContent.trim();
        topicDateSpan.innerHTML = `<a href="${topicUrl}" class="xXx lien-jv">${topicDate}</a>`;
    }
    document.querySelector('.topic-list.topic-list-admin').appendChild(element);
    topics.push(element); // on rajoute le nouveau topic à la liste en cours de remplissage pour éviter de le reprendre sur les pages suivantes
}

function topicExists(topics, element) {
    /*
    * Le temps de charger la page certains sujets peuvent se retrouver à la page précédente.
    * Cela peut provoquer des doublons à l'affichage.
    */
    let topicId = element.getAttribute('data-id');
    if (!topicId) return false;
    return topics.some((elem) => elem.getAttribute('data-id') === topicId);
}

function getTopicMessageCount(element) {
    let messageCountElement = element.querySelector('.topic-count');
    return parseInt(messageCountElement?.textContent.trim() ?? "0");
}

function isTopicBlacklisted(element, optionAllowDisplayThreshold, optionDisplayThreshold, optionAntiVinz) {
    if (!element.hasAttribute('data-id')) return true;

    let topicId = element.getAttribute('data-id');
    if (topicIdBlacklistMap.has(topicId) && topicId !== '67697509' && topicId !== '68410257') {
        matchedTopics.set(topicIdBlacklistMap.get(topicId), 1);
        hiddenTopicsIds++;
        return true;
    }

    // Seuil d'affichage valable uniquement pour les BL sujets et auteurs
    if (optionAllowDisplayThreshold && getTopicMessageCount(element) >= optionDisplayThreshold) return false;

    let titleTag = element.querySelector('.lien-jv.topic-title');
    if (titleTag) {
        const title = titleTag.textContent.trim();
        const subjectBlacklisted = getSubjectBlacklistMatches(title);
        if (subjectBlacklisted?.length) {
            matchedSubjects.addArrayIncrement(subjectBlacklisted);
            hiddenSubjects++;
            return true;
        }
    }

    let authorTag = element.querySelector('.topic-author');
    if (authorTag) {
        const author = authorTag.textContent.trim();
        const authorBlacklisted = getAuthorBlacklistMatches(author);
        if (authorBlacklisted?.length) {
            matchedAuthors.addArrayIncrement(authorBlacklisted);
            hiddenAuthors++;
            return true;
        }
    }

    if (optionAntiVinz) {
        const title = titleTag.textContent;
        const author = authorTag.textContent.toLowerCase().trim();
        if (isVinzTopic(title, author)) {
            matchedSubjects.addArrayIncrement([title.trim()]);
            matchedAuthors.addArrayIncrement(['Vinz']);
            hiddenSubjects++;
            hiddenAuthors++;
            return true;
        }
    }

    return false;
}

function filterMatchResults(matches) {
    /* Imbitable en dépit : 
        - on récupère toutes les correspondances sous forme de tableau avec matchAll
        - on vire le premier élément de chaque tableau qui correspond à la correspondance complète
        - on applati les tableaux dans un seul pour faciliter le filtrage
        - on filtre en ne gardant que les correspondances exactes (non-nulle) du groupe "expression" du regex
    */
    return matches.map(r => r.slice(1)).flat().filter(r => r);
}

function getSubjectBlacklistMatches(subject) {
    if (!subjectsBlacklistReg) return null;
    const normSubject = subject.normalizeDiacritic();
    // let matches = normSubject.match(subjectsBlacklistReg);
    let matches = [...normSubject.matchAll(subjectsBlacklistReg)];
    let groupedMatches = filterMatchResults(matches);
    return groupedMatches;
}

function getAuthorBlacklistMatches(author) {
    if (!authorsBlacklistReg) return null;
    const normAuthor = author.toLowerCase().normalizeDiacritic();
    if (normAuthor === 'rand0max' || normAuthor === 'deboucled') return null;
    // let matches = normAuthor.match(authorsBlacklistReg);
    let matches = [...normAuthor.matchAll(authorsBlacklistReg)];
    let groupedMatches = filterMatchResults(matches);
    return groupedMatches;
}

function isVinzTopic(subject, author) {
    const authorMayBeVinz = author.startsWith('vinz') || (author.length === 5 && author.charAt(0) === 'v');
    const pureSubject = makeVinzSubjectPure(subject);
    for (const boucle of vinzBoucleArray) {
        let score = calculateStringDistance(boucle, pureSubject);
        if (authorMayBeVinz) score += 10; // on rajoute 10% au score si l'on soupçonne l'auteur d'être Vinz
        if (score >= 80) return true;
    }
    return false;
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
    const isTitlePocRegex = /(pos(t|te|tez|to|too|tou)(")?$)|(pos(t|te|tez).*ou.*(cancer|quand|kan))|paustaouk|postukhan|postookan|postouk|postook|pose.*toucan/i;
    let isTitlePoc = isTitlePocRegex.test(title);

    if (optionDetectPocMode === 1 && !isTitlePoc) {
        // Inutile de continuer si le titre n'est pas détecté PoC et qu'on n'est pas en deep mode
        return false;
    }

    function topicCallback(r) {
        const doc = domParser.parseFromString(r, 'text/html');

        const firstMessageElem = doc.querySelector('.txt-msg');
        const firstMessage = firstMessageElem.textContent.trim().toLowerCase().normalizeDiacritic();

        const isMessagePocRegex = /pos(t|te|tez) ou/i;
        const maladies = ['cancer', 'ancer', 'cer', 'en serre', 'necrose', 'torsion', 'testiculaire', 'tumeur', 'cholera', 'sida', 'corona', 'coronavirus', 'covid', 'covid19', 'cerf', 'serf', 'phimosis', 'trisomie', 'diarrhee', 'charcot', 'lyme', 'avc', 'cirrhose', 'diabete', 'parkinson', 'alzheimer', 'mucoviscidose', 'lepre', 'tuberculose'];
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
    let spanHead = document.createElement('span');
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

        const text = messagePreview.querySelector('.txt-msg.text-enrichi-forum');
        if (!text) return messagePreview;

        // Adjust text contrast for Dark Reader
        const preferDark = document.documentElement.getAttribute('data-darkreader-scheme');
        //window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (preferDark === 'dark') {
            text.classList.toggle('deboucled-preview-content-text-light', true);
        }
        else {
            text.classList.toggle('deboucled-preview-content-text-dark', true);
        }

        return messagePreview;
    }

    async function previewTopicCallback(topicUrl) {
        return await fetch(topicUrl).then(function (response) {
            if (!response.ok) throw Error(response.statusText);
            return response.text();
        }).then(function (r) {
            const html = domParser.parseFromString(r, 'text/html');
            return prepareMessagePreview(html);
        }).catch(function (err) {
            console.error(err);
            return null;
        });
    }

    async function onPreviewHover(topicUrl, previewDiv) {
        if (previewDiv.querySelector('.bloc-message-forum')) return;
        const topicContent = await previewTopicCallback(topicUrl);
        if (!topicContent) return;
        previewDiv.firstChild.remove();
        previewDiv.appendChild(topicContent);
    }

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

        anchor.onclick = () => onPreviewHover(topicUrl, previewDiv);
        anchor.onmouseenter = () => onPreviewHover(topicUrl, previewDiv);
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

async function topicIsModerated(topicId) {
    async function isModerated(url) {
        return await fetch(url).then(function (response) {
            return response.status === 410;
        }).catch(function () {
            return false;
        });
    }
    let url42 = `/forums/42-1-${topicId}-1-0-1-0-topic.htm`;
    return await isModerated(url42);

    //if (await isModerated(url42)) return true;
    //let url1 = `/forums/1-1-${topicId}-1-0-1-0-topic.htm`;
    //return await isModerated(url1);
}

function removeUselessTags(topics) {
    const regex = /(\[?a+y+a+o*\]?|^((\{|\[|\(|🛑|🔴)*\s*\w*alerte?(\srouge|\snoir|\snoire|\secarlate|\satomique|\sgenerale|\scosmique|\snucleaire)?\w*\s*(\}|\]|\)|🛑|🔴)*))\s?:?-?,?/gi;
    topics.slice(1).forEach(function (topic) {
        const titleElem = topic.querySelector('.lien-jv.topic-title');
        let newTitle = titleElem.textContent.replace(regex, '').removeDoubleSpaces().trim().capitalize();
        if (newTitle.length > 0) titleElem.textContent = newTitle;
    });
}

