
///////////////////////////////////////////////////////////////////////////////////////
// STORAGE
///////////////////////////////////////////////////////////////////////////////////////

const store = new GMStorage(); // eslint-disable-line no-undef

const localstorage_pocTopics = 'deboucled_pocTopics';
const localstorage_topicAuthors = 'deboucled_topicAuthors';
const localstorage_authorAvatars = 'deboucled_topicAuthorAvatars';

const storage_init = 'deboucled_init', storage_init_default = false;
const storage_secret_displayed = 'deboucled_secret_displayed', storage_secret_displayed_default = false;
const storage_announcement_displayed = 'deboucled_announcement2_displayed', storage_announcement_displayed_default = false;
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
const storage_optionDisplayHotTopics = 'deboucled_optionDisplayHotTopics', storage_optionDisplayHotTopics_default = true;
const storage_optionHideLongMessages = 'deboucled_optionHideLongMessages', storage_optionHideLongMessages_default = false;
const storage_optionDisplayTitleSmileys = 'deboucled_optionDisplayTitleSmileys', storage_optionDisplayTitleSmileys_default = true;
const storage_optionDisplayTopicAvatar = 'deboucled_optionDisplayTopicAvatar', storage_optionDisplayTopicAvatar_default = false;
const storage_optionJvFluxEmbedded = 'deboucled_optionJvFluxEmbedded', storage_optionJvFluxEmbedded_default = false;
const storage_optionHideAvatarBorder = 'deboucled_optionHideAvatarBorder', storage_optionHideAvatarBorder_default = false;

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
const storage_aiLoopsData = 'deboucled_aiLoopsData', storage_aiLoopsData_default = '{}';
const storage_aiLoopsLastUpdate = 'deboucled_aiLoopsLastUpdate';
const storage_lastUpdateUser = 'deboucled_lastUpdateUser';
const storage_DiagnosticLastUpdate = 'deboucled_DiagnosticLastUpdate';
const storage_hotTopicsData = 'deboucled_hotTopicsData', storage_hotTopicsData_default = '[]';
const storage_hotTopicsLastUpdate = 'deboucled_hotTopicsLastUpdate';

const storage_Keys = [storage_init, storage_lastUsedPseudo, storage_preBoucles, storage_blacklistedTopicIds, storage_blacklistedSubjects, storage_blacklistedAuthors, storage_blacklistedShadows, storage_whitelistedTopicIds, storage_optionEnableJvcDarkTheme, storage_optionEnableJvRespawnRefinedTheme, storage_optionEnableDeboucledDarkTheme, storage_optionBoucledUseJvarchive, storage_optionHideMessages, storage_optionAllowDisplayThreshold, storage_optionDisplayThreshold, storage_optionDisplayBlacklistTopicButton, storage_optionShowJvcBlacklistButton, storage_optionFilterResearch, storage_optionDetectPocMode, storage_optionPrevisualizeTopic, storage_optionDisplayBlackTopic, storage_optionDisplayTopicCharts, storage_optionDisplayTopicMatches, storage_optionClickToShowTopicMatches, storage_optionRemoveUselessTags, storage_optionMaxTopicCount, storage_optionAntiVinz, storage_optionBlAuthorIgnoreMp, storage_optionBlSubjectIgnoreMessages, storage_optionEnableTopicMsgCountThreshold, storage_optionTopicMsgCountThreshold, storage_optionReplaceResolvedPicto, storage_optionDisplayTopicIgnoredCount, storage_optionEnhanceQuotations, storage_optionAntiSpam, storage_optionSmoothScroll, storage_optionAntiLoopAiMode, storage_optionDisplayHotTopics, storage_optionHideLongMessages, storage_optionDisplayTitleSmileys, storage_optionDisplayTopicAvatar, storage_optionJvFluxEmbedded, storage_optionHideAvatarBorder, storage_disabledFilteringForums, storage_totalHiddenTopicIds, storage_totalHiddenSubjects, storage_totalHiddenAuthors, storage_totalHiddenMessages, storage_totalHiddenPrivateMessages, storage_totalHiddenSpammers, storage_TopicStats];

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
    userId = store.get(storage_userId, storage_userId_default);
    if (!userId?.length) {
        userId = getUUIDv4();
        store.set(storage_userId, userId);
    }
}

async function initStorage() {
    initUserId();
    initVinzBoucles();
    //initShadowent();
    initSmileyGifMap();

    firstLaunch = !store.get(storage_init, storage_init_default);
    if (firstLaunch) {
        await refreshApiData();
        await saveStorage();
        store.set(storage_init, true);
    }
    else {
        await loadStorage();
    }
}

async function loadStorage() {
    await refreshApiData();

    subjectBlacklistArray = [...new Set(JSON.parse(store.get(storage_blacklistedSubjects, storage_blacklistedSubjects_default)))];
    authorBlacklistArray = [...new Set(JSON.parse(store.get(storage_blacklistedAuthors, storage_blacklistedAuthors_default)))];
    topicIdBlacklistMap = new Map([...JSON.parse(store.get(storage_blacklistedTopicIds, storage_blacklistedTopicIds_default))]);

    shadowent = [...new Set(JSON.parse(store.get(storage_blacklistedShadows, storage_blacklistedShadows_default)))];

    buildBlacklistsRegex();

    let topicStats = store.get(storage_TopicStats);
    if (topicStats) deboucledTopicStatsMap = new Map([...JSON.parse(topicStats)]);

    topicIdWhitelistArray = [...new Set(JSON.parse(store.get(storage_whitelistedTopicIds, storage_whitelistedTopicIds_default)))];

    disabledFilteringForumSet = new Set(JSON.parse(store.get(storage_disabledFilteringForums, storage_disabledFilteringForums_default)));

    await loadLocalStorage();
}

async function saveStorage() {
    store.set(storage_blacklistedSubjects, JSON.stringify([...new Set(subjectBlacklistArray)]));
    store.set(storage_blacklistedAuthors, JSON.stringify([...new Set(authorBlacklistArray)]));
    store.set(storage_blacklistedTopicIds, JSON.stringify([...topicIdBlacklistMap]));

    store.set(storage_blacklistedShadows, JSON.stringify([...new Set(shadowent)]));

    store.set(storage_whitelistedTopicIds, JSON.stringify([...new Set(topicIdWhitelistArray)]));

    store.set(storage_disabledFilteringForums, JSON.stringify([...disabledFilteringForumSet]));

    savePreBouclesStatuses();

    await saveLocalStorage();

    refreshEntityCounts();
}

async function loadLocalStorage() {
    //let optionDetectPocMode = store.get(storage_optionDetectPocMode, storage_optionDetectPocMode_default);
    //if (optionDetectPocMode === 0) return;

    let storagePocTopics;
    let storageTopicAuthors;
    let storageAuthorAvatars;

    /* eslint-disable no-undef */
    if (typeof localforage !== 'undefined') {
        storagePocTopics = await localforage.getItem(localstorage_pocTopics);
        storageTopicAuthors = await localforage.getItem(localstorage_topicAuthors);
        storageAuthorAvatars = await localforage.getItem(localstorage_authorAvatars);
    }
    else {
        storagePocTopics = store.get(localstorage_pocTopics, '[]');
        storageTopicAuthors = store.get(localstorage_topicAuthors, '[]');
        storageAuthorAvatars = store.get(localstorage_authorAvatars, '[]');
    }
    /* eslint-enable no-undef */

    if (storagePocTopics) pocTopicMap = new Map([...JSON.parse(storagePocTopics)]);
    if (storageTopicAuthors) topicAuthorMap = new Map([...JSON.parse(storageTopicAuthors)]);
    if (storageAuthorAvatars) authorAvatarMap = new Map([...JSON.parse(storageAuthorAvatars)]);
}

async function saveLocalStorage() {
    //let optionDetectPocMode = store.get(storage_optionDetectPocMode, storage_optionDetectPocMode_default);
    //if (optionDetectPocMode === 0) return;

    /* eslint-disable no-undef */
    if (typeof localforage !== 'undefined') {
        await localforage.setItem(localstorage_pocTopics, JSON.stringify([...pocTopicMap]));
        await localforage.setItem(localstorage_topicAuthors, JSON.stringify([...topicAuthorMap]));
        await localforage.setItem(localstorage_authorAvatars, JSON.stringify([...authorAvatarMap]));
    }
    else {
        store.set(localstorage_pocTopics, JSON.stringify([...pocTopicMap]));
        store.set(localstorage_topicAuthors, JSON.stringify([...topicAuthorMap]));
        store.set(localstorage_authorAvatars, JSON.stringify([...authorAvatarMap]));
    }
    /* eslint-enable no-undef */
}

async function refreshApiData(forceUpdate = false) {
    await parsePreboucleData(forceUpdate);
    await parseYoutubeBlacklistData(forceUpdate);
    await parseAiLoopData(forceUpdate);
}

function loadPreBouclesStatuses() {
    const gmPreBouclesStatus = store.get(storage_preBoucles, storage_preBoucles_default);
    if (!gmPreBouclesStatus) return;
    let preBouclesStatuses = [...JSON.parse(store.get(storage_preBoucles, storage_preBoucles_default))];
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
    store.set(storage_preBoucles, JSON.stringify(preBouclesStatuses));
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
    let currentValue = parseInt(store.get(settingKey, '0'));
    store.set(settingKey, currentValue + value);
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
    store.forEach((val, key) => {
        if (onlyBlacklists && !storage_Keys_Blacklists.includes(key)) return;
        if (!storage_Keys.includes(key)) return;
        if (excludedKeys?.includes(key)) return;
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
    let file = blobToFile(new Blob([json], { type: 'application/json' }), 'deboucled');
    let anchor = document.createElement('a');
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
            store.set(key, JSON.stringify(newValue));
        }
        else {
            // Valeur normale (boolean/string/int/etc)
            store.set(key, value);
        }
    }

    showRestoreCompleted();
}

function showRestoreCompleted() {
    document.querySelectorAll('#deboucled-impexp-message').forEach(function (e) {
        setTimeout(() => { e.classList.toggle('active'); }, 5000);
        e.classList.toggle('active');
    });
}

function loadFile(fileEvent) {
    let file = fileEvent.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function (e) {
        let content = e.target.result;
        restoreStorage(content);
    };
    reader.readAsText(file);
}

async function importFromTotalBlacklist() {
    let blacklistFromTbl = localStorage.getItem('blacklisted');
    if (!blacklistFromTbl) {
        alert('Aucune blacklist détectée dans TotalBlacklist.');
        return;
    }
    const blacklistFromTblArray = JSON.parse(blacklistFromTbl).filter(function (val) { return val !== 'forums' });
    authorBlacklistArray = [...new Set(authorBlacklistArray.concat(blacklistFromTblArray))];
    await saveStorage();
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

