///////////////////////////////////////////////////////////////////////////////////////
// SETTINGS
///////////////////////////////////////////////////////////////////////////////////////

function buildSettingPage() {
    let bgView = document.createElement('div');
    bgView.setAttribute("id", "deboucled-settings-bg-view");
    bgView.setAttribute("class", "deboucled-settings-bg-view");
    bgView.innerHTML = '<div></div>';
    document.body.prepend(bgView);
    document.getElementById('deboucled-settings-bg-view').style.display = 'none';

    function addStat(title, content) {
        let html = "";
        html += '<tr>';
        html += '<td style="text-align: right;">';
        html += `<span class="deboucled-stat-title">${title}</span>`;
        html += '</td>';
        html += '<td>';
        html += `<span class="deboucled-stat-value">${content}</span>`;
        html += '</td>';
        html += '</tr>';
        return html;
    }
    function addToggleOption(title, optionId, defaultValue, hint) {
        let html = "";
        html += '<tr>';
        html += `<td title="${hint}">${title}</td>`;
        html += '<td>';
        html += '<label class="deboucled-switch">';
        let checked = GM_getValue(optionId, defaultValue) ? 'checked' : '';
        html += `<input type="checkbox" id="${optionId}" ${checked}>`;
        html += '<span class="deboucled-toggle-slider round"></span>';
        html += '</label>';
        html += '</td>';
        html += '</tr>';
        return html;
    }
    function addRangeOption(title, optionId, defaultValue, minValue, maxValue, enabled, hint) {
        let html = "";
        html += `<tr id="${optionId}-container" class="${enabled ? '' : 'deboucled-disabled'}">`;
        html += `<td class="deboucled-option-cell deboucled-option-table-subcell" style="padding-left: 5px;" title="${hint}">${title}</td>`;
        html += '<td class="deboucled-option-cell deboucled-option-table-subcell" style="padding-top: 7px;">';
        let value = GM_getValue(optionId, defaultValue);
        html += `<input type="range" id="${optionId}" min="${minValue}" max="${maxValue}" value="${value}" step="10" class="deboucled-range-slider">`;
        html += '<td>';
        html += `<span id="${optionId}-value">${value}</span>`;
        html += '</td>';
        html += '</tr>';
        return html;
    }
    function addDropdownOption(title, optionId, hint, defaultValue, values) {
        let html = "";
        html += '<tr>';
        html += `<td title="${hint}" style="vertical-align: top;">${title}</td>`;
        html += '<td>';
        html += '<span class="deboucled-dropdown select">';
        html += `<select class="deboucled-dropdown" id="${optionId}">`;
        let selectedOption = GM_getValue(optionId, defaultValue);
        values.forEach(function (value, key) {
            let selected = selectedOption === key ? ' selected' : '';
            html += `<option class="deboucled-dropdown-option" value="${key}"${selected}>${value}</option>`;
        })
        html += '</select>';
        html += '</span>';
        html += '</td>';
        html += '</tr>';
        return html;
    }
    function addImportExportButtons() {
        let html = "";
        html += '<tr>';
        html += '<td>Restaurer/sauvegarder les préférences</td>';
        html += '<td>';
        html += `<label for="deboucled-import-button" class="btn btn-actu-new-list-forum deboucled-setting-button">Restaurer</label>`;
        html += `<input type="file" accept="application/JSON" id="deboucled-import-button" style="display: none;"></input>`;
        html += `<span id="deboucled-export-button" class="btn btn-actu-new-list-forum deboucled-setting-button">Sauvegarder</span>`;
        html += '</td>';
        html += '<td>';
        html += `<span id="deboucled-impexp-message" class="deboucled-setting-impexp-message">Restauration terminée ⚠ Veuillez rafraichir la page ⚠</span>`;
        html += '</td>';
        html += '</tr>';
        return html;
    }

    function addOptionsSection(sectionIsActive) {
        let html = "";
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">OPTIONS</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-options-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content" style="margin-bottom: 0;">';
        html += `<span class="deboucled-version">v${deboucledVersion}</span>`;
        html += '<table class="deboucled-option-table">';

        let spiral = '<span class="deboucled-svg-spiral-black"><svg width="16px" viewBox="0 2 24 24" id="deboucled-spiral-logo"><use href="#spirallogo"/></svg></span>';
        html += addToggleOption(`Utiliser <i>JvArchive</i> pour <i>Pseudo boucled</i> ${spiral}`, storage_optionBoucledUseJvarchive, false, 'Quand vous cliquez sur le bouton en spirale à côté du pseudo, un nouvel onglet sera ouvert avec la liste des topics soit avec JVC soit avec JvArchive.');

        html += addToggleOption('Cacher les messages des <span style="color: rgb(230, 0, 0)">pseudos blacklist</span>', storage_optionHideMessages, true, 'Permet de masquer complètement les messages d\'un pseudo dans les topics.');

        let forbidden = '<span class="deboucled-svg-forbidden-black"><svg viewBox="0 0 180 180" id="deboucled-forbidden-logo" class="deboucled-logo-forbidden"><use href="#forbiddenlogo"/></svg></span>';
        html += addToggleOption(`Afficher les boutons pour <i>Blacklist le topic</i> ${forbidden}`, storage_optionDisplayBlacklistTopicButton, true, 'Afficher ou non le bouton rouge à droite des sujets pour ignorer les topics voulu.');

        let blackTopic = '<span class="topic-img deboucled-topic-black-logo" style="display: inline-block; vertical-align: middle;"></span>'
        html += addToggleOption(`Afficher le pictogramme pour les <i>topics noirs</i> ${blackTopic}`, storage_optionDisplayBlackTopic, true, 'Afficher les topics de plus de 100 messages avec le pictogramme noir (en plus du jaune, rouge, résolu, épinglé etc).');

        let preview = '<span><svg width="16px" viewBox="0 0 30 30" id="deboucled-preview-logo"><use href="#previewlogo"/></svg></span>';
        html += addToggleOption(`Afficher les boutons pour avoir un <i>aperçu du topic</i> ${preview}`, storage_optionPrevisualizeTopic, true, 'Afficher ou non l\'icone \'loupe\' à côté du sujet pour prévisualiser le topic.');

        let blJvc = '<span class="picto-msg-tronche deboucled-blacklist-jvc-button" style="width: 13px;height: 13px;background-size: 13px;"></span>'
        html += addToggleOption(`Afficher le bouton <i>Blacklist pseudo</i> ${blJvc} de JVC`, storage_optionShowJvcBlacklistButton, false, 'Afficher ou non le bouton blacklist original de JVC à côté du nouveau bouton blacklist de Déboucled.');

        let poc = '<span class="deboucled-poc-logo"></span>'
        html += addDropdownOption(`Protection contre les <i>PoC</i> ${poc} <span style="opacity: 0.3;font-style: italic;font-size: xx-small;">(beta)</span>`,
            storage_optionDetectPocMode,
            'Protection contre les topics &quot;post ou cancer&quot; et les dérivés.\n• Désactivé : aucune protection\n• Mode simple (rapide) : recherche dans le message uniquement si le titre contient un indice\n• Mode approfondi (plus lent) : recherche systématiquement dans le message et le titre',
            0,
            ['Désactivé', 'Mode simple', 'Mode approfondi']);

        html += addToggleOption('Autoriser l\'affichage du topic à partir d\'un seuil', storage_optionAllowDisplayThreshold, false, 'Autoriser l\'affichage des topics même si le sujet est blacklist, à partir d\'un certain nombre de messages.');

        let allowDisplayThreshold = GM_getValue(storage_optionAllowDisplayThreshold, false);
        html += addRangeOption('Nombre de messages minimum', storage_optionDisplayThreshold, 100, 10, 1000, allowDisplayThreshold, 'Nombre de messages minimum dans le topic pour forcer l\'affichage.');

        html += addImportExportButtons();

        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addEntitySettingSection(entity, header, hint, sectionIsActive) {
        let html = "";
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">${header}</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-${entity}-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<table class="deboucled-option-table-entities">';
        html += '<tr>';
        html += '<td>';
        html += `<input type="text" id="deboucled-${entity}-input-key" class="deboucled-input-key" placeholder="${hint}" >`;
        html += `<span id="deboucled-${entity}-input-button" class="btn btn-actu-new-list-forum deboucled-add-button">Ajouter</span>`;
        html += `<input type="search" id="deboucled-${entity}-search-key" class="deboucled-input-search" style="float: right;" placeholder="Rechercher..." >`;
        html += '</td>';
        html += '</tr>';
        html += '<td style="padding-top: 12px;padding-bottom: 0;">';
        html += `<span id="deboucled-${entity}-entity-count" class="deboucled-entity-count"></span>`;
        html += '</td>';
        html += '<tr>';
        html += '<td colspan="2">';
        html += `<div id="deboucled-${entity}List" style="margin-top:10px;"></div>`;
        html += '</td>';
        html += '</tr>';
        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addStatsSection(sectionIsActive) {
        let html = "";
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">STATISTIQUES</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-options-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<table class="deboucled-option-table">';
        let totalHiddenSubjects = GM_getValue(storage_totalHiddenSubjects, '0');
        let totalHiddenAuthors = GM_getValue(storage_totalHiddenAuthors, '0');
        let totalHiddenTopicIds = GM_getValue(storage_totalHiddenTopicIds, '0');
        let totalHiddenMessages = GM_getValue(storage_totalHiddenMessages, '0');
        let totalHidden = parseInt(totalHiddenSubjects + totalHiddenAuthors + totalHiddenTopicIds + totalHiddenMessages);
        html += addStat('Sujets ignorés', totalHiddenSubjects);
        html += addStat('Pseudos ignorés', totalHiddenAuthors);
        html += addStat('Topics ignorés', totalHiddenTopicIds);
        html += addStat('Messages ignorés', totalHiddenMessages);
        html += addStat('Total ignorés', totalHidden);
        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }

    let settingsHtml = "";
    settingsHtml += addOptionsSection(false);
    settingsHtml += addEntitySettingSection(entitySubject, 'BLACKLIST SUJETS', 'Mot-clé', true);
    settingsHtml += addEntitySettingSection(entityAuthor, 'BLACKLIST AUTEURS', 'Pseudo', false);
    settingsHtml += addEntitySettingSection(entityTopicId, 'BLACKLIST TOPICS', 'TopicId', false);
    settingsHtml += addStatsSection(false);

    let settingsView = document.createElement('div');
    settingsView.setAttribute("id", "deboucled-settings-view");
    settingsView.setAttribute('class', 'deboucled-settings-view');
    settingsView.innerHTML = settingsHtml;
    document.body.prepend(settingsView);

    document.querySelector('.deboucled-version').onclick = function () { alert('En dépit des boucleurs --> ent :)'); };

    function addToggleEvent(id, callback = undefined) {
        const toggleSlider = document.getElementById(id);
        toggleSlider.addEventListener('change', (e) => {
            GM_setValue(id, e.currentTarget.checked);
            if (callback) callback();
        });
    }
    function addRangeEvent(id) {
        const rangeSlider = document.getElementById(id);
        rangeSlider.oninput = function () {
            GM_setValue(id, parseInt(this.value));
            document.getElementById(`${id}-value`).innerHTML = this.value;
        };
    }
    function addSelectEvent(id) {
        const select = document.getElementById(id);
        select.addEventListener('change', (e) => {
            GM_setValue(id, parseInt(e.currentTarget.value));
        });
    }

    addToggleEvent(storage_optionHideMessages);
    addToggleEvent(storage_optionBoucledUseJvarchive);
    addToggleEvent(storage_optionDisplayBlacklistTopicButton);
    addToggleEvent(storage_optionDisplayBlackTopic);
    addToggleEvent(storage_optionPrevisualizeTopic);
    addToggleEvent(storage_optionShowJvcBlacklistButton);
    addToggleEvent(storage_optionAllowDisplayThreshold, function () {
        document.querySelectorAll(`[id = ${storage_optionDisplayThreshold}-container]`).forEach(function (el) {
            el.classList.toggle("deboucled-disabled");
        })
    });
    addRangeEvent(storage_optionDisplayThreshold);
    addSelectEvent(storage_optionDetectPocMode);

    addImportExportEvent();

    addCollapsibleEvents();

    buildSettingEntities();

    refreshEntityCounts();
}

function addImportExportEvent() {
    document.getElementById('deboucled-export-button').addEventListener('click', backupStorage);
    document.getElementById('deboucled-import-button').addEventListener('change', loadFile);
}

function addCollapsibleEvents() {
    const activeClass = 'deboucled-collapsible-active';
    document.querySelectorAll('.deboucled-collapsible').forEach(function (el) {
        el.addEventListener('click', function () {
            // collapse every active panel
            document.querySelectorAll('.' + activeClass).forEach(function (activeEl) {
                if (activeEl === el) return;
                activeEl.classList.toggle(activeClass, false);
                var content = activeEl.nextElementSibling;
                content.removeAttribute('style');
            });

            // toggle current panel
            this.classList.toggle(activeClass);
            let content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.removeAttribute('style');
            }
            else {
                let view = document.getElementById('deboucled-settings-view');
                view.style.overflowY = 'scroll';
                content.style.maxHeight = content.scrollHeight + 'px';
                view.removeAttribute('style');
            }
        });
    });
}

function buildSettingEntities() {
    const regexAllowedSubject = /^[A-z0-9\u0020-\u007E\u00A1-\u02AF]*$/i;
    const regexAllowedAuthor = /^[A-z\u00C0-\u02AF0-9-_\[\]]*$/i;
    const regexAllowedTopicId = /^[0-9]+$/i;

    createAddEntityEvent(entitySubject, regexAllowedSubject, function (key) { addEntityBlacklist(subjectBlacklistArray, key); refreshSubjectKeys(); });
    createAddEntityEvent(entityAuthor, regexAllowedAuthor, function (key) { addEntityBlacklist(authorBlacklistArray, key); refreshAuthorKeys(); });
    createAddEntityEvent(entityTopicId, regexAllowedTopicId, function (key) { addTopicIdBlacklist(key, key, false); refreshTopicIdKeys(); });

    createSearchEntitiesEvent(entitySubject, regexAllowedSubject, refreshSubjectKeys);
    createSearchEntitiesEvent(entityAuthor, regexAllowedAuthor, refreshAuthorKeys);
    createSearchEntitiesEvent(entityTopicId, regexAllowedSubject, refreshTopicIdKeys); // On peut filter sur le titre du topic

    refreshSubjectKeys();
    refreshAuthorKeys();
    refreshTopicIdKeys();
}

function writeEntityKeys(entity, array, filter, removeCallback) {

    let entries = array;
    if (filter) {
        if (entries instanceof Array) {
            entries = entries.filter((value) => normalizeValue(value).includes(filter));
        }
        else if (entries instanceof Map) {
            entries = new Map([...entries].filter((value, key) => normalizeValue(value).includes(filter) || normalizeValue(key).includes(filter)));
        }
    }

    let html = '<ul class="deboucled-entity-list">';
    entries.forEach(function (value, key) {
        html += `<li class="key deboucled-entity-element" id="${key}"><input type="submit" class="deboucled-${entity}-button-delete-key" value="X">${value}</li>`;
    });
    document.getElementById(`deboucled-${entity}List`).innerHTML = html + '</ul>';

    document.querySelectorAll(`.deboucled-${entity}-button-delete-key`).forEach(input => input.addEventListener('click', function (e) {
        removeCallback(this.parentNode);
    }));
}

function refreshSubjectKeys(filter = null) {
    writeEntityKeys(entitySubject, subjectBlacklistArray, filter, function (node) {
        removeEntityBlacklist(subjectBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, ''));
        refreshSubjectKeys();
        refreshCollapsibleContentHeight(entitySubject);
        clearSearchInputs();
    });
}

function refreshAuthorKeys(filter = null) {
    writeEntityKeys(entityAuthor, authorBlacklistArray, filter, function (node) {
        removeEntityBlacklist(authorBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, ''));
        refreshAuthorKeys();
        refreshCollapsibleContentHeight(entityAuthor);
        clearSearchInputs();
    });
}

function refreshTopicIdKeys(filter = null) {
    writeEntityKeys(entityTopicId, topicIdBlacklistMap, filter, function (node) {
        removeTopicIdBlacklist(node.getAttribute('id').replace(/<[^>]*>/g, ''));
        refreshTopicIdKeys();
        refreshCollapsibleContentHeight(entityTopicId);
        clearSearchInputs();
    });
}

function keyIsAllowed(key, ctrlKey) {
    // Génial le JS qui gère même pas ça nativement :)
    if (key === 'Enter') return true;
    if (key === 'Backspace') return true;
    if (key === 'Delete') return true;
    if (key === 'Control') return true;
    if (key === 'Insert') return true;
    if (key === 'Alt') return true;
    if (key === 'AltGraph') return true;
    if (key === 'Shift') return true;
    if (key === 'CapsLock') return true;
    if (key === 'Home') return true;
    if (key === 'End') return true;
    if (key === 'ArrowLeft') return true;
    if (key === 'ArrowRight') return true;
    if (key === 'ArrowUp') return true;
    if (key === 'ArrowDown') return true;
    if (key === 'ArrowDown') return true;
    if (ctrlKey && (key === 'a' || key === 'c' || key === 'v' || key === 'x')) return true;
    return false;
}

function createAddEntityEvent(entity, keyRegex, addCallback) {
    function addEntity(entity, keyRegex, addCallback) {
        let input = document.getElementById(`deboucled-${entity}-input-key`);
        let key = input.value;
        if (key === '' || !key.match(keyRegex)) return;
        addCallback(key);
        input.value = '';
        refreshCollapsibleContentHeight(entity);
    }

    document.getElementById(`deboucled-${entity}-input-key`).addEventListener('keydown', function (event) {
        if (!keyIsAllowed(event.key, event.ctrlKey) && !event.key.match(keyRegex)) event.preventDefault();
        if (event.key !== "Enter") return;
        addEntity(entity, keyRegex, addCallback);
    });

    document.getElementById(`deboucled-${entity}-input-button`).addEventListener('click', function (e) {
        addEntity(entity, keyRegex, addCallback);
    });
}

function createSearchEntitiesEvent(entity, keyRegex, refreshCallback) {
    document.getElementById(`deboucled-${entity}-search-key`).addEventListener('keydown', function (event) {
        if (!keyIsAllowed(event.key, event.ctrlKey) && !event.key.match(keyRegex)) event.preventDefault();
    });
    document.getElementById(`deboucled-${entity}-search-key`).addEventListener('input', function (event) {
        refreshCallback(normalizeValue(event.target.value));
        refreshCollapsibleContentHeight(entity);
    });
}

function refreshEntityCounts() {
    let subjectCount = document.getElementById(`deboucled-${entitySubject}-entity-count`);
    if (subjectCount !== null) subjectCount.textContent = `${subjectBlacklistArray.length} sujet${plural(subjectBlacklistArray.length)} blacklist`;

    let authorCount = document.getElementById(`deboucled-${entityAuthor}-entity-count`);
    if (authorCount !== null) authorCount.textContent = `${authorBlacklistArray.length} pseudo${plural(authorBlacklistArray.length)} blacklist`;

    let topicCount = document.getElementById(`deboucled-${entityTopicId}-entity-count`)
    if (topicCount !== null) topicCount.textContent = `${topicIdBlacklistMap.size} topic${plural(topicIdBlacklistMap.size)} blacklist`;
}

function refreshCollapsibleContentHeight(entity) {
    let content = document.getElementById(`deboucled-${entity}-collapsible-content`);
    if (content === null) return;
    content.style.maxHeight = content.scrollHeight + 'px';
}

function addSettingButton(firstLaunch) {
    let optionButton = document.createElement("button");
    optionButton.setAttribute('id', 'deboucled-option-button');
    optionButton.setAttribute('class', `btn btn-actu-new-list-forum deboucled-option-button${firstLaunch ? ' blinking' : ''}`);
    optionButton.innerHTML = 'Déboucled';
    document.querySelector('.bloc-pre-right').prepend(optionButton);
    optionButton.addEventListener('click', function (e) {
        e.preventDefault();
        clearEntityInputs();
        showSettings();
    });

    window.addEventListener('click', function (e) {
        if (!document.getElementById('deboucled-settings-bg-view').contains(e.target)) return;
        hideSettings();
    });
    window.addEventListener('keydown', function (e) {
        if (!document.getElementById('deboucled-settings-bg-view').contains(e.target) && e.key !== 'Escape') return;
        hideSettings();
    });
}

function addSearchFilterToggle() {
    let optionFilterResearch = GM_getValue(storage_optionFilterResearch, true);

    let toggleElem = document.createElement('label');
    toggleElem.className = 'deboucled-switch';
    toggleElem.style.marginBottom = '2px';
    toggleElem.title = 'Filter les résultats avec Déboucled';
    toggleElem.innerHTML = `<input type="checkbox" id="deboucled-search-filter-toggle" ${optionFilterResearch ? 'checked' : ''}><span class="deboucled-toggle-slider round red"></span>`;
    document.querySelector('.form-rech-forum').appendChild(toggleElem);

    document.querySelector('#deboucled-search-filter-toggle').addEventListener('change', (e) => {
        GM_setValue(storage_optionFilterResearch, e.currentTarget.checked);
        location.reload();
    });

    return optionFilterResearch;
}

function showSettings() {
    let bgView = document.getElementById('deboucled-settings-bg-view');
    bgView.style.display = 'block'

    let view = document.getElementById('deboucled-settings-view');
    view.classList.add('visible');
    view.clientWidth; // force display
    view.classList.add('active');
}

function hideSettings() {
    let bgView = document.getElementById('deboucled-settings-bg-view');
    bgView.style.display = 'none';

    let view = document.getElementById('deboucled-settings-view');
    view.classList.remove('active');
    setTimeout(() => view.classList.remove('visible'), 200); // wait transition (flemme d'utiliser l'event)
}

function clearEntityInputs() {
    document.querySelectorAll('.deboucled-input-key').forEach(el => { el.value = '' });
}

function clearSearchInputs() {
    document.querySelectorAll('.deboucled-input-search').forEach(el => { el.value = '' });
}
