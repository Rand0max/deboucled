
///////////////////////////////////////////////////////////////////////////////////////
// JVARCHIVE API
///////////////////////////////////////////////////////////////////////////////////////

const jvarchiveApiUrl = `${jvarchiveUrl}/api`;
const jvarchiveApiTopicsUrl = `${jvarchiveApiUrl}/topics`;

const jvarchiveApiGetHotTopicsUrl = (itemsPerPage, timeInterval) => `${jvarchiveApiTopicsUrl}?page=1&itemsPerPage=${itemsPerPage}&orderBy=nb_messages&timeInterval=${timeInterval}&topicState=created`;

const getJvArchiveHotTopics = async (itemsPerPage = 20, timeInterval = 'day') => await fetchJson(jvarchiveApiGetHotTopicsUrl(itemsPerPage, timeInterval), 3000);

function parseJvArchiveHotTopicResults(results) {
    if (!results?.items?.length) return null;

    return results.items.map(r => {
        const randomStr = buildRandomStr(6);
        return {
            id: parseInt(r.id),
            title: r.titre,
            author: r.auteur.pseudo,
            nbMessages: r.nb_messages,
            isHotTopic: r.nb_messages > 20,
            lastMessageDate: new Date(r.date_dernier_message),
            url: `/forums/42-51-${r.id}-1-0-1-0-${randomStr}.htm`,
            authorProfil: `/profil/${r.auteur.pseudo.toLowerCase()}?mode=infos`,
            lastPageUrl: `/forums/42-51-${r.id}-${Math.ceil(r.nb_messages / 20)}-0-1-0-${randomStr}.htm`
        };
    });
}