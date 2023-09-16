
///////////////////////////////////////////////////////////////////////////////////////
// API DATA
///////////////////////////////////////////////////////////////////////////////////////

function mustRefresh(storageLastUpdateKey, dataExpire) {
    let lastUpdate = new Date(store.get(storageLastUpdateKey, new Date(0)));
    let datenow = new Date();
    let dateExpireRange = new Date(datenow.setMinutes(datenow.getMinutes() - dataExpire.totalMinutes()));
    return lastUpdate <= dateExpireRange;
}

async function queryApiData(forceUpdate, dataUrl, storageLastUpdateKey, dataExpire, storageDataKey, storageDataDefaultKey, dataTransformFn) {
    let resultData = JSON.parse(store.get(storageDataKey, storageDataDefaultKey));

    if (!resultData || forceUpdate || mustRefresh(storageLastUpdateKey, dataExpire)) {
        let newData = await fetchJson(dataUrl);
        store.set(storageLastUpdateKey, Date.now());
        if (!newData) return resultData;

        if (dataTransformFn) newData = dataTransformFn(newData);

        store.set(storageDataKey, JSON.stringify(newData));
        return newData;
    }

    return resultData;
}

async function queryHotTopics() {
    let newHotTopics = await buildHotTopics();
    store.set(storage_hotTopicsLastUpdate, Date.now());
    if (!newHotTopics) return;

    hotTopicsData = newHotTopics;

    store.set(storage_hotTopicsData, JSON.stringify(hotTopicsData));
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
        onerror: (response) => { console.error("error : %o", response); }
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
    };
    const bodyJson = JSON.stringify(body);
    await GM.xmlHttpRequest({
        method: 'POST',
        url: updateUserUrl,
        data: bodyJson,
        headers: { 'Content-Type': 'application/json' },
        onerror: (response) => { console.error("error : %o", response); }
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
    };
    const bodyJson = JSON.stringify(body);
    if (!bodyJson || bodyJson === '{}') return;

    await GM.xmlHttpRequest({
        method: 'POST',
        url: diagnosticUrl,
        data: bodyJson,
        headers: { 'Content-Type': 'application/json' },
        onerror: (response) => { console.error("error : %o", response); }
    });

    store.set(storage_DiagnosticLastUpdate, Date.now());
}

async function parseYoutubeBlacklistData(forceUpdate) {
    youtubeBlacklistArray = await queryApiData(
        forceUpdate,
        youtubeBlacklistUrl,
        storage_youtubeBlacklistLastUpdate,
        youtubeBlacklistRefreshExpire,
        storage_youtubeBlacklist,
        storage_youtubeBlacklist_default,
        (data) => data.flatMap(yp => yp.videos)
    );

    if (youtubeBlacklistArray?.length) youtubeBlacklistReg = buildArrayRegex(youtubeBlacklistArray);
}

async function parsePreboucleData(forceUpdate) {
    preBoucleArray = await queryApiData(
        forceUpdate,
        prebouclesDataUrl,
        storage_prebouclesLastUpdate,
        prebouclesRefreshExpire,
        storage_preBouclesData,
        storage_preBouclesData_default
    );

    if (preBoucleArray?.length) {
        loadPreBouclesStatuses();
        loadPreBoucleRegexCache();
    }
}

async function parseAiLoopData(forceUpdate) {
    aiLoopData = await queryApiData(
        forceUpdate,
        aiLoopsDataUrl,
        storage_aiLoopsLastUpdate,
        aiLoopsRefreshExpire,
        storage_aiLoopsData,
        storage_aiLoopsData_default
    );
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

async function parseAiBoucledAuthorsData(forceUpdate) {
    aiBoucledAuthorsData = await queryApiData(
        forceUpdate,
        aiBoucledAuthorsDataUrl,
        storage_aiBoucledAuthorsLastUpdate,
        aiBoucledAuthorsRefreshExpire,
        storage_aiBoucledAuthorsData,
        storage_aiBoucledAuthorsData_default
    );

    if (!aiBoucledAuthorsData) return;

    const dataVersion = parseInt(aiBoucledAuthorsData.version ?? '1');
    if (dataVersion === 1) {
        aiBoucledAuthorsReg = buildEntityRegex(aiBoucledAuthorsData.boucledAuthors, false);
    }
}

async function parseHotTopicsData(forceUpdate) {
    hotTopicsData = JSON.parse(store.get(storage_hotTopicsData, storage_hotTopicsData_default));
    if (!hotTopicsData ||
        forceUpdate ||
        mustRefresh(storage_hotTopicsLastUpdate, hotTopicsRefreshExpire)) {
        await queryHotTopics();
    }
}
