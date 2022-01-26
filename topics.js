
///////////////////////////////////////////////////////////////////////////////////////
// TOPICS
///////////////////////////////////////////////////////////////////////////////////////

function getAllTopics(doc) {
    let allTopics = doc.querySelectorAll('.topic-list.topic-list-admin > li:not(.dfp__atf):not(.message)');
    return [...allTopics];
}

async function fillTopics(topics, optionAllowDisplayThreshold, optionDisplayThreshold, optionEnableTopicMsgCountThreshold, optionTopicMsgCountThreshold, optionAntiVinz) {
    let actualTopics = topics.length - hiddenTotalTopics - 1;
    let pageBrowse = 1;
    let filledTopics = [];
    const maxPages = 15;

    const maxTopicCount = parseInt(GM_getValue(storage_optionMaxTopicCount, storage_optionMaxTopicCount_default));

    while (actualTopics < maxTopicCount && pageBrowse <= maxPages) {
        pageBrowse++;
        const nextPageTopics = await getForumPageContent(pageBrowse)
            .then((res) => {
                let nextPageDoc = domParser.parseFromString(res, 'text/html');
                return getAllTopics(nextPageDoc);
            });

        for (let topic of nextPageTopics.slice(1)) {
            const topicBlacklisted = await isTopicBlacklisted(topic, optionAllowDisplayThreshold, optionDisplayThreshold, optionEnableTopicMsgCountThreshold, optionTopicMsgCountThreshold, optionAntiVinz);
            if (topicBlacklisted) {
                hiddenTotalTopics++;
                continue;
            }

            if (actualTopics < maxTopicCount && !topicExists(topics, topic)) {
                addTopic(topic, topics);
                actualTopics++;
                filledTopics.push(topic);
            }
        }
    }
    return filledTopics;
}

function createTopicListOverlay() {
    let topicTable = document.querySelector('.topic-list.topic-list-admin');
    if (!topicTable) return;

    topicTable.style.opacity = '0.3';
    topicTable.style.filter = 'blur(2px)';

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
    let optionDisplayTopicIgnoredCount = GM_getValue(storage_optionDisplayTopicIgnoredCount, storage_optionDisplayTopicIgnoredCount_default);
    if (optionDisplayTopicIgnoredCount) {
        let subjectHeader = document.querySelector('.topic-head > span:nth-child(1)');
        subjectHeader.innerHTML = `SUJET<span class="deboucled-topic-subject">(${hiddenTotalTopics} ignoré${plural(hiddenTotalTopics)})</span>`;
    }

    let optionDisplayBlacklistTopicButton = GM_getValue(storage_optionDisplayBlacklistTopicButton, storage_optionDisplayBlacklistTopicButton_default);
    if (optionDisplayBlacklistTopicButton) {
        let lastMessageHeader = document.querySelector('.topic-head > span:nth-child(4)');
        lastMessageHeader.style.width = '5.3rem';
    }
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

async function isTopicBlacklisted(element, optionAllowDisplayThreshold, optionDisplayThreshold, optionEnableTopicMsgCountThreshold, optionTopicMsgCountThreshold, optionAntiVinz) {
    if (!element.hasAttribute('data-id')) return true;

    let topicId = element.getAttribute('data-id');
    if (topicIdBlacklistMap.has(topicId) && topicId !== '67697509' && topicId !== '68410257') {
        matchedTopics.set(topicIdBlacklistMap.get(topicId), 1);
        hiddenTopicsIds++;
        return true;
    }

    // Seuil d'affichage valable uniquement pour les BL sujets et auteurs
    if (optionAllowDisplayThreshold && getTopicMessageCount(element) >= optionDisplayThreshold) return false;

    if (optionEnableTopicMsgCountThreshold && getTopicMessageCount(element) < optionTopicMsgCountThreshold) return true;

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
        const title = titleTag.textContent.trim();
        const author = authorTag.textContent.toLowerCase().trim();
        const url = titleTag.getAttribute('href');
        const vinzTopic = await isVinzTopic(title, author, url);
        if (vinzTopic) {
            matchedSubjects.addArrayIncrement([title]);
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
    let matches = [...normSubject.matchAll(subjectsBlacklistReg)];
    let groupedMatches = filterMatchResults(matches);
    return groupedMatches;
}

function getAuthorBlacklistMatches(author) {
    if (!authorsBlacklistReg) return null;
    const normAuthor = author.toLowerCase().normalizeDiacritic();
    if (normAuthor === 'rand0max') return null;
    return normAuthor.match(authorsBlacklistReg) ? [author] : null;
}

async function isVinzTopic(subject, author, topicUrl) {
    // TODO : implémenter du cache comme pour les poc

    let topicContent = undefined;

    async function isVinzMessage(url) {
        function getTopicMessageCallback(r) {
            const doc = domParser.parseFromString(r, 'text/html');
            const firstMessageElem = doc.querySelector('.txt-msg');
            return normalizeValue(firstMessageElem.textContent.trim());
        }
        if (!topicContent) {
            topicContent = await fetch(url).then(function (response) {
                if (!response.ok) throw Error(response.statusText);
                return response.text();
            }).then(function (r) {
                return getTopicMessageCallback(r);
            }).catch(function (err) {
                console.warn(err);
                return undefined;
            });
            if (!topicContent) return false; // Probablement 410
        }

        for (const boucleMessage of vinzBoucleMessageArray) {
            if (topicContent.includes(boucleMessage)) return true;
        }
        return false;
    }

    const authorMayBeVinz = author.startsWith('vinz') || ((author.length >= 5 && author.length <= 7) && author.charAt(0) === 'v');
    const pureSubject = makeVinzSubjectPure(subject);
    let possibleBoucle = false;
    for (const boucle of vinzBoucleArray) {
        let score = calculateStringDistance(boucle, pureSubject);
        if (authorMayBeVinz) score += 10; // on rajoute 10% au score si l'on soupçonne l'auteur d'être Vinz

        // +80% c'est certifié Vinz le zinzin
        if (score >= 80) return true;

        /* 
            +50% on a encore un doute, on ira vérifier le contenu de son topic éclatax 
            après avoir vérifié toutes les boucles, si aucune ne dépasse 80%.
            P.S : je sais que tu lis ça Vinz, je t'invite à disposax.
        */
        if (score >= 50) possibleBoucle = true;
    }
    if (possibleBoucle) return await isVinzMessage(topicUrl);
    return false;
}

async function isTopicPoC(element, optionDetectPocMode) {
    if (!element.hasAttribute('data-id')) return false;
    let topicId = element.getAttribute('data-id');

    if (topicId === '67697509' || topicId === '68410257') return false;

    if (pocTopicMap.has(topicId)) {
        return pocTopicMap.get(topicId);
    }

    let titleElem = element.querySelector('.lien-jv.topic-title');
    if (!titleElem) return false;

    const title = titleElem.textContent.trim().normalizeDiacritic();
    const isTitlePocRegex = /(pos(t|te|tez|to|too|tou)(")?$)|(pos(t|te|tez).*ou.*(cancer|quand|kan))|paustaouk|postukhan|postookan|postouk|postook|pose.*toucan/i;
    let isTitlePoc = title.isMatch(isTitlePocRegex);

    if ((optionDetectPocMode === 1 || optionDetectPocMode === 3) && !isTitlePoc) {
        // Inutile de continuer si le titre n'est pas détecté PoC et qu'on n'est pas en mode approfondi
        return false;
    }

    function topicCallback(r) {
        const doc = domParser.parseFromString(r, 'text/html');

        const firstMessageElem = doc.querySelector('.txt-msg');
        const firstMessage = firstMessageElem.textContent.trim().toLowerCase().normalizeDiacritic();

        const isMessagePocRegex = /pos(t|te|tez) ou/i;
        const maladies = ['cancer', 'ancer', 'cer', 'en serre', 'necrose', 'torsion', 'testiculaire', 'tumeur', 'cholera', 'sida', 'corona', 'coronavirus', 'covid', 'covid19', 'cerf', 'serf', 'phimosis', 'trisomie', 'diarrhee', 'charcot', 'lyme', 'avc', 'cirrhose', 'diabete', 'parkinson', 'alzheimer', 'mucoviscidose', 'lepre', 'tuberculose'];
        const isMessagePoc = firstMessage.isMatch(isMessagePocRegex) || (isTitlePoc && maladies.some(s => firstMessage.includes(s)));

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

function markTopicPoc(element, hide = false) {
    if (hide) {
        removeTopic(element);
        hiddenTotalTopics++;
        updateTopicsHeader();
        return;
    }
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
        if (avatar && avatar.hasAttribute('data-src') && avatar.hasAttribute('src')) {
            avatar.setAttribute('src', avatar.getAttribute('data-src'));
            avatar.removeAttribute('data-src');
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

        // Adjust text contrast for Dark Reader and JVC new Dark Theme
        const preferDark = document.documentElement.getAttribute('data-darkreader-scheme') || !document.documentElement.classList.contains('theme-light');
        //window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (preferDark) {
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

function handleTopicPictos(topics, optionDisplayBlackTopic, optionReplaceResolvedPicto) {
    const ignoredTopics = ['topic fermé', 'topic épinglé'];

    function buildBlackPicto(topicImg) {
        let span = document.createElement('span');
        span.className = 'topic-img icon-topic-folder deboucled-topic-folder-black';
        insertAfter(span, topicImg);
        topicImg.remove();
    }

    topics.slice(1).forEach(function (topic) {
        const topicImg = topic.querySelector('.topic-img');
        if (!topicImg) return;
        const currentPictoName = topicImg.title.trim().toLowerCase();
        if (ignoredTopics.includes(currentPictoName)) return;

        const messageCount = topic.querySelector('.topic-count');
        if (!messageCount) return;
        const nbMessage = parseInt(messageCount.textContent.trim());

        if (currentPictoName === 'topic résolu' && optionReplaceResolvedPicto) {
            if (nbMessage >= 100 && optionDisplayBlackTopic) {
                buildBlackPicto(topicImg);
            }
            else if (nbMessage >= 25) {
                topicImg.src = '/img/forums/topic-dossier2.png';
                topicImg.alt = 'Topic hot';
                topicImg.title = 'Topic hot';
            }
            else {
                topicImg.src = '/img/forums/topic-dossier1.png';
                topicImg.alt = 'Topic';
                topicImg.title = 'Topic';
            }
        }
        else if (nbMessage >= 100 && optionDisplayBlackTopic) {
            buildBlackPicto(topicImg);
        }
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
    // eslint-disable-next-line no-useless-escape
    const regex = /(\[?a+y+a+o*\]?|[\{[(🛑🔴🚨 ]+(alerte.*?)[\}\])🛑🔴🚨]+|^alerte)\s?:?-?,?!?/giu;
    topics.slice(1).forEach(function (topic) {
        const titleElem = topic.querySelector('.lien-jv.topic-title');
        let newTitle = titleElem.textContent.replace(regex, '');
        newTitle = newTitle.removeSurrogatePairs();
        newTitle = newTitle.replace(/\(\)|\[\]|{}/g, '');
        newTitle = newTitle.removeDoubleSpaces();
        newTitle = newTitle.trim().toLowerCase().capitalize();
        if (newTitle.length > 0) titleElem.textContent = newTitle;
    });
}

