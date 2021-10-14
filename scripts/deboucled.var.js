///////////////////////////////////////////////////////////////////////////////////////
// VARIABLES
///////////////////////////////////////////////////////////////////////////////////////

let subjectBlacklistArray = [];
let authorBlacklistArray = [];
let topicIdBlacklistMap = new Map();
let subjectsBlacklistReg = makeRegex(subjectBlacklistArray, true);
let authorsBlacklistReg = makeRegex(authorBlacklistArray, false);

let pocTopicMap = new Map();

let hiddenTotalTopics = 0;
let hiddenSubjects = 0;
let hiddenTopicsIds = 0;
let hiddenMessages = 0;
let hiddenAuthors = 0;
let hiddenAuthorArray = new Set();

const deboucledVersion = '1.12.6'
const topicByPage = 25;

const entitySubject = 'subject';
const entityAuthor = 'author';
const entityTopicId = 'topicid';

const domParser = new DOMParser();


// STORAGE

const localstorage_pocTopics = 'deboucled_pocTopics';

const storage_init = 'deboucled_init';
const storage_blacklistedTopicIds = 'deboucled_blacklistedTopicIds';
const storage_blacklistedSubjects = 'deboucled_blacklistedSubjects';
const storage_blacklistedAuthors = 'deboucled_blacklistedAuthors';
const storage_optionBoucledUseJvarchive = 'deboucled_optionBoucledUseJvarchive';
const storage_optionHideMessages = 'deboucled_optionHideMessages';
const storage_optionAllowDisplayThreshold = 'deboucled_optionAllowDisplayThreshold';
const storage_optionDisplayThreshold = 'deboucled_optionDisplayThreshold';
const storage_optionDisplayBlacklistTopicButton = 'deboucled_optionDisplayBlacklistTopicButton';
const storage_optionShowJvcBlacklistButton = 'deboucled_optionShowJvcBlacklistButton';
const storage_optionFilterResearch = 'deboucled_optionFilterResearch';
const storage_optionDetectPocMode = 'deboucled_optionDetectPocMode';
const storage_optionPrevisualizeTopic = 'deboucled_optionPrevisualizeTopic';
const storage_optionDisplayBlackTopic = 'deboucled_optionDisplayBlackTopic';
const storage_totalHiddenTopicIds = 'deboucled_totalHiddenTopicIds';
const storage_totalHiddenSubjects = 'deboucled_totalHiddenSubjects';
const storage_totalHiddenAuthors = 'deboucled_totalHiddenAuthors';
const storage_totalHiddenMessages = 'deboucled_totalHiddenMessages';

const storage_Keys = [storage_init, storage_blacklistedTopicIds, storage_blacklistedSubjects, storage_blacklistedAuthors, storage_optionBoucledUseJvarchive, storage_optionHideMessages, storage_optionAllowDisplayThreshold, storage_optionDisplayThreshold, storage_optionDisplayBlacklistTopicButton, storage_optionShowJvcBlacklistButton, storage_optionFilterResearch, storage_optionDetectPocMode, storage_optionPrevisualizeTopic, storage_optionDisplayBlackTopic, storage_totalHiddenTopicIds, storage_totalHiddenSubjects, storage_totalHiddenAuthors, storage_totalHiddenMessages];
