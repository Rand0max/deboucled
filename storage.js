
///////////////////////////////////////////////////////////////////////////////////////
// STORAGE
///////////////////////////////////////////////////////////////////////////////////////

const localstorage_pocTopics = 'deboucled_pocTopics';
const localstorage_topicAuthors = 'deboucled_topicAuthors';

const storage_init = 'deboucled_init', storage_init_default = false;
const storage_secret_displayed = 'deboucled_secret_displayed', storage_secret_displayed_default = false;
const storage_userId = 'deboucled_userId', storage_userId_default = '';
const storage_lastUsedPseudo = 'deboucled_lastUsedPseudo', storage_lastUsedPseudo_default = '';
const storage_preBoucles = 'deboucled_preBoucles', storage_preBoucles_default = '[]';
const storage_blacklistedTopicIds = 'deboucled_blacklistedTopicIds', storage_blacklistedTopicIds_default = '[]';
const storage_blacklistedSubjects = 'deboucled_blacklistedSubjects', storage_blacklistedSubjects_default = '[]';
const storage_blacklistedAuthors = 'deboucled_blacklistedAuthors', storage_blacklistedAuthors_default = '[]';
const storage_blacklistedShadows = 'deboucled_blacklistedShadows', storage_blacklistedShadows_default = '[]';
const storage_whitelistedTopicIds = 'deboucled_whitelistedTopicIds', storage_whitelistedTopicIds_default = '[]';
const storage_optionEnableJvcDarkTheme = 'deboucled_optionEnableJvcDarkTheme', storage_optionEnableJvcDarkTheme_default = false;
const storage_optionEnableJvRespawnRefinedTheme = 'deboucled_optionEnableJvRespawnRefinedTheme', storage_optionEnableJvRespawnRefinedTheme_default = false;
const storage_optionEnableDeboucledDarkTheme = 'deboucled_optionEnableDeboucledDarkTheme', storage_optionEnableDeboucledDarkTheme_default = false;
const storage_optionBoucledUseJvarchive = 'deboucled_optionBoucledUseJvarchive', storage_optionBoucledUseJvarchive_default = false;
const storage_optionHideMessages = 'deboucled_optionHideMessages', storage_optionHideMessages_default = true;
const storage_optionAllowDisplayThreshold = 'deboucled_optionAllowDisplayThreshold', storage_optionAllowDisplayThreshold_default = false;
const storage_optionDisplayThreshold = 'deboucled_optionDisplayThreshold', storage_optionDisplayThreshold_default = 100;
const storage_optionDisplayBlacklistTopicButton = 'deboucled_optionDisplayBlacklistTopicButton', storage_optionDisplayBlacklistTopicButton_default = true;
const storage_optionShowJvcBlacklistButton = 'deboucled_optionShowJvcBlacklistButton', storage_optionShowJvcBlacklistButton_default = false;
const storage_optionFilterResearch = 'deboucled_optionFilterResearch', storage_optionFilterResearch_default = true;
const storage_optionDetectPocMode = 'deboucled_optionDetectPocMode', storage_optionDetectPocMode_default = 0;
const storage_optionPrevisualizeTopic = 'deboucled_optionPrevisualizeTopic', storage_optionPrevisualizeTopic_default = true;
const storage_optionDisplayBlackTopic = 'deboucled_optionDisplayBlackTopic', storage_optionDisplayBlackTopic_default = true;
const storage_optionDisplayTopicCharts = 'deboucled_optionDisplayTopicCharts', storage_optionDisplayTopicCharts_default = true;
const storage_optionDisplayTopicMatches = 'deboucled_optionDisplayTopicMatches', storage_optionDisplayTopicMatches_default = true;
const storage_optionClickToShowTopicMatches = 'deboucled_optionClickToShowTopicMatches', storage_optionClickToShowTopicMatches_default = false;
const storage_optionRemoveUselessTags = 'deboucled_optionRemoveUselessTags', storage_optionRemoveUselessTags_default = false;
const storage_optionMaxTopicCount = 'deboucled_optionMaxTopicCount', storage_optionMaxTopicCount_default = defaultTopicCount;
const storage_optionAntiVinz = 'deboucled_optionAntiVinz', storage_optionAntiVinz_default = true;
const storage_optionBlAuthorIgnoreMp = 'deboucled_optionBlAuthorIgnoreMp', storage_optionBlAuthorIgnoreMp_default = false;
const storage_optionBlSubjectIgnoreMessages = 'deboucled_optionBlSubjectIgnoreMessages', storage_optionBlSubjectIgnoreMessages_default = false;
const storage_optionEnableTopicMsgCountThreshold = 'deboucled_optionEnableTopicMsgCountThreshold', storage_optionEnableTopicMsgCountThreshold_default = false;
const storage_optionTopicMsgCountThreshold = 'deboucled_optionTopicMsgCountThreshold', storage_optionTopicMsgCountThreshold_default = 10;
const storage_optionReplaceResolvedPicto = 'deboucled_optionReplaceResolvedPicto', storage_optionReplaceResolvedPicto_default = false;
const storage_optionDisplayTopicIgnoredCount = 'deboucled_optionDisplayTopicIgnoredCount', storage_optionDisplayTopicIgnoredCount_default = true;
const storage_optionEnhanceQuotations = 'deboucled_optionEnhanceQuotations', storage_optionEnhanceQuotations_default = true;
const storage_optionAntiSpam = 'deboucled_optionAntiSpam', storage_optionAntiSpam_default = true;
const storage_optionSmoothScroll = 'deboucled_optionSmoothScroll', storage_optionSmoothScroll_default = false;
const storage_optionAntiLoopAiMode = 'deboucled_optionAntiLoopAiMode', storage_optionAntiLoopAiMode_default = 1;

const storage_disabledFilteringForums = 'deboucled_disabledFilteringForums', storage_disabledFilteringForums_default = '[]';

const storage_totalHiddenTopicIds = 'deboucled_totalHiddenTopicIds';
const storage_totalHiddenSubjects = 'deboucled_totalHiddenSubjects';
const storage_totalHiddenAuthors = 'deboucled_totalHiddenAuthors';
const storage_totalHiddenMessages = 'deboucled_totalHiddenMessages';
const storage_totalHiddenPrivateMessages = 'deboucled_totalHiddenPrivateMessages';
const storage_totalHiddenSpammers = 'deboucled_totalHiddenSpammers';
const storage_TopicStats = 'deboucled_TopicStats';

const storage_lastUpdateCheck = 'deboucled_lastUpdateCheck';
const storage_lastUpdateDeferredCheck = 'deboucled_lastUpdateDeferredCheck';
const storage_youtubeBlacklist = 'deboucled_youtubeBlacklist', storage_youtubeBlacklist_default = '[]';
const storage_youtubeBlacklistLastUpdate = 'deboucled_youtubeBlacklistLastUpdate';
const storage_preBouclesData = 'deboucled_preBouclesData', storage_preBouclesData_default = '[]';
const storage_prebouclesLastUpdate = 'deboucled_prebouclesLastUpdate';
const storage_aiLoopsData = 'deboucled_aiLoopsData', storage_aiLoopsData_default = '[]';
const storage_aiLoopsLastUpdate = 'deboucled_aiLoopsLastUpdate';
const storage_lastUpdateUser = 'deboucled_lastUpdateUser';
const storage_DiagnosticLastUpdate = 'deboucled_DiagnosticLastUpdate';

const storage_Keys = [storage_init, storage_lastUsedPseudo, storage_preBoucles, storage_blacklistedTopicIds, storage_blacklistedSubjects, storage_blacklistedAuthors, storage_blacklistedShadows, storage_whitelistedTopicIds, storage_optionEnableJvcDarkTheme, storage_optionEnableJvRespawnRefinedTheme, storage_optionEnableDeboucledDarkTheme, storage_optionBoucledUseJvarchive, storage_optionHideMessages, storage_optionAllowDisplayThreshold, storage_optionDisplayThreshold, storage_optionDisplayBlacklistTopicButton, storage_optionShowJvcBlacklistButton, storage_optionFilterResearch, storage_optionDetectPocMode, storage_optionPrevisualizeTopic, storage_optionDisplayBlackTopic, storage_optionDisplayTopicCharts, storage_optionDisplayTopicMatches, storage_optionClickToShowTopicMatches, storage_optionRemoveUselessTags, storage_optionMaxTopicCount, storage_optionAntiVinz, storage_optionBlAuthorIgnoreMp, storage_optionBlSubjectIgnoreMessages, storage_optionEnableTopicMsgCountThreshold, storage_optionTopicMsgCountThreshold, storage_optionReplaceResolvedPicto, storage_optionDisplayTopicIgnoredCount, storage_optionEnhanceQuotations, storage_optionAntiSpam, storage_optionSmoothScroll, storage_optionAntiLoopAiMode, storage_disabledFilteringForums, storage_totalHiddenTopicIds, storage_totalHiddenSubjects, storage_totalHiddenAuthors, storage_totalHiddenMessages, storage_totalHiddenPrivateMessages, storage_totalHiddenSpammers, storage_TopicStats];

const storage_excluded_user_Keys = [storage_TopicStats];

const storage_Keys_Blacklists = [storage_blacklistedTopicIds, storage_blacklistedSubjects, storage_blacklistedAuthors, storage_blacklistedShadows];


function getBlacklistWithKey(key) {
    switch (key) {
        case storage_blacklistedTopicIds:
            return topicIdBlacklistMap;
        case storage_blacklistedSubjects:
            return subjectBlacklistArray;
        case storage_blacklistedAuthors:
            return authorBlacklistArray;
        case storage_blacklistedShadows:
            return shadowent;
    }
    return null;
}

function initUserId() {
    userId = GM_getValue(storage_userId, storage_userId_default);
    if (!userId?.length) {
        userId = getUUIDv4();
        GM_setValue(storage_userId, userId);
    }
}

async function initStorage() {
    initUserId();
    initVinzBoucles();
    //initShadowent();

    let isInit = GM_getValue(storage_init, storage_init_default);
    if (isInit) {
        await loadStorage();
        return false;
    }
    else {
        await refreshApiData();
        await saveStorage();
        GM_setValue(storage_init, true);
        return true;
    }
}

async function loadStorage() {
    await refreshApiData();

    subjectBlacklistArray = [...new Set(JSON.parse(GM_getValue(storage_blacklistedSubjects, storage_blacklistedSubjects_default)))];
    authorBlacklistArray = [...new Set(JSON.parse(GM_getValue(storage_blacklistedAuthors, storage_blacklistedAuthors_default)))];
    topicIdBlacklistMap = new Map([...JSON.parse(GM_getValue(storage_blacklistedTopicIds, storage_blacklistedTopicIds_default))]);

    shadowent = [...new Set(JSON.parse(GM_getValue(storage_blacklistedShadows, storage_blacklistedShadows_default)))];

    buildBlacklistsRegex();

    let topicStats = GM_getValue(storage_TopicStats);
    if (topicStats) deboucledTopicStatsMap = new Map([...JSON.parse(topicStats)]);

    topicIdWhitelistArray = [...new Set(JSON.parse(GM_getValue(storage_whitelistedTopicIds, storage_whitelistedTopicIds_default)))];

    disabledFilteringForumSet = new Set(JSON.parse(GM_getValue(storage_disabledFilteringForums, storage_disabledFilteringForums_default)));

    await loadLocalStorage();
}

async function saveStorage() {
    GM_setValue(storage_blacklistedSubjects, JSON.stringify([...new Set(subjectBlacklistArray)]));
    GM_setValue(storage_blacklistedAuthors, JSON.stringify([...new Set(authorBlacklistArray)]));
    GM_setValue(storage_blacklistedTopicIds, JSON.stringify([...topicIdBlacklistMap]));

    GM_setValue(storage_blacklistedShadows, JSON.stringify([...new Set(shadowent)]));

    GM_setValue(storage_whitelistedTopicIds, JSON.stringify([...new Set(topicIdWhitelistArray)]));

    GM_setValue(storage_disabledFilteringForums, JSON.stringify([...disabledFilteringForumSet]));

    savePreBouclesStatuses();

    await saveLocalStorage();

    refreshEntityCounts();
}

async function loadLocalStorage() {
    //let optionDetectPocMode = GM_getValue(storage_optionDetectPocMode, storage_optionDetectPocMode_default);
    //if (optionDetectPocMode === 0) return;

    let storagePocTopics;
    let storageTopicAuthors;

    /* eslint-disable no-undef */
    if (localforage) {
        storagePocTopics = await localforage.getItem(localstorage_pocTopics);
        storageTopicAuthors = await localforage.getItem(localstorage_topicAuthors);
    }
    else {
        storagePocTopics = GM_getValue(localstorage_pocTopics, '[]');
        storageTopicAuthors = GM_getValue(localstorage_topicAuthors, '[]');
    }
    /* eslint-enable no-undef */

    if (storagePocTopics) pocTopicMap = new Map([...JSON.parse(storagePocTopics)]);
    if (storageTopicAuthors) topicAuthorMap = new Map([...JSON.parse(storageTopicAuthors)]);
}

async function saveLocalStorage() {
    //let optionDetectPocMode = GM_getValue(storage_optionDetectPocMode, storage_optionDetectPocMode_default);
    //if (optionDetectPocMode === 0) return;

    /* eslint-disable no-undef */
    if (localforage) {
        await localforage.setItem(localstorage_pocTopics, JSON.stringify([...pocTopicMap]));
        await localforage.setItem(localstorage_topicAuthors, JSON.stringify([...topicAuthorMap]));
    }
    else {
        GM_setValue(localstorage_pocTopics, JSON.stringify([...pocTopicMap]));
        GM_setValue(localstorage_topicAuthors, JSON.stringify([...topicAuthorMap]));
    }
    /* eslint-enable no-undef */
}

async function refreshApiData(forceUpdate = false) {
    youtubeBlacklistArray = JSON.parse(GM_getValue(storage_youtubeBlacklist, storage_youtubeBlacklist_default));
    if (!youtubeBlacklistArray?.length || forceUpdate
        || mustRefresh(storage_youtubeBlacklistLastUpdate, youtubeBlacklistRefreshExpire)) {
        await queryYoutubeBlacklist();
    }
    if (youtubeBlacklistArray?.length) youtubeBlacklistReg = buildArrayRegex(youtubeBlacklistArray);


    preBoucleArray = JSON.parse(GM_getValue(storage_preBouclesData, storage_preBouclesData_default));
    if (!preBoucleArray?.length || forceUpdate
        || mustRefresh(storage_prebouclesLastUpdate, prebouclesRefreshExpire)) {
        await queryPreboucles();
    }
    if (preBoucleArray?.length) loadPreBouclesStatuses();


    aiLoopArray = JSON.parse(GM_getValue(storage_aiLoopsData, storage_aiLoopsData_default));
    if (!aiLoopArray?.length || forceUpdate
        || mustRefresh(storage_aiLoopsLastUpdate, aiLoopsRefreshExpire)) {
        await queryAiLoops();
    }
    if (aiLoopArray?.length) {
        aiLoopSubjectReg = buildEntityRegex(aiLoopArray.map(l => l.title), true);
        aiLoopAuthorReg = buildEntityRegex(aiLoopArray.map(l => l.author), false);
    }
}

function loadPreBouclesStatuses() {
    const gmPreBouclesStatus = GM_getValue(storage_preBoucles, storage_preBoucles_default);
    if (!gmPreBouclesStatus) return;
    let preBouclesStatuses = [...JSON.parse(GM_getValue(storage_preBoucles, storage_preBoucles_default))];
    if (preBouclesStatuses.length === 0) return;
    preBouclesStatuses.forEach(pbs => {
        togglePreBoucleStatus(pbs[0], pbs[1]);
    });
}

function togglePreBoucleStatus(id, enabled) {
    let preBoucle = preBoucleArray.find(pb => pb.id === id);
    if (!preBoucle) return;
    preBoucle.enabled = enabled;
}

function savePreBouclesStatuses() {
    let preBouclesStatuses = preBoucleArray.map(pb => [pb.id, pb.enabled]);
    GM_setValue(storage_preBoucles, JSON.stringify(preBouclesStatuses));
}

async function addEntityBlacklist(array, key) {
    if (array.indexOf(key) === -1) {
        array.push(key);
        await saveStorage();
    }
}

async function removeEntityBlacklist(array, key) {
    let index = array.indexOf(key);
    if (index > -1) {
        array.splice(index, 1);
        await saveStorage();
    }
}

async function removeTopicIdBlacklist(topicId) {
    if (topicIdBlacklistMap.has(topicId)) {
        topicIdBlacklistMap.delete(topicId);
        await saveStorage();
    }
}

function incrementTotalHidden(settingKey, value) {
    let currentValue = parseInt(GM_getValue(settingKey, '0'));
    GM_setValue(settingKey, currentValue + value);
}

function saveTotalHidden() {
    incrementTotalHidden(storage_totalHiddenTopicIds, hiddenTopicsIds);
    incrementTotalHidden(storage_totalHiddenSubjects, hiddenSubjects);
    incrementTotalHidden(storage_totalHiddenAuthors, hiddenAuthors);
    incrementTotalHidden(storage_totalHiddenMessages, hiddenMessages);
    incrementTotalHidden(storage_totalHiddenPrivateMessages, hiddenPrivateMessages);
    incrementTotalHidden(storage_totalHiddenSpammers, hiddenSpammers);
}

function getStorageJson(onlyBlacklists = false, excludedKeys = undefined) {
    let map = new Map();
    GM_listValues().forEach(key => {
        if (onlyBlacklists && !storage_Keys_Blacklists.includes(key)) return;
        if (!storage_Keys.includes(key)) return;
        if (excludedKeys?.includes(key)) return;
        const val = GM_getValue(key);
        try {
            map.set(key, JSON.parse(val));
        } catch {
            map.set(key, val);
        }
    });
    const json = JSON.stringify(Object.fromEntries(map));
    return json;
}

function backupStorage() {
    function blobToFile(blob, fileName) {
        let file = new File([blob], fileName);
        file.lastModifiedDate = new Date();
        file.name = fileName;
        return file;
    }
    const onlyBlacklists = document.querySelector('#deboucled-impexp-blonly').checked;
    const json = getStorageJson(onlyBlacklists);
    var file = blobToFile(new Blob([json], { type: 'application/json' }), 'deboucled');
    var anchor = document.createElement('a');
    anchor.download = 'deboucled-settings.json';
    anchor.href = window.URL.createObjectURL(file);
    anchor.style.display = 'none';
    anchor.click();
}

function restoreStorage(fileContent) {
    const onlyBlacklists = document.querySelector('#deboucled-impexp-blonly').checked;
    const mergeBlacklists = document.querySelector('#deboucled-impexp-mergebl').checked;

    // On parse le JSON du fichier pour en faire un objet
    let settingsObj = JSON.parse(fileContent);

    // On parcours les clés/valeurs
    for (const [key, value] of Object.entries(settingsObj)) {
        // Si une clé est inconnue on ignore
        if (!storage_Keys.includes(key)) continue;

        // Si on importe uniquement les blacklists
        if (onlyBlacklists && !storage_Keys_Blacklists.includes(key)) continue;

        // Type object = array/map donc il faut déserialiser
        if (typeof (value) === 'object') {
            let newValue = value;
            // On merge les blacklists si besoin
            if (storage_Keys_Blacklists.includes(key) && mergeBlacklists) {
                let currentList = getBlacklistWithKey(key);
                newValue = [...mergeArrays(currentList, value)];
            }
            GM_setValue(key, JSON.stringify(newValue));
        }
        else {
            // Valeur normale (boolean/string/int/etc)
            GM_setValue(key, value);
        }
    }

    showRestoreCompleted()
}

function showRestoreCompleted() {
    document.querySelectorAll('#deboucled-impexp-message').forEach(function (e) {
        setTimeout(() => { e.classList.toggle('active'); }, 5000);
        e.classList.toggle('active');
    });
}

function loadFile(fileEvent) {
    var file = fileEvent.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function (e) {
        let content = e.target.result;
        restoreStorage(content);
    };
    reader.readAsText(file);
}

async function importFromTotalBlacklist() {
    var blacklistFromTbl = localStorage.getItem('blacklisted');
    if (!blacklistFromTbl) {
        alert('Aucune blacklist détectée dans TotalBlacklist.');
        return;
    }
    const blacklistFromTblArray = JSON.parse(blacklistFromTbl).filter(function (val) { return val !== 'forums' });
    authorBlacklistArray = [...new Set(authorBlacklistArray.concat(blacklistFromTblArray))];
    await saveStorage()
    buildBlacklistsRegex();
    refreshAuthorKeys();
    showRestoreCompleted();
    alert(`${blacklistFromTblArray.length} pseudos TotalBlacklist ont été importés dans Déboucled avec succès.`);
}

function buildBlacklistsRegex(entityOption = 'both') {
    if (entityOption === 'both' || entityOption === entitySubject) {
        let preBoucleEnabledSubjects = [];
        preBoucleArray.filter(pb => pb.enabled && pb.type === entitySubject)
            .forEach(pb => { preBoucleEnabledSubjects = preBoucleEnabledSubjects.concat(pb.entities); });

        const mergedSubjectBlacklistArray = [...new Set([...preBoucleEnabledSubjects, ...subjectBlacklistArray])];
        subjectsBlacklistReg = buildEntityRegex(mergedSubjectBlacklistArray, true);
    }

    if (entityOption === 'both' || entityOption === entityAuthor) {
        let preBoucleEnabledAuthors = [];
        preBoucleArray.filter(pb => pb.enabled && pb.type === entityAuthor)
            .forEach(pb => { preBoucleEnabledAuthors = preBoucleEnabledAuthors.concat(pb.entities); });

        const mergedAuthorBlacklistArray = [...new Set([...preBoucleEnabledAuthors, ...authorBlacklistArray, ...shadowent])];
        authorsBlacklistReg = buildEntityRegex(mergedAuthorBlacklistArray, false);
    }
}

