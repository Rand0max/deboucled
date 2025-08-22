
'use strict';

///////////////////////////////////////////////////////////////////////////////////////
// VARIABLES
///////////////////////////////////////////////////////////////////////////////////////

const defaultTopicCount = 25;

const entitySubject = 'subject';
const entityAuthor = 'author';
const entityTopicId = 'topicid';

const jvarchiveUrl = 'https://jvarchive.st';
const avatarUseJvArchiveApi = false;

const deboucledBackendUrl = 'https://deboucled.randomax.com';
const deboucledApiUrl = `${deboucledBackendUrl}/api`;
const apiChangelogUrl = `${deboucledApiUrl}/changelog`;
const apiYoutubeBlacklistUrl = `${deboucledApiUrl}/youtubeblacklist`;
const apiPrebouclesDataUrl = `${deboucledApiUrl}/preboucles`;
const apiAiLoopsDataUrl = `${deboucledApiUrl}/loops/v2`;
const apiAiBoucledAuthorsDataUrl = `${deboucledApiUrl}/loops/authors`;
const apiCheckUpdateUrl = `${deboucledApiUrl}/checkupdate`;
const apiUpdateUserUrl = `${deboucledApiUrl}/user`;
const apiDiagnosticUrl = `${deboucledApiUrl}/diagnostic`;
const apiMessageQuoteUrl = `${deboucledApiUrl}/message/quote`;

/* eslint-disable no-undef */
const checkUpdateExpire = TimeSpan.FromHours(1);
const checkUpdateDeferredExpire = TimeSpan.FromDays(5);
const youtubeBlacklistRefreshExpire = TimeSpan.FromHours(1);
const prebouclesRefreshExpire = TimeSpan.FromMinutes(60);
const aiLoopsRefreshExpire = TimeSpan.FromMinutes(5);
const aiBoucledAuthorsRefreshExpire = TimeSpan.FromMinutes(30);
const updateUserExpire = TimeSpan.FromHours(3);
const diagnosticExpire = TimeSpan.FromHours(12);
const hotTopicsRefreshExpire = TimeSpan.FromMinutes(15);
const messageQuotesRefreshExpire = TimeSpan.FromMinutes(2);
const pendingMessageQuoteExpire = TimeSpan.FromDays(3);
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

let aiBoucledAuthorsData = undefined;
let aiBoucledAuthorsReg;

let hotTopicsData = undefined;

let messageQuotesPendingArray = [];
let messageQuotesData = undefined;

let pocTopicMap = new Map();
let topicAuthorMap = new Map();
let authorAvatarMap = new Map();
let topicFilteredAuthorMap = new Map();
let entityBlacklistMatches = new Map();

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
let currentForumId = undefined;
let forumFilteringIsDisabled = false;
let fetchedChangelog = false;
let settingsLoaded = false;

const domParser = new DOMParser();

let smileyGifMap = new Map();
let brokenSmileyGifArray = [];
let smileyGifRegex = new RegExp();

const deboucledPseudos = ['rand0max', 'rand0max2', 'rand0max3', 'rand0max4', 'rand0max5', 'rand0max6', 'rand0max7', 'rand0maxreborn', 'deboucled', 'decensured', 'roninwf', 'roninwf2'];
const deboucledTopics = ['67697509', '68410257', '68982055', '70029449', '71596925'];

// Decensured
const decensuredBackendUrl = 'https://deboucled.randomax.com';
const decensuredApiUrl = `${decensuredBackendUrl}/decensured/api`;
const apiDecensuredMessagesUrl = `${decensuredApiUrl}/message`;
const apiDecensuredUsersUrl = `${decensuredApiUrl}/user`;
const apiDecensuredCreateMessageUrl = `${decensuredApiUrl}/message/create`;

const decensuredPingInterval = 1000 * 60 * 2; // every 2 minutes

