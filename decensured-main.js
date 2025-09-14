///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED MAIN
///////////////////////////////////////////////////////////////////////////////////////

async function initDecensuredPing() {
    if (!getCurrentUserPseudo()) return;

    await pingDecensuredApi();

    if (decensuredPingTimer) {
        clearInterval(decensuredPingTimer);
        decensuredPingTimer = null;
    }

    decensuredPingTimer = setInterval(() => {
        pingDecensuredApi().catch(err => logDecensuredError(err, 'initializeDecensured - Erreur ping timer'));
    }, DECENSURED_CONFIG.PING_INTERVAL);
}

async function initDecensured() {
    if (decensuredInitialized) {
        return;
    }

    if (!await store.get(storage_optionEnableDecensured, storage_optionEnableDecensured_default)) {
        return;
    }

    decensuredInitialized = true;

    initDecensuredPing();

    buildDecensuredMessagesUI();
    buildDecensuredTopicsUI();

    createDecensuredUsersHeader();
    toggleDecensuredUsersCountDisplay();
    startDecensuredUsersMonitoring();

    toggleDecensuredFloatingWidget();

    debouncedHighlightDecensuredTopics();
    setupDynamicTopicHighlighting();

    await checkAndProcessNewTopic();
}
