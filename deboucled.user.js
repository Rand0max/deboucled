// ==UserScript==
// @name        Déboucled
// @namespace   deboucledjvcom
// @version     2.3.0
// @downloadURL https://github.com/Rand0max/deboucled/raw/master/deboucled.user.js
// @updateURL   https://github.com/Rand0max/deboucled/raw/master/deboucled.meta.js
// @author      Rand0max
// @description Censure les topics et les auteurs éclatax et vous sort de la boucle
// @icon        https://image.noelshack.com/fichiers/2021/38/6/1632606701-deboucled.png
// @match       http://www.jeuxvideo.com/forums/*
// @match       https://www.jeuxvideo.com/forums/*
// @match       http://www.jeuxvideo.com/recherche/forums/*
// @match       https://www.jeuxvideo.com/recherche/forums/*
// @match       http://www.jeuxvideo.com/messages-prives/*
// @match       https://www.jeuxvideo.com/messages-prives/*
// @match       http://m.jeuxvideo.com/forums/*
// @match       https://m.jeuxvideo.com/forums/*
// @match       http://m.jeuxvideo.com/recherche/forums/*
// @match       https://m.jeuxvideo.com/recherche/forums/*
// @match       http://m.jeuxvideo.com/messages-prives/*
// @match       https://m.jeuxvideo.com/messages-prives/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_getResourceText
// @resource    DEBOUCLED_CSS https://raw.githubusercontent.com/Rand0max/deboucled/master/deboucled.css
// @resource    PEEPODARKJVC_CSS https://raw.githubusercontent.com/Rand0max/deboucled/master/peepodarkjvc.css
// @resource    CHARTS_CSS https://unpkg.com/charts.css/dist/charts.min.css
// @require     https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js
// @require     https://unpkg.com/@chocolateboy/uncommonjs
// @require     https://unpkg.com/fastest-levenshtein
// @require     variables.js
// @require     storage.js
// @require     extensions.js
// @require     preboucles.js
// @require     stats.js
// @require     topics.js
// @require     messages.js
// @require     settings.js
// @require     privatemessages.js
// @require     main.js
// @run-at      document-end
// ==/UserScript==
