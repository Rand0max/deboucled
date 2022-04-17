
///////////////////////////////////////////////////////////////////////////////////////
// JVARCHIVE API
///////////////////////////////////////////////////////////////////////////////////////

const jvarchiveApiUrl = `${jvarchiveUrl}/api`;
const jvarchiveApiTopicsUrl = `${jvarchiveApiUrl}/topics`;

const jvarchiveApiGetHotTopicsUrl = (itemsPerPage) => `${jvarchiveApiTopicsUrl}?page=1&itemsPerPage=${itemsPerPage}&orderBy=nb_messages&timeInterval=hour&topicState=created`;

const getJvArchiveHotTopics = async (nb = 10) => await fetchJson(jvarchiveApiGetHotTopicsUrl(nb), 3000);

function parseJvArchiveHotTopicResults(results) {
    if (!results?.items?.length) return null;

    const randomStr = (Math.random() + 1).toString(36).substring(6);

    return results.items.map(r =>
    ({
        id: parseInt(r.id),
        title: r.titre,
        author: r.auteur.pseudo,
        nbMessages: r.nb_messages,
        isHotTopic: r.nb_messages > 20,
        lastMessageDate: new Date(r.date_dernier_message),
        url: `/forums/42-51-${r.id}-1-0-1-0-${randomStr}.htm`,
        authorProfil: `/profil/${r.auteur.pseudo.toLowerCase()}?mode=infos`,
        lastPageUrl: `/forums/42-51-${r.id}-${Math.ceil(r.nb_messages / 20)}-0-1-0-${randomStr}.htm`
    }));
}