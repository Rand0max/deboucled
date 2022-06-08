// ==UserScript==
// @name        Déboucled
// @namespace   deboucledjvcom
// @version     2.32.1
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
// @match       http://www.jeuxvideo.com/profil/*
// @match       https://www.jeuxvideo.com/profil/*
// @match       http://www.jeuxvideo.com/sso/*
// @match       https://www.jeuxvideo.com/sso/*
// @connect     deboucled.jvflux.fr
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_getResourceText
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.addStyle
// @grant       GM.deleteValue
// @grant       GM.listValues
// @grant       GM.getResourceText
// @grant       GM.xmlHttpRequest
// @resource    DEBOUCLED_CSS https://raw.githubusercontent.com/Rand0max/deboucled/master/deboucled.css
// @resource    PEEPODARKJVCV2_CSS https://raw.githubusercontent.com/Rand0max/deboucled/master/peepodarkjvcv2.css
// @resource    JVRESPAWNREFINED_CSS https://raw.githubusercontent.com/Rand0max/deboucled/master/jv-respawn-refined.css
// @resource    CHARTS_CSS https://unpkg.com/charts.css/dist/charts.min.css
// @require     https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js
// @require     https://unpkg.com/infinite-scroll/dist/infinite-scroll.pkgd.min.js
// @require     https://unpkg.com/timespan@2.3.0/browser/TimeSpan-1.2.min.js
// @require     https://unpkg.com/gm-storage@1.1.0/dist/index.umd.min.js
// @require     https://cdn.jsdelivr.net/gh/tomik23/show-more/dist/js/showMore.min.js
// @require     https://unpkg.com/@chocolateboy/uncommonjs
// @require     https://unpkg.com/fastest-levenshtein
// @require     variables.js
// @require     extensions.js
// @require     storage.js
// @require     preboucles.js
// @require     apidata.js
// @require     jvarchiveapi.js
// @require     stats.js
// @require     topics.js
// @require     messages.js
// @require     postmessage.js
// @require     settings.js
// @require     privatemessages.js
// @require     profile.js
// @require     main.js
// @run-at      document-start
// ==/UserScript==
