
///////////////////////////////////////////////////////////////////////////////////////
// ANTI-SPAM AUTO BLACKLIST
///////////////////////////////////////////////////////////////////////////////////////

async function queryYoutubeBlacklist() {
    let newYoutubeBlacklist = await fetchJson(youtubeBlacklistUrl);
    if (!newYoutubeBlacklist?.length) return;

    youtubeBlacklistArray = newYoutubeBlacklist.flatMap(yp => yp.videos);

    GM_setValue(storage_youtubeBlacklist, JSON.stringify(youtubeBlacklistArray));
    GM_setValue(storage_youtubeBlacklistLastUpdate, Date.now());
}

function mustRefreshYoutubeBlacklist() {
    let youtubeBlacklistLastUpdate = new Date(GM_getValue(storage_youtubeBlacklistLastUpdate, storage_youtubeBlacklistLastUpdate_default));
    let datenow = new Date();
    let dateOneDayOld = new Date(datenow.setHours(datenow.getHours() - youtubeBlacklistRefreshExpire));
    return youtubeBlacklistLastUpdate <= dateOneDayOld;
}

