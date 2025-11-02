
///////////////////////////////////////////////////////////////////////////////////////
// SETTINGS
///////////////////////////////////////////////////////////////////////////////////////

function buildTooltip(hint, location = 'right') {
    const tooltipLocation = location === 'top' ? '' : ` data-tooltip-location="${location}"`;
    return `deboucled-data-tooltip="${hint}"${tooltipLocation}`;
}

function buildSettingsPage() {
    let bgView = document.createElement('div');
    bgView.setAttribute('id', 'deboucled-settings-bg-view');
    bgView.setAttribute('class', 'deboucled-settings-bg-view');
    bgView.innerHTML = '<div></div>';
    document.body.prepend(bgView);
    document.querySelector('#deboucled-settings-bg-view').style.display = 'none';
    const collapsibleMaxHeight = 'style="max-height: max-content; overflow: visible;"';

    function addToggleOption(title, optionId, defaultValue, hint, enabled = true, isSubCell = false, hintLocation = 'right', toggleColor = 'blue') {
        let html = '';
        html += `<tr id="${optionId}-container"${enabled ? '' : 'class="deboucled-disabled"'}>`;
        html += `<td class="deboucled-td-left${isSubCell ? ' deboucled-option-table-subcell' : ''}">`;
        html += `<span ${buildTooltip(hint, hintLocation)}>${title}</span>`;
        html += '</td>';
        html += `<td class="deboucled-td-right">`;
        html += '<label class="deboucled-switch">';
        let checkedStr = store.get(optionId, defaultValue) ? 'checked' : '';
        html += `<input type="checkbox" id="${optionId}" ${checkedStr}></input>`;
        html += `<span class="deboucled-toggle-slider round ${toggleColor}"></span>`;
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
        let value = parseInt(store.get(optionId, defaultValue));
        html += `<input type="range" id="${optionId}" min="${minValue}" max="${maxValue}" value="${value}" step="${step}" class="deboucled-range-slider">`;
        html += `<span class="deboucled-range-title-value" id="${optionId}-value">${value}</span>`;
        html += '</tr>';
        return html;
    }
    function addDropdownOption(title, optionId, hint, defaultValue, values, className) {
        let html = '';
        html += '<tr>';
        html += '<td class="deboucled-td-left">'; // style="vertical-align: top;">';
        html += `<span${className ? ` class="${className}"` : ''} ${buildTooltip(hint)}>${title}</span>`;
        html += '</td>';
        html += '<td class="deboucled-td-right">';
        html += '<span class="deboucled-dropdown select">';
        html += `<select class="deboucled-dropdown" id="${optionId}">`;
        let selectedOption = store.get(optionId, defaultValue);
        values.forEach(function (value, key) {
            let selected = selectedOption === key ? ' selected' : '';
            html += `<option class="deboucled-dropdown-option" value="${key}"${selected}>${value}</option>`;
        });
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
        html += `<span ${buildTooltip('Exportez ou importer vos paramètres et/ou vos listes noires.')}>Restaurer/sauvegarder les paramètres</span>`;
        html += '</td>';
        html += '<td class="deboucled-td-left">';
        html += '<label for="deboucled-import-button" class="btn deboucled-button deboucled-setting-button">Restaurer</label>';
        html += '<input type="file" accept="application/JSON" id="deboucled-import-button" style="display: none;"></input>';
        html += '<span id="deboucled-export-button" class="btn deboucled-button deboucled-setting-button">Sauvegarder</span>';
        html += '<span id="deboucled-import-tbl" class="btn deboucled-button deboucled-setting-button" style="min-width: 10rem;">Importer TotalBlacklist</span>';
        html += '</td>';
        html += '<td class="deboucled-td-right info" style="white-space: nowrap;">';
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
        html += '<span class="deboucled-toggle-title-right">Uniquement les listes noires</span>';

        html += '<label class="deboucled-switch little">';
        html += '<input type="checkbox" id="deboucled-impexp-mergebl"></input>';
        html += '<span class="deboucled-toggle-slider little round"></span>';
        html += '</label>';
        html += '<span class="deboucled-toggle-title-right">Fusionner les listes noires</span>';

        html += '</td>';
        html += '</tr>';
        return html;
    }

    function addOptionsSection(sectionIsActive) {
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">OPTIONS</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-options-collapsible-content" ${sectionIsActive ? collapsibleMaxHeight : ''}>`;
        html += '<div class="deboucled-setting-content">';

        html += '<div class="deboucled-setting-credits">';

        /*
        const jvcLogo = '<span class="deboucled-jvc-logo"></span>';
        // html += `<a class="deboucled-about-link-jvc" href="https://www.jeuxvideo.com/forums/42-51-68410257-1-0-1-0-officiel-deboucled-v2-est-arrive-fini-la-boucle-et-le-spam.htm" target="_blank" title="Topic officiel JVC">${jvcLogo}</a>`;
        html += `<a class="deboucled-about-link-jvc" href="https://www.jeuxvideo.com/messages-prives/nouveau.php?all_dest=Rand0max4" target="_blank" title="Me contacter par MP">${jvcLogo}</a>`;
        */

        const githubLogo = '<span class="deboucled-svg-github"><svg width="20px" viewBox="0 0 16 16" id="deboucled-github-logo"><use href="#githublogo"/></svg></span>';
        html += `<a class="deboucled-about-link-github" href="${deboucledRepositoryUrl}" target="_blank" title="Github officiel Déboucled">${githubLogo}</a>`;

        /*
        const jvarchiveLogo = '<span class="deboucled-jvarchive-logo"></span>';
        html += `<a class="deboucled-about-link-jvarchive" href="${jvarchiveUrl}" target="_blank" title="JvArchive">${jvarchiveLogo}</a>`;
        */

        const stylishLogo = '<span class="deboucled-stylish-logo"></span>';
        html += `<a class="deboucled-about-link-stylish" href="https://userstyles.world/style/3030/jv-respawn-refined" target="_blank" title="Thème JVC par Rand0max">${stylishLogo}</a>`;

        const discordLogo = '<span class="deboucled-discord-logo"></span>';
        html += `<a class="deboucled-about-link-discord" href="https://discord.com/users/781564172483166268" target="_blank" title="Me contacter sur Discord">${discordLogo}</a>`;

        const contactLogo = '<span class="deboucled-contact-logo"></span>';
        html += `<a class="deboucled-about-link-contact" href="mailto:rand0max@protonmail.com" target="_blank" title="Me contacter par email">${contactLogo}</a>`;

        const supportLogo = '<span class="deboucled-support-logo"></span>';
        // html += `<a class="deboucled-about-link-support" href="https://commerce.coinbase.com/checkout/8ea5e4cc-cc0b-432f-852f-5cc4e30458b5" target="_blank" title="Faire un don">${supportLogo}</a>`;
        html += `<a class="deboucled-about-link-support" href="https://www.buymeacoffee.com/jvcdeboucled" target="_blank" title="Faire un don">${supportLogo}</a>`;

        html += `<span class="deboucled-about-version">v${getCurrentScriptVersion()}</span>`;
        html += '</div>';

        html += '<table class="deboucled-option-table">';

        const aiLogo = '<span class="deboucled-ai-logo"></span>';
        html += addDropdownOption(`Intelligence artificielle ${aiLogo} Anti-Boucle`,
            storage_optionAntiLoopAiMode,
            'Intelligence artificielle de détection des &quot;boucles&quot; (topics répétitifs) développée spécialement pour Déboucled.\n• Désactivé : aucune vérification sur les boucles.\n• Mode informatif : affiche une balise rouge &quot;BOUCLE&quot; à côté du sujet.\n• Mode filtrage : filtre automatiquement les sujets boucles.',
            storage_optionAntiLoopAiMode_default,
            ['Désactivé', 'Mode informatif', 'Mode filtrage'],
            'deboucled-td-main-option');

        html += addToggleOption('Masquer totalement les messages des <span class="deboucled-blacklisted">pseudos blacklist</span>', storage_optionHideMessages, storage_optionHideMessages_default, 'Permet de masquer complètement les messages d\'un pseudo dans les topics. Si l\'option est désactivée, le contenu des messages sera caché et visible après un clic sur l\'oeil.');

        const mpLogo = '<span class="deboucled-mp-logo icon-pm"></span>';
        html += addToggleOption(`Filtrer les <i>Messages Privés</i> ${mpLogo} des <i>auteurs blacklist</i>`, storage_optionBlAuthorIgnoreMp, storage_optionBlAuthorIgnoreMp_default, 'Ignorer les MPs des pseudos présents dans votre liste noire et les déplacer automatiquement dans le dossier &quot;Spam&quot;.');

        const spiralLogo = '<span class="deboucled-svg-spiral-black"><svg width="16px" viewBox="0 2 24 24" id="deboucled-spiral-logo"><use href="#spirallogo"/></svg></span>';
        html += addToggleOption(`Utiliser <i>JvArchive</i> pour <i>Pseudo boucled</i> ${spiralLogo}`, storage_optionBoucledUseJvarchive, storage_optionBoucledUseJvarchive_default, 'Quand vous cliquez sur le bouton en spirale à côté du pseudo, un nouvel onglet sera ouvert avec la liste des topics soit avec JVC soit avec JvArchive.');

        const messageLogo = '<span class="deboucled-msg-logo"></span>';
        html += addToggleOption(`Masquer les <i>messages</i> ${messageLogo} avec les <i>sujets blacklist</i>`, storage_optionBlSubjectIgnoreMessages, storage_optionBlSubjectIgnoreMessages_default, 'Masque les messages contenant les mots-clés présents dans la &quot;Blacklist Sujets&quot;.\nCliquez sur l\'oeil pour afficher le message, et les expressions blacklist apparaitront en rouge.');

        html += addToggleOption('Autoriser l\'affichage du topic à partir d\'un seuil', storage_optionAllowDisplayThreshold, storage_optionAllowDisplayThreshold_default, 'Autoriser l\'affichage des topics même si le sujet est blacklist, à partir d\'un certain nombre de messages.');

        const allowDisplayThreshold = store.get(storage_optionAllowDisplayThreshold, storage_optionAllowDisplayThreshold_default);
        html += addRangeOption('Nombre de messages minimum', storage_optionDisplayThreshold, storage_optionDisplayThreshold_default, 10, 1000, 10, 'Nombre de messages minimum dans le topic pour forcer l\'affichage.', allowDisplayThreshold, true);

        const displayHotTopics = store.get(storage_optionDisplayHotTopics, storage_optionDisplayHotTopics_default);
        const hotTopicLogo = '<span class="deboucled-fire-logo"></span>';
        html += addToggleOption(`Filtrer les <i>topics tendances</i> ${hotTopicLogo}`, storage_optionFilterHotTopics, storage_optionFilterHotTopics_default, 'Filtrer ou non les topics en tendance.', displayHotTopics, false);

        const pocLogo = '<span class="deboucled-poc-logo"></span>';
        html += addDropdownOption(`Protection contre les <i>PoC</i> ${pocLogo}`,
            storage_optionDetectPocMode,
            'Protection contre les topics &quot;post ou cancer&quot; et les dérivés.\n• Désactivé : aucune protection\n• Mode simple (rapide) : recherche dans les messages uniquement si le titre contient un indice\n• Mode approfondi (plus lent) : recherche systématiquement dans les messages et le titre\n• Mode automatique (rapide) : mode simple + masque automatiquement le topic\n• Mode auto approfondi (plus lent) : mode approfondi + masque automatiquement le topic.',
            storage_optionDetectPocMode_default,
            ['Désactivé', 'Mode simple', 'Mode approfondi ⚠', 'Mode automatique', 'Mode auto approfondi ⚠']);

        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addCustomisationSection(sectionIsActive) {
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">PERSONNALISATION</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-customisation-collapsible-content" ${sectionIsActive ? collapsibleMaxHeight : ''}>`;
        html += '<div class="deboucled-setting-content">';

        html += '<table class="deboucled-option-table">';

        const darkLogo = '<span class="deboucled-dark-logo"></span>';
        html += addToggleOption(`Utiliser le <i>thème sombre</i> ${darkLogo} pour <b>Déboucled</b>`, storage_optionEnableDeboucledDarkTheme, storage_optionEnableDeboucledDarkTheme_default, 'Permet de basculer entre le thème normal et le thème sombre pour le script Déboucled.');

        const themeLogo = '<span class="deboucled-stylish-logo deboucled-theme-logo"></span>';
        html += addToggleOption(`Utiliser le <i>thème Déboucled Officiel</i> ${themeLogo} pour <b>JVC</b>`, storage_optionEnableJvRespawnRefinedTheme, storage_optionEnableJvRespawnRefinedTheme_default, 'Basculer entre le thème JVC normal, et le thème officiel Déboucled. (pensez à rafraichir la page pour voir les changements)');

        const forbiddenLogo = '<span class="deboucled-svg-forbidden-black"><svg viewBox="0 0 180 180" id="deboucled-forbidden-logo" class="deboucled-logo-forbidden"><use href="#forbiddenlogo"/></svg></span>';
        html += addToggleOption(`Afficher les boutons pour <i>Blacklist le topic</i> ${forbiddenLogo}`, storage_optionDisplayBlacklistTopicButton, storage_optionDisplayBlacklistTopicButton_default, 'Afficher ou non le bouton rouge à droite des sujets pour ignorer les topics souhaités.');

        const blackTopicLogo = '<span class="topic-img deboucled-topic-black-logo" style="display: inline-block; vertical-align: middle;"></span>';
        html += addToggleOption(`Afficher le pictogramme pour les <i>topics noirs</i> ${blackTopicLogo}`, storage_optionDisplayBlackTopic, storage_optionDisplayBlackTopic_default, 'Afficher les topics de plus de 100 messages avec le pictogramme noir (en plus du jaune, rouge, résolu, épinglé etc).');

        const previewLogo = '<span><svg width="16px" viewBox="0 0 30 30" id="deboucled-preview-logo"><use href="#previewlogo"/></svg></span>';
        html += addToggleOption(`Afficher les boutons pour avoir un <i>aperçu du topic</i> ${previewLogo}`, storage_optionPrevisualizeTopic, storage_optionPrevisualizeTopic_default, 'Afficher ou non l\'icone \'loupe\' à côté du sujet pour prévisualiser le topic au survol.');

        const matchesLogo = '<span class="deboucled-list-logo"></span>';
        html += addToggleOption(`Afficher les <i>détails du filtrage</i> ${matchesLogo} des topics`, storage_optionDisplayTopicMatches, storage_optionDisplayTopicMatches_default, 'Afficher ou non le tableau des détails de filtrage des topics sur la droite de la page.');

        let optionDisplayTopicMatches = store.get(storage_optionDisplayTopicMatches, storage_optionDisplayTopicMatches_default);
        const eyeLogo = '<span class="deboucled-eye-logo"></span>';
        html += addToggleOption(`Cliquer sur l'oeil ${eyeLogo} pour <i>afficher les détails</i>`, storage_optionClickToShowTopicMatches, storage_optionClickToShowTopicMatches_default, 'Affiche par défaut l\'icone en oeil, nécéssite de cliquer pour afficher le détail du filtrage par catégorie.', optionDisplayTopicMatches, true);

        const statsLogo = '<span class="deboucled-chart-logo"></span>';
        html += addToggleOption(`Afficher les <i>statistiques de filtrage</i> ${statsLogo} des topics`, storage_optionDisplayTopicCharts, storage_optionDisplayTopicCharts_default, 'Afficher ou non le graphique des tendances de filtrage de topics sur la droite de la page.');

        html += addToggleOption(`Afficher le nombre de <i>topics ignorés</i> dans l'entête`, storage_optionDisplayTopicIgnoredCount, storage_optionDisplayTopicIgnoredCount_default, 'Afficher ou non le nombre de topics ignorés dans l\'entête de la liste des sujets : &quot;SUJETS (X IGNORÉS)&quot; .');

        const badgeLogo = `<span class="deboucled-badge deboucled-badge-blacklist ${preferDarkTheme() ? ' dark' : ''}" style="vertical-align:bottom;">BADGES</span>`;
        html += addToggleOption(`Afficher les ${badgeLogo} des auteurs en liste noire`, storage_optionDisplayBadges, storage_optionDisplayBadges_default, 'Afficher ou non les badges des pseudos présents dans les listes noires.');

        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addEnhancementSection(sectionIsActive) {
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">AMÉLIORATIONS</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-enhancement-collapsible-content" ${sectionIsActive ? collapsibleMaxHeight : ''}>`;
        html += '<div class="deboucled-setting-content">';

        html += '<table class="deboucled-option-table">';

        html += addToggleOption('Uniformiser et nettoyer les <i>titres des topics</i>', storage_optionRemoveUselessTags, storage_optionRemoveUselessTags_default, 'Uniformise le titre des topics et efface les balises inutiles/répétitives comme [ALERTE], ou l\'usage abusif du &quot;AYA&quot; et ses dérivés.\n\nExemple : &quot;[ALERTE] cet EXEMPLE incroyable AYAAAA&quot; => &quot;Cet exemple incroyable&quot;');

        const quoteRoundLogo = '<span class="deboucled-quoteround-logo settings"></span>';
        html += addToggleOption(`Recevoir les <i>notifications</i> ${quoteRoundLogo} de citation`, storage_optionGetMessageQuotes, storage_optionGetMessageQuotes_default, 'Recevoir ou non les notifications lorsque quelqu\'un cite vos messages.');

        const scrollLogo = '<span class="deboucled-scroll-logo"></span>';
        html += addToggleOption(`Activer le <i>défilement automatique</i> ${scrollLogo} des messages`, storage_optionSmoothScroll, storage_optionSmoothScroll_default, 'Activer le chargement automatique des messages du topic en faisant défiler la page vers le bas.');

        const hotTopicLogo = '<span class="deboucled-fire-logo"></span>';
        html += addToggleOption(`Mettre en avant les <i>topics tendances</i> ${hotTopicLogo}`, storage_optionDisplayHotTopics, storage_optionDisplayHotTopics_default, 'Afficher un pictogramme de flamme à côté des topics très actifs.');

        html += addToggleOption(`Masquer une partie des <i>messages trop longs</i>`, storage_optionHideLongMessages, storage_optionHideLongMessages_default, 'Si cette option est activée, le contenu des longs messages sera masqué et un bouton &quot;lire la suite&quot; apparaitra.');

        const smileyLogo = '<img src="https://image.jeuxvideo.com/smileys_img/26.gif" style="vertical-align: bottom;"></img>';
        html += addToggleOption(`Intégrer les <i>smileys JVC</i> ${smileyLogo} dans les titres`, storage_optionDisplayTitleSmileys, storage_optionDisplayTitleSmileys_default, 'Permet d\'intégrer les smileys JVC dans les titres des topics.');

        const avatarLogo = '<img src="https://image.jeuxvideo.com/avatar-xs/default.jpg" class="deboucled-avatar-logo"></img>';
        html += addToggleOption(`Afficher les <i>avatars</i> ${avatarLogo} des auteurs`, storage_optionDisplayTopicAvatar, storage_optionDisplayTopicAvatar_default, 'Afficher ou non les avatars des auteurs dans la liste des topics.');

        const twitterLogo = '<span class="deboucled-twitter-logo"></span>';
        html += addToggleOption(`Intégrer <i>Twitter</i> ${twitterLogo} dans les messages`, storage_optionEmbedTwitter, storage_optionEmbedTwitter_default, 'Intègre automatiquement les miniatures de Tweet dans les messages. ⚠ Attention ⚠ certains bloqueurs de pub peuvent empêcher les tweets de s\'afficher.');

        html += addToggleOption(`Intégrer les vidéos dans les messages`, storage_optionEmbedVideos, storage_optionEmbedVideos_default, 'Intègre automatiquement les vidéos (Streamable, YouTube, etc) dans les messages.');


        const quoteLogo = '<span class="deboucled-quote-logo"></span>';
        html += addToggleOption(`Améliorer les <i>citations</i> ${quoteLogo} des messages`, storage_optionEnhanceQuotations, storage_optionEnhanceQuotations_default, 'Améliore les citations avec plusieurs fonctionnalités :\n\n• Insère le pseudo du message cité\n• Citer une partie des messages en sélectionnant le texte\n• Citer et suggérer des pseudos en écrivant avec l\'arobase @ (conditions : connecté et minimum 3 lettres)\n• Mettre en couleur les pseudos lorsqu\'ils sont cités');

        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addDecensuredSection(sectionIsActive) {
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">DÉCENSURED</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-decensured-collapsible-content" ${sectionIsActive ? collapsibleMaxHeight : ''}>`;
        html += '<div class="deboucled-setting-content">';

        html += '<table class="deboucled-option-table">';

        const lockLogo = '🔓';
        html += addToggleOption(`Activer <i>Décensured</i> ${lockLogo}`, storage_optionEnableDecensured, storage_optionEnableDecensured_default, 'Active les fonctionnalités de messages chiffrés et masqués. Permet de poster des messages visibles uniquement par les utilisateurs de Déboucled qui ont cette option activée.');

        let optionEnableDecensured = store.get(storage_optionEnableDecensured, storage_optionEnableDecensured_default);

        const autoLogo = '⚡';
        html += addToggleOption(`Déchiffrement ${autoLogo} automatique`, storage_optionAutoDecryptMessages, storage_optionAutoDecryptMessages_default, 'Déchiffre automatiquement les messages masqués lors du chargement de la page.', optionEnableDecensured, true);

        const topicLogo = '📋';
        html += addToggleOption(`Activer les ${topicLogo} topics masqués`, storage_optionEnableDecensuredTopics, storage_optionEnableDecensuredTopics_default, 'Active la possibilité de créer des topics avec des messages masqués et de les mettre en évidence.', optionEnableDecensured, true);

        const widgetLogo = '📑';
        html += addToggleOption(`Afficher le widget ${widgetLogo} flottant`, storage_optionDisplayDecensuredWidget, storage_optionDisplayDecensuredWidget_default, 'Affiche un widget flottant avec le chat en temps réel et les derniers topics Décensured créés.', optionEnableDecensured, true);

        const chatLogo = '💬';
        html += addToggleOption(`Activer le ${chatLogo} chat en temps réel`, storage_optionEnableDecensuredChat, storage_optionEnableDecensuredChat_default, 'Active le chat en temps réel Décensured pour communiquer avec les autres utilisateurs en direct.', optionEnableDecensured, true);

        const peopleLogo = '👥';
        html += addToggleOption(`Afficher le ${peopleLogo} nombre de connectés`, storage_optionDisplayDecensuredUsersCount, storage_optionDisplayDecensuredUsersCount_default, 'Affiche dans le header le nombre d\'utilisateurs Décensured actuellement connectés.', optionEnableDecensured, true);

        const badgeLogo = '<span class="deboucled-decensured-premium-logo settings"></span>';
        html += addToggleOption(`Afficher les ${badgeLogo} utilisateurs Décensured`, storage_optionEnableDecensuredBadges, storage_optionEnableDecensuredBadges_default, 'Affiche un petit badge à côté du pseudo des utilisateurs qui utilisent aussi Déboucled pour les messages masqués.', optionEnableDecensured, true);

        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addPreBouclesSection(sectionIsActive) {
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">LISTES PRÉDÉFINIES</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-preboucles-collapsible-content" ${sectionIsActive ? collapsibleMaxHeight : ''}>`;
        html += '<div class="deboucled-setting-content">';

        html += '<div class="deboucled-preboucle-header">';

        const titleTooltip = buildTooltip('Cochez les catégories que vous souhaitez filtrer sur le forum.\nPassez la souris ou cliquez sur les intitulés de catégorie pour voir les mots-clés qui seront utilisés.', 'bottom');
        html += `<span class="deboucled-preboucle-title" ${titleTooltip}>Listes anti-boucle prédéfinies</span>`;

        const lastUpdate = formatDateToFrenchFormat(new Date(store.get(storage_prebouclesLastUpdate)));
        const refreshTooltip = buildTooltip(`Dernière mise à jour : ${lastUpdate}`, 'left');
        html += `<span class="deboucled-svg-refresh" ${refreshTooltip}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke="currentColor" id="deboucled-refresh-logo"><use href="#refreshlogo"/></svg></span>`;

        html += '</div>';

        html += '<table class="deboucled-option-table" id="deboucled-preboucles-table">';
        html += buildPrebouclesTable();
        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addEntitySettingSection(entity, header, hint, messageHint, sectionIsActive) {
        let html = '';
        html += `<div class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">${header}</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-${entity}-collapsible-content" ${sectionIsActive ? collapsibleMaxHeight : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<table class="deboucled-option-table-entities">';
        html += '<tr>';
        html += '<td class="deboucled-td-entity-menu">';
        html += `<input type="text" id="deboucled-${entity}-input-key" class="deboucled-input-key" placeholder="${hint}" >`;
        html += `<span id="deboucled-${entity}-input-button" class="btn deboucled-button deboucled-add-button">Ajouter</span>`;
        if (messageHint) html += `<span class="deboucled-entity-message-hint">${messageHint}</span>`;
        html += `<input type="search" id="deboucled-${entity}-search-key" class="deboucled-input-search" placeholder="Rechercher..." >`;
        html += '</td>';
        html += '</tr>';
        html += '<td class="deboucled-td-entity-submenu">';
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
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-advancedoptions-collapsible-content" ${sectionIsActive ? collapsibleMaxHeight : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<table class="deboucled-option-table">';

        const vinzLogo = '<span class="deboucled-vinz-logo"></span>';
        html += addToggleOption(`Algorithme de filtrage <i>anti-Vinz</i> ${vinzLogo}`, storage_optionAntiVinz, storage_optionAntiVinz_default, 'Algorithme intelligent pour éradiquer totalement Vinz et sa boucle infernale, en dépit de ses tentatives d\'évitement.');

        const spamLogo = '<span class="deboucled-spam-logo"></span>';
        html += addToggleOption(`Algorithme <i>anti-spam et publicité</i> ${spamLogo}`, storage_optionAntiSpam, storage_optionAntiSpam_default, 'Algorithme pour blacklister automatiquement les spammeurs (publicité Youtube).');

        const resolvedLogo = '<span class="deboucled-topic-resolved-logo"></span>';
        html += addToggleOption(`Remplacer le pictogramme ${resolvedLogo} <i>résolu</i> des topics`, storage_optionReplaceResolvedPicto, storage_optionReplaceResolvedPicto_default, 'Remplacer le pictogramme résolu sur la gauche des topics par le picto normal (jaune, rouge, verrouillé, etc).');

        const blJvcLogo = '<span class="picto-msg-tronche deboucled-blacklist-jvc-button" style="width: 13px;height: 13px;background-size: 13px;"></span>';
        html += addToggleOption(`Afficher le bouton <i>Blacklist pseudo</i> ${blJvcLogo} de JVC`, storage_optionShowJvcBlacklistButton, storage_optionShowJvcBlacklistButton_default, 'Afficher ou non le bouton blacklist original de JVC à côté du nouveau bouton blacklist de Déboucled.');

        html += addRangeOption('Nombre de topics à afficher sur la page', storage_optionMaxTopicCount, storage_optionMaxTopicCount_default, defaultTopicCount, 50, 1, 'Nombre de topics à afficher sur la page (25 par défaut).', true, false);

        html += addToggleOption('Filtrer les topics en dessous d\'un nombre de messages', storage_optionEnableTopicMsgCountThreshold, storage_optionEnableTopicMsgCountThreshold_default, 'Filtrer automatiquement les topics qui n\'ont pas le nombre minimum de messages voulu.');

        let enableTopicMsgCountThreshold = store.get(storage_optionEnableTopicMsgCountThreshold, storage_optionEnableTopicMsgCountThreshold_default);
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
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-stats-collapsible-content" ${sectionIsActive ? collapsibleMaxHeight : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<table class="deboucled-option-table">';
        let totalHiddenSubjects = store.get(storage_totalHiddenSubjects, '0');
        let totalHiddenAuthors = store.get(storage_totalHiddenAuthors, '0');
        let totalHiddenTopicIds = store.get(storage_totalHiddenTopicIds, '0');
        let totalHiddenMessages = store.get(storage_totalHiddenMessages, '0');
        let totalHiddenPrivateMessages = store.get(storage_totalHiddenPrivateMessages, '0');
        let totalHiddenSpammers = store.get(storage_totalHiddenSpammers, '0');
        let totalHidden = parseInt(totalHiddenSubjects + totalHiddenAuthors + totalHiddenTopicIds + totalHiddenMessages + totalHiddenPrivateMessages + totalHiddenSpammers);
        html += addStat('Sujets ignorés', totalHiddenSubjects);
        html += addStat('Pseudos ignorés', totalHiddenAuthors);
        html += addStat('Topics ignorés', totalHiddenTopicIds);
        html += addStat('Messages ignorés', totalHiddenMessages);
        html += addStat('Messages privés ignorés', totalHiddenPrivateMessages);
        html += addStat('Spammeurs ignorés', totalHiddenSpammers);
        html += addStat('Total ignorés', totalHidden);
        html += '</table>';
        html += '</div>';
        html += '</div>';
        return html;
    }
    function addChangelogSection(sectionIsActive) {
        let html = '';
        html += `<div id="deboucled-changelog-section" class="deboucled-bloc-header deboucled-collapsible${sectionIsActive ? ' deboucled-collapsible-active' : ''}">CHANGELOG</div>`;
        html += `<div class="deboucled-bloc deboucled-collapsible-content" id="deboucled-changelog-collapsible-content" ${sectionIsActive ? collapsibleMaxHeight : ''}>`;
        html += '<div class="deboucled-setting-content">';
        html += '<pre id="deboucled-changelog" style="white-space: pre-wrap; word-wrap: break-word; max-width: 100%;">';
        html += '</pre>';
        html += '</div>';
        html += '</div>';
        return html;
    }

    let settingsHtml = '';
    settingsHtml += addOptionsSection(false);
    settingsHtml += addCustomisationSection(false);
    settingsHtml += addEnhancementSection(false);
    settingsHtml += addDecensuredSection(false);
    settingsHtml += addPreBouclesSection(firstLaunch);
    settingsHtml += addEntitySettingSection(entitySubject, 'LISTE NOIRE - SUJETS', 'Mot-clé', 'Utilisez le caractère étoile * pour remplacer n\'importe quelle expression.', !firstLaunch);
    settingsHtml += addEntitySettingSection(entityAuthor, 'LISTE NOIRE - AUTEURS', 'Pseudo', undefined, false);
    settingsHtml += addEntitySettingSection(entityTopicId, 'LISTE NOIRE - TOPICS', 'TopicId', undefined, false);
    settingsHtml += addAdvancedOptionsSection(false);
    settingsHtml += addStatsSection(false);
    settingsHtml += addChangelogSection(false);

    let settingsView = document.createElement('div');
    settingsView.setAttribute('id', 'deboucled-settings-view');
    settingsView.setAttribute('class', 'deboucled-settings-view');
    settingsView.innerHTML = settingsHtml;
    document.body.prepend(settingsView);

    addSettingEvents();

    addImportExportEvent();

    addCollapsibleEvents();

    buildSettingEntities();

    addChangeLogEvent()

    settingsLoaded = true;
}

function addChangeLogEvent() {
    document.querySelector('#deboucled-changelog-section').addEventListener('click', fetchChangelog);
}

async function fetchChangelog() {
    if (fetchedChangelog) return;
    await fetch(apiChangelogUrl)
        .then(response => response.text())
        .then(data => {
            //data = data.split('\n').slice(0, 100).join('\n');
            document.querySelector('#deboucled-changelog').innerHTML = data;
            document.querySelector('#deboucled-changelog-collapsible-content').style.maxHeight = 'max-content';
            fetchedChangelog = true;
        });
}

function addToggleEvent(id, setValue = true, callback = undefined) {
    const toggleSlider = document.querySelector('#' + id);
    if (!toggleSlider) return;
    toggleSlider.oninput = (e) => {
        const checked = e.currentTarget.checked;
        if (setValue) store.set(id, checked);
        if (callback) callback(checked);
    };
}

function addRangeEvent(id) {
    const rangeSlider = document.querySelector('#' + id);
    rangeSlider.oninput = function () {
        store.set(id, parseInt(this.value));
        document.querySelector(`#${id}-value`).innerHTML = this.value;
    };
}

function addSelectEvent(id) {
    const select = document.querySelector('#' + id);
    select.oninput = (e) => {
        store.set(id, parseInt(e.currentTarget.value));
    };
}

function addSettingEvents() {
    const boucleUrl = 'https://www.youtube.com/watch?v=KkxZfUlNlDo';
    //const boucleUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    //const boucleUrl = 'https://www.jeuxvideo.com/forums/42-51-62052373-1-0-1-0-ce-forum-est-une-putain-de-boucle-temporelle-sans-fin.htm';
    document.querySelector('.deboucled-about-version').onclick = () => window.open(boucleUrl, '_blank').focus();

    document.querySelector('.deboucled-svg-refresh').onclick = forceApiDataRefresh;

    addToggleEvent(storage_optionEnableDeboucledDarkTheme, undefined, toggleDeboucledDarkTheme);
    addToggleEvent(storage_optionEnableJvRespawnRefinedTheme);
    addSelectEvent(storage_optionAntiLoopAiMode);
    addToggleEvent(storage_optionHideMessages);
    addToggleEvent(storage_optionBlAuthorIgnoreMp);
    addToggleEvent(storage_optionBlSubjectIgnoreMessages);
    addToggleEvent(storage_optionBoucledUseJvarchive);
    addToggleEvent(storage_optionDisplayBlacklistTopicButton);
    addToggleEvent(storage_optionDisplayBlackTopic);
    addToggleEvent(storage_optionPrevisualizeTopic);
    addToggleEvent(storage_optionDisplayHotTopics, undefined, function () {
        document.querySelectorAll(`[id = ${storage_optionFilterHotTopics}-container]`).forEach(function (el) {
            el.classList.toggle('deboucled-disabled');
        });
    });
    addToggleEvent(storage_optionShowJvcBlacklistButton);
    addToggleEvent(storage_optionDisplayTopicCharts);
    addToggleEvent(storage_optionDisplayTopicMatches, undefined, function () {
        document.querySelectorAll(`[id = ${storage_optionClickToShowTopicMatches}-container]`).forEach(function (el) {
            el.classList.toggle('deboucled-disabled');
        });
    });
    addToggleEvent(storage_optionClickToShowTopicMatches);
    addToggleEvent(storage_optionAllowDisplayThreshold, undefined, function () {
        document.querySelectorAll(`[id = ${storage_optionDisplayThreshold}-container]`).forEach(function (el) {
            el.classList.toggle('deboucled-disabled');
        });
    });
    addToggleEvent(storage_optionRemoveUselessTags);
    addToggleEvent(storage_optionEnhanceQuotations);
    addRangeEvent(storage_optionDisplayThreshold);
    addRangeEvent(storage_optionMaxTopicCount);
    addSelectEvent(storage_optionDetectPocMode);

    addToggleEvent(storage_optionAntiVinz);
    addToggleEvent(storage_optionAntiSpam);
    addToggleEvent(storage_optionSmoothScroll);
    addToggleEvent(storage_optionReplaceResolvedPicto);
    addToggleEvent(storage_optionEnableTopicMsgCountThreshold, undefined, function () {
        document.querySelectorAll(`[id = ${storage_optionTopicMsgCountThreshold}-container]`).forEach(function (el) {
            el.classList.toggle('deboucled-disabled');
        });
    });
    addRangeEvent(storage_optionTopicMsgCountThreshold);
    addToggleEvent(storage_optionDisplayTopicIgnoredCount);
    addToggleEvent(storage_optionHideLongMessages);
    addToggleEvent(storage_optionDisplayTitleSmileys);
    addToggleEvent(storage_optionDisplayTopicAvatar);
    addToggleEvent(storage_optionHideAvatarBorder);
    addToggleEvent(storage_optionEmbedVideos);
    addToggleEvent(storage_optionEmbedTwitter);
    addToggleEvent(storage_optionDisplayBadges);
    addToggleEvent(storage_optionGetMessageQuotes);
    addToggleEvent(storage_optionFilterHotTopics);

    addToggleEvent(storage_optionEnableDecensured, undefined, function () {
        const decensuredSubOptions = [
            `${storage_optionEnableDecensuredBadges}-container`,
            `${storage_optionAutoDecryptMessages}-container`,
            `${storage_optionDisplayDecensuredUsersCount}-container`,
            `${storage_optionDisplayDecensuredWidget}-container`,
            `${storage_optionEnableDecensuredTopics}-container`,
            `${storage_optionEnableDecensuredChat}-container`
        ];

        decensuredSubOptions.forEach(optionId => {
            document.querySelectorAll(`[id="${optionId}"]`).forEach(function (el) {
                el.classList.toggle('deboucled-disabled');
            });
        });
    });

    addToggleEvent(storage_optionEnableDecensuredBadges, undefined, function () {
        toggleDecensuredBadgesDisplay();
    });
    addToggleEvent(storage_optionAutoDecryptMessages);
    addToggleEvent(storage_optionDisplayDecensuredUsersCount, undefined, function () {
        toggleDecensuredUsersCountDisplay();
    });
    addToggleEvent(storage_optionDisplayDecensuredWidget, undefined, function () {
        toggleDecensuredFloatingWidget();
    });
    addToggleEvent(storage_optionEnableDecensuredTopics);
    addToggleEvent(storage_optionEnableDecensuredChat, undefined, function () {
        const isEnabled = store.get(storage_optionEnableDecensuredChat, storage_optionEnableDecensuredChat_default);
        if (!isEnabled) {
            destroyDecensuredChat();
            updateChatStatusWhenDisabled();
        } else {
            initializeDecensuredChat();
        }
    });

    addPrebouclesEvents();
}

function addPrebouclesEvents() {
    preBoucleArray.forEach(b => {
        const inputId = `deboucled-preboucle-${b.id}-input`;
        addToggleEvent(inputId, false, function (checked) {
            togglePreBoucleStatus(b.id, checked);
            savePreBouclesStatuses();
        });
        document.querySelector(`#deboucled-preboucle-${b.id}-title`).onclick = () => document.querySelector(`#${inputId}`)?.click();
    });
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
    document.querySelector('#deboucled-import-button').oninput = (fe) => loadFile(fe);
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
                let content = activeEl.nextElementSibling;
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
                content.style.overflow = 'visible';
                view.removeAttribute('style');
            }
        };
    });
}

function buildPrebouclesTable() {

    function addTogglePreboucle(title, optionId, defaultValue, hint) {
        let html = '';
        html += `<tr id="${optionId}-container">`;
        html += `<td class="deboucled-td-left full-width">`;
        html += `<span id="${optionId}-title" class="data-tooltip-large" ${buildTooltip(hint)}>${title}</span>`;
        html += '</td>';
        html += `<td class="deboucled-td-right deboucled-td-right-padding">`;
        html += '<label class="deboucled-switch">';
        let checkedStr = store.get(optionId, defaultValue) ? 'checked' : '';
        html += `<input type="checkbox" id="${optionId}-input" ${checkedStr}></input>`;
        html += '<span class="deboucled-toggle-slider round"></span>';
        html += '</label>';
        html += '</td>';
        html += '</tr>';
        return html;
    }

    let html = '';
    preBoucleArray.forEach(b => {
        let hint = `${getEntityTitle(b.type)} : ${b.entities.sort().slice(0, 120).join(', ')}`;
        if (b.entities.length > 120) hint += ' ...';
        let titleLogo = '';
        if (b.type === entitySubject) titleLogo = '<span class="deboucled-preboucle-subject-logo"></span>';
        else if (b.type === entityAuthor) titleLogo = '<span class="deboucled-preboucle-author-logo"></span>';
        html += addTogglePreboucle(`${titleLogo}${b.title}`, `deboucled-preboucle-${b.id}`, b.enabled, hint);
    });
    return html;
}

function buildSettingEntities() {
    const regexAllowedSubject = /^[A-z0-9\u0020-\u007E\u2018-\u201F\u00A1-\u02AF\u2700-\u27BF\u20A0-\u20CF\u{1F300}-\u{1FAD6}]*$/iu;
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

    addClearListButton(entitySubject, () => subjectBlacklistArray.splice(0, subjectBlacklistArray.length), refreshSubjectKeys);
    addClearListButton(entityAuthor, () => authorBlacklistArray.splice(0, authorBlacklistArray.length), refreshAuthorKeys);
    addClearListButton(entityTopicId, () => topicIdBlacklistMap.clear(), refreshTopicIdKeys);

    addHighlightModeratedButton();

    refreshEntityCounts();

    addSortEvent();
}

function writeEntityKeys(entity, entries, filterCallback, removeCallback, entityClassCallback, sortCallback) {
    if (filterCallback) entries = filterCallback(entries);
    if (sortCallback) entries = sortCallback(entries);

    let html = '<table class="deboucled-entity-list">';
    entries.forEach(function (value, key) {
        let cls = entityClassCallback ? entityClassCallback(key, value) : '';
        html += `<td class="deboucled-entity-key deboucled-entity-element${cls}" id="${key}"><input type="submit" class="deboucled-${entity}-button-delete-key" value="X">${value}</td>`;
    });
    html += '</table>';

    const deboucledEntityList = document.querySelector(`#deboucled-${entity}List`);
    if (deboucledEntityList) deboucledEntityList.innerHTML = html;

    document.querySelectorAll(`.deboucled-${entity}-button-delete-key`).forEach(function (input) {
        input.onclick = function () { removeCallback(this.parentNode); };
    });
}

function refreshSubjectKeys(filter = null) {
    let sortCallback = null;
    switch (sortModeSubject) {
        case 1:
            sortCallback = (array) => array.sortNormalize();
            break;
        case 2:
            sortCallback = (array) => array.sortNormalize().reverse();
            break;
    }

    loadPreboucleArrayCache(entitySubject);

    writeEntityKeys(
        entitySubject,
        [...subjectBlacklistArray],
        filter ? (array) => array.filter((value) => normalizeValue(value).includes(filter)) : null,
        async function (node) {
            await removeEntityBlacklist(subjectBlacklistArray, node.textContent);
            refreshSubjectKeys();
            refreshCollapsibleContentHeight(entitySubject);
            clearSearchInputs();
        },
        (key, value) => isEntityInPreboucles(entitySubject, value) ? ' deboucled-entity-pre-element' : '',
        sortCallback
    );
}

function refreshAuthorKeys(filter = null) {
    let sortCallback = null;
    switch (sortModeAuthor) {
        case 1:
            sortCallback = (array) => array.sortNormalize();
            break;
        case 2:
            sortCallback = (array) => array.sortNormalize().reverse();
            break;
    }

    loadPreboucleArrayCache(entityAuthor);

    writeEntityKeys(
        entityAuthor,
        [...authorBlacklistArray],
        filter ? (array) => array.filter((value) => normalizeValue(value).includes(filter)) : null,
        async function (node) {
            await removeEntityBlacklist(authorBlacklistArray, node.textContent);
            refreshAuthorKeys();
            refreshCollapsibleContentHeight(entityAuthor);
            clearSearchInputs();
        },
        (key, value) => isEntityInPreboucles(entityAuthor, value) ? ' deboucled-entity-pre-element' : '',
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
            await removeTopicIdBlacklist(node.getAttribute('id'));
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

function addSettingButton() {
    function createDeboucledButton() {
        let button = document.createElement('button');
        button.setAttribute('id', 'deboucled-option-button');
        button.setAttribute('class', `btn deboucled-button deboucled-option-button${firstLaunch ? ' blinking' : ''}`);
        button.innerHTML = 'Déboucled';
        return button;
    }

    let blocMenu = document.querySelectorAll('.bloc-pre-right');
    if (blocMenu.length === 0) blocMenu = document.querySelectorAll('div:not(.pagination) > .action-right');
    blocMenu.forEach(e => { e.prepend(createDeboucledButton()); });

    let optionOnclick = function (e) {
        e.preventDefault();
        if (!settingsLoaded) buildSettingsPage();
        clearEntityInputs();
        showSettings();
    };
    document.querySelectorAll('#deboucled-option-button').forEach(e => { e.onclick = optionOnclick; });

    window.onclick = function (e) {
        const deboucledBg = document.querySelector('#deboucled-settings-bg-view');
        if (!deboucledBg) return;
        if (!deboucledBg.contains(e.target)) return;
        hideSettings();
    };
    window.onkeydown = function (e) {
        const deboucledBg = document.querySelector('#deboucled-settings-bg-view');
        if (!deboucledBg) return;
        if (!deboucledBg.contains(e.target) && e.key !== 'Escape') return;
        hideSettings();
    };
}

function addSearchFilterToggle() {
    let optionFilterResearch = store.get(storage_optionFilterResearch, storage_optionFilterResearch_default);

    const formRechForum = document.querySelector('.form-rech-forum');
    if (!formRechForum) return optionFilterResearch;

    let toggleElem = document.createElement('label');
    toggleElem.className = 'deboucled-switch';
    toggleElem.title = 'Filtrer les résultats avec Déboucled';
    toggleElem.innerHTML = `<input type="checkbox" id="deboucled-search-filter-toggle" ${optionFilterResearch ? 'checked' : ''}><span class="deboucled-toggle-slider round red"></span>`;
    formRechForum.appendChild(toggleElem);

    document.querySelector('#deboucled-search-filter-toggle').oninput = (e) => {
        store.set(storage_optionFilterResearch, e.currentTarget.checked);
        window.location.reload();
    };

    return optionFilterResearch;
}

function addDisableFilteringButton() {
    const menuForumElement = document.querySelector('.menu-user-forum');
    if (!menuForumElement) return;

    const forumId = getForumId();
    if (!forumId) return;
    forumFilteringIsDisabled = filteringIsDisabled(forumId);

    const enableFilteringId = 'deboucled-enable-filtering';
    let menuChild = document.createElement('li');
    const spiralLogo = '<span class="deboucled-svg-spiral-black" style="margin-right: 7px;"><svg width="16px" viewBox="0 2 24 24" id="deboucled-spiral-logo"><use href="#spirallogo"/></svg></span>';
    menuChild.innerHTML = `<span class="float-start">${spiralLogo}Activer Déboucled sur ce forum</span><input type="checkbox" class="input-on-off" id="${enableFilteringId}"${forumFilteringIsDisabled ? '' : ' checked=""'}><label for="${enableFilteringId}" class="btn-on-off"></label>`;
    menuForumElement.appendChild(menuChild);

    const toggleFiltering = document.querySelector(`#${enableFilteringId}`);
    toggleFiltering.oninput = (e) => {

        const checked = e.currentTarget.checked; // Checked = filtrage activé
        if (checked) disabledFilteringForumSet.delete(forumId);
        else disabledFilteringForumSet.add(forumId);

        store.set(storage_disabledFilteringForums, JSON.stringify([...disabledFilteringForumSet]));
        window.location.reload();
    };
}

function showSettings() {
    let bgView = document.querySelector('#deboucled-settings-bg-view');
    bgView.style.display = 'block';

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
    document.querySelectorAll('.deboucled-input-key').forEach(el => { el.value = ''; });
}

function clearSearchInputs() {
    document.querySelectorAll('.deboucled-input-search').forEach(el => { el.value = ''; });
}

function buildSettingLinkButton(text, tooltip, className, insertSelector, onclick) {
    let anchor = document.createElement('a');
    anchor.className = `titre-bloc deboucled-entity-link-button ${className}`;
    anchor.setAttribute('role', 'button');
    anchor.setAttribute('deboucled-data-tooltip', tooltip);
    anchor.setAttribute('data-tooltip-location', 'left');
    anchor.innerHTML = text;
    anchor.onclick = onclick;
    const labelCount = document.querySelector(insertSelector);
    insertAfter(anchor, labelCount);
}

function addClearListButton(entity, clearCallback, refreshCallback) {
    buildSettingLinkButton(
        'Tout supprimer',
        'Effacer entièrement cette liste noire.',
        'deboucled-entity-clear-link-button',
        `#deboucled-${entity}-entity-count`,
        async () => {
            if (!confirm('Êtes-vous sûr de vouloir effacer l\'intégralité de cette liste noire ?')) return;
            clearCallback();
            await saveStorage();
            refreshCallback();
        }
    );
}

function addHighlightModeratedButton() {
    const buttonText = '410 ?';
    const buttonStopText = 'STOP';
    buildSettingLinkButton(
        buttonText,
        'Recherche les topics supprimés (410) et les affiche en rouge.',
        undefined,
        '#deboucled-topicid-entity-count',
        async function () {
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
        }
    );
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

async function forceApiDataRefresh() {
    const button = document.querySelector('.deboucled-svg-refresh');
    button.onclick = undefined;

    const refreshLogo = document.querySelector('#deboucled-refresh-logo');
    if (!refreshLogo) return;
    refreshLogo.onanimationend = () => refreshLogo.classList.toggle('rotate', false);
    refreshLogo.classList.toggle('rotate', true);

    await refreshApiData(true);

    const lastUpdate = formatDateToFrenchFormat(new Date(store.get(storage_prebouclesLastUpdate)));
    this.setAttribute('deboucled-data-tooltip', `Dernière mise à jour : ${lastUpdate}`);

    const prebouclesTable = document.querySelector('#deboucled-preboucles-table');
    if (!prebouclesTable) return;
    prebouclesTable.innerHTML = buildPrebouclesTable();
    addPrebouclesEvents();

    button.classList.toggle('deboucled-disabled', true);
    await sleep(2000);
    button.onclick = forceApiDataRefresh;
    button.classList.toggle('deboucled-disabled', false);
}

