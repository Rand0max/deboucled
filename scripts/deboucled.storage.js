// ==UserScript==
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// ==/UserScript==

///////////////////////////////////////////////////////////////////////////////////////
// STORAGE
///////////////////////////////////////////////////////////////////////////////////////

async function initStorage() {
    let isInit = GM_getValue(storage_init, false);
    if (isInit) {
        await loadStorage();
        return false;
    }
    else {
        saveStorage();
        GM_setValue(storage_init, true);
        return true;
    }
}

async function loadStorage() {
    subjectBlacklistArray = [...new Set(subjectBlacklistArray.concat(JSON.parse(GM_getValue(storage_blacklistedSubjects))))];
    authorBlacklistArray = [...new Set(authorBlacklistArray.concat(JSON.parse(GM_getValue(storage_blacklistedAuthors))))];
    topicIdBlacklistMap = new Map([...topicIdBlacklistMap, ...JSON.parse(GM_getValue(storage_blacklistedTopicIds))]);

    subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
    authorsBlacklistReg = makeRegex(authorBlacklistArray, false);

    await loadLocalStorage();

    await saveStorage();
}

async function saveStorage() {
    GM_setValue(storage_blacklistedSubjects, JSON.stringify([...new Set(subjectBlacklistArray)]));
    GM_setValue(storage_blacklistedAuthors, JSON.stringify([...new Set(authorBlacklistArray)]));
    GM_setValue(storage_blacklistedTopicIds, JSON.stringify([...topicIdBlacklistMap]));

    subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
    authorsBlacklistReg = makeRegex(authorBlacklistArray, false);

    await saveLocalStorage();

    refreshEntityCounts();
}

async function loadLocalStorage() {
    const storagePocTopics = await localforage.getItem(localstorage_pocTopics);
    if (storagePocTopics) pocTopicMap = new Map([...pocTopicMap, ...JSON.parse(storagePocTopics)]);
}

async function saveLocalStorage() {
    await localforage.setItem(localstorage_pocTopics, JSON.stringify([...pocTopicMap]));
}

function removeTopicIdBlacklist(topicId) {
    if (topicIdBlacklistMap.has(topicId)) {
        topicIdBlacklistMap.delete(topicId);
        saveStorage();
    }
}

function addEntityBlacklist(array, key) {
    if (array.indexOf(key) === -1) {
        array.push(key);
        saveStorage();
    }
}

function removeEntityBlacklist(array, key) {
    let index = array.indexOf(key);
    if (index > -1) {
        array.splice(index, 1);
        saveStorage();
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
}

function backupStorage() {
    function blobToFile(blob, fileName) {
        let file = new File([blob], fileName);
        file.lastModifiedDate = new Date();
        file.name = fileName;
        return file;
    }

    let map = new Map();
    GM_listValues().forEach(key => { map.set(key, JSON.parse(GM_getValue(key))); });
    let json = JSON.stringify(Object.fromEntries(map));
    var file = blobToFile(new Blob([json], { type: 'application/json' }), 'deboucled');
    var anchor = document.createElement('a');
    anchor.download = 'deboucled-settings.json';
    anchor.href = window.URL.createObjectURL(file);
    anchor.style.display = 'none';
    anchor.click();
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

function restoreStorage(fileContent) {
    // On parse le JSON du fichier pour en faire un objet
    let settingsObj = JSON.parse(fileContent);

    // On parcours les clés/valeurs
    for (const [key, value] of Object.entries(settingsObj)) {
        // Si une clé est inconnue on ignore
        if (!storage_Keys.includes(key)) continue;

        // Type object = array/map donc il faut déserialiser
        if (typeof (value) === 'object') {
            GM_setValue(key, JSON.stringify(value));
        }
        else {
            // Valeur normale (boolean/string/int/etc)
            GM_setValue(key, value);
        }
    }

    let msg = document.getElementById('deboucled-impexp-message');
    setTimeout(() => { msg.classList.toggle('active'); }, 5000);
    msg.classList.toggle('active');
}
