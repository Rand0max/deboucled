
///////////////////////////////////////////////////////////////////////////////////////
// PROFILE
///////////////////////////////////////////////////////////////////////////////////////

function buildJvArchiveProfilButton(author) {
    const redirectUrl = `${jvarchiveUrl}/profil/${author.toLowerCase()}`;
    const profilAnchor = document.createElement('a');
    profilAnchor.setAttribute('class', 'xXx lien-jv deboucled-jvarchive-logo deboucled-blackandwhite');
    profilAnchor.setAttribute('href', redirectUrl);
    profilAnchor.setAttribute('target', '_blank');
    profilAnchor.setAttribute('title', 'Profil JvArchive');
    return profilAnchor;
}

function updateFilteredAuthorHeader() {
    const filteredAuthor = topicFilteredAuthorMap.get(currentTopicId);

    let filteredAuthorElement = document.querySelector('#deboucled-filtered-author');

    if (filteredAuthorElement && !filteredAuthor?.length) { // suppression du bouton
        filteredAuthorElement.remove();
    }
    else if (!filteredAuthorElement && filteredAuthor?.length) { // création du bouton
        const paginationElement = document.querySelector('div.bloc-pagi-default');
        if (!paginationElement) return;

        filteredAuthorElement = document.createElement('div');
        filteredAuthorElement.id = 'deboucled-filtered-author'
        filteredAuthorElement.className = `deboucled-badge deboucled-badge-neutral${preferDarkTheme() ? ' dark' : ''} pill close`;
        filteredAuthorElement.textContent = filteredAuthor.trim().toUpperCase();
        filteredAuthorElement.onclick = async () => {
            await toggleFilteredTopicAuthor();
            updateFilteredMessages();
        };
        paginationElement.insertAdjacentElement('afterend', filteredAuthorElement);
    }
    else if (filteredAuthorElement && filteredAuthor?.length) { // mise à jour
        filteredAuthorElement.textContent = filteredAuthor.trim().toUpperCase();
    }
}

async function toggleFilteredTopicAuthor(author) {
    const currentFilteredAuthor = topicFilteredAuthorMap.get(currentTopicId);
    if (currentFilteredAuthor?.toLowerCase() !== author?.toLowerCase()) {
        topicFilteredAuthorMap.set(currentTopicId, author);
    }
    else {
        topicFilteredAuthorMap.delete(currentTopicId);
    }
    await saveLocalStorage();
}

function updateFilteredMessages() {
    const messages = getAllMessages();
    if (!messages?.length) return;

    const filteredAuthor = topicFilteredAuthorMap.get(currentTopicId);

    function toggleFilterClass(elem, enabled) {
        if (!elem) return;
        elem.classList.toggle('deboucled-filter-logo', enabled);
        elem.classList.toggle('deboucled-clearfilter-logo', !enabled);
    }

    messages.forEach(message => {
        if (!message.getAttribute('blacklisted')) message.style.removeProperty('display');

        const mAuthorElement = message.querySelector('a.bloc-pseudo-msg, span.bloc-pseudo-msg');
        if (!mAuthorElement) return;

        const mAuthor = mAuthorElement.textContent?.trim();
        if (!mAuthor?.length) return;

        const mFilterElement = message.querySelector('.deboucled-filter-logo,.deboucled-clearfilter-logo');
        if (!mFilterElement) return;

        if (filteredAuthor?.length) {
            if (filteredAuthor.toLowerCase() === mAuthor.toLowerCase()) {
                toggleFilterClass(mFilterElement, false);
            }
            else {
                message.style.display = 'none';
                toggleFilterClass(mFilterElement, true);
            }
        }
        else {
            toggleFilterClass(mFilterElement, true);
        }
    });

    updateFilteredAuthorHeader();
}

function buildFilterAuthorMessageButton(author) {
    const filterElement = document.createElement('div');
    filterElement.className = 'deboucled-filter-logo deboucled-blackandwhite';
    filterElement.setAttribute('deboucled-data-tooltip', 'Filter sur les messages de ce pseudo.');
    filterElement.onclick = async () => {
        await toggleFilteredTopicAuthor(author);
        updateFilteredMessages();
    }
    return filterElement;
}

function buildProfileBlacklistBadges(author, authorElement) {
    if (!authorElement) return;
    const blacklists = blacklistsIncludingEntity(author, entityAuthor, false);
    if (!blacklists?.length) return;

    blacklists.forEach(bl => {
        const content = bl.shortDescription ?? bl.description ?? bl.id ?? 'BL';
        const badge = buildBadge(bl.id, content, `Présent dans la liste « ${bl.description} ».`, '', 'blacklist', 'big');
        authorElement.parentElement.append(badge);
    });
}

function buildProfileLinkElements(elements) {
    if (!elements?.length) return;
    let profileElementsHtml = '';
    profileElementsHtml += '<table class="profil-display-tab">';
    profileElementsHtml += '<tbody>';
    elements.forEach(element => {
        profileElementsHtml += '<tr>';
        profileElementsHtml += '<td class="text-cell line-ellipsis">';
        profileElementsHtml += `<a href="${element.url}" class="xXx" target="_blank">`;
        if (element.class) profileElementsHtml += `<span class="${element.class}"></span>`;
        profileElementsHtml += element.text;
        profileElementsHtml += '</a>';
        profileElementsHtml += '</td>';
        profileElementsHtml += `<td class="date-cell">${element.date}</td>`;
        profileElementsHtml += '</tr>';
    });
    profileElementsHtml += '</tbody>';
    profileElementsHtml += '</table>';
    return profileElementsHtml;
}

function buildProfileMedals(elements) {
    if (!elements?.length) return;
    let profileElementsHtml = '';

    const getDateMonthYear = (d) => d.toLocaleString("fr-FR", { month: "long", year: "numeric" });
    const buildHint = (medal) => `• Posteur n°${medal.classement} en ${getDateMonthYear(medal.dateTop)} (${medal.nbMessages} messages)`;

    profileElementsHtml += '<div class="deboucled-medal-container">';
    elements.forEach(element => {
        const hint = element.map(m => buildHint(m)).join('\n');
        profileElementsHtml += `<span class="deboucled-medal-wrapper" deboucled-data-tooltip="${hint}">`;
        profileElementsHtml += element[0].medalHtml;
        profileElementsHtml += `<span class="deboucled-badge largepill deboucled-badge-neutral${preferDarkTheme() ? ' dark' : ''}">${element.length}</span>`;
        profileElementsHtml += '</span>';
    });
    profileElementsHtml += '</div>';

    return profileElementsHtml;
}

function buildBlocProfile(parentElement, headerTitle, footerTitle, footerLink, elements, elementBuilder) {
    if (!parentElement) return;

    let blocProfileHtml = '';
    blocProfileHtml += '<div class="bloc-default-profil">';
    blocProfileHtml += '<div class="bloc-default-profil-header">';
    blocProfileHtml += `<h2>${headerTitle}</h2>`;
    blocProfileHtml += '</div>';
    blocProfileHtml += '<div class="body deboucled-profile-list">';
    blocProfileHtml += elementBuilder(elements);
    blocProfileHtml += '<div class="foot-link">';
    blocProfileHtml += `<a href="${footerLink}" class="bloc-chev-pix icon-next" target="_blank">`;
    blocProfileHtml += `<span>${footerTitle}</span>`;
    blocProfileHtml += '</a>';
    blocProfileHtml += '</div>';
    blocProfileHtml += '</div>';
    blocProfileHtml += '</div>';

    const div = document.createElement('div');
    parentElement.appendChild(div);
    div.outerHTML = blocProfileHtml;
}

function createNewColLg6(parentElement) {
    const newCol = document.createElement('div');
    newCol.className = 'col-lg-6';
    parentElement.appendChild(newCol);
    return newCol;
}

function getProfileColumnBlocs() {
    let columnBlocs = [...document.querySelectorAll('.col-lg-6')];
    if (!columnBlocs.length) {
        const rowElem = document.querySelector('div.row:not(.flex-column)');
        if (!rowElem) return;
        columnBlocs.push(createNewColLg6(rowElem));
        columnBlocs.push(createNewColLg6(rowElem));
    }
    return columnBlocs;
}

async function buildProfileStats(author) {
    const authorJvaResult = await getJvArchiveAuthor(author);
    if (!authorJvaResult) return;

    const authorJva = parseJvArchiveAuthorResult(authorJvaResult);
    if (!authorJva?.statistiquesTopMessages?.length) return;

    const columnBlocs = getProfileColumnBlocs();
    if (columnBlocs.length < 2) return;

    const authorJvArchiveProfile = `${jvarchiveUrl}/profil/${author.toLowerCase()}`;
    const stats = authorJva.statistiquesTopMessages.sort((a, b) => (a.classement > b.classement) ? 1 : -1);

    const elements = group(stats, (item) => { return item.classement > 3 ? 99 : item.classement });

    buildBlocProfile(
        columnBlocs[0],
        'Récompenses',
        'Profil JvArchive',
        authorJvArchiveProfile,
        Object.values(elements),
        buildProfileMedals);
}

async function buildProfileHistory(author) {
    const columnBlocs = getProfileColumnBlocs();
    if (columnBlocs.length < 2) return;

    function getTopicClass(topic) {
        if (!topic) return null;
        if (topic.is410) return 'deboucled-410-logo';
        if (topic.isRedTopic) return 'icon-topic-folder deboucled-topic-profile-folder deboucled-topic-folder2';
        return 'icon-topic-folder deboucled-topic-profile-folder deboucled-topic-folder1';
    }

    if (!document.querySelector('.last-messages')) { // inutile de charger les derniers messages s'ils sont déjà affichés par JVC
        const authorLastMessageResults = await getJvArchiveAuthorLastMessages(author);
        let authorLastMessages = parseJvArchiveAuthorLastMessageResults(authorLastMessageResults);
        if (authorLastMessages?.length) {
            const elements = authorLastMessages.map(m => ({
                url: userPseudo ? m.jvcUrl : m.jvArchiveUrl,
                text: m.topicTitle,
                date: formatDateToFrenchFormat(m.datePost)
            }));
            const authorJvArchiveProfile = `${jvarchiveUrl}/profil/${author.toLowerCase()}`;

            buildBlocProfile(
                columnBlocs[1],
                'Derniers messages',
                'Profil JvArchive',
                authorJvArchiveProfile,
                elements,
                buildProfileLinkElements);
        }
    }

    const authorLastTopicResults = await getJvArchiveAuthorLastTopics(author);
    let authorLastTopics = parseJvArchiveTopicsResults(authorLastTopicResults);
    if (authorLastTopics?.length) {
        const elements = authorLastTopics.map(t => ({
            url: t.is410 ? t.jvArchiveUrl : t.url,
            text: t.title,
            date: formatDateToFrenchFormat(t.lastMessageDate),
            class: getTopicClass(t)
        }));
        const authorJvArchiveTopics = `${jvarchiveUrl}/topic/recherche?search=${author.toLowerCase()}&searchType=auteur_topic_exact`;

        buildBlocProfile(
            columnBlocs[0],
            'Derniers topics',
            'Topics JvArchive',
            authorJvArchiveTopics,
            elements,
            buildProfileLinkElements);
    }
}

