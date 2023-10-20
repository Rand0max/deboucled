
///////////////////////////////////////////////////////////////////////////////////////
// API DATA
///////////////////////////////////////////////////////////////////////////////////////

function mustRefresh(storageLastUpdateKey, dataExpire) {
    let lastUpdate = new Date(store.get(storageLastUpdateKey, new Date(0)));
    let datenow = new Date();
    let dateExpireRange = new Date(datenow.setMinutes(datenow.getMinutes() - dataExpire.totalMinutes()));
    return lastUpdate <= dateExpireRange;
}

async function queryApiData(forceUpdate, dataUrl, storageLastUpdateKey, dataExpire, storageDataKey, storageDataDefaultKey, dataTransformFn, queryParams) {
    let resultData = JSON.parse(store.get(storageDataKey, storageDataDefaultKey));

    if (!resultData || forceUpdate || mustRefresh(storageLastUpdateKey, dataExpire)) {
        let newData = queryParams ? await fetchJsonWithParams(dataUrl, queryParams) : await fetchJson(dataUrl);
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
        url: apiCheckUpdateUrl,
        data: bodyJson,
        headers: { 'Content-Type': 'application/json' },
        onload: (response) => { checkRes = response.responseText; },
        onerror: (response) => { console.error("error : %o", response); }
    });

    store.set(storage_lastUpdateCheck, Date.now());

    return checkRes;
}

async function updateUser(forceUpdate = false) {
    if (!mustRefresh(storage_lastUpdateUser, updateUserExpire) && !forceUpdate) return;

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
        url: apiUpdateUserUrl,
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
        url: apiDiagnosticUrl,
        data: bodyJson,
        headers: { 'Content-Type': 'application/json' },
        onerror: (response) => { console.error("error : %o", response); }
    });

    store.set(storage_DiagnosticLastUpdate, Date.now());
}

async function sendMessageQuote(messageQuoteInfo) {
    const body = {
        userid: messageQuoteInfo.userId,
        quoted_message_id: messageQuoteInfo.quotedMessageId,
        quoted_username: messageQuoteInfo.quotedUsername,
        quoted_message_url: messageQuoteInfo.quotedMessageUrl,
        new_message_id: messageQuoteInfo.newMessageId,
        new_message_username: messageQuoteInfo.newMessageUsername,
        new_message_content: messageQuoteInfo.newMessageContent,
        new_message_url: messageQuoteInfo.newMessageUrl,
        topic_id: messageQuoteInfo.topicId,
        topic_url: messageQuoteInfo.topicUrl,
        topic_title: messageQuoteInfo.topicTitle,
        creation_date: new Date()
    };
    const bodyJson = JSON.stringify(body);

    await GM.xmlHttpRequest({
        method: 'POST',
        url: apiMessageQuoteUrl,
        data: bodyJson,
        headers: { 'Content-Type': 'application/json' },
        onerror: (response) => { console.error("error : %o", response); }
    });
}

async function updateMessageQuote(userId, username, isRead, quoteId) {
    const body = {
        userid: userId,
        username: username,
        isread: isRead
    };
    if (quoteId?.length) body.id = quoteId;

    const bodyJson = JSON.stringify(body);

    await GM.xmlHttpRequest({
        method: 'PUT',
        url: apiMessageQuoteUrl,
        data: bodyJson,
        headers: { 'Content-Type': 'application/json' },
        onerror: (response) => { console.error("error : %o", response); }
    });
}

async function parseYoutubeBlacklistData(forceUpdate) {
    youtubeBlacklistArray = await queryApiData(
        forceUpdate,
        apiYoutubeBlacklistUrl,
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
        apiPrebouclesDataUrl,
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
        apiAiLoopsDataUrl,
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
        apiAiBoucledAuthorsDataUrl,
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

async function parseMessageQuotesData(forceUpdate) {
    if (!userPseudo?.length || !userId) return;

    messageQuotesData = await queryApiData(
        forceUpdate,
        apiMessageQuoteUrl,
        storage_messageQuotesLastUpdate,
        messageQuotesRefreshExpire,
        storage_messageQuotesData,
        storage_messageQuotesData_default,
        undefined,
        { username: userPseudo.toLowerCase(), userid: userId }
    );
}
