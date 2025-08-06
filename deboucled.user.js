// ==UserScript==
// @name        Déboucled
// @namespace   deboucledjvcom
// @version     2.58.1
// @downloadURL https://github.com/Rand0max/deboucled/raw/master/deboucled.user.js
// @updateURL   https://github.com/Rand0max/deboucled/raw/master/deboucled.meta.js
// @author      Rand0max
// @description Masque les topics, les sujets et les auteurs indésirables et vous sort de la boucle.
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
// @connect     randomax.com
// @connect     jvarchive.st
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
// @resource    JVRESPAWNREFINED_CSS https://raw.githubusercontent.com/Rand0max/deboucled/master/jv-respawn-refined.css
// @resource    CHARTS_CSS https://unpkg.com/charts.css@1.1.0/dist/charts.min.css
// @resource    SWEETALERTDARK_CSS https://cdn.jsdelivr.net/npm/@sweetalert2/theme-dark/dark.css
// @resource    LITEYOUTUBE_CSS https://cdn.jsdelivr.net/npm/lite-youtube-embed@0.3.2/src/lite-yt-embed.min.css
// @require     https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js
// @require     https://unpkg.com/infinite-scroll@4.0.1/dist/infinite-scroll.pkgd.min.js
// @require     https://unpkg.com/timespan@2.3.0/browser/TimeSpan-1.2.min.js
// @require     https://unpkg.com/gm-storage@2.0.3/dist/index.umd.min.js
// @require     https://cdn.jsdelivr.net/gh/tomik23/show-more/dist/js/showMore.min.js
// @require     https://cdn.jsdelivr.net/npm/sweetalert2
// @require     https://unpkg.com/@chocolateboy/uncommonjs@3.2.1/dist/polyfill.iife.min.js
// @require     https://unpkg.com/fastest-levenshtein@1.0.16/mod.js
// @require     https://cdn.jsdelivr.net/npm/lite-youtube-embed@0.3.2/src/lite-yt-embed.min.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/variables.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/helpers.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/storage.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/header.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/preboucles.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/apidata.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/jvarchiveapi.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/stats.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/topics.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/messages.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/postmessage.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/settings.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/privatemessages.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/profile.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/extras.js
// @require     https://raw.githubusercontent.com/Rand0max/deboucled/master/main.js
// @run-at      document-body
// ==/UserScript==
