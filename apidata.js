
///////////////////////////////////////////////////////////////////////////////////////
// API DATA
///////////////////////////////////////////////////////////////////////////////////////

function mustRefresh(storageLastUpdateId, dataExpire) {
    let lastUpdate = new Date(GM_getValue(storageLastUpdateId, new Date(0)));
    let datenow = new Date();
    let dateExpireRange = new Date(datenow.setHours(datenow.getHours() - dataExpire));
    return lastUpdate <= dateExpireRange;
}

async function queryYoutubeBlacklist() {
    let newYoutubeBlacklist = await fetchJson(youtubeBlacklistUrl);
    if (!newYoutubeBlacklist?.length) return;

    youtubeBlacklistArray = newYoutubeBlacklist.flatMap(yp => yp.videos);

    GM_setValue(storage_youtubeBlacklist, JSON.stringify(youtubeBlacklistArray));
    GM_setValue(storage_youtubeBlacklistLastUpdate, Date.now());
}

async function queryPreboucles() {
    let newPreboucles = await fetchJson(prebouclesDataUrl);
    if (!newPreboucles?.length) return;

    preBoucleArray = newPreboucles;

    GM_setValue(storage_preBouclesData, JSON.stringify(preBoucleArray));
    GM_setValue(storage_prebouclesLastUpdate, Date.now());
}

async function checkUpdate() {
    if (!mustRefresh(storage_lastUpdateCheck, checkUpdateExpire)) return;

    let currentUserPseudo = userPseudo ?? GM_getValue(storage_lastUsedPseudo);
    const bodyJson = `{"userid":"${userId}","username":"${currentUserPseudo.toLowerCase() ?? 'anonymous'}","version":"${getCurrentScriptVersion()}"}`;
    let checkRes;
    await GM.xmlHttpRequest({
        method: 'POST',
        url: checkUpdateUrl,
        data: bodyJson,
        headers: { 'Content-Type': 'application/json' },
        onload: (response) => { checkRes = response.responseText; },
        onerror: (response) => { console.error("error : %o", response) }
    });

    GM_setValue(storage_lastUpdateCheck, Date.now());

    return checkRes;
}

