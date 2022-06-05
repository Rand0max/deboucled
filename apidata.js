
///////////////////////////////////////////////////////////////////////////////////////
// API DATA
///////////////////////////////////////////////////////////////////////////////////////

function mustRefresh(storageLastUpdateId, dataExpire) {
    let lastUpdate = new Date(store.get(storageLastUpdateId, new Date(0)));
    let datenow = new Date();
    let dateExpireRange = new Date(datenow.setMinutes(datenow.getMinutes() - dataExpire.totalMinutes()));
    return lastUpdate <= dateExpireRange;
}

async function queryYoutubeBlacklist() {
    let newYoutubeBlacklist = await fetchJson(youtubeBlacklistUrl);
    if (!newYoutubeBlacklist?.length) return;

    youtubeBlacklistArray = newYoutubeBlacklist.flatMap(yp => yp.videos);

    store.set(storage_youtubeBlacklist, JSON.stringify(youtubeBlacklistArray));
    store.set(storage_youtubeBlacklistLastUpdate, Date.now());
}

async function queryPreboucles() {
    let newPreboucles = await fetchJson(prebouclesDataUrl);
    if (!newPreboucles?.length) return;

    preBoucleArray = newPreboucles;

    store.set(storage_preBouclesData, JSON.stringify(preBoucleArray));
    store.set(storage_prebouclesLastUpdate, Date.now());
}

async function queryAiLoops() {
    let newAiLoops = await fetchJson(aiLoopsDataUrl);
    if (!newAiLoops) return;

    aiLoopData = newAiLoops;

    store.set(storage_aiLoopsData, JSON.stringify(aiLoopData));
    store.set(storage_aiLoopsLastUpdate, Date.now());
}

async function queryHotTopics() {
    let newHotTopics = await buildHotTopics();
    if (!newHotTopics) return;

    hotTopicsData = newHotTopics;

    store.set(storage_hotTopicsData, JSON.stringify(hotTopicsData));
    store.set(storage_hotTopicsLastUpdate, Date.now());
}

async function checkUpdate() {
    if (!mustRefresh(storage_lastUpdateCheck, checkUpdateExpire)) return;

    const currentUserPseudo = userPseudo ?? store.get(storage_lastUsedPseudo, userId);
    const bodyJson = `{"userid":"${userId}","username":"${currentUserPseudo?.toLowerCase() ?? 'anonymous'}","version":"${getCurrentScriptVersion()}"}`;
    let checkRes;
    await GM.xmlHttpRequest({
        method: 'POST',
        url: checkUpdateUrl,
        data: bodyJson,
        headers: { 'Content-Type': 'application/json' },
        onload: (response) => { checkRes = response.responseText; },
        onerror: (response) => { console.error("error : %o", response) }
    });

    store.set(storage_lastUpdateCheck, Date.now());

    return checkRes;
}

async function updateUser() {
    if (!mustRefresh(storage_lastUpdateUser, updateUserExpire)) return;

    const currentUserPseudo = userPseudo ?? store.get(storage_lastUsedPseudo, userId);
    const settings = getStorageJson(false, storage_excluded_user_Keys);
    const body =
    {
        userid: userId,
        username: currentUserPseudo?.toLowerCase() ?? 'anonymous',
        version: getCurrentScriptVersion(),
        settings: settings
    }
    const bodyJson = JSON.stringify(body);
    await GM.xmlHttpRequest({
        method: 'POST',
        url: updateUserUrl,
        data: bodyJson,
        headers: { 'Content-Type': 'application/json' },
        onerror: (response) => { console.error("error : %o", response) }
    });

    store.set(storage_lastUpdateUser, Date.now());
}

async function sendDiagnostic(elapsed, exception) {
    if (!exception && !mustRefresh(storage_DiagnosticLastUpdate, diagnosticExpire)) return;

    const currentUserPseudo = userPseudo ?? store.get(storage_lastUsedPseudo, userId);
    const settings = getStorageJson(false, storage_excluded_user_Keys);
    const body =
    {
        userid: userId,
        username: currentUserPseudo?.toLowerCase() ?? 'anonymous',
        version: getCurrentScriptVersion(),
        elapsed: elapsed,
        location: window.location.href,
        settings: settings,
        ...(exception && { exception: stringifyError(exception) }),
    }
    const bodyJson = JSON.stringify(body);
    if (!bodyJson || bodyJson === '{}') return;

    await GM.xmlHttpRequest({
        method: 'POST',
        url: diagnosticUrl,
        data: bodyJson,
        headers: { 'Content-Type': 'application/json' },
        onerror: (response) => { console.error("error : %o", response) }
    });

    store.set(storage_DiagnosticLastUpdate, Date.now());
}

async function parseYoutubeBlacklistData(forceUpdate) {
    youtubeBlacklistArray = JSON.parse(store.get(storage_youtubeBlacklist, storage_youtubeBlacklist_default));
    if (!youtubeBlacklistArray?.length
        || forceUpdate
        || mustRefresh(storage_youtubeBlacklistLastUpdate, youtubeBlacklistRefreshExpire)) {
        await queryYoutubeBlacklist();
    }
    if (youtubeBlacklistArray?.length) youtubeBlacklistReg = buildArrayRegex(youtubeBlacklistArray);
}

async function parsePreboucleData(forceUpdate) {
    preBoucleArray = JSON.parse(store.get(storage_preBouclesData, storage_preBouclesData_default));
    if (!preBoucleArray?.length
        || forceUpdate
        || mustRefresh(storage_prebouclesLastUpdate, prebouclesRefreshExpire)) {
        await queryPreboucles();
    }
    if (preBoucleArray?.length) loadPreBouclesStatuses();
}

async function parseAiLoopData(forceUpdate) {
    aiLoopData = JSON.parse(store.get(storage_aiLoopsData, storage_aiLoopsData_default));
    if (!aiLoopData
        || forceUpdate
        || mustRefresh(storage_aiLoopsLastUpdate, aiLoopsRefreshExpire)) {
        await queryAiLoops();
    }
    if (!aiLoopData) return;

    const dataVersion = parseInt(aiLoopData.version ?? '1');
    if (dataVersion === 1 && Array.isArray(aiLoopData)) {
        aiLoopSubjectReg = buildEntityRegex(aiLoopData.map(l => l.title), true);
        aiLoopAuthorReg = buildEntityRegex(aiLoopData.map(l => l.author), false);
    }
    else if (dataVersion === 2) {
        aiLoopSubjectReg = buildEntityRegex(aiLoopData.titles, true);
        aiLoopAuthorReg = buildEntityRegex(aiLoopData.authors, false);
    }
}

async function parseHotTopicsData(forceUpdate) {
    hotTopicsData = JSON.parse(store.get(storage_hotTopicsData, storage_hotTopicsData_default));
    if (!hotTopicsData
        || forceUpdate
        || mustRefresh(storage_hotTopicsLastUpdate, hotTopicsRefreshExpire)) {
        await queryHotTopics();
    }
}
