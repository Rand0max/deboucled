
///////////////////////////////////////////////////////////////////////////////////////
// RIGHT COLUMN - STATS/CHARTS
///////////////////////////////////////////////////////////////////////////////////////


function addRightBlocMatches() {
    let optionDisplayTopicMatches = store.get(storage_optionDisplayTopicMatches, storage_optionDisplayTopicMatches_default);
    if (!optionDisplayTopicMatches || (!matchedTopics.hasAny() && !matchedSubjects.hasAny() && !matchedAuthors.hasAny())) return;

    const forumRightCol = document.querySelector('#forum-right-col');
    if (!forumRightCol) return;

    function countMatchesOccurencies(matches) {
        let res = 0;
        matches.forEach((occ) => res += occ);
        return res;
    }

    const totalMatchesHidden = countMatchesOccurencies(matchedSubjects) + countMatchesOccurencies(matchedAuthors) + matchedTopics.size; // hiddenTotalTopics

    let html = '';
    html += '<div class="card card-jv-forum card-forum-margin">';
    html += `<div class="card-header">CORRESPONDANCES<span class="deboucled-card-header-right">${totalMatchesHidden} ignoré${plural(totalMatchesHidden)}</span></div>`;
    html += '<div class="card-body">';
    html += '<div class="scrollable">';
    html += '<div class="scrollable-wrapper">';
    html += '<div id="deboucled-matches-content" class="scrollable-content bloc-info-forum">';

    const formatMatch = (str) => str.replaceAll(',', '').removeDoubleSpaces().trim().capitalize();

    function formatMatches(matches, withHint, formatCallback, urlCallback) {
        let matchesSorted = matches.sortByValueThenKey(true);
        let matchesHtml = '';
        let index = 0;
        matchesSorted.forEach((occ, match) => {
            const className = `deboucled-match${index < matchesSorted.size - 1 ? ' match-after' : ''}`;
            const hint = withHint ? ` deboucled-data-tooltip="${occ} fois"` : '';
            if (urlCallback) matchesHtml += `<a class="${className}"${hint} href="${urlCallback(match, occ)}" target="_blank">${formatCallback(match, occ)}</a>`;
            else matchesHtml += `<span class="${className}"${hint}>${formatCallback(match, occ)}</span>`;
            index++;
        });
        return matchesHtml;
    }

    let optionClickToShowTopicMatches = store.get(storage_optionClickToShowTopicMatches, storage_optionClickToShowTopicMatches_default);

    function addMatches(matches, entity, title, withHint, formatCallback, urlCallback) {
        let matchesHtml = '';
        matchesHtml += `<h4 class="titre-info-fofo">${title}</h4>`;
        if (optionClickToShowTopicMatches) {
            matchesHtml += `<div id="deboucled-matches-${entity}-wrapper" class="deboucled-hide-wrapper">`;
            matchesHtml += `<span class="deboucled-eye-logo deboucled-display-matches"></span>`;
            matchesHtml += `<div id="deboucled-matched-${entity}" style="display:none;">${formatMatches(matches, withHint, formatCallback, urlCallback)}</div>`;
        }
        else {
            matchesHtml += `<div id="deboucled-matches-${entity}-wrapper">`;
            matchesHtml += `<div id="deboucled-matched-${entity}">${formatMatches(matches, withHint, formatCallback, urlCallback)}</div>`;
        }
        matchesHtml += '</div>';
        return matchesHtml;
    }

    if (matchedSubjects.hasAny()) html += addMatches(matchedSubjects, entitySubject, 'Sujets', true, (m) => formatMatch(m));
    if (matchedAuthors.hasAny()) html += addMatches(matchedAuthors, entityAuthor, 'Auteurs', true, (m) => formatMatch(m), (m) => `/profil/${m.toLowerCase()}?mode=infos`);
    if (matchedTopics.hasAny()) html += addMatches(matchedTopics, entityTopicId, 'Topics', false, (_, o) => formatMatch(o), (m) => `/forums/42-51-${m}-1-0-1-0-${buildRandomStr(6)}.htm`);

    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    let matches = document.createElement('div');
    forumRightCol.append(matches);
    matches.outerHTML = html;

    if (!optionClickToShowTopicMatches) return;

    function addMatchesToggleEvent(entity) {
        const wrapper = document.querySelector(`#deboucled-matches-${entity}-wrapper`);
        wrapper.onclick = function () {
            this.firstChild.remove();
            this.removeAttribute('class');
            document.querySelector(`#deboucled-matched-${entity}`).removeAttribute('style');
            wrapper.onclick = null;
        }
    }
    if (matchedSubjects.hasAny()) addMatchesToggleEvent(entitySubject);
    if (matchedAuthors.hasAny()) addMatchesToggleEvent(entityAuthor);
    if (matchedTopics.hasAny()) addMatchesToggleEvent(entityTopicId);
}

function addRightBlocStats() {
    let optionDisplayTopicCharts = store.get(storage_optionDisplayTopicCharts, storage_optionDisplayTopicCharts_default);
    if (!optionDisplayTopicCharts || !deboucledTopicStatsMap.hasAny() || !deboucledTopicStatsMap.anyValue((v) => v > 0)) return;

    const forumRightCol = document.querySelector('#forum-right-col');
    if (!forumRightCol) return;

    const calcAverage = arr => arr.reduce((p, c) => p + c, 0) / arr.length;
    const average = Math.round(calcAverage([...deboucledTopicStatsMap.values()]));

    let html = '';
    html += '<div class="card card-jv-forum card-forum-margin" style="max-height: 130px;">';
    html += `<div class="card-header">TENDANCE DE FILTRAGE<span class="deboucled-card-header-right">Moyenne : ${average}</span></div>`;
    html += '<div class="card-body" style="max-height: 130px;">';
    html += '<div class="scrollable">';
    html += '<div class="scrollable-wrapper">';
    html += '<div id="deboucled-chart-content" class="scrollable-content bloc-info-forum">';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    let chart = document.createElement('div');
    forumRightCol.append(chart);
    chart.outerHTML = html;

    buildStatsChart();
}

function buildStatsChart() {

    function addChartStyles() {
        const css = GM_getResourceText('CHARTS_CSS');
        let html = '';
        html += `<style>${css}</style>`;
        html += `<style>:root {color-scheme: light dark;} #deboucled-stats-chart {--color-1: linear-gradient(rgba(240, 50, 50, 0.8), rgba(240, 50, 50, 0.3));} .data {font: bold 16px/0px sans-serif;color: #999999;height: 100%;text-align: center;white-space: nowrap;} .data-datetime {font-size: 11px;font-weight: normal;font-family: monospace;} .charts-css.area tbody tr th {width: 50px;font: bold 10px/10px sans-serif;color: #999999;} .charts-css.area:not(.reverse):not(.reverse-data) tbody tr td {-webkit-box-pack: center;-ms-flex-pack: center;justify-content: center;-webkit-box-align: center;-ms-flex-align: center;align-items: center;} .charts-css.area:not(.reverse):not(.reverse-data) tbody tr td .data {-webkit-transform: initial;transform: initial;}</style>`;
        return html;
    }
    function formatDateToGroup(d) {
        var dateOptions = { day: '2-digit', month: '2-digit', year: '2-digit' };
        return d.toLocaleDateString(undefined, dateOptions);
    }
    function formatDateToDisplay(d) {
        var timeOptions = { hour12: false, hour: '2-digit', minute: '2-digit' };
        return d.toLocaleTimeString(undefined, timeOptions);
    }
    function buildChartTableHtml() {
        const maxValues = 73;
        const selectedStats = [...deboucledTopicStatsMap].splice(Math.max(deboucledTopicStatsMap.size - maxValues, 0), maxValues);

        const statsWithDate = [...selectedStats].map(function (v) {
            let d = new Date(v[0]);
            return { key: formatDateToGroup(d), value: v[1], datetime: d };
        });
        const groupedByDate = groupBy(statsWithDate, 'key');

        let chartTableHtml = '';
        chartTableHtml += addChartStyles();
        chartTableHtml += '<table class="charts-css area show-data-on-hover show-labels" id="deboucled-stats-chart" style="width: 340px; height: 75px;">';

        chartTableHtml += '<thead>';
        // eslint-disable-next-line no-unused-vars
        for (const [rowKey, stats] of Object.entries(groupedByDate)) {
            chartTableHtml += `<th scope="col">${rowKey}</th>`;
        }
        chartTableHtml += '</thead>';

        const selectedValues = selectedStats.map((v) => v[1]);
        const coefValue = Math.max(...selectedValues) + 2;
        let previousValue = Math.max(selectedValues[0] - 1, 0);

        chartTableHtml += '<tbody>'
        for (const [rowKey, stats] of Object.entries(groupedByDate)) {
            let firstEntry = true;
            // eslint-disable-next-line no-unused-vars
            for (const [statKey, stat] of Object.entries(stats)) {
                chartTableHtml += `<tr${firstEntry ? '' : ' class="hide-label"'}>`;
                chartTableHtml += `<th scope="row">${rowKey}</th>`;
                chartTableHtml += `<td style="--start: ${previousValue / coefValue}; --size: ${stat.value / coefValue}">`;
                chartTableHtml += `<span class="data data-datetime">${formatDateToDisplay(stat.datetime)}</span>`;
                chartTableHtml += `<span class="data">${stat.value}</span>`;
                chartTableHtml += '</td>';
                chartTableHtml += '</tr>';
                previousValue = stat.value;
                firstEntry = false;
            }
        }
        chartTableHtml += '</tbody>';
        chartTableHtml += '</table>';
        return chartTableHtml;
    }
    function iframeOnLoad() {
        const iframeProcessed = document.querySelector('iframe#deboucled-iframe-chart').contentWindow.document.body;
        if (!iframeProcessed) return;
        const labels = iframeProcessed.querySelectorAll('tr:not(.hide-label) > th[scope="row"]');
        if (!labels || labels.length <= 1) return;
        for (let i = 0; i < labels.length - 1; i++) {
            let label = labels[i];
            let nextLabel = labels[i + 1];
            // Hide overlapped headers
            if (label.getBoundingClientRect().right > nextLabel.getBoundingClientRect().left) {
                label.parentElement.classList.toggle('hide-label', true);
            }
        }
    }

    const iframe = buildChartIframe(buildChartTableHtml(), iframeOnLoad);
    document.querySelector('#deboucled-chart-content').append(iframe);
}

function buildChartIframe(bodyHtml, onloadFunction) {
    let iframe = document.createElement('iframe');
    iframe.onload = onloadFunction;
    iframe.id = 'deboucled-iframe-chart';
    iframe.style = 'width: 100%; height: 100%;';
    iframe.border = 'none';
    iframe.scrolling = 'no';
    iframe.overflowY = 'hidden';
    iframe.margin = '0';
    iframe.srcdoc = bodyHtml;
    return iframe;
}

function updateTopicHiddenAtDate() {
    deboucledTopicStatsMap.set(Date.now(), hiddenTotalTopics);
    const maxElem = 100; // on ne garde que les 100 dernières stats
    if (deboucledTopicStatsMap.size > maxElem) {
        deboucledTopicStatsMap = new Map([...deboucledTopicStatsMap].slice(deboucledTopicStatsMap.size - maxElem));
    }
    store.set(storage_TopicStats, JSON.stringify([...deboucledTopicStatsMap]));
}

