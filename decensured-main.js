///////////////////////////////////////////////////////////////////////////////////////
// DECENSURED MAIN
///////////////////////////////////////////////////////////////////////////////////////

async function initDecensured() {
    if (decensuredInitialized) {
        return;
    }

    if (!await store.get(storage_optionEnableDecensured, storage_optionEnableDecensured_default)) {
        return;
    }

    decensuredInitialized = true;

    if (getUserPseudo()) {
        await pingDecensuredApi();

        if (decensuredPingTimer) {
            clearInterval(decensuredPingTimer);
            decensuredPingTimer = null;
        }

        decensuredPingTimer = setInterval(() => {
            pingDecensuredApi().catch(err => console.error('Erreur ping timer :', err));
        }, DECENSURED_CONFIG.PING_INTERVAL);
    }

    buildDecensuredMessagesUI();
    buildDecensuredTopicsUI();

    createDecensuredUsersHeader();
    toggleDecensuredUsersCountDisplay();
    startDecensuredUsersMonitoring();

    toggleDecensuredFloatingWidget();

    debouncedDecryptMessages();
    debouncedHighlightDecensuredTopics();
    setupDynamicTopicHighlighting();

    await checkAndProcessNewTopic();
}
