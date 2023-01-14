
'use strict';

///////////////////////////////////////////////////////////////////////////////////////
// VARIABLES
///////////////////////////////////////////////////////////////////////////////////////

const defaultTopicCount = 25;

const entitySubject = 'subject';
const entityAuthor = 'author';
const entityTopicId = 'topicid';

const jvarchiveUrl = 'https://jvarchive.com';
const avatarUseJvArchiveApi = false;

const deboucledBackendUrl = 'https://deboucled.jvflux.fr';
const deboucledApiUrl = `${deboucledBackendUrl}/deboucledapi`;
const youtubeBlacklistUrl = `${deboucledApiUrl}/youtubeblacklist`;
const prebouclesDataUrl = `${deboucledApiUrl}/preboucles`;
const aiLoopsDataUrl = `${deboucledApiUrl}/loops/v2`;
const checkUpdateUrl = `${deboucledApiUrl}/checkupdate`;
const updateUserUrl = `${deboucledApiUrl}/user`;
const diagnosticUrl = `${deboucledApiUrl}/diagnostic`;

/* eslint-disable no-undef */
const checkUpdateExpire = TimeSpan.FromHours(6);
const checkUpdateDeferredExpire = TimeSpan.FromDays(5);
const youtubeBlacklistRefreshExpire = TimeSpan.FromHours(1);
const prebouclesRefreshExpire = TimeSpan.FromMinutes(30);
const aiLoopsRefreshExpire = TimeSpan.FromMinutes(5);
const updateUserExpire = TimeSpan.FromHours(6);
const diagnosticExpire = TimeSpan.FromHours(12);
const hotTopicsRefreshExpire = TimeSpan.FromMinutes(10);
/* eslint-enable no-undef */

let subjectBlacklistArray = [];
let authorBlacklistArray = [];
let topicIdBlacklistMap = new Map();
let subjectsBlacklistReg;
let authorsBlacklistReg;
let userSubjectBlacklistReg;
let userAuthorBlacklistReg;

let topicIdWhitelistArray = [];
let shadowent = [];

let youtubeBlacklistArray = [];
let youtubeBlacklistReg;

let aiLoopData = undefined;
let aiLoopSubjectReg;
let aiLoopAuthorReg;

let hotTopicsData = undefined;

let pocTopicMap = new Map();
let topicAuthorMap = new Map();
let authorAvatarMap = new Map();

let hiddenTotalTopics = 0;
let hiddenSubjects = 0;
let hiddenTopicsIds = 0;
let hiddenMessages = 0;
let hiddenAuthors = 0;
let hiddenPrivateMessages = 0;
let hiddenSpammers = 0;
let hiddenAuthorArray = new Set();
let deboucledTopicStatsMap = new Map();

let preBoucleArray = [];
let preBoucleSubjectEnabledArray;
let preBoucleAuthorEnabledArray;
let vinzBoucleArray = [];
let vinzBoucleMessageArray = [];

let matchedSubjects = new Map();
let matchedAuthors = new Map();
let matchedTopics = new Map();

let stopHighlightModeratedTopics = false;
let moderatedTopics = new Map();
let sortModeSubject = 0;
let sortModeAuthor = 0;
let sortModeTopicId = 0;

let disabledFilteringForumSet = new Set();

let firstLaunch = false;
let userId = undefined;
let userPseudo = undefined;
let currentTopicId = undefined;
let currentTopicPageId = undefined;
let currentTopicAuthor = undefined;
let forumFilteringIsDisabled = false;

const domParser = new DOMParser();

let smileyGifMap = new Map();
let smileyGifRegex = new RegExp();

const decensuredUrl = 'https://github.com/Rand0max/decensured#readme';
let decensuredActive = false;

const deboucledPseudos = ['rand0max', 'rand0max2', 'rand0max3', 'rand0max4', 'rand0max5', 'rand0maxreborn', 'deboucled', 'decensured'];
const deboucledTopics = ['67697509', '68410257', '68982055', '70029449'];

