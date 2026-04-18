
///////////////////////////////////////////////////////////////////////////////////////
// TOPICS
///////////////////////////////////////////////////////////////////////////////////////

function getAllTopics(doc) {
    if (!doc) return;
    let allTopics = doc.querySelectorAll(JVC_SEL.topicListItem);
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
    let topicTable = document.querySelector(JVC_SEL.topicListContainer);
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
    document.querySelector('.deboucled-overlay')?.classList.toggle('active', active);
    document.querySelector('.deboucled-overlay-spinner')?.classList.toggle('active', active);
    document.querySelector(JVC_SEL.topicListContainer)?.removeAttribute('style');
}

async function addTopicIdBlacklist(topicId, topicSubject, refreshTopicList) {
    if (!topicIdBlacklistMap.has(topicId)) {
        topicIdBlacklistMap.set(topicId, topicSubject);
        await saveStorage();

        if (!refreshTopicList) return;
        let topic = jvcFindTopicById(topicId);
        if (!topic) return;
        removeTopic(topic);
        hiddenTotalTopics++;
        updateTopicsHeader();
    }
}

function getTopicTitle() {
    const titleElement = document.querySelector(JVC_SEL.topicTitleHeader);
    return titleElement?.textContent?.trim();
}

function getCurrentTopicId() {
    const payload = jvcGetForumsAppPayload();
    if (payload?.topicId) return String(payload.topicId);

    const blocFormulaireElem = document.querySelector('#bloc-formulaire-forum');
    if (blocFormulaireElem) {
        const topicId = blocFormulaireElem.getAttribute('data-topic-id');
        if (topicId) return topicId;
    }

    const currentUrl = window.location.href;
    const match = currentUrl.match(/\/forums\/\d+-\d+-(\d+)-/);
    return match ? match[1] : null;
}

function getTopicId(topicElement) {
    return jvcGetTopicIdFromElement(topicElement);
}

function getTopicCurrentPageId(doc) {
    if (!doc) doc = document;
    if (doc === document) {
        const payload = jvcGetForumsAppPayload();
        if (payload?.pagerView?.currentPage) return parseInt(payload.pagerView.currentPage);
    }
    const pageActiveElem = doc.querySelector(JVC_SEL.pageActive);
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
    if (doc === document) {
        const payload = jvcGetForumsAppPayload();
        if (payload?.pagerView?.pageCount) return parseInt(payload.pagerView.pageCount);
    }
    const lastPageButton = doc.querySelector(JVC_SEL.pageLast);
    if (!lastPageButton) return undefined;
    let pageId = getTopicPageIdFromUri(lastPageButton.getAttribute('href'));
    if (!pageId) {
        const cls = lastPageButton.getAttribute('class') || '';
        if (cls.includes('JvCare')) pageId = getTopicPageIdFromUri(decryptJvCare(cls));
    }
    return parseInt(pageId);
}

function updateTopicsHeader() {
    let optionDisplayTopicIgnoredCount = store.get(storage_optionDisplayTopicIgnoredCount, storage_optionDisplayTopicIgnoredCount_default);
    if (optionDisplayTopicIgnoredCount) {
        let subjectHeader = document.querySelector(JVC_SEL.topicHeadSubject);
        if (subjectHeader) subjectHeader.innerHTML = `SUJET<span class="deboucled-topic-subject">(${hiddenTotalTopics} ignoré${plural(hiddenTotalTopics)})</span>`;
    }

    let optionDisplayBlacklistTopicButton = store.get(storage_optionDisplayBlacklistTopicButton, storage_optionDisplayBlacklistTopicButton_default);
    if (optionDisplayBlacklistTopicButton) {
        let lastMessageHeader = document.querySelector(JVC_SEL.topicHeadLastMsg);
        if (lastMessageHeader) lastMessageHeader.style.width = '5.5rem';
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
    // Handles JvCare-obfuscated topics (not logged in):
    // - Legacy DOM: author was a JvCare <span class="topic-author"> with the real pseudo in text.
    //   We promoted it to a plain <a> so the rest of the code (blacklist, badges) could read it.
    // - New DOM (April 2026, logged-in): real <a class="tablesForum__firstAvatar" href="/profil/...">.
    // - New DOM (April 2026, not-logged-in): JvCare-obfuscated <span class="JvCare ... tablesForum__firstAvatar" title="Pseudo">
    //   with no real href. We must decrypt the JvCare class and promote the span to a real <a>
    //   so that the row behaves like a logged-in row (avatar click, blacklist pipeline, etc.).
    //   The "+N" placeholder is handled by getTopicAuthor() which filters it out.

    // 1) Promote JvCare-obfuscated first-avatar <span> to a real <a>.
    const jvCareAvatar = element.querySelector('span.tablesForum__firstAvatar.JvCare, span.JvCare.tablesForum__firstAvatar');
    if (jvCareAvatar) {
        const cls = jvCareAvatar.getAttribute('class') || '';
        const href = decryptJvCare(cls);
        const cleanedClass = cls.replace(/\bJvCare\b/, '').replace(/\s+[0-9A-F]{20,}/g, '').replace(/\s+/g, ' ').trim();
        const authorA = document.createElement('a');
        authorA.href = href || '#';
        authorA.target = '_blank';
        authorA.className = cleanedClass || 'avatar tablesForum__firstAvatar';
        const title = jvCareAvatar.getAttribute('title');
        if (title) authorA.title = title;
        authorA.innerHTML = jvCareAvatar.innerHTML;
        jvCareAvatar.replaceWith(authorA);
    }

    // 2) Legacy fallback: rebuild author anchor from a plain-text author cell when nothing else exists.
    const existingAuthorLink = element.querySelector('a.tablesForum__firstAvatar, a.tablesForum__authorLink, a.xXx.text-user.topic-author');
    if (!existingAuthorLink) {
        const authorCell = element.querySelector('.tablesForum__cellAuthor');
        if (authorCell) {
            const author = authorCell.textContent.trim();
            if (author && !/^\+\d+$/.test(author)) {
                const authorA = document.createElement('a');
                authorA.href = `https://www.jeuxvideo.com/profil/${author.toLowerCase()}?mode=infos`;
                authorA.target = '_blank';
                authorA.className = 'xXx text-user topic-author tablesForum__authorLink';
                authorA.title = author;
                authorA.textContent = author;
                authorCell.innerHTML = '';
                authorCell.appendChild(authorA);
            }
        }
    }

    // 3) Decrypt JvCare on the activity cell so topic preview links work.
    //    New DOM: the cell itself is <span class="JvCare ... tablesForum__cellLink"> (no inner anchor).
    //    Legacy DOM: <a class="tablesForum__cellLink"> wrapping a JvCare child.
    const dateCell = element.querySelector('.tablesForum__cellLink') || element.children[3];
    if (dateCell) {
        const ownClass = dateCell.getAttribute('class') || '';
        if (dateCell.tagName !== 'A' && ownClass.includes('JvCare')) {
            const topicUrl = decryptJvCare(ownClass);
            const topicDate = dateCell.textContent.trim();
            const title = dateCell.getAttribute('title') || '';
            const dataVal = dateCell.getAttribute('data-val') || '';
            const a = document.createElement('a');
            a.href = topicUrl;
            a.className = 'xXx tablesForum__cellLink';
            if (title) a.title = title;
            if (dataVal) a.setAttribute('data-val', dataVal);
            a.textContent = topicDate;
            dateCell.replaceWith(a);
        } else if (dateCell.firstElementChild && dateCell.firstElementChild.className?.includes('JvCare')) {
            const topicUrl = decryptJvCare(dateCell.firstElementChild.className);
            const topicDate = dateCell.firstElementChild.textContent.trim();
            dateCell.innerHTML = `<a href="${topicUrl}" class="xXx lien-jv">${topicDate}</a>`;
        }
    }
    document.querySelector(JVC_SEL.topicListContainer).appendChild(element);
    topics.push(element); // on rajoute le nouveau topic à la liste en cours de remplissage pour éviter de le reprendre sur les pages suivantes
}

function topicExists(topics, element) {
    /*
    * Le temps de charger la page certains sujets peuvent se retrouver à la page précédente.
    * Cela peut provoquer des doublons à l'affichage.
    */
    let topicId = getTopicId(element);
    if (!topicId) return false;
    return topics.some((elem) => getTopicId(elem) === topicId);
}

function getTopicMessageCount(element) {
    let messageCountElement = element.querySelector(JVC_SEL.topicCount);
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
            mapAddArrayIncrement(matchedSubjects, topicLoop.subjectMatches);
            hiddenSubjects++;
        }
        if (topicLoop.isAuthorLoop) {
            mapAddArrayIncrement(matchedAuthors, topicLoop.boucledAuthorMatches ?? topicLoop.authorMatches);
            hiddenAuthors++;
        }
        return true;
    }
}

async function isTopicBlacklisted(topicElement, topicOptions) {
    const topicId = getTopicId(topicElement);
    if (!topicId) return true;

    if (topicIdBlacklistMap.has(topicId) && !deboucledTopics.includes(topicId)) {
        matchedTopics.set(topicId, topicIdBlacklistMap.get(topicId));
        hiddenTopicsIds++;
        return true;
    }

    // Seuil d'affichage valable uniquement pour les BL sujets et auteurs
    if (topicOptions.optionAllowDisplayThreshold && getTopicMessageCount(topicElement) >= topicOptions.optionDisplayThreshold) return false;

    if (!topicOptions.optionFilterHotTopics && isHotTopic(topicElement)) return false;

    if (topicOptions.optionEnableTopicMsgCountThreshold && getTopicMessageCount(topicElement) < topicOptions.optionTopicMsgCountThreshold) return true;

    const titleTag = topicElement.querySelector(JVC_SEL.topicTitle);
    const title = titleTag?.textContent.trim();
    const author = getTopicAuthor(topicElement)?.toLowerCase();

    if (author?.length && author === userPseudo?.toLowerCase()) {
        return false;
    }

    if (title?.length) {
        const subjectBlacklisted = getSubjectBlacklistMatches(title);
        if (subjectBlacklisted?.length) {
            mapAddArrayIncrement(matchedSubjects, subjectBlacklisted);
            hiddenSubjects++;
            return true;
        }
    }

    if (author?.length) {
        const authorBlacklisted = getAuthorBlacklistMatches(author);
        if (authorBlacklisted?.length) {
            mapAddArrayIncrement(matchedAuthors, authorBlacklisted);
            hiddenAuthors++;
            return true;
        }
    }

    if (topicOptions.optionAntiVinz && title?.length && author?.length) {
        const url = titleTag.getAttribute('href');
        const vinzTopic = await isVinzTopic(title, author, url);
        if (vinzTopic) {
            mapAddArrayIncrement(matchedSubjects, [title]);
            mapAddArrayIncrement(matchedAuthors, ['Vinz']);
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
    //return matches.map(r => r.slice(1)).flat().filter(r => r);
    return matches.flat().filter(r => r);
}

function getSubjectBlacklistMatches(subject, regex = subjectsBlacklistReg) {
    if (!regex) return null;
    const normSubject = normalizeDiacritic(subject);
    const matches = [...normSubject.matchAll(regex)];
    const groupedMatches = filterMatchResults(matches);
    return groupedMatches;
}

function getAuthorBlacklistMatches(author, isSelf, regex = authorsBlacklistReg) {
    if (!regex) return null;
    const normAuthor = normalizeDiacritic(author.toLowerCase());
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

    if (typeof distance === 'undefined') return;

    let topicContent = undefined;

    async function isVinzMessage(url) {
        function getTopicMessageCallback(r) {
            const doc = domParser.parseFromString(r, 'text/html');
            const firstMessageElem = doc.querySelector(JVC_SEL.messageContent);
            return normalizeValue(firstMessageElem.textContent.trim());
        }
        if (!topicContent) {
            topicContent = await pageFetch(toAbsoluteUrl(url)).then(function (response) {
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

    const authorMayBeVinz = author.match(/^(vinz|farine|tchoupi|chicken|smash|garfield|biscuit)/, 'i')
        || ((author.length >= 5 && author.length <= 7) && author.charAt(0) === 'v');

    const pureSubject = makeVinzSubjectPure(subject);
    let possibleBoucle = false;
    for (const boucle of vinzBoucleArray) {
        let score = calcStringDistanceScore(boucle, pureSubject);
        if (authorMayBeVinz) score += 20; // on rajoute 20% au score si l'on soupçonne l'auteur d'être Vinz

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
    let topicId = getTopicId(element);
    if (!topicId) return false;

    if (deboucledTopics.includes(topicId)) return false;

    const existingStatus = getTopicPocStatus(topicId);
    if (existingStatus) return existingStatus;

    let titleElem = element.querySelector(JVC_SEL.topicTitle);
    if (!titleElem) return false;

    const title = normalizeDiacritic(titleElem.textContent.trim());
    const isTitlePocRegex = /(pos(t|te|tez|to|too|tou|ttou)(")?$)|(pos(t|te|tez).*ou.*(cancer|quand|kan))|paustaouk|postukhan|postookan|postouk|postook|pose.*toucan/i;
    let isTitlePoc = isMatch(title, isTitlePocRegex);

    if ((optionDetectPocMode === 1 || optionDetectPocMode === 3) && !isTitlePoc) {
        // Inutile de continuer si le titre n'est pas détecté PoC et qu'on n'est pas en mode approfondi
        return false;
    }

    function topicCallback(r) {
        const doc = domParser.parseFromString(r, 'text/html');

        const firstMessageElem = doc.querySelector(JVC_SEL.messageContent);
        const firstMessage = firstMessageElem?.textContent.trim().toLowerCase();
        if (!firstMessage?.length) return false;

        const isMessagePocRegex = /pos(t|te|tez) ou/i;
        const maladies = ['cancer', 'ancer', 'cer', 'en serre', 'necrose', 'torsion', 'testiculaire', 'tumeur', 'cholera', 'sida', 'corona', 'coronavirus', 'covid', 'covid19', 'cerf', 'serf', 'phimosis', 'trisomie', 'diarrhee', 'charcot', 'lyme', 'avc', 'cirrhose', 'diabete', 'parkinson', 'alzheimer', 'mucoviscidose', 'lepre', 'tuberculose', 'variole'];
        const isMessagePoc = isMatch(normalizeDiacritic(firstMessage), isMessagePocRegex) || (isTitlePoc && maladies.some(s => firstMessage.includes(s)));

        pocTopicMap.set(topicId, isMessagePoc);

        return isMessagePoc;
    }

    const url = titleElem.getAttribute('href');

    let isPoc = await pageFetch(toAbsoluteUrl(url)).then(function (response) {
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
    // Fais un don ou cancer
    const badgeOpt = {
        id: 'subject_poc',
        content: 'PoC',
        hint: withHint ? 'Détection d\'un "post ou cancer"' : undefined,
        url: 'https://jvflux.fr/Post_ou_cancer',
        level: 'danger',
        parent: nearElement,
        badgeLogoClass: 'deboucled-skull-logo',
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
        hint: withHint ? `‹I.A Déboucled› - consulter cette boucle sur JvArchive` : undefined,
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
        hint: withHint ? `‹I.A Déboucled› - consulter les topics de ce boucleur sur JvArchive` : undefined,
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

async function buildAuthorBlacklistBadges(author, parentElement, excludedLists, containerClass) {
    if (!parentElement) return;

    const blacklists = blacklistsIncludingEntity(author, entityAuthor, false);
    if (!blacklists?.length) return;

    const badgeContainer = buildBadgeContainer(parentElement, containerClass);

    const cleanAuthor = author.replaceAll('%', '').trim();
    const redirectUrl = `${jvarchiveUrl}/topic/recherche?searchType=auteur_topic_exact&search=${cleanAuthor}`;

    blacklists
        .filter(bl => !excludedLists?.includes(bl.id))
        .sort((a, b) => (a.shortDescription > b.shortDescription) ? -1 : 1)
        .sort((a, b) => (a.enabled > b.enabled) ? -1 : 1)
        .forEach(bl => {
            const content = bl.shortDescription ?? bl.description ?? bl.id ?? 'BL';
            const badgeOpt = {
                id: `blacklist_${bl.id}`,
                content: content?.toUpperCase(),
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
        const topicSubjectElem = topic.querySelector(JVC_SEL.topicTitle) || topic.querySelector('span:nth-child(1) > a:nth-child(2)');
        if (!topicSubjectElem) return;
        let topicSubject = topicSubjectElem.textContent.trim();
        let topicId = getTopicId(topic);

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

        const messagePreview = page.querySelector(JVC_SEL.message);
        if (!messagePreview) return;

        messagePreview.querySelector(JVC_SEL.messageOptions)?.remove(); // remove buttons

        // JvCare
        const avatar = messagePreview.querySelector(JVC_SEL.messageAvatar);
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

        const text = messagePreview.querySelector(JVC_SEL.messageContent);
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
        if (previewDiv.querySelector(JVC_SEL.message)) return; // already loaded
        const topicContent = await fetchHtml(topicUrl, true).then((html) => prepareMessagePreview(html));
        if (!topicContent) return;
        previewDiv.firstChild.remove();
        previewDiv.appendChild(topicContent);
    }

    topics.slice(1).forEach(function (topic) {
        const topicTitleElement = topic.querySelector(JVC_SEL.topicTitle);
        if (!topicTitleElement) return;
        const topicUrl = topicTitleElement.getAttribute('href');

        // let previewRootElement = document.createElement('a');
        // previewRootElement.setAttribute('href', topicUrl);
        const previewRootElement = document.createElement('span');
        previewRootElement.setAttribute('class', 'deboucled-topic-preview-col');
        previewRootElement.innerHTML = '<svg viewBox="0 0 30 30" id="deboucled-preview-logo" class="deboucled-logo-preview"><use href="#previewlogo"/></svg>';
        const topicImg = topic.querySelector(JVC_SEL.topicImg);
        insertAfter(previewRootElement, topicImg);

        const previewSpinnerElement = document.createElement('div');
        previewSpinnerElement.className = 'deboucled-preview-content bloc-message-forum';
        previewSpinnerElement.innerHTML = '<span class="deboucled-preview-spinner deboucled-spinner active"/>';
        previewSpinnerElement.onclick = (e) => e.preventDefault();
        previewRootElement.appendChild(previewSpinnerElement);

        const onPreviewStart = () => onPreviewHover(previewRootElement, topicUrl, previewSpinnerElement);
        const onPreviewEnd = () => previewRootElement.classList.toggle('active', false);

        // For mobile
        topicImg.ontouchstart = onPreviewStart;
        topicImg.ontouchend = onPreviewEnd;
        // For everything else
        previewRootElement.onpointerenter = onPreviewStart;
        previewRootElement.onpointerleave = onPreviewEnd;
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
        const topicImg = topic.querySelector(JVC_SEL.topicImg);
        if (!topicImg) return;

        if (ignoredTopics.some((it) => topicImg.classList.contains(it))) return;

        const messageCount = topic.querySelector(JVC_SEL.topicCount);
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
        return await pageFetch(toAbsoluteUrl(url)).then(function (response) {
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
        const titleElem = topic.querySelector(JVC_SEL.topicTitle);
        if (!titleElem) return;
        // New JVC DOM: the subject <a> wraps both the <i class="tablesForum__subjectMarkerIcon"> and
        // a <span class="tablesForum__subjectText">. Writing textContent on the <a> would wipe the icon,
        // so target the inner text span when present; fall back to the <a> for the legacy DOM.
        const textTarget = titleElem.querySelector('.tablesForum__subjectText') ?? titleElem;
        let newTitle = textTarget.textContent;
        newTitle = newTitle.replace(regexAlert, '');
        newTitle = newTitle.replace(regexAyao, '');
        newTitle = removeSurrogatePairs(newTitle);
        newTitle = newTitle.replace(/\(\)|\[\]|{}/g, '');
        newTitle = capitalize(removeDoubleSpaces(newTitle).trim().toLowerCase());
        if (newTitle.length > 0) textTarget.textContent = newTitle;
        else textTarget.textContent = capitalize(textTarget.textContent.toLowerCase());
    });
}


function createTopicTitleSmileys(topics) {
    topics.slice(1).forEach(function (topic) {
        const titleElem = topic.querySelector(JVC_SEL.topicTitle);
        if (!titleElem) return;
        titleElem.innerHTML = titleElem.innerHTML.replaceAll(smileyGifRegex, (e) => getSmileyImgHtml(e, false));
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
    const messageTopicElement = document.querySelector(`${JVC_SEL.messageTopicInput}, #forums-post-message-editor, .message-lock-topic`);

    const navbar = document.createElement('div');
    navbar.className = 'deboucled-floating-container';

    const container = document.querySelector('.layout__contentAside');
    container.prepend(navbar);

    const setTooltip = (bt, txt) => { bt.setAttribute('deboucled-data-tooltip', txt); bt.setAttribute('data-tooltip-location', 'left'); };

    const buttonTop = document.createElement('div');
    buttonTop.className = 'deboucled-floating-button deboucled-arrow-up-logo';
    setTooltip(buttonTop, 'Retour en haut de page');

    buttonTop.onclick = () => document.querySelector(JVC_SEL.topicTitleHeader)?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
    if (messageTopicElement) observer.observe(messageTopicElement);
    const pagiObs = document.querySelector(JVC_SEL.paginationContainer);
    if (pagiObs) observer.observe(pagiObs);
}

function toggleInfiniteScroll(infScroll, status) {
    if (!infScroll) return;
    const blocFormulaire = document.querySelector(JVC_SEL.topicBlocFormulaire);
    if (blocFormulaire) blocFormulaire.style.display = status ? 'none' : 'block';
    infScroll.options.loadOnScroll = status;
    infScroll.options.scrollThreshold = status ? -200 : false;
    document.querySelector('#deboucled-smoothscroll-toggle')?.classList.toggle('disabled', !status);
}

function createSmoothScroll(handleMessageCallback) {
    const initialPageId = getTopicCurrentPageId();
    const lastPageId = getTopicLastPageId();

    const forumContainer = document.querySelector('#forum-main-col');
    const allPagi = document.querySelectorAll(JVC_SEL.paginationContainer);
    const bottomPagi = allPagi[allPagi.length - 1];
    const blocFormulaire = document.querySelector(JVC_SEL.topicBlocFormulaire);

    if (!bottomPagi || !forumContainer || !blocFormulaire) return;

    blocFormulaire.style.display = 'none';

    const loaderStatus = buildLoaderStatus();
    forumContainer.appendChild(loaderStatus);

    function getInfScrollPath() {
        const nextPageId = initialPageId + this.pageIndex;
        if (lastPageId && nextPageId <= lastPageId) return buildTopicNewPageUri(nextPageId);
    }

    let infScroll = new InfiniteScroll(JVC_SEL.messagesContainer, {
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
            const fixedMessage = fixMessageJvCare(m);
            bottomPagi.insertAdjacentElement('beforebegin', fixedMessage);
            handleMessageCallback(fixedMessage);
        });

        separator.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    });

    document.querySelector('.btn-repondre-msg')?.addEventListener('click', () => toggleInfiniteScroll(infScroll, false));
    document.querySelector(JVC_SEL.messageTopicInput)?.addEventListener('focus', () => toggleInfiniteScroll(infScroll, false));

    buildFloatingNavbar(infScroll);
}

function buildEnableSmoothScrollButton(smoothScrollCallback) {
    const bottomMenu = document.querySelector('.bloc-outils-bottom > .bloc-pre-right') || document.querySelector(JVC_SEL.blocPreRight);
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
        .map(t => ({ id: t.id, title: t.title, url: t.url, nbMessages: t.nbMessages }));

    return topTopics;
}

function isHotTopic(topic) {
    const topicId = getTopicId(topic);
    if (!topicId || !hotTopicsData?.length) return false;
    return hotTopicsData.some(ht => ht.id === parseInt(topicId));
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
        [':mac:', '16'],
        [':fete:', '66'],
        [':-d', '40']
    ]);
    //brokenSmileyGifArray = [':fete:', ':rire:',':ouch:'];

    let regexMap = [...smileyGifMap.keys()].map((e) => escapeRegexPatterns(e));
    smileyGifRegex = new RegExp(`(${regexMap.join('|')})`, 'gi');
}

function buildSmileyUrl(smileyCode) {
    if (brokenSmileyGifArray.includes(smileyCode)) return `${jvarchiveUrl}/static/smileys/${smileyCode}.gif`;
    const gifCode = smileyGifMap.get(smileyCode);
    if (!gifCode?.length) return smileyCode;
    return `https://image.jeuxvideo.com/smileys_img/${gifCode}.gif`;
}

function getSmileyImgHtml(smileyCode, big = false) {
    if (!smileyCode?.length) return smileyCode;
    const smileyLower = smileyCode.toLowerCase();
    const smileyUrl = buildSmileyUrl(smileyLower);
    return `<img data-code="${smileyLower}" title="${smileyLower}" src="${smileyUrl}" class="deboucled-smiley${big ? ' big' : ''}">`;
}

