
///////////////////////////////////////////////////////////////////////////////////////
// PROFILE
///////////////////////////////////////////////////////////////////////////////////////

function buildBlocProfileElements(elements) {
    if (!elements?.length) return;
    let blocProfileElementsHtml = '';
    elements.forEach(element => {
        blocProfileElementsHtml += '<tr>';
        blocProfileElementsHtml += '<td class="text-cell line-ellipsis">';
        blocProfileElementsHtml += `<a href="${element.url}" class="xXx">`;
        if (element.class) blocProfileElementsHtml += `<span class="${element.class}"></span>`;
        blocProfileElementsHtml += element.text;
        blocProfileElementsHtml += '</a>';
        blocProfileElementsHtml += '</td>';
        blocProfileElementsHtml += `<td class="date-cell">${element.date}</td>`;
        blocProfileElementsHtml += '</tr>';
    });
    return blocProfileElementsHtml;
}

function buildBlocProfile(parentElement, headerTitle, footerTitle, footerLink, elements) {
    if (!parentElement) return;

    let blocProfileHtml = '';
    blocProfileHtml += '<div class="bloc-default-profil">';
    blocProfileHtml += '<div class="bloc-default-profil-header">';
    blocProfileHtml += `<h2>${headerTitle}</h2>`;
    blocProfileHtml += '</div>';
    blocProfileHtml += '<div class="body last-messages">';
    blocProfileHtml += '<table class="profil-display-tab">';
    blocProfileHtml += '<tbody>';
    blocProfileHtml += buildBlocProfileElements(elements);
    blocProfileHtml += '</tbody>';
    blocProfileHtml += '</table>';
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

function createNewColMd6(parentElement) {
    const newCol = document.createElement('div');
    newCol.className = 'col-md-6';
    parentElement.appendChild(newCol);
    return newCol;
}

async function buildProfileHistory(author) {
    let columnBlocs = [...document.querySelectorAll('.col-md-6')];
    if (!columnBlocs.length) {
        const rowElem = document.querySelector('div.row:not(.flex-column)');
        if (!rowElem) return;
        columnBlocs.push(createNewColMd6(rowElem));
        columnBlocs.push(createNewColMd6(rowElem));
    }

    if (columnBlocs.length < 2) return;

    function getTopicClass(topic) {
        if (!topic) return null;
        if (topic.deleteByModeration !== null) return 'deboucled-410-logo';
        if (topic.isRedTopic) return 'icon-topic-folder deboucled-topic-profile-folder deboucled-topic-folder2';
        return 'icon-topic-folder deboucled-topic-profile-folder deboucled-topic-folder1';
    }

    if (!document.querySelector('.last-messages')) { // inutile de charger les derniers messages s'ils sont déjà affichés par JVC
        const authorLastMessageResults = await getJvArchiveAuthorLastMessages(author);
        let authorLastMessages = parseJvArchiveAuthorLastMessageResults(authorLastMessageResults);
        if (authorLastMessages?.length) {
            const elements = authorLastMessages.map(m => ({
                url: m.jvcUrl,
                text: m.topicTitle,
                date: formatDateToFrenchFormat(m.datePost)
            }));
            const authorJvArchiveProfile = `${jvarchiveUrl}/profil/${author.toLowerCase()}`;
            buildBlocProfile(columnBlocs[1], 'Derniers messages', 'Profil JvArchive', authorJvArchiveProfile, elements);
        }
    }

    const authorLastTopicResults = await getJvArchiveAuthorLastTopics(author);
    let authorLastTopics = parseJvArchiveTopicsResults(authorLastTopicResults);
    if (authorLastTopics?.length) {
        const elements = authorLastTopics.map(t => ({
            url: t.url,
            text: t.title,
            date: formatDateToFrenchFormat(t.lastMessageDate),
            class: getTopicClass(t)
        }));
        const authorJvArchiveTopics = `${jvarchiveUrl}/topic/recherche?search=${author.toLowerCase()}&searchType=auteur_topic_exact`;
        buildBlocProfile(columnBlocs[0], 'Derniers topics', 'Topics JvArchive', authorJvArchiveTopics, elements);
    }
}

