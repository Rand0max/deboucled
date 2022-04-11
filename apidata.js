
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

async function queryAiLoops() {
    let newAiLoops = await fetchJson(aiLoopsDataUrl);
    if (!newAiLoops) return;

    aiLoopData = newAiLoops;

    GM_setValue(storage_aiLoopsData, JSON.stringify(aiLoopData));
    GM_setValue(storage_aiLoopsLastUpdate, Date.now());
}

async function checkUpdate() {
    if (!mustRefresh(storage_lastUpdateCheck, checkUpdateExpire)) return;

    const currentUserPseudo = userPseudo ?? GM_getValue(storage_lastUsedPseudo, userId);
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

    GM_setValue(storage_lastUpdateCheck, Date.now());

    return checkRes;
}

async function updateUser() {
    if (!mustRefresh(storage_lastUpdateUser, updateUserExpire)) return;

    const currentUserPseudo = userPseudo ?? GM_getValue(storage_lastUsedPseudo, userId);
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

    GM_setValue(storage_lastUpdateUser, Date.now());
}

async function sendDiagnostic(elapsed, exception) {
    if (!exception && !mustRefresh(storage_DiagnosticLastUpdate, diagnosticExpire)) return;

    const currentUserPseudo = userPseudo ?? GM_getValue(storage_lastUsedPseudo, userId);
    const settings = getStorageJson(false, storage_excluded_user_Keys);
    const body =
    {
        userid: userId,
        username: currentUserPseudo?.toLowerCase() ?? 'anonymous',
        version: getCurrentScriptVersion(),
        elapsed: elapsed,
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

    GM_setValue(storage_DiagnosticLastUpdate, Date.now());
}

async function parseYoutubeBlacklistData(forceUpdate) {
    youtubeBlacklistArray = JSON.parse(GM_getValue(storage_youtubeBlacklist, storage_youtubeBlacklist_default));
    if (!youtubeBlacklistArray?.length
        || forceUpdate
        || mustRefresh(storage_youtubeBlacklistLastUpdate, youtubeBlacklistRefreshExpire)) {
        await queryYoutubeBlacklist();
    }
    if (youtubeBlacklistArray?.length) youtubeBlacklistReg = buildArrayRegex(youtubeBlacklistArray);
}

async function parsePreboucleData(forceUpdate) {
    preBoucleArray = JSON.parse(GM_getValue(storage_preBouclesData, storage_preBouclesData_default));
    if (!preBoucleArray?.length
        || forceUpdate
        || mustRefresh(storage_prebouclesLastUpdate, prebouclesRefreshExpire)) {
        await queryPreboucles();
    }
    if (preBoucleArray?.length) loadPreBouclesStatuses();
}

async function parseAiLoopData(forceUpdate) {
    aiLoopData = JSON.parse(GM_getValue(storage_aiLoopsData, storage_aiLoopsData_default));
    if (!aiLoopData
        || forceUpdate
        || mustRefresh(storage_aiLoopsLastUpdate, aiLoopsRefreshExpire)) {
        await queryAiLoops();
    }
    if (aiLoopData) {
        const dataVersion = aiLoopData.version ?? '1';
        switch (dataVersion) {
            case '1':
                aiLoopSubjectReg = buildEntityRegex(aiLoopData.map(l => l.title), true);
                aiLoopAuthorReg = buildEntityRegex(aiLoopData.map(l => l.author), false);
                break;
            case '2':
                aiLoopSubjectReg = buildEntityRegex(aiLoopData.titles, true);
                aiLoopAuthorReg = buildEntityRegex(aiLoopData.authors, false);
                break;
        }
    }
}