
///////////////////////////////////////////////////////////////////////////////////////
// TOPICS
///////////////////////////////////////////////////////////////////////////////////////

function getAllTopics(doc) {
    if (!doc) return;
    let allTopics = doc.querySelectorAll('.topic-list > li:not(.dfp__atf):not(.message)');
    return [...allTopics];
}

async function fillTopics(topics, topicOptions) {
    let actualTopics = topics.length - hiddenTotalTopics - 1;
    let pageBrowse = 1;
    let filledTopics = [];
    const maxPages = 15;
    const maxTopicCount = parseInt(store.get(storage_optionMaxTopicCount, storage_optionMaxTopicCount_default));

    while (actualTopics < maxTopicCount && pageBrowse <= maxPages) {
        pageBrowse++;
        const nextPageTopics = await getForumPageContent(pageBrowse).then((nextPageDoc) => getAllTopics(nextPageDoc));
        if (!nextPageTopics) break;

        for (let topic of nextPageTopics.slice(1)) {
            const topicBlacklisted = await isTopicBlacklisted(topic, topicOptions);
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
    let topicTable = document.querySelector('.topic-list');
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
    document.querySelector('.topic-list').removeAttribute('style');
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

function getTopicId() {
    /*
    const urlRegex = /^\/forums\/(42|1)-[0-9]+-(?<topicid>[0-9]+)-[0-9]+-0-1-0-.*\.htm$/gi;
    const matches = urlRegex.exec(window.location.pathname);
    if (!matches?.groups?.topicid) return;
    return parseInt(matches.groups.topicid);
    */
    const blocFormulaireElem = document.querySelector('#bloc-formulaire-forum');
    if (!blocFormulaireElem) return undefined;
    return blocFormulaireElem.getAttribute('data-topic-id');
}

function getTopicCurrentPageId(doc) {
    if (!doc) doc = document;
    const pageActiveElem = doc.querySelector('.page-active');
    if (!pageActiveElem) return undefined;
    return parseInt(pageActiveElem.textContent.trim());
}

function getTopicPageIdFromUri(url) {
    const urlRegex = /^\/forums\/(42|1)-[0-9]+-[0-9]+-(?<pageid>[0-9]+)-0-1-0-.*\.htm$/gi;
    const matches = urlRegex.exec(url);
    if (!matches?.groups?.pageid) return;
    return parseInt(matches.groups.pageid);
}

function getTopicLastPageId(doc) {
    if (!doc) doc = document;
    const lastPageButton = doc.querySelector('.pagi-fin-actif.icon-next2');
    if (!lastPageButton) return undefined;
    let pageId = getTopicPageIdFromUri(lastPageButton.getAttribute('href'));
    if (!pageId) {
        pageId = getTopicPageIdFromUri(decryptJvCare(lastPageButton.getAttribute('class')));
    }
    return parseInt(pageId);
}

function updateTopicsHeader() {
    let optionDisplayTopicIgnoredCount = store.get(storage_optionDisplayTopicIgnoredCount, storage_optionDisplayTopicIgnoredCount_default);
    if (optionDisplayTopicIgnoredCount) {
        let subjectHeader = document.querySelector('.topic-head > span:nth-child(1)');
        subjectHeader.innerHTML = `SUJET<span class="deboucled-topic-subject">(${hiddenTotalTopics} ignoré${plural(hiddenTotalTopics)})</span>`;
    }

    let optionDisplayBlacklistTopicButton = store.get(storage_optionDisplayBlacklistTopicButton, storage_optionDisplayBlacklistTopicButton_default);
    if (optionDisplayBlacklistTopicButton) {
        let lastMessageHeader = document.querySelector('.topic-head > span:nth-child(4)');
        lastMessageHeader.style.width = '5.5rem';
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
    document.querySelector('.topic-list').appendChild(element);
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

function getTopicLoop(subject, author) {
    const subjectBlacklisted = subject?.length ? getSubjectBlacklistMatches(subject, aiLoopSubjectReg) : null;
    const authorBlacklisted = author?.length ? getAuthorBlacklistMatches(author, undefined, aiLoopAuthorReg) : null;
    const boucledAuthorBlacklisted = author?.length ? getAuthorBlacklistMatches(author, undefined, aiBoucledAuthorsReg) : null;
    const subjectLoopScore = subjectBlacklisted?.length && authorBlacklisted?.length ? calcStringDistanceScore(subject, subjectBlacklisted[0]) : 0;
    const isSubjectLoop = subjectLoopScore >= 70;
    const isAuthorLoop = boucledAuthorBlacklisted?.length > 0 || (isSubjectLoop && authorBlacklisted?.length > 0);

    return {
        subjectMatches: subjectBlacklisted,
        authorMatches: authorBlacklisted,
        boucledAuthorMatches: boucledAuthorBlacklisted,
        isSubjectLoop: isSubjectLoop,
        isAuthorLoop: isAuthorLoop,
        loopSubject: subjectBlacklisted?.length ? subjectBlacklisted[0] ?? subject : subject,
        loopAuthor: boucledAuthorBlacklisted?.length ? boucledAuthorBlacklisted[0] ?? author : author,
        isLoop: function () { return this.isSubjectLoop || this.isAuthorLoop; }
    };
}

function handleAntiLoopAi(topicOptions, title, author, titleTag) {
    const topicLoop = getTopicLoop(title, author);
    if (!topicLoop.isLoop()) return false;

    if (topicOptions.optionAntiLoopAiMode === 1) {
        if (topicLoop.isSubjectLoop) {
            titleTag.style.width = 'auto';
            markTopicLoop(topicLoop.loopSubject, titleTag);
        }
        else if (topicLoop.isAuthorLoop) {
            if (topicLoop.loopAuthor === 'pseudo supprimé') return false; // faux positif
            titleTag.style.width = 'auto';
            markAuthorLoop(topicLoop.loopAuthor, titleTag);
        }
        return false;
    }
    else if (topicOptions.optionAntiLoopAiMode === 2) {
        if (topicLoop.isSubjectLoop) {
            matchedSubjects.addArrayIncrement(topicLoop.subjectMatches);
            hiddenSubjects++;
        }
        if (topicLoop.isAuthorLoop) {
            matchedAuthors.addArrayIncrement(topicLoop.boucledAuthorMatches ?? topicLoop.authorMatches);
            hiddenAuthors++;
        }
        return true;
    }
}

async function isTopicBlacklisted(topicElement, topicOptions) {
    if (!topicElement.hasAttribute('data-id')) return true;

    const topicId = topicElement.getAttribute('data-id');
    if (topicIdBlacklistMap.has(topicId) && !deboucledTopics.includes(topicId)) {
        matchedTopics.set(topicId, topicIdBlacklistMap.get(topicId));
        hiddenTopicsIds++;
        return true;
    }

    // Seuil d'affichage valable uniquement pour les BL sujets et auteurs
    if (topicOptions.optionAllowDisplayThreshold && getTopicMessageCount(topicElement) >= topicOptions.optionDisplayThreshold) return false;

    if (topicOptions.optionEnableTopicMsgCountThreshold && getTopicMessageCount(topicElement) < topicOptions.optionTopicMsgCountThreshold) return true;

    const titleTag = topicElement.querySelector('.lien-jv.topic-title');
    const authorTag = topicElement.querySelector('.topic-author');

    const title = titleTag?.textContent.trim();
    const author = authorTag?.textContent.toLowerCase().trim();

    if (author?.length && author === userPseudo?.toLowerCase()) {
        return false;
    }

    if (title?.length) {
        const subjectBlacklisted = getSubjectBlacklistMatches(title);
        if (subjectBlacklisted?.length) {
            matchedSubjects.addArrayIncrement(subjectBlacklisted);
            hiddenSubjects++;
            return true;
        }
    }

    if (author?.length) {
        const authorBlacklisted = getAuthorBlacklistMatches(author);
        if (authorBlacklisted?.length) {
            matchedAuthors.addArrayIncrement(authorBlacklisted);
            hiddenAuthors++;
            return true;
        }
    }

    if (topicOptions.optionAntiVinz && title?.length && author?.length) {
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

    if (topicOptions.optionAntiLoopAiMode !== 0) {
        return handleAntiLoopAi(topicOptions, title, author, titleTag);
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

function getSubjectBlacklistMatches(subject, regex = subjectsBlacklistReg) {
    if (!regex) return null;
    const normSubject = subject.normalizeDiacritic();
    let matches = [...normSubject.matchAll(regex)];
    let groupedMatches = filterMatchResults(matches);
    return groupedMatches;
}

function getAuthorBlacklistMatches(author, isSelf, regex = authorsBlacklistReg) {
    if (!regex) return null;
    const normAuthor = author.toLowerCase().normalizeDiacritic();
    if (deboucledPseudos.includes(normAuthor) || isSelf) return null;
    return normAuthor.match(regex) ? [author] : null;
}

function isContentYoutubeBlacklisted(messageContentElement) {
    const content = getMessageContentWithoutQuotes(messageContentElement);
    if (!youtubeBlacklistReg || !content?.length) return null;
    return content.match(youtubeBlacklistReg);
}

async function isVinzTopic(subject, author, topicUrl) {
    // TODO : implémenter du cache comme pour les poc

    if (typeof distance === 'undefined') return; // eslint-disable-line no-undef

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
        let score = calcStringDistanceScore(boucle, pureSubject);
        if (authorMayBeVinz) score += 10; // on rajoute 10% au score si l'on soupçonne l'auteur d'être Vinz

        // +80% c'est certifié Vinz le zinzin
        if (score >= 80) return true;

        /* 
            +50% on a encore un doute, on ira vérifier le contenu de son topic éclatax 
            après avoir vérifié toutes les boucles, si aucune ne dépasse 80%.
            P.S : je sais que tu lis ça Vinz, je t'invite à disposax dans les plus brefs délaxs.
        */
        if (score >= 50) possibleBoucle = true;
    }
    if (possibleBoucle) return await isVinzMessage(topicUrl);
    return false;
}

function getTopicPocStatus(topicId) {
    return pocTopicMap.get(topicId);
}

async function isTopicPoC(element, optionDetectPocMode) {
    if (!element.hasAttribute('data-id')) return false;
    let topicId = element.getAttribute('data-id');

    if (deboucledTopics.includes(topicId)) return false;

    const existingStatus = getTopicPocStatus(topicId);
    if (existingStatus) return existingStatus;

    let titleElem = element.querySelector('.lien-jv.topic-title');
    if (!titleElem) return false;

    const title = titleElem.textContent.trim().normalizeDiacritic();
    const isTitlePocRegex = /(pos(t|te|tez|to|too|tou|ttou)(")?$)|(pos(t|te|tez).*ou.*(cancer|quand|kan))|paustaouk|postukhan|postookan|postouk|postook|pose.*toucan/i;
    let isTitlePoc = title.isMatch(isTitlePocRegex);

    if ((optionDetectPocMode === 1 || optionDetectPocMode === 3) && !isTitlePoc) {
        // Inutile de continuer si le titre n'est pas détecté PoC et qu'on n'est pas en mode approfondi
        return false;
    }

    function topicCallback(r) {
        const doc = domParser.parseFromString(r, 'text/html');

        const firstMessageElem = doc.querySelector('.txt-msg');
        const firstMessage = firstMessageElem?.textContent.trim().toLowerCase().normalizeDiacritic();
        if (!firstMessage?.length) return false;

        const isMessagePocRegex = /pos(t|te|tez) ou/i;
        const maladies = ['cancer', 'ancer', 'cer', 'en serre', 'necrose', 'torsion', 'testiculaire', 'tumeur', 'cholera', 'sida', 'corona', 'coronavirus', 'covid', 'covid19', 'cerf', 'serf', 'phimosis', 'trisomie', 'diarrhee', 'charcot', 'lyme', 'avc', 'cirrhose', 'diabete', 'parkinson', 'alzheimer', 'mucoviscidose', 'lepre', 'tuberculose', 'variole'];
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

function buildBadge(id, content, hint, url, level, iconClass, badgeLogoClass) {
    const badge = document.createElement('span');
    badge.id = `deboucled_${id}`;
    let badgeClass = 'deboucled-badge';
    if (level) badgeClass = `${badgeClass} ${badgeClass}-${level}${preferDarkTheme() ? ' dark' : ''}`;
    badge.className = `${badgeClass} ${hint ? '' : 'pill'} ${iconClass ? iconClass : ''}`.trim();
    badge.textContent = content;
    if (hint?.length) badge.setAttribute('deboucled-data-tooltip', hint);

    if (badgeLogoClass?.length) badge.classList.add(badgeLogoClass);

    if (url?.length) {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.target = '_blank';
        anchor.appendChild(badge);
        return anchor;
    }

    return badge;
}

function addBadgeTag(badgeOpt) {
    const badgeTag = buildBadge(badgeOpt.id, badgeOpt.content, badgeOpt.hint, badgeOpt.url, badgeOpt.level, undefined, badgeOpt.badgeLogoClass);
    if (badgeOpt.insertFn) badgeOpt.insertFn(badgeTag);
    else badgeOpt.parent.append(badgeTag);
}

function markTopicPoc(nearElement, withHint = true) {
    const badgeOpt = {
        id: 'subject_poc',
        content: 'PoC',
        hint: withHint ? 'Détection d\'un "post ou cancer"' : undefined,
        url: 'https://jvflux.fr/Post_ou_cancer',
        level: 'danger',
        parent: nearElement,
        insertFn: function (elem) { this.parent.insertAdjacentElement('afterend', elem); }
    };
    addBadgeTag(badgeOpt);
}

function markTopicLoop(subject, nearElement, withHint = true) {
    const cleanSubject = subject.replaceAll('%', '').trim();
    const redirectUrl = `${jvarchiveUrl}/topic/recherche?searchType=titre_topic&search=${cleanSubject}`;
    const badgeOpt = {
        id: 'ai_boucledsubject',
        content: 'BOUCLE',
        hint: withHint ? `<I.A Déboucled> - consulter cette boucle sur JvArchive` : undefined,
        url: redirectUrl,
        level: 'danger',
        parent: nearElement,
        badgeLogoClass: 'deboucled-idea-logo',
        insertFn: function (elem) { this.parent.insertAdjacentElement('afterend', elem); }
    };
    addBadgeTag(badgeOpt);
}

function markAuthorLoop(author, nearElement, withHint = true, badgeContainerClass) {
    const cleanAuthor = author.replaceAll('%', '').trim();
    const redirectUrl = `${jvarchiveUrl}/topic/recherche?searchType=auteur_topic_exact&search=${cleanAuthor}`;
    const badgeContainer = buildBadgeContainer(nearElement.parentElement, badgeContainerClass);
    const badgeOpt = {
        id: 'ai_boucledauthor',
        content: 'BOUCLEUR',
        hint: withHint ? `<I.A Déboucled> - consulter les topics de ce boucleur sur JvArchive` : undefined,
        url: redirectUrl,
        level: 'warning',
        parent: badgeContainer,
        badgeLogoClass: 'deboucled-idea-logo',
        insertFn: function (elem) { this.parent.prepend(elem); }
    };
    addBadgeTag(badgeOpt);
}

function markTopicHot(titleElem, append = true) {
    const loopBadge = document.createElement('span');
    loopBadge.className = 'deboucled-badge deboucled-fire-logo';
    loopBadge.setAttribute('deboucled-data-tooltip', 'Topic tendance');

    if (append) {
        titleElem.appendChild(loopBadge);
    }
    else {
        loopBadge.style.marginLeft = '0';
        titleElem.prepend(loopBadge);
    }
}

function buildBadgeContainer(parentElement, customClass) {
    let badgeContainer = parentElement.querySelector('.deboucled-badge-container');
    if (badgeContainer) return badgeContainer;

    badgeContainer = document.createElement('div');
    badgeContainer.className = `deboucled-badge-container ${customClass ? customClass : ''}`;
    parentElement.append(badgeContainer);
    return badgeContainer
}

function buildAuthorBlacklistBadges(author, parentElement, excludedLists, containerClass) {
    if (!parentElement) return;

    const blacklists = blacklistsIncludingEntity(author, entityAuthor, false);
    if (!blacklists?.length) return;

    const badgeContainer = buildBadgeContainer(parentElement, containerClass);

    const cleanAuthor = author.replaceAll('%', '').trim();
    const redirectUrl = `${jvarchiveUrl}/topic/recherche?searchType=auteur_topic_exact&search=${cleanAuthor}`;

    blacklists
        .filter(bl => !excludedLists?.includes(bl.id))
        .sort((a, b) => (a.enabled > b.enabled) ? -1 : 1)
        .forEach(bl => {
            const badgeOpt = {
                id: `blacklist_${bl.id}`,
                content: bl.description.toUpperCase(),
                hint: `Présent dans la liste « ${bl.description} ».`,
                level: bl.enabled ? 'blacklist' : 'neutral',
                url: redirectUrl,
                parent: badgeContainer,
                insertFn: function (elem) { this.parent.append(elem); }
            };
            addBadgeTag(badgeOpt);
        });
}

function addIgnoreButtons(topics) {
    let header = topics[0];
    let spanHead = document.createElement('span');
    spanHead.setAttribute('class', 'deboucled-topic-blacklist');
    spanHead.setAttribute('style', 'width: 1.75rem');
    header.appendChild(spanHead);

    topics.slice(1).forEach(function (topic) {
        const topicSubjectElem = topic.querySelector('span:nth-child(1) > a:nth-child(2)');
        if (!topicSubjectElem) return;
        let topicSubject = topicSubjectElem.textContent.trim();
        let topicId = topic.getAttribute('data-id');

        let span = document.createElement('span');
        span.setAttribute('class', 'deboucled-topic-blacklist');
        let anchor = document.createElement('a');
        anchor.setAttribute('role', 'button');
        anchor.setAttribute('title', 'Blacklist le topic');
        anchor.setAttribute('class', 'deboucled-svg-forbidden-red');
        anchor.onclick = function () { addTopicIdBlacklist(topicId, topicSubject, true); refreshTopicIdKeys(); };
        anchor.innerHTML = '<svg viewBox="0 0 160 160" id="deboucled-forbidden-logo" class="deboucled-logo-forbidden"><use href="#forbiddenlogo"/></svg>';
        span.appendChild(anchor);
        topic.appendChild(span);
    });
}

function addPrevisualizeTopicEvent(topics) {

    function prepareMessagePreview(page) {
        if (!page) return;

        const imgErreur = page.querySelector('.img-erreur');
        if (imgErreur) return imgErreur;

        const messagePreview = page.querySelector('.bloc-message-forum');
        if (!messagePreview) return;

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

        if (preferDarkTheme()) {
            text.classList.toggle('deboucled-preview-content-text-light', true);
        }
        else {
            text.classList.toggle('deboucled-preview-content-text-dark', true);
        }

        return messagePreview;
    }

    async function onPreviewHover(anchor, topicUrl, previewDiv) {
        anchor.classList.toggle('active', true);
        if (previewDiv.querySelector('.bloc-message-forum')) return; // already loaded
        const topicContent = await fetchHtml(topicUrl, true).then((html) => prepareMessagePreview(html));
        if (!topicContent) return;
        previewDiv.firstChild.remove();
        previewDiv.appendChild(topicContent);
    }

    topics.slice(1).forEach(function (topic) {
        const topicTitleElement = topic.querySelector('.topic-title');
        if (!topicTitleElement) return;
        const topicUrl = topicTitleElement.getAttribute('href');

        let anchor = document.createElement('a');
        anchor.setAttribute('href', topicUrl);
        anchor.setAttribute('class', 'deboucled-topic-preview-col');
        anchor.innerHTML = '<svg viewBox="0 0 30 30" id="deboucled-preview-logo" class="deboucled-logo-preview"><use href="#previewlogo"/></svg>';
        let topicImg = topic.querySelector('.topic-img');
        insertAfter(anchor, topicImg);

        let previewDiv = document.createElement('div');
        previewDiv.className = 'deboucled-preview-content bloc-message-forum';
        previewDiv.innerHTML = '<span class="deboucled-preview-spinner deboucled-spinner active"/>';
        previewDiv.onclick = (e) => e.preventDefault();
        anchor.appendChild(previewDiv);

        const onPreviewStart = () => onPreviewHover(anchor, topicUrl, previewDiv);
        const onPreviewEnd = () => anchor.classList.toggle('active', false);

        // For mobile
        topicImg.ontouchstart = onPreviewStart;
        topicImg.ontouchend = onPreviewEnd;
        // For everything else
        anchor.onpointerenter = onPreviewStart;
        anchor.onpointerleave = onPreviewEnd;
    });
}

function handleTopicPictos(topics, optionDisplayBlackTopic, optionReplaceResolvedPicto) {
    const ignoredTopics = ['topic-lock', 'topic-pin-off', 'topic-pin-on', 'topic-removed'];

    function buildBlackPicto(topicImg) {
        topicImg.classList.toggle('topic-folder1', false);
        topicImg.classList.toggle('topic-folder2', false);
        topicImg.classList.toggle('deboucled-topic-folder-black', true);
    }

    topics.slice(1).forEach(function (topic) {
        const topicImg = topic.querySelector('.topic-img');
        if (!topicImg) return;

        if (ignoredTopics.some((it) => topicImg.classList.contains(it))) return;

        const messageCount = topic.querySelector('.topic-count');
        if (!messageCount) return;
        const nbMessage = parseInt(messageCount.textContent.trim());

        if (topicImg.classList.contains('topic-resolved') && optionReplaceResolvedPicto) {

            topicImg.classList.toggle('topic-resolved', false);
            topicImg.classList.toggle('icon-topic-resolved', false);
            topicImg.classList.toggle('icon-topic-folder', true);
            topicImg.title = 'Topic';

            if (nbMessage >= 100 && optionDisplayBlackTopic) {
                buildBlackPicto(topicImg);
            }
            else if (nbMessage >= 25) {
                topicImg.classList.toggle('topic-folder2', true);
            }
            else {
                topicImg.classList.toggle('topic-folder1', true);
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
    // eslint-disable-next-line no-misleading-character-class
    const regexAlert = /^[{[(🛑🔴🚨🔕☢️\s]*alerte\s?(rouge|noire|nucl[eé]aire|[eé]carlate|g[eé]n[eé]rale|ovni|prolo|info|jaune|orange|ww3|generale)?[\s}\])🛑🔴🚨🔕☢️!,:-]*/giu;
    const regexAyao = /\ba+y+a+o*\b/gi;

    topics.slice(1).forEach(function (topic) {
        const titleElem = topic.querySelector('.lien-jv.topic-title');
        if (!titleElem) return;
        let newTitle = titleElem.textContent;
        newTitle = newTitle.replace(regexAlert, '');
        newTitle = newTitle.replace(regexAyao, '');
        newTitle = newTitle.removeSurrogatePairs();
        newTitle = newTitle.replace(/\(\)|\[\]|{}/g, '');
        newTitle = newTitle.removeDoubleSpaces().trim().toLowerCase().capitalize();
        if (newTitle.length > 0) titleElem.textContent = newTitle;
        else titleElem.textContent = titleElem.textContent.toLowerCase().capitalize();
    });
}

async function handleTopicAvatars(topics) {
    GM_addStyle('.topic-list .topic-author { width: 7.4rem; }');

    const imageRootUrl = 'https://image.jeuxvideo.com';
    const avatarSmallSizeRoute = 'avatar-sm';
    const defaultAvatar = `${imageRootUrl}/${avatarSmallSizeRoute}/default.jpg`;

    async function getAuthorAvatarUrl(topicAuthorElem) {
        if (!topicAuthorElem) return;

        const author = topicAuthorElem.textContent.trim().toLowerCase();
        if (!author?.length) return;

        if (authorAvatarMap.has(author)) {
            let url = authorAvatarMap.get(author);
            if (url === 'def') return defaultAvatar;
            return `${imageRootUrl}${url}`;
        }

        function storeAvatarUrl(avatarUrl) {
            avatarUrl = avatarUrl.replace('avatar-md', avatarSmallSizeRoute);
            if (avatarUrl === defaultAvatar) authorAvatarMap.set(author, 'def');
            else authorAvatarMap.set(author, avatarUrl.replace(imageRootUrl, ''));
            return avatarUrl;
        }

        async function getAvatarUsingJvcProfile() {
            const authorProfileUrl = topicAuthorElem.href;
            if (!authorProfileUrl?.length) return;
            const resHtml = await fetchHtml(authorProfileUrl);
            if (!resHtml) return;

            const profileAvatarUrl = resHtml.querySelector('.content-img-avatar')?.firstElementChild?.src;
            if (!profileAvatarUrl?.length) return;
            return storeAvatarUrl(profileAvatarUrl);
        }

        async function getAvatarUsingJvArchive() {
            const authorJvaResult = await getJvArchiveAuthor(author);
            if (!authorJvaResult) return;

            const authorJva = parseJvArchiveAuthorResult(authorJvaResult);
            let jvaAvatarUrl = authorJva?.avatar;
            if (!jvaAvatarUrl?.length) jvaAvatarUrl = defaultAvatar;

            return storeAvatarUrl(jvaAvatarUrl);
        }

        // Use JvArchive to get avatar in only one request instead of two (with JVC profile)
        // Useful to avoid JVC query limitation/slowness
        if (avatarUseJvArchiveApi) {
            const jvArchiveAvatarUrl = await getAvatarUsingJvArchive();
            if (jvArchiveAvatarUrl?.length) return jvArchiveAvatarUrl;
        }
        // If not successful (too many request/jvarchive down) or not enabled, fallback with JVC
        return await getAvatarUsingJvcProfile();
    }

    await Promise.all(topics.slice(1).map(async function (topic) {
        const topicAuthorElem = topic.querySelector('.topic-author');
        if (!topicAuthorElem) return;

        const topicAuthorWrapper = document.createElement('span');
        topicAuthorWrapper.className = 'topic-author';
        topicAuthorElem.insertAdjacentElement('beforebegin', topicAuthorWrapper);

        topicAuthorElem.classList.remove('topic-author');
        topicAuthorWrapper.appendChild(topicAuthorElem);

        const authorAvatar = document.createElement('img');
        authorAvatar.className = 'deboucled-topic-avatar';
        authorAvatar.src = defaultAvatar;
        topicAuthorElem.prepend(authorAvatar);

        const avatarUrl = await getAuthorAvatarUrl(topicAuthorElem);
        if (avatarUrl?.length) {
            authorAvatar.alt = authorAvatar.src;
            authorAvatar.src = avatarUrl;
        }
    }));

    await saveLocalStorage();
}

function createTopicTitleSmileys(topics) {
    topics.slice(1).forEach(function (topic) {
        const titleElem = topic.querySelector('.lien-jv.topic-title');
        if (!titleElem) return;
        titleElem.innerHTML = titleElem.innerHTML.replace(smileyGifRegex, (e) => getSmileyImgHtml(e, false));
    });
}

function buildLoaderStatus() {
    const loaderRequest = `
    <div class="loader-ellips infinite-scroll-request">
    <span class="loader-ellips__dot"></span>
    <span class="loader-ellips__dot"></span>
    <span class="loader-ellips__dot"></span>
    <span class="loader-ellips__dot"></span>
    </div>`;
    const loaderLast = '<p class="infinite-scroll-last">Fin du topic</p>';
    const loaderError = '<p class="infinite-scroll-error">Fin des messages</p>';

    let loadStatusElement = document.createElement('div');
    loadStatusElement.className = 'page-load-status';
    loadStatusElement.innerHTML = `${loaderRequest}${loaderLast}${loaderError}`;
    return loadStatusElement;
}

function buildFloatingNavbar(infScroll) {
    const messageTopicElement = document.querySelector('#message_topic, .message-lock-topic');

    const navbar = document.createElement('div');
    navbar.className = 'deboucled-floating-container';

    const container = document.querySelector('.layout__contentAside');
    container.prepend(navbar);

    const setTooltip = (bt, txt) => { bt.setAttribute('deboucled-data-tooltip', txt); bt.setAttribute('data-tooltip-location', 'left'); };

    const buttonTop = document.createElement('div');
    buttonTop.className = 'deboucled-floating-button deboucled-arrow-up-logo';
    setTooltip(buttonTop, 'Retour en haut de page');

    buttonTop.onclick = () => document.querySelector('#bloc-title-forum')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    navbar.appendChild(buttonTop);

    const buttonAnswer = document.createElement('div');
    buttonAnswer.className = 'deboucled-floating-button deboucled-answer-logo';
    setTooltip(buttonAnswer, 'Répondre au topic');
    buttonAnswer.onclick = () => {
        toggleInfiniteScroll(infScroll, false);
        messageTopicElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    navbar.appendChild(buttonAnswer);

    const buttonToggleSmooth = document.createElement('div');
    let smoothScrollLogo = '<svg width="24px" viewBox="0 20 460.088 460.088" id="deboucled-smoothscroll-logo" fill="#000" style="margin: auto;"><use href="#smoothscrolllogo"/></svg>';
    buttonToggleSmooth.className = 'deboucled-floating-button';
    buttonToggleSmooth.id = 'deboucled-smoothscroll-toggle';
    setTooltip(buttonToggleSmooth, 'Activer/désactiver le défilement automatique');
    buttonToggleSmooth.innerHTML = smoothScrollLogo;
    buttonToggleSmooth.onclick = () => toggleInfiniteScroll(infScroll, !infScroll.options.loadOnScroll);
    navbar.appendChild(buttonToggleSmooth);

    /* Handle navbar transparency */
    let messageTopicIsVisible = true;
    function toggleTransparentButton() {
        const isTransparent = messageTopicIsVisible;// window.scrollY < 350 || messageTopicIsVisible;
        buttonTop.classList.toggle('transparent', isTransparent);
        buttonAnswer.classList.toggle('transparent', isTransparent);
        buttonToggleSmooth.classList.toggle('transparent', isTransparent);
    }
    toggleTransparentButton();
    window.addEventListener('scroll', toggleTransparentButton, { passive: true });
    let observer = new IntersectionObserver((entries) => { messageTopicIsVisible = entries[0].isIntersecting; }, { threshold: [1] });
    observer.observe(messageTopicElement);
    observer.observe(document.querySelector('.bloc-pagi-default'));
}

function toggleInfiniteScroll(infScroll, status) {
    if (!infScroll) return;
    document.querySelector('#bloc-formulaire-forum').style.display = status ? 'none' : 'block';
    infScroll.options.loadOnScroll = status;
    infScroll.options.scrollThreshold = status ? -200 : false;
    document.querySelector('#deboucled-smoothscroll-toggle')?.classList.toggle('disabled', !status);
}

function createSmoothScroll(handleMessageCallback) {
    const initialPageId = getTopicCurrentPageId();
    const lastPageId = getTopicLastPageId();

    const forumContainer = document.querySelector('#forum-main-col');
    const bottomPagi = document.querySelectorAll('.bloc-pagi-default')[1];
    const blocFormulaire = document.querySelector('#bloc-formulaire-forum');

    if (!bottomPagi || !forumContainer || !blocFormulaire) return;

    blocFormulaire.style.display = 'none';

    const loaderStatus = buildLoaderStatus();
    forumContainer.appendChild(loaderStatus);

    function getInfScrollPath() {
        const nextPageId = initialPageId + this.pageIndex;
        if (lastPageId && nextPageId <= lastPageId) return buildTopicNewPageUri(nextPageId);
    }

    // eslint-disable-next-line no-undef
    let infScroll = new InfiniteScroll('.conteneur-messages-pagi', {
        // debug: true,
        //hideNav: '.bloc-pagi-default:nth-of-type(2n)',
        scrollThreshold: -100,
        status: '.page-load-status',
        checkLastPage: true,
        path: getInfScrollPath
    });

    infScroll.on('load', function (body) {
        const allMessages = getAllMessages(body);

        const separator = document.createElement('div');
        separator.className = 'deboucled-message-separator';
        bottomPagi.insertAdjacentElement('beforebegin', separator);

        allMessages.forEach(m => {
            let fixedMessage = fixMessageJvCare(m);
            bottomPagi.insertAdjacentElement('beforebegin', fixedMessage);
            handleMessageCallback(fixedMessage);
        });

        separator.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    });

    document.querySelector('.btn-repondre-msg')?.addEventListener('click', () => toggleInfiniteScroll(infScroll, false));
    document.querySelector('#message_topic')?.addEventListener('focus', () => toggleInfiniteScroll(infScroll, false));

    buildFloatingNavbar(infScroll);
}

function buildEnableSmoothScrollButton(smoothScrollCallback) {
    const bottomMenu = document.querySelector('.bloc-outils-bottom > .bloc-pre-right');
    if (!bottomMenu) return;

    const buttonEnableSC = document.createElement('button');

    let smoothScrollLogo = '<svg width="18px" viewBox="0 20 460.088 460.088" id="deboucled-smoothscroll-logo" fill="var(--jv-text-secondary)"><use href="#smoothscrolllogo"/></svg>';
    buttonEnableSC.className = 'btn deboucled-button deboucled-smoothscroll-button';
    buttonEnableSC.title = 'Activer le défilement automatique des messages avec Déboucled';
    buttonEnableSC.innerHTML = smoothScrollLogo;
    buttonEnableSC.onclick = () => {
        smoothScrollCallback();
        buttonEnableSC.style.display = 'none';
    };
    bottomMenu.appendChild(buttonEnableSC);
}

async function buildHotTopics() {
    const topTopicResults = await getJvArchiveHotTopics(100);
    let topTopics = parseJvArchiveHotTopicResults(topTopicResults);
    if (!topTopics?.length) return;

    let minDate = new Date();
    minDate.setMinutes(minDate.getMinutes() - 15);

    topTopics = topTopics
        .filter(t => t.lastMessageDate >= minDate) // dernier message il y a moins de 15 minutes
        .sort((a, b) => (a.nbMessages > b.nbMessages) ? -1 : 1) // tri décroissant par nb messages
        .slice(0, 5) // sélection des 5 premiers
        .map(t => t.id); // map uniquement l'id du topic

    return topTopics;
}

function initSmileyGifMap() {
    smileyGifMap = new Map([
        [':)', '1'],
        [':snif:', '20'],
        [':gba:', '17'],
        [':g)', '3'],
        [':-)', '46'],
        [':snif2:', '13'],
        [':bravo:', '69'],
        [':d)', '4'],
        [':hap:', '18'],
        [':ouch:', '22'],
        [':pacg:', '9'],
        [':cd:', '5'],
        [':-)))', '23'],
        [':ouch2:', '57'],
        [':pacd:', '10'],
        [':cute:', 'nyu'],
        [':content:', '24'],
        [':p)', '7'],
        [':-p', '31'],
        [':noel:', '11'],
        [':oui:', '37'],
        [':(', '45'],
        [':peur:', '47'],
        [':cool:', '26'],
        [':-(', '14'],
        [':mort:', '21'],
        [':rire:', '39'],
        [':-((', '15'],
        [':fou:', '50'],
        [':-D', '40'],
        [':nonnon:', '25'],
        [':fier:', '53'],
        [':honte:', '30'],
        [':rire2:', '41'],
        [':non2:', '33'],
        [':sarcastic:', '43'],
        [':monoeil:', '34'],
        [':o))', '12'],
        [':nah:', '19'],
        [':doute:', '28'],
        [':rouge:', '55'],
        [':ok:', '36'],
        [':non:', '35'],
        [':malade:', '8'],
        [':sournois:', '67'],
        [':hum:', '68'],
        [':bave:', '71'],
        [':pf:', 'pf'],
        [':siffle:', 'siffle'],
        [':globe:', '6'],
        [':mac:', '16']
    ]);
    let regexMap = [...smileyGifMap.keys()].map((e) => e.escapeRegexPatterns());
    smileyGifRegex = new RegExp(`(${regexMap.join('|')})`, 'g');
}

function getSmileyImgHtml(smiley, big = false) {
    if (!smiley?.length) return smiley;
    const smileyLower = smiley.toLowerCase();
    const gifCode = smileyGifMap.get(smileyLower);
    if (!gifCode?.length) return smiley;
    return `<img data-code="${smileyLower}" title="${smileyLower}" src="https://image.jeuxvideo.com/smileys_img/${gifCode}.gif" class="deboucled-smiley${big ? ' big' : ''}">`;
}

