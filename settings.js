
///////////////////////////////////////////////////////////////////////////////////////
// SETTINGS
///////////////////////////////////////////////////////////////////////////////////////

function buildSettingsPage() {
    let bgView = document.createElement('div');
    bgView.setAttribute('id', 'deboucled-settings-bg-view');
    bgView.setAttribute('class', 'deboucled-settings-bg-view');
    bgView.innerHTML = '<div></div>';
    document.body.prepend(bgView);
    document.querySelector('#deboucled-settings-bg-view').style.display = 'none';

    function buildTooltip(hint, location = 'right') {
        const tooltipLocation = location === 'top' ? '' : ` data-tooltip-location="${location}"`;
        return `deboucled-data-tooltip="${hint}"${tooltipLocation}`;
    }
    function addToggleOption(title, optionId, defaultValue, hint, enabled = true, isSubCell = false) {
        let html = '';
        html += `<tr id="${optionId}-container"${enabled ? '' : 'class="deboucled-disabled"'}>`;
        html += `<td class="deboucled-td-left${isSubCell ? ' deboucled-option-table-subcell' : ''}">`;
        html += `<span ${buildTooltip(hint)}>${title}</span>`;
        html += '</td>';
        html += `<td class="deboucled-td-right">`;
        html += '<label class="deboucled-switch">';
        let checkedStr = GM_getValue(optionId, defaultValue) ? 'checked' : '';
        html += `<input type="checkbox" id="${optionId}" ${checkedStr}></input>`;
        html += '<span class="deboucled-toggle-slider round"></span>';
        html += '</label>';
        html += '</td>';
        html += '</tr>';
        return html;
    }
    function addToggleAltOption(title, optionId, defaultValue, hint) {
        let html = '';
        html += `<tr id="${optionId}-container">`;
        html += `<td class="deboucled-td-left full-width">`;
        html += `<span class="data-tooltip-large" ${buildTooltip(hint)}>${title}</span>`;
        html += '</td>';
        html += `<td class="deboucled-td-right deboucled-td-right-padding">`;
        html += '<label class="deboucled-switch">';
        let checkedStr = GM_getValue(optionId, defaultValue) ? 'checked' : '';
        html += `<input type="checkbox" id="${optionId}" ${checkedStr}></input>`;
        html += '<span class="deboucled-toggle-slider round"></span>';
        html += '</label>';
        html += '</td>';
        html += '</tr>';
        return html;
    }
    function addRangeOption(title, optionId, defaultValue, minValue, maxValue, step, hint, enabled, isSubCell = false) {
        let html = '';
        html += `<tr id="${optionId}-container"${enabled ? '' : 'class="deboucled-disabled"'}>`;
        html += `<td class="deboucled-td-left${isSubCell ? ' deboucled-option-table-subcell' : ''}">`;
        html += `<span ${buildTooltip(hint)}>${title}</span>`;
        html += '</td>';
        html += '<td class="deboucled-td-right" style="padding-top: 7px;">';
        let value = parseInt(GM_getValue(optionId, defaultValue));
        html += `<input type="range" id="${optionId}" min="${minValue}" max="${maxValue}" value="${value}" step="${step}" class="deboucled-range-slider">`;
        html += `<span class="deboucled-range-title-value" id="${optionId}-value">${value}</span>`;
        html += '</tr>';
        return html;
    }
    function addDropdownOption(title, optionId, hint, defaultValue, values) {
        let html = '';
        html += '<tr>';
        html += '<td class="deboucled-td-left" style="vertical-align: top;">';
        html += `<span ${buildTooltip(hint)}>${title}</span>`;
        html += '</td>';
        html += '<td class="deboucled-td-right">';
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
        let html = '';
        html += '<tr>';
        html += `<td class="deboucled-td-left" rowspan="2">`;
        html += `<span ${buildTooltip('Exportez ou importer vos préférences et/ou vos blacklists.')}>Restaurer/sauvegarder les préférences</span>`;
        html += '</td>';
        html += '<td class="deboucled-td-left">';
        html += '<label for="deboucled-import-button" class="btn deboucled-button deboucled-setting-button">Restaurer</label>';
        html += '<input type="file" accept="application/JSON" id="deboucled-import-button" style="display: none;"></input>';
        html += '<span id="deboucled-export-button" class="btn deboucled-button deboucled-setting-button">Sauvegarder</span>';
        html += '<span id="deboucled-import-tbl" class="btn deboucled-button deboucled-setting-button" style="min-width: 10rem;">Importer TotalBlacklist</span>';
        html += '</td>';
        html += '<td class="deboucled-td-right" style="white-space: nowrap;">';
        html += '<span id="deboucled-impexp-message" class="deboucled-setting-impexp-message" style="display: block; text-align: center;">Restauration terminée</span>';
        html += '<span id="deboucled-impexp-message" class="deboucled-setting-impexp-message">⚠ Veuillez rafraichir la page ⚠</span>';
        html += '</td>';
        html += '</tr>';
        html += '<tr>';
        html += '<td class="deboucled-td-left">';

        html += '<label class="deboucled-switch little">';
        html += '<input type="checkbox" id="deboucled-impexp-blonly"></input>';
        html += '<span class="deboucled-toggle-slider little round"></span>';
        html += '</label>';
        html += '<span class="deboucled-toggle-title-right">Uniquement les blacklists</span>';

        html += '<label class="deboucled-switch little">';
        html += '<input type="checkbox" id="deboucled-impexp-mergebl"></input>';
        html += '<span class="deboucled-toggle-slider little round"></span>';
        html += '</label>';
        html += '<span class="deboucled-toggle-title-right">Fusionner les blacklists</span>';

        html += '</td>';
        html += '</tr>';
        return html;
    }

    function addOptionsSection(sectionIsActive) {
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">OPTIONS</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-options-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';

        let jvcLogo = '<span class="deboucled-jvc-logo"></span>';
        html += `<a class="deboucled-about-link-jvc" href="https://www.jeuxvideo.com/forums/42-51-68410257-1-0-1-0-officiel-deboucled-v2-est-arrive-fini-la-boucle-et-le-spam.htm" target="_blank" title="Topic officiel JVC">${jvcLogo}</a>`;

        let githubLogo = '<span class="deboucled-svg-github"><svg width="20px" viewBox="0 0 16 16" id="deboucled-github-logo"><use href="#githublogo"/></svg></span>';
        html += `<a class="deboucled-about-link-github" href="https://github.com/Rand0max/deboucled" target="_blank" title="Github Officiel Déboucled">${githubLogo}</a>`;

        html += `<span class="deboucled-about-version">v${deboucledVersion}</span>`;

        html += '<table class="deboucled-option-table">';

        html += addToggleOption('Cacher les messages des <span style="color: rgb(230, 0, 0)">pseudos blacklist</span>', storage_optionHideMessages, storage_optionHideMessages_default, 'Permet de masquer complètement les messages d\'un pseudo dans les topics.');

        let mpLogo = '<span class="deboucled-mp-logo nav-icon-pm"></span>'
        html += addToggleOption(`Filtrer les <i>Messages Privés</i> ${mpLogo} des <i>auteurs blacklist</i>`, storage_optionBlAuthorIgnoreMp, storage_optionBlAuthorIgnoreMp_default, 'Ignorer les MPs des pseudos présents dans votre blacklist et les déplacer automatiquement dans le dossier &quot;Spam&quot;.');

        let messageLogo = '<span class="deboucled-msg-logo"></span>'
        html += addToggleOption(`Masquer les <i>messages</i> ${messageLogo} avec les <i>sujets blacklist</i>`, storage_optionBlSubjectIgnoreMessages, storage_optionBlSubjectIgnoreMessages_default, 'Masque les messages contenant les mots-clés présents dans la &quot;Blacklist Sujets&quot;.\nCliquez sur l\'oeil pour afficher le message, et les expressions blacklist apparaitront en rouge.');

        let spiralLogo = '<span class="deboucled-svg-spiral-black"><svg width="16px" viewBox="0 2 24 24" id="deboucled-spiral-logo"><use href="#spirallogo"/></svg></span>';
        html += addToggleOption(`Utiliser <i>JvArchive</i> pour <i>Pseudo boucled</i> ${spiralLogo}`, storage_optionBoucledUseJvarchive, storage_optionBoucledUseJvarchive_default, 'Quand vous cliquez sur le bouton en spirale à côté du pseudo, un nouvel onglet sera ouvert avec la liste des topics soit avec JVC soit avec JvArchive.');

        html += addToggleOption('Autoriser l\'affichage du topic à partir d\'un seuil', storage_optionAllowDisplayThreshold, storage_optionAllowDisplayThreshold_default, 'Autoriser l\'affichage des topics même si le sujet est blacklist, à partir d\'un certain nombre de messages.');

        let allowDisplayThreshold = GM_getValue(storage_optionAllowDisplayThreshold, storage_optionAllowDisplayThreshold_default);
        html += addRangeOption('Nombre de messages minimum', storage_optionDisplayThreshold, storage_optionDisplayThreshold_default, 10, 1000, 10, 'Nombre de messages minimum dans le topic pour forcer l\'affichage.', allowDisplayThreshold, true);

        let pocLogo = '<span class="deboucled-poc-logo"></span>'
        html += addDropdownOption(`Protection contre les <i>PoC</i> ${pocLogo} <span style="opacity: 0.3;font-style: italic;font-size: xx-small;">(beta)</span>`,
            storage_optionDetectPocMode,
            'Protection contre les topics &quot;post ou cancer&quot; et les dérivés.\n• Désactivé : aucune protection\n• Mode simple (rapide) : recherche dans le contenu uniquement si le titre contient un indice\n• Mode approfondi (plus lent) : recherche systématiquement dans le contenu et le titre',
            storage_optionDetectPocMode_default,
            ['Désactivé', 'Mode simple', 'Mode approfondi ⚠']);

        html += addToggleOption('Effacer les <i>balises abusives</i> du titre des topics', storage_optionRemoveUselessTags, storage_optionRemoveUselessTags_default, 'Effacer du titre des topics les balises inutiles et répétitives comme [ALERTE], ou l\'usage abusif du &quot;AYA&quot; et ses dérivés.\n\nExemple : &quot;[ALERTE] cet exemple incroyable AYAAAA&quot; => &quot;Cet exemple incroyable&quot;');

        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addCustomisationSection(sectionIsActive) {
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">PERSONNALISATION</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-customisation-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';

        html += '<table class="deboucled-option-table">';

        let darkLogo = '<span class="deboucled-dark-logo"></span>'
        html += addToggleOption(`Utiliser le <i>thème sombre</i> ${darkLogo} pour <b>JVC</b> (par Peepo)`, storage_optionEnableJvcDarkTheme, storage_optionEnableJvcDarkTheme_default, 'Basculer entre le thème JVC normal, et le thème sombre créé par Peepo (pensez à rafraichir la page pour voir les changements).');

        html += addToggleOption(`Utiliser le <i>thème sombre</i> pour <b>Déboucled</b>`, storage_optionEnableDeboucledDarkTheme, storage_optionEnableDeboucledDarkTheme_default, 'Permet de basculer entre le thème normal et le thème sombre pour le script Déboucled.', undefined, true);

        let forbiddenLogo = '<span class="deboucled-svg-forbidden-black"><svg viewBox="0 0 180 180" id="deboucled-forbidden-logo" class="deboucled-logo-forbidden"><use href="#forbiddenlogo"/></svg></span>';
        html += addToggleOption(`Afficher les boutons pour <i>Blacklist le topic</i> ${forbiddenLogo}`, storage_optionDisplayBlacklistTopicButton, storage_optionDisplayBlacklistTopicButton_default, 'Afficher ou non le bouton rouge à droite des sujets pour ignorer les topics souhaités.');

        let blackTopicLogo = '<span class="topic-img deboucled-topic-black-logo" style="display: inline-block; vertical-align: middle;"></span>'
        html += addToggleOption(`Afficher le pictogramme pour les <i>topics noirs</i> ${blackTopicLogo}`, storage_optionDisplayBlackTopic, storage_optionDisplayBlackTopic_default, 'Afficher les topics de plus de 100 messages avec le pictogramme noir (en plus du jaune, rouge, résolu, épinglé etc).');

        let previewLogo = '<span><svg width="16px" viewBox="0 0 30 30" id="deboucled-preview-logo"><use href="#previewlogo"/></svg></span>';
        html += addToggleOption(`Afficher les boutons pour avoir un <i>aperçu du topic</i> ${previewLogo}`, storage_optionPrevisualizeTopic, storage_optionPrevisualizeTopic_default, 'Afficher ou non l\'icone \'loupe\' à côté du sujet pour prévisualiser le topic au survol.');

        let blJvcLogo = '<span class="picto-msg-tronche deboucled-blacklist-jvc-button" style="width: 13px;height: 13px;background-size: 13px;"></span>'
        html += addToggleOption(`Afficher le bouton <i>Blacklist pseudo</i> ${blJvcLogo} de JVC`, storage_optionShowJvcBlacklistButton, storage_optionShowJvcBlacklistButton_default, 'Afficher ou non le bouton blacklist original de JVC à côté du nouveau bouton blacklist de Déboucled.');

        let matchesLogo = '<span class="deboucled-list-logo"></span>'
        html += addToggleOption(`Afficher les <i>détails du filtrage</i> ${matchesLogo} des topics`, storage_optionDisplayTopicMatches, storage_optionDisplayTopicMatches_default, 'Afficher ou non le tableau des détails de filtrage des topics sur la droite de la page.');

        let optionDisplayTopicMatches = GM_getValue(storage_optionDisplayTopicMatches, storage_optionDisplayTopicMatches_default);
        let eyeLogo = '<span class="deboucled-eye-logo"></span>'
        html += addToggleOption(`Cliquer sur l'oeil ${eyeLogo} pour <i>afficher les détails</i>`, storage_optionClickToShowTopicMatches, storage_optionClickToShowTopicMatches_default, 'Affiche par défaut l\'icone en oeil, nécéssite de cliquer pour afficher le détail du filtrage par catégorie.', optionDisplayTopicMatches, true);

        let statsLogo = '<span class="deboucled-chart-logo"></span>'
        html += addToggleOption(`Afficher la <i>tendance de filtrage</i> ${statsLogo} des topics`, storage_optionDisplayTopicCharts, storage_optionDisplayTopicCharts_default, 'Afficher ou non le graphique des tendances de filtrage de topics sur la droite de la page.');

        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addPreBouclesSection(sectionIsActive) {
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">ANTI-BOUCLES</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-options-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += `<div class="deboucled-preboucle-title" ${buildTooltip('Cochez les catégories que vous souhaitez filtrer sur le forum.\nPassez la souris ou cliquez sur les intitulés de catégorie pour voir les mots-clés qui seront utilisés.', 'bottom')}>Listes anti-boucle pré-enregistrées</div>`;
        html += '<table class="deboucled-option-table">';
        preBoucleArray.forEach(b => {
            const hint = `${getEntityTitle(b.type)} : ${b.entities.sort().join(', ')}`;
            html += addToggleAltOption(b.title, `deboucled-preboucle-${b.id}`, b.enabled, hint);
        });
        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addEntitySettingSection(entity, header, hint, messageHint, sectionIsActive) {
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">${header}</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-${entity}-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<table class="deboucled-option-table-entities">';
        html += '<tr>';
        html += '<td>';
        html += `<input type="text" id="deboucled-${entity}-input-key" class="deboucled-input-key" placeholder="${hint}" >`;
        html += `<span id="deboucled-${entity}-input-button" class="btn deboucled-button deboucled-add-button">Ajouter</span>`;
        if (messageHint) html += `<span class="deboucled-entity-message-hint">${messageHint}</span>`;
        html += `<input type="search" id="deboucled-${entity}-search-key" class="deboucled-input-search" style="float: right;" placeholder="Rechercher..." >`;
        html += '</td>';
        html += '</tr>';
        html += '<td style="padding-top: 12px;padding-bottom: 0;">';
        html += `<a id="deboucled-${entity}-sortmode" class="deboucled-sort-button deboucled-sort-undefined-logo" role="button" title="Tri par défaut"></a>`;
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
    function addAdvancedOptionsSection(sectionIsActive) {
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">OPTIONS AVANCÉES</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-options-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<table class="deboucled-option-table">';

        html += addToggleOption('Algorithme de filtrage <i>anti-Vinz</i>', storage_optionAntiVinz, storage_optionAntiVinz_default, 'Algorithme intelligent pour éradiquer totalement Vinz et sa boucle infernale, en dépit de ses tentatives d\'évitement.');

        let resolvedLogo = '<span class="deboucled-topic-resolved-logo"></span>'
        html += addToggleOption(`Remplacer le pictogramme ${resolvedLogo} <i>résolu</i> des topics`, storage_optionReplaceResolvedPicto, storage_optionReplaceResolvedPicto_default, 'Remplacer le pictogramme résolu sur la gauche des topics par le picto normal (jaune, rouge, vérouillé, etc).');

        html += addRangeOption('Nombre de topics à afficher sur la page', storage_optionMaxTopicCount, storage_optionMaxTopicCount_default, defaultTopicCount, 50, 1, 'Nombre de topics à afficher sur la page (25 par défaut).', true, false);

        html += addToggleOption('Filtrer les topics en dessous d\'un nombre de messages', storage_optionEnableTopicMsgCountThreshold, storage_optionEnableTopicMsgCountThreshold_default, 'Filtrer automatiquement les topics qui n\'ont pas le nombre minimum de messages voulu.');

        let enableTopicMsgCountThreshold = GM_getValue(storage_optionEnableTopicMsgCountThreshold, storage_optionEnableTopicMsgCountThreshold_default);
        html += addRangeOption('Nombre de messages minimum', storage_optionTopicMsgCountThreshold, storage_optionTopicMsgCountThreshold_default, 1, 30, 1, 'Nombre de messages minimum dans le topic pour autoriser l\'affichage.', enableTopicMsgCountThreshold, true);

        html += addImportExportButtons();

        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addStatsSection(sectionIsActive) {
        function addStat(title, content) {
            let html = '';
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
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">STATISTIQUES</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-options-collapsible-content" ${sectionIsActive ? 'style="max-height: inherit;"' : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<table class="deboucled-option-table">';
        let totalHiddenSubjects = GM_getValue(storage_totalHiddenSubjects, '0');
        let totalHiddenAuthors = GM_getValue(storage_totalHiddenAuthors, '0');
        let totalHiddenTopicIds = GM_getValue(storage_totalHiddenTopicIds, '0');
        let totalHiddenMessages = GM_getValue(storage_totalHiddenMessages, '0');
        let totalHiddenPrivateMessages = GM_getValue(storage_totalHiddenPrivateMessages, '0');
        let totalHidden = parseInt(totalHiddenSubjects + totalHiddenAuthors + totalHiddenTopicIds + totalHiddenMessages + totalHiddenPrivateMessages);
        html += addStat('Sujets ignorés', totalHiddenSubjects);
        html += addStat('Pseudos ignorés', totalHiddenAuthors);
        html += addStat('Topics ignorés', totalHiddenTopicIds);
        html += addStat('Messages ignorés', totalHiddenMessages);
        html += addStat('Messages privés ignorés', totalHiddenPrivateMessages);
        html += addStat('Total ignorés', totalHidden);
        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }

    let settingsHtml = '';
    settingsHtml += addOptionsSection(false);
    settingsHtml += addCustomisationSection(false);
    settingsHtml += addPreBouclesSection(false);
    settingsHtml += addEntitySettingSection(entitySubject, 'BLACKLIST SUJETS', 'Mot-clé', 'Utilisez le caractère étoile * pour remplacer n\'importe quelle expression.', true);
    settingsHtml += addEntitySettingSection(entityAuthor, 'BLACKLIST AUTEURS', 'Pseudo', undefined, false);
    settingsHtml += addEntitySettingSection(entityTopicId, 'BLACKLIST TOPICS', 'TopicId', undefined, false);
    settingsHtml += addAdvancedOptionsSection(false);
    settingsHtml += addStatsSection(false);

    let settingsView = document.createElement('div');
    settingsView.setAttribute('id', 'deboucled-settings-view');
    settingsView.setAttribute('class', 'deboucled-settings-view');
    settingsView.innerHTML = settingsHtml;
    document.body.prepend(settingsView);

    addSettingEvents();

    addImportExportEvent();

    addCollapsibleEvents();

    buildSettingEntities();

    refreshEntityCounts();

    addHighlightModeratedButton();

    addSortEvent();
}

function addSettingEvents() {
    function addToggleEvent(id, setValue = true, callback = undefined) {
        const toggleSlider = document.querySelector('#' + id);
        toggleSlider.onchange = (e) => {
            const checked = e.currentTarget.checked;
            if (setValue) GM_setValue(id, checked);
            if (callback) callback(checked);
        };
    }
    function addRangeEvent(id) {
        const rangeSlider = document.querySelector('#' + id);
        rangeSlider.oninput = function () {
            GM_setValue(id, parseInt(this.value));
            document.querySelector(`#${id}-value`).innerHTML = this.value;
        };
    }
    function addSelectEvent(id) {
        const select = document.querySelector('#' + id);
        select.onchange = (e) => {
            GM_setValue(id, parseInt(e.currentTarget.value));
        };
    }

    const pave2022 = 'Juste pour rappel en 2022 :\n\n· Fin de la boucle temporelle.\n· Débug du script mathématique.\n· Révélation projet DéboucledV2.\n· Conscience des oldfags.\n· Avènement des proto-boucleurs.\n· Résonnance de Vinzmann.\n\nVous n\'êtes pas prêts.';
    document.querySelector('.deboucled-about-version').onclick = () => alert(pave2022);

    addToggleEvent(storage_optionEnableDeboucledDarkTheme, undefined, toggleDeboucledDarkTheme);
    addToggleEvent(storage_optionEnableJvcDarkTheme);
    addToggleEvent(storage_optionHideMessages);
    addToggleEvent(storage_optionBlAuthorIgnoreMp);
    addToggleEvent(storage_optionBlSubjectIgnoreMessages);
    addToggleEvent(storage_optionBoucledUseJvarchive);
    addToggleEvent(storage_optionDisplayBlacklistTopicButton);
    addToggleEvent(storage_optionDisplayBlackTopic);
    addToggleEvent(storage_optionPrevisualizeTopic);
    addToggleEvent(storage_optionShowJvcBlacklistButton);
    addToggleEvent(storage_optionDisplayTopicCharts);
    addToggleEvent(storage_optionDisplayTopicMatches, undefined, function () {
        document.querySelectorAll(`[id = ${storage_optionClickToShowTopicMatches}-container]`).forEach(function (el) {
            el.classList.toggle('deboucled-disabled');
        })
    });
    addToggleEvent(storage_optionClickToShowTopicMatches);
    addToggleEvent(storage_optionAllowDisplayThreshold, undefined, function () {
        document.querySelectorAll(`[id = ${storage_optionDisplayThreshold}-container]`).forEach(function (el) {
            el.classList.toggle('deboucled-disabled');
        })
    });
    addToggleEvent(storage_optionRemoveUselessTags);
    addRangeEvent(storage_optionDisplayThreshold);
    addRangeEvent(storage_optionMaxTopicCount);
    addSelectEvent(storage_optionDetectPocMode);

    preBoucleArray.forEach(b => {
        addToggleEvent(`deboucled-preboucle-${b.id}`, false, function (checked) {
            togglePreBoucleStatus(b.id, checked);
            savePreBouclesStatuses();
        });
    });

    addToggleEvent(storage_optionAntiVinz);
    addToggleEvent(storage_optionReplaceResolvedPicto);
    addToggleEvent(storage_optionEnableTopicMsgCountThreshold, undefined, function () {
        document.querySelectorAll(`[id = ${storage_optionTopicMsgCountThreshold}-container]`).forEach(function (el) {
            el.classList.toggle('deboucled-disabled');
        })
    });
    addRangeEvent(storage_optionTopicMsgCountThreshold);
}

function addSortEvent() {
    function switchSortMode(sortModeEntity, element) {
        switch (sortModeEntity) {
            case 0:
                element.classList.toggle('deboucled-sort-undefined-logo', false);
                element.classList.toggle('deboucled-sort-alpha-logo', true);
                element.title = 'Tri par ordre alphabétique';
                return 1;
            case 1:
                element.classList.toggle('deboucled-sort-alpha-logo', false);
                element.classList.toggle('deboucled-sort-reversealpha-logo', true);
                element.title = 'Tri par ordre alphabétique inversé';
                return 2;
            case 2:
                element.classList.toggle('deboucled-sort-reversealpha-logo', false);
                element.classList.toggle('deboucled-sort-undefined-logo', true);
                element.title = 'Tri par défaut';
                return 0;
        }
    }
    document.querySelector(`#deboucled-${entitySubject}-sortmode`).onclick = function () {
        sortModeSubject = switchSortMode(sortModeSubject, this);
        refreshSubjectKeys();
    };
    document.querySelector(`#deboucled-${entityAuthor}-sortmode`).onclick = function () {
        sortModeAuthor = switchSortMode(sortModeAuthor, this);
        refreshAuthorKeys();
    };
    document.querySelector(`#deboucled-${entityTopicId}-sortmode`).onclick = function () {
        sortModeTopicId = switchSortMode(sortModeTopicId, this);
        refreshTopicIdKeys();
    };
}

function addImportExportEvent() {
    document.querySelector('#deboucled-export-button').onclick = () => backupStorage();
    document.querySelector('#deboucled-import-button').onchange = (fe) => loadFile(fe);
    document.querySelector('#deboucled-import-tbl').onclick = () => importFromTotalBlacklist();
}

function addCollapsibleEvents() {
    const activeClass = 'deboucled-collapsible-active';
    document.querySelectorAll('.deboucled-collapsible').forEach(function (el) {
        el.onclick = function () {
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
                let view = document.querySelector('#deboucled-settings-view');
                view.style.overflowY = 'scroll';
                content.style.maxHeight = content.scrollHeight + 'px';
                view.removeAttribute('style');
            }
        };
    });
}

function buildSettingEntities() {
    const regexAllowedSubject = /^[A-z0-9\u0020-\u007E\u2018-\u201F\u00A1-\u02AF\u{1F300}-\u{1FAD6}]*$/iu;
    // eslint-disable-next-line no-useless-escape
    const regexAllowedAuthor = /^[A-z\u00C0-\u02AF0-9-_\[\]\*]*$/iu;
    const regexAllowedTopicId = /^[0-9]+$/i;

    createAddEntityEvent(entitySubject, regexAllowedSubject, function (key) { addEntityBlacklist(subjectBlacklistArray, key); refreshSubjectKeys(); });
    createAddEntityEvent(entityAuthor, regexAllowedAuthor, function (key) { addEntityBlacklist(authorBlacklistArray, key); refreshAuthorKeys(); });
    createAddEntityEvent(entityTopicId, regexAllowedTopicId, function (key) { addTopicIdBlacklist(key, key, false); refreshTopicIdKeys(); });

    createSearchEntitiesEvent(entitySubject, regexAllowedSubject, refreshSubjectKeys);
    createSearchEntitiesEvent(entityAuthor, regexAllowedAuthor, refreshAuthorKeys);
    createSearchEntitiesEvent(entityTopicId, regexAllowedSubject, refreshTopicIdKeys); // On peut filtrer sur le titre du topic

    refreshSubjectKeys();
    refreshAuthorKeys();
    refreshTopicIdKeys();
}

function writeEntityKeys(entity, entries, filterCallback, removeCallback, entityClassCallback, sortCallback) {
    if (filterCallback) entries = filterCallback(entries);
    if (sortCallback) entries = sortCallback(entries);

    let html = '<ul class="deboucled-entity-list">';
    entries.forEach(function (value, key) {
        let cls = entityClassCallback ? entityClassCallback(key) : '';
        html += `<li class="deboucled-entity-key deboucled-entity-element${cls}" id="${key}"><input type="submit" class="deboucled-${entity}-button-delete-key" value="X">${value}</li>`;
    });
    html += '</ul>';
    document.querySelector(`#deboucled-${entity}List`).innerHTML = html;

    document.querySelectorAll(`.deboucled-${entity}-button-delete-key`).forEach(function (input) {
        input.onclick = function () { removeCallback(this.parentNode) };
    });
}

function refreshSubjectKeys(filter = null) {
    let sortCallback = null;
    switch (sortModeSubject) {
        case 1:
            sortCallback = (array) => array.sort();
            break;
        case 2:
            sortCallback = (array) => array.sort().reverse();
            break;
    }

    writeEntityKeys(
        entitySubject,
        [...subjectBlacklistArray],
        filter ? (array) => array.filter((value) => normalizeValue(value).includes(filter)) : null,
        async function (node) {
            await removeEntityBlacklist(subjectBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, ''));
            refreshSubjectKeys();
            refreshCollapsibleContentHeight(entitySubject);
            clearSearchInputs();
        },
        null,
        sortCallback
    );
}

function refreshAuthorKeys(filter = null) {
    let sortCallback = null;
    switch (sortModeAuthor) {
        case 1:
            sortCallback = (array) => array.sort();
            break;
        case 2:
            sortCallback = (array) => array.sort().reverse();
            break;
    }

    writeEntityKeys(
        entityAuthor,
        [...authorBlacklistArray],
        filter ? (array) => array.filter((value) => normalizeValue(value).includes(filter)) : null,
        async function (node) {
            await removeEntityBlacklist(authorBlacklistArray, node.innerHTML.replace(/<[^>]*>/g, ''));
            refreshAuthorKeys();
            refreshCollapsibleContentHeight(entityAuthor);
            clearSearchInputs();
        },
        null,
        sortCallback
    );
}

function refreshTopicIdKeys(filter = null) {
    let sortCallback = null;
    switch (sortModeTopicId) {
        case 1:
            sortCallback = (map) => new Map([...map].sort((a, b) => String(a[1]).localeCompare(b[1])));
            break;
        case 2:
            sortCallback = (map) => new Map([...map].sort((a, b) => String(b[1]).localeCompare(a[1])));
            break;
    }

    writeEntityKeys(
        entityTopicId,
        new Map(topicIdBlacklistMap),
        filter ? (map) => new Map([...map].filter((value, key) => normalizeValue(value).includes(filter) || normalizeValue(key).includes(filter))) : null,
        async function (node) {
            await removeTopicIdBlacklist(node.getAttribute('id').replace(/<[^>]*>/g, ''));
            refreshTopicIdKeys();
            refreshCollapsibleContentHeight(entityTopicId);
            clearSearchInputs();
        },
        function (key) {
            return moderatedTopics.has(key) && moderatedTopics.get(key) ? ' deboucled-entity-moderated-key' : '';
        },
        sortCallback
    );
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
        let input = document.querySelector(`#deboucled-${entity}-input-key`);
        let key = input.value;
        if (key === '' || !key.match(keyRegex)) return;
        addCallback(key);
        input.value = '';
        refreshCollapsibleContentHeight(entity);
    }

    document.querySelector(`#deboucled-${entity}-input-key`).onkeydown = function (event) {
        if (!keyIsAllowed(event.key, event.ctrlKey) && !event.key.match(keyRegex)) event.preventDefault();
        if (event.key !== "Enter") return;
        addEntity(entity, keyRegex, addCallback);
    };

    document.querySelector(`#deboucled-${entity}-input-button`).onclick = function () {
        addEntity(entity, keyRegex, addCallback);
    };
}

function createSearchEntitiesEvent(entity, keyRegex, refreshCallback) {
    document.querySelector(`#deboucled-${entity}-search-key`).onkeydown = function (event) {
        if (!keyIsAllowed(event.key, event.ctrlKey) && !event.key.match(keyRegex)) event.preventDefault();
    };
    document.querySelector(`#deboucled-${entity}-search-key`).oninput = function (event) {
        refreshCallback(normalizeValue(event.target.value));
        refreshCollapsibleContentHeight(entity);
    };
}

function refreshEntityCounts() {
    let subjectCount = document.querySelector(`#deboucled-${entitySubject}-entity-count`);
    if (subjectCount) subjectCount.textContent = `${subjectBlacklistArray.length} sujet${plural(subjectBlacklistArray.length)} blacklist`;

    let authorCount = document.querySelector(`#deboucled-${entityAuthor}-entity-count`);
    if (authorCount) authorCount.textContent = `${authorBlacklistArray.length} pseudo${plural(authorBlacklistArray.length)} blacklist`;

    let topicCount = document.querySelector(`#deboucled-${entityTopicId}-entity-count`)
    if (topicCount) topicCount.textContent = `${topicIdBlacklistMap.size} topic${plural(topicIdBlacklistMap.size)} blacklist`;
}

function refreshCollapsibleContentHeight(entity) {
    let content = document.querySelector(`#deboucled-${entity}-collapsible-content`);
    if (content) content.style.maxHeight = content.scrollHeight + 'px';
}

function addSettingButton(firstLaunch) {
    function createDeboucledButton() {
        let button = document.createElement('button');
        button.setAttribute('id', 'deboucled-option-button');
        button.setAttribute('class', `btn deboucled-button deboucled-option-button${firstLaunch ? ' blinking' : ''}`);
        button.innerHTML = 'Déboucled';
        return button;
    }

    let blocMenu = document.querySelectorAll('.bloc-pre-right');
    if (blocMenu.length === 0) blocMenu = document.querySelectorAll('.action-left');
    blocMenu.forEach(e => { e.prepend(createDeboucledButton()); });

    let optionOnclick = function (e) {
        e.preventDefault();
        clearEntityInputs();
        showSettings();
    };
    document.querySelectorAll('#deboucled-option-button').forEach(e => { e.onclick = optionOnclick });

    window.onclick = function (e) {
        if (!document.querySelector('#deboucled-settings-bg-view').contains(e.target)) return;
        hideSettings();
    };
    window.onkeydown = function (e) {
        if (!document.querySelector('#deboucled-settings-bg-view').contains(e.target) && e.key !== 'Escape') return;
        hideSettings();
    };
}

function addSearchFilterToggle() {
    let optionFilterResearch = GM_getValue(storage_optionFilterResearch, storage_optionFilterResearch_default);

    let toggleElem = document.createElement('label');
    toggleElem.className = 'deboucled-switch';
    toggleElem.title = 'Filtrer les résultats avec Déboucled';
    toggleElem.innerHTML = `<input type="checkbox" id="deboucled-search-filter-toggle" ${optionFilterResearch ? 'checked' : ''}><span class="deboucled-toggle-slider round red"></span>`;
    document.querySelector('.form-rech-forum').appendChild(toggleElem);

    document.querySelector('#deboucled-search-filter-toggle').onchange = (e) => {
        GM_setValue(storage_optionFilterResearch, e.currentTarget.checked);
        location.reload();
    };

    return optionFilterResearch;
}

function showSettings() {
    let bgView = document.querySelector('#deboucled-settings-bg-view');
    bgView.style.display = 'block'

    let view = document.querySelector('#deboucled-settings-view');
    view.classList.add('visible');
    view.clientWidth; // force display
    view.classList.add('active');
}

function hideSettings() {
    let bgView = document.querySelector('#deboucled-settings-bg-view');
    bgView.style.display = 'none';

    let view = document.querySelector('#deboucled-settings-view');
    view.classList.remove('active');
    setTimeout(() => view.classList.remove('visible'), 200); // wait transition (flemme d'utiliser l'event)
}

function clearEntityInputs() {
    document.querySelectorAll('.deboucled-input-key').forEach(el => { el.value = '' });
}

function clearSearchInputs() {
    document.querySelectorAll('.deboucled-input-search').forEach(el => { el.value = '' });
}

function addHighlightModeratedButton() {
    const buttonText = '410 ?';
    const buttonStopText = 'STOP';
    let anchor = document.createElement('a');
    anchor.className = 'titre-bloc deboucled-entity-moderated-button';
    anchor.setAttribute('role', 'button');
    anchor.innerHTML = buttonText;
    anchor.onclick = async function () {
        if (this.textContent === buttonStopText) {
            stopHighlightModeratedTopics = true;
            this.innerHTML = buttonText;
        }
        else {
            this.innerHTML = `<b>${buttonStopText}</b>`;
            await highlightModeratedTopics();
            stopHighlightModeratedTopics = false;
            this.innerHTML = buttonText;
        }
    };
    const labelCount = document.querySelector('#deboucled-topicid-entity-count');
    insertAfter(anchor, labelCount);
}

async function highlightModeratedTopics() {
    const entityRoot = document.querySelector('#deboucled-topicidList').firstElementChild;
    let entities = [...entityRoot.querySelectorAll('.deboucled-entity-key.deboucled-entity-element')];
    for (const entity of entities) {
        if (stopHighlightModeratedTopics) break;

        let key = entity.id;
        if (!moderatedTopics.has(key)) {
            entity.style.backgroundColor = '#69ceff70';
            let isModerated = await topicIsModerated(key);
            await sleep(700);
            entity.removeAttribute('style');
            moderatedTopics.set(key, isModerated);
        }
        entity.classList.toggle('deboucled-entity-moderated-key', moderatedTopics.get(key));
    }
}

