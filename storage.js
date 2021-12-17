
///////////////////////////////////////////////////////////////////////////////////////
// STORAGE
///////////////////////////////////////////////////////////////////////////////////////

const localstorage_pocTopics = 'deboucled_pocTopics';

const storage_init = 'deboucled_init', storage_init_default = false;
const storage_preBoucles = 'deboucled_preBoucles', storage_preBoucles_default = '[]';
const storage_blacklistedTopicIds = 'deboucled_blacklistedTopicIds', storage_blacklistedTopicIds_default = '[]';
const storage_blacklistedSubjects = 'deboucled_blacklistedSubjects', storage_blacklistedSubjects_default = '[]';
const storage_blacklistedAuthors = 'deboucled_blacklistedAuthors', storage_blacklistedAuthors_default = '[]';
const storage_optionEnableJvcDarkTheme = 'deboucled_optionEnableJvcDarkTheme', storage_optionEnableJvcDarkTheme_default = false;
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

const storage_totalHiddenTopicIds = 'deboucled_totalHiddenTopicIds';
const storage_totalHiddenSubjects = 'deboucled_totalHiddenSubjects';
const storage_totalHiddenAuthors = 'deboucled_totalHiddenAuthors';
const storage_totalHiddenMessages = 'deboucled_totalHiddenMessages';
const storage_totalHiddenPrivateMessages = 'deboucled_totalHiddenPrivateMessages';
const storage_TopicStats = 'deboucled_TopicStats';

const storage_Keys = [storage_init, storage_preBoucles, storage_blacklistedTopicIds, storage_blacklistedSubjects, storage_blacklistedAuthors, storage_optionEnableJvcDarkTheme, storage_optionEnableDeboucledDarkTheme, storage_optionBoucledUseJvarchive, storage_optionHideMessages, storage_optionAllowDisplayThreshold, storage_optionDisplayThreshold, storage_optionDisplayBlacklistTopicButton, storage_optionShowJvcBlacklistButton, storage_optionFilterResearch, storage_optionDetectPocMode, storage_optionPrevisualizeTopic, storage_optionDisplayBlackTopic, storage_optionDisplayTopicCharts, storage_optionDisplayTopicMatches, storage_optionClickToShowTopicMatches, storage_optionRemoveUselessTags, storage_optionMaxTopicCount, storage_optionAntiVinz, storage_optionBlAuthorIgnoreMp, storage_optionBlSubjectIgnoreMessages, storage_optionEnableTopicMsgCountThreshold, storage_optionTopicMsgCountThreshold, storage_optionReplaceResolvedPicto, storage_totalHiddenTopicIds, storage_totalHiddenSubjects, storage_totalHiddenAuthors, storage_totalHiddenMessages, storage_totalHiddenPrivateMessages, storage_TopicStats];

const storage_Keys_Blacklists = [storage_blacklistedTopicIds, storage_blacklistedSubjects, storage_blacklistedAuthors];


function getBlacklistWithKey(key) {
    switch (key) {
        case storage_blacklistedTopicIds:
            return topicIdBlacklistMap;
        case storage_blacklistedSubjects:
            return subjectBlacklistArray;
        case storage_blacklistedAuthors:
            return authorBlacklistArray;
    }
    return null;
}

async function initStorage() {
    initPreBoucles();
    initVinzBoucles();

    let isInit = GM_getValue(storage_init, storage_init_default);
    if (isInit) {
        await loadStorage();
        return false;
    }
    else {
        await saveStorage();
        GM_setValue(storage_init, true);
        return true;
    }
}

async function loadStorage() {
    subjectBlacklistArray = [...new Set(JSON.parse(GM_getValue(storage_blacklistedSubjects, storage_blacklistedSubjects_default)))];
    authorBlacklistArray = [...new Set(JSON.parse(GM_getValue(storage_blacklistedAuthors, storage_blacklistedAuthors_default)))];
    topicIdBlacklistMap = new Map([...JSON.parse(GM_getValue(storage_blacklistedTopicIds, storage_blacklistedTopicIds_default))]);

    buildBlacklistsRegex();

    let topicStats = GM_getValue(storage_TopicStats);
    if (topicStats) deboucledTopicStatsMap = new Map([...JSON.parse(topicStats)]);

    await loadLocalStorage();
}

async function saveStorage() {
    GM_setValue(storage_blacklistedSubjects, JSON.stringify([...new Set(subjectBlacklistArray)]));
    GM_setValue(storage_blacklistedAuthors, JSON.stringify([...new Set(authorBlacklistArray)]));
    GM_setValue(storage_blacklistedTopicIds, JSON.stringify([...topicIdBlacklistMap]));

    savePreBouclesStatuses();

    await saveLocalStorage();

    refreshEntityCounts();
}

async function loadLocalStorage() {
    let optionDetectPocMode = GM_getValue(storage_optionDetectPocMode, storage_optionDetectPocMode_default);
    if (optionDetectPocMode === 0) return;
    // eslint-disable-next-line no-undef
    const storagePocTopics = await localforage.getItem(localstorage_pocTopics);
    if (storagePocTopics) pocTopicMap = new Map([...JSON.parse(storagePocTopics)]);
}

async function saveLocalStorage() {
    let optionDetectPocMode = GM_getValue(storage_optionDetectPocMode, storage_optionDetectPocMode_default);
    if (optionDetectPocMode === 0) return;
    // eslint-disable-next-line no-undef
    await localforage.setItem(localstorage_pocTopics, JSON.stringify([...pocTopicMap]));
}

async function removeTopicIdBlacklist(topicId) {
    if (topicIdBlacklistMap.has(topicId)) {
        topicIdBlacklistMap.delete(topicId);
        await saveStorage();
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
}

function backupStorage() {
    function blobToFile(blob, fileName) {
        let file = new File([blob], fileName);
        file.lastModifiedDate = new Date();
        file.name = fileName;
        return file;
    }

    const onlyBlacklists = document.querySelector('#deboucled-impexp-blonly').checked;

    let map = new Map();
    GM_listValues().forEach(key => {
        if (onlyBlacklists && !storage_Keys_Blacklists.includes(key)) return;
        map.set(key, JSON.parse(GM_getValue(key)));
    });
    let json = JSON.stringify(Object.fromEntries(map));
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

function buildBlacklistsRegex() {
    let preBoucleSubjects = [];
    let preBoucleAuthors = [];
    preBoucleArray.filter(pb => pb.enabled && pb.type === entitySubject)
        .forEach(pb => { preBoucleSubjects = preBoucleSubjects.concat(pb.entities); });
    preBoucleArray.filter(pb => pb.enabled && pb.type === entityAuthor)
        .forEach(pb => { preBoucleAuthors = preBoucleAuthors.concat(pb.entities); });

    const mergedSubjectBlacklistArray = [...new Set([...preBoucleSubjects, ...subjectBlacklistArray])];
    const mergedAuthorBlacklistArray = [...new Set([...preBoucleAuthors, ...authorBlacklistArray])];

    subjectsBlacklistReg = buildRegex(mergedSubjectBlacklistArray, true);
    authorsBlacklistReg = buildRegex(mergedAuthorBlacklistArray, false);
}

