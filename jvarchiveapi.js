
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

const jvArchiveTop1Url = `${jvarchiveUrl}/_nuxt/img/1.24cfc48.svg`;
const jvArchiveTop2Url = `${jvarchiveUrl}/_nuxt/img/2.84b5d8d.svg`;
const jvArchiveTop3Url = `${jvarchiveUrl}/_nuxt/img/3.827ef94.svg`;
const jvArchiveMedalSvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OTQuNCA0OTQuNCIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHBhdGggZD0iTTI0NyA0OTRDMTE1IDQ5NCA3IDM4NiA3IDI1NFMxMTUgMTQgMjQ3IDE0czI0MCAxMDggMjQwIDI0MC0xMDggMjQwLTI0MCAyNDB6IiBmaWxsPSIjZDNjNDljIi8+PGNpcmNsZSBjeD0iMjQ3LjIiIGN5PSIyNDAiIHI9IjIyNC44IiBmaWxsPSIjZTlkOGFhIi8+PHBhdGggZD0iTTQ5IDI2N0EyMjUgMjI1IDAgMCAxIDQxOCA5NWEyMjUgMjI1IDAgMSAwLTMxNiAzMTdjLTMzLTM5LTUzLTkwLTUzLTE0NXoiIGZpbGw9ImhzbCg0NGRlZyAzNSUgNjIlKSIvPjxwYXRoIGQ9Ik00MDYgODJBMjI1IDIyNSAwIDEgMSA4OCA0MDAiIGZpbGw9ImhzbCg0NGRlZyA1OSUgNzAlKSIvPjxwYXRoIGQ9Ik0yNDcgNDgwQzExNSA0ODAgNyAzNzIgNyAyNDBTMTE1IDAgMjQ3IDBzMjQwIDEwOCAyNDAgMjQwLTEwOCAyNDAtMjQwIDI0MHptMC00NTBhMjEwIDIxMCAwIDEgMCAxIDQyMCAyMTAgMjEwIDAgMCAwLTEtNDIweiIgZmlsbD0iI2U5ZDhhYSIvPjxwYXRoIGQ9Ik00ODcgMjQwYzAtNjEtMjItMTE2LTU5LTE1OGEyNDEgMjQxIDAgMCAwLTI3MC0zMSAyMDUgMjA1IDAgMCAxIDI0OCA1MyAyMDggMjA4IDAgMCAxIDUzIDI0OWMxOC0zNCAyOC03MiAyOC0xMTN6IiBmaWxsPSIjY2RiZDkyIi8+PHBhdGggZD0iTTMwIDI2M2MwIDYxIDIyIDExNiA1OSAxNThhMjQwIDI0MCAwIDAgMCAyNjkgMzEgMjEwIDIxMCAwIDAgMS0yNDgtNTQgMjA5IDIwOSAwIDAgMS01NC0yNDhjLTE2IDM0LTI2IDcyLTI2IDExM3oiIGZpbGw9IiNkZGNkYTMiLz48L3N2Zz4=';

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

    function getMedalUrl(classement) {
        if (classement === 1) return jvArchiveTop1Url;
        if (classement === 2) return jvArchiveTop2Url;
        if (classement === 3) return jvArchiveTop3Url;
        return jvArchiveMedalSvg;
    }

    const getMedalHtml = (classement) => `<img src="${getMedalUrl(classement)}" alt="${classement}" style="width: 44px">`;

    return {
        id: parseInt(result.id),
        author: result.pseudo,
        avatar: result.avatar,
        statistiquesTopMessages: result.statistiques_top_messages?.map(s => ({
            id: parseInt(s.id),
            authorId: parseInt(s.auteur_id),
            topType: s.top_type,
            dateTop: new Date(s.date_top),
            classement: s.classement,
            nbMessages: parseInt(s.nb_messages),
            medalHtml: getMedalHtml(s.classement)
        }))
    };
}

function parseJvArchiveAuthorLastMessageResults(results) {
    if (!results?.length) return null;

    return results.map(r => ({
        id: parseInt(r.id),
        datePost: new Date(r.date_post),
        topicId: r.topic?.id,
        topicTitle: r.topic?.titre,
        jvcUrl: `/forums/message/${r.id}`,
        jvArchiveUrl: `${jvarchiveUrl}/forums/message/${r.id}`
    }));
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

