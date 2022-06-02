
///////////////////////////////////////////////////////////////////////////////////////
// JVARCHIVE API
///////////////////////////////////////////////////////////////////////////////////////

const jvarchiveApiUrl = `${jvarchiveUrl}/api`;
const jvarchiveApiTopicsUrl = `${jvarchiveApiUrl}/topics`;
const jvarchiveApiAuteursUrl = `${jvarchiveApiUrl}/auteurs`;

const jvarchiveApiGetHotTopicsRoute = (itemsPerPage, timeInterval) => `${jvarchiveApiTopicsUrl}?page=1&itemsPerPage=${itemsPerPage}&orderBy=nb_messages&timeInterval=${timeInterval}&topicState=created`;
const jvarchiveApiGetAuthorRoute = (author) => `${jvarchiveApiAuteursUrl}/${author}`;
const jvarchiveApiGetAuthorLastMessagesRoute = (author) => `${jvarchiveApiAuteursUrl}/${author}/last5messages`;
const jvarchiveApiGetAuthorLastTopicsRoute = (author, itemsPerPage) => `${jvarchiveApiTopicsUrl}/search?page=1&itemsPerPage=${itemsPerPage}&search=${author}&searchType=auteur_topic_exact`;

const getJvArchiveHotTopics = async (itemsPerPage = 20, timeInterval = 'day') => fetchJson(jvarchiveApiGetHotTopicsRoute(itemsPerPage, timeInterval), 3000);
const getJvArchiveAuthor = async (author) => fetchJson(jvarchiveApiGetAuthorRoute(author), 3000);
const getJvArchiveAuthorLastMessages = async (author) => fetchJson(jvarchiveApiGetAuthorLastMessagesRoute(author), 3000);
const getJvArchiveAuthorLastTopics = async (author, itemsPerPage = 5) => fetchJson(jvarchiveApiGetAuthorLastTopicsRoute(author, itemsPerPage), 3000);

function parseJvArchiveHotTopicResults(results) {
    if (!results?.items?.length) return null;

    return results.items.map(r => {
        const randomStr = buildRandomStr(6);
        return {
            id: parseInt(r.id),
            title: r.titre,
            author: r.auteur.pseudo,
            nbMessages: r.nb_messages,
            isRedTopic: r.nb_messages > 20,
            lastMessageDate: new Date(r.date_dernier_message),
            url: `/forums/42-51-${r.id}-1-0-1-0-${randomStr}.htm`,
            authorProfile: `/profil/${r.auteur.pseudo.toLowerCase()}?mode=infos`,
            lastPageUrl: `/forums/42-51-${r.id}-${Math.ceil(r.nb_messages / 20)}-0-1-0-${randomStr}.htm`
        };
    });
}

function parseJvArchiveAuthorResult(result) {
    if (!result) return null;

    return {
        id: parseInt(result.id),
        author: result.pseudo,
        avatar: result.avatar
    };
}

function parseJvArchiveAuthorLastMessageResults(results) {
    if (!results?.length) return null;

    return results.map(r => {
        return {
            id: parseInt(r.id),
            datePost: new Date(r.date_post),
            topicId: r.topic?.id,
            topicTitle: r.topic?.titre,
            jvcUrl: `/forums/message/${r.id}`,
            jvArchiveUrl: `${jvarchiveUrl}/forums/message/${r.id}`,
        };
    });
}

function parseJvArchiveTopicsResults(results) {
    if (!results?.items?.length) return null;

    return results.items.map(r => {
        const randomStr = buildRandomStr(6);
        return {
            id: parseInt(r.id),
            title: r.titre,
            author: r.auteur.pseudo,
            nbMessages: r.nb_messages,
            nbArchivedMessages: r.nb_messages_enregistre,
            creationDate: new Date(r.date_creation),
            deletionDate: new Date(r.date_suppression),
            lastMessageDate: new Date(r.date_dernier_message),
            deletedByModeration: r.delete_by_modo, // null=not deleted; true=deleted by modo; false=deleted by author
            is410: r.delete_by_modo !== null,
            isRedTopic: r.nb_messages > 20,
            isBlackTopic: r.nb_messages >= 100,
            url: `/forums/42-51-${r.id}-1-0-1-0-${randomStr}.htm`,
            jvArchiveUrl: `${jvarchiveUrl}/forums/42-51-${r.id}-1-0-1-0-${randomStr}.htm`,
            authorProfile: `/profil/${r.auteur.pseudo.toLowerCase()}?mode=infos`,
            authorJvArchiveProfile: `${jvarchiveUrl}/profil/${r.auteur.pseudo.toLowerCase()}`,
            lastPageUrl: `/forums/42-51-${r.id}-${Math.ceil(r.nb_messages / 20)}-0-1-0-${randomStr}.htm`
        };
    });
}

