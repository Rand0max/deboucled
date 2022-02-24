
///////////////////////////////////////////////////////////////////////////////////////
// ANTI-SPAM AUTO BLACKLIST
///////////////////////////////////////////////////////////////////////////////////////

async function queryYoutubeBlacklist() {

    let newYoutubeBlacklist = await fetch(youtubeBlacklistUrl)
        .then(function (response) {
            if (!response.ok) throw Error(response.statusText);
            return response.text();
        })
        .then(function (text) {
            return JSON.parse(text);
        })
        .catch(function (err) {
            console.warn(err);
            return undefined;
        });

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

