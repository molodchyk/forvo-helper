import { MESSAGE_TYPES } from "../core/messages.js";
import { createSingleVowelStress } from "../core/stress.js";
import {
  buildGorohLookupUrl,
  lookupWordsEquivalent,
  normalizeForvoRecordingUrl,
  normalizeLookupWord,
  preferReferenceWordCasing
} from "../core/word.js";
import {
  handleChatGptPromptInserted,
  handleChatGptPromptSkippedDuplicate,
  openChatGptForWord,
  preloadChatGptForForvoUrl,
  preloadChatGptTab
} from "./chatGptFallback.js";
import { formatDailyBadgeText } from "../../recording/core/dailySubmissions.js";
import { refreshForvoProfileStats } from "../../profile-stats/background/scanner.js";
import { SETTINGS_KEY } from "../../settings/core/settings.js";
import {
  clearRecordingHistory,
  readDailySubmissionStats,
  readForvoProfileStats,
  readRecordingHistory,
  readSettings,
  readStatus,
  recordDailySubmission,
  writeSettings,
  writeStatus
} from "../../../platform/chrome/storage.js";
import { getActiveTab, openOrReuseTab, sendTabMessage, waitForTabComplete } from "../../../platform/chrome/tabs.js";

const GOROH_PATTERNS = ["https://goroh.pp.ua/*", "https://www.goroh.pp.ua/*"];
const DAILY_BADGE_ALARM = "forvo-helper:daily-badge-refresh";

export function registerLookupCoordinator() {
  chrome.runtime.onInstalled.addListener(() => {
    readSettings()
      .then(writeSettings)
      .then(() => refreshDailyBadge());
    scheduleDailyBadgeAlarm();
  });
  chrome.runtime.onStartup.addListener(() => {
    refreshDailyBadge();
    scheduleDailyBadgeAlarm();
  });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === DAILY_BADGE_ALARM) {
      refreshDailyBadge();
      scheduleDailyBadgeAlarm();
    }
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes[SETTINGS_KEY]) {
      refreshDailyBadge();
    }
  });
  chrome.commands.onCommand.addListener((command) => {
    if (command === "trigger-recording") {
      startRecordingOnActiveTab();
    }
  });
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
      preloadChatGptForForvoUrl(tab.url);
    }
  });
  chrome.tabs.onActivated.addListener(({ tabId }) => {
    chrome.tabs.get(tabId)
      .then((tab) => preloadChatGptForForvoUrl(tab.url))
      .catch(() => {});
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then((response) => sendResponse({ ok: true, ...response }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  });
  refreshDailyBadge();
  scheduleDailyBadgeAlarm();
}

async function handleMessage(message, sender) {
  switch (message?.type) {
    case MESSAGE_TYPES.GET_STATUS:
      return {
        settings: await readSettings(),
        status: await readStatus(),
        dailyStats: await readDailySubmissionStats(),
        recordingHistory: await readRecordingHistory(),
        profileStats: await readForvoProfileStats()
      };
    case MESSAGE_TYPES.POPUP_REFRESH_FORVO_PROFILE_STATS:
      return { profileStats: await refreshForvoProfileStats() };
    case MESSAGE_TYPES.CLEAR_RECORDING_HISTORY:
      return handleClearRecordingHistory();
    case MESSAGE_TYPES.FORVO_WORD_DETECTED:
      return handleForvoWordDetected(message, sender);
    case MESSAGE_TYPES.RECORDING_TRIGGERED:
      return writeStatus({
        lastAction: message.ok ? `recording:${message.source}` : "recording-target-missing",
        lastError: message.ok ? "" : "Could not find the Forvo record button."
      });
    case MESSAGE_TYPES.FORVO_PRONUNCIATION_SUBMITTED:
      return handleForvoPronunciationSubmitted(message);
    case MESSAGE_TYPES.GOROH_STRESS_RESULT:
      return handleGorohStressResult(message, sender);
    case MESSAGE_TYPES.CHATGPT_PROMPT_INSERTED:
      return handleChatGptPromptInserted(message);
    case MESSAGE_TYPES.CHATGPT_PROMPT_SKIPPED_DUPLICATE:
      return handleChatGptPromptSkippedDuplicate(message);
    default:
      return {};
  }
}

async function handleClearRecordingHistory() {
  const recordingHistory = await clearRecordingHistory();
  const dailyStats = await readDailySubmissionStats();

  await refreshDailyBadge(dailyStats);

  return {
    recordingHistory,
    dailyStats
  };
}

async function handleForvoPronunciationSubmitted(message) {
  const normalizedUrl = message.normalizedUrl || normalizeForvoRecordingUrl(message.url);

  if (!normalizedUrl) {
    throw new Error("Forvo recording URL was empty.");
  }

  const word = normalizeLookupWord(message.word);
  const isRepronunciation = Boolean(message.isRepronunciation);

  if (isRepronunciation) {
    const stats = await readDailySubmissionStats();

    await writeStatus({
      lastWord: word || (await readStatus()).lastWord,
      lastForvoUrl: message.url || "",
      lastAction: "pronunciation-resubmitted",
      lastError: ""
    });
    await refreshDailyBadge(stats);

    return {
      added: false,
      dailyCount: stats.count,
      normalizedUrl,
      isRepronunciation: true
    };
  }

  const result = await recordDailySubmission({
    normalizedUrl,
    word,
    sourceUrl: message.url || ""
  });

  await writeStatus({
    lastWord: word || (await readStatus()).lastWord,
    lastForvoUrl: message.url || "",
    lastAction: result.added ? "pronunciation-submitted" : "pronunciation-resubmitted",
    lastError: ""
  });
  await refreshDailyBadge(result.stats);

  return {
    added: result.added,
    dailyCount: result.stats.count,
    normalizedUrl
  };
}

async function handleForvoWordDetected(message, sender) {
  const word = normalizeLookupWord(message.word);

  if (!word) {
    throw new Error("Forvo word was empty.");
  }

  const settings = await readSettings();
  await writeStatus({
    lastWord: word,
    lastForvoUrl: sender.url || message.url || "",
    lastForvoTabId: sender.tab?.id || 0,
    lastGorohUrl: "",
    lastStressState: "unknown",
    lastStressSource: "",
    lastStressedWord: "",
    lastStressSample: "",
    lastAction: "forvo-word-detected",
    lastError: ""
  });

  const localStress = createSingleVowelStress(word);

  if (localStress) {
    await handleLocalStressResult(word, localStress);
    return { word, localStress: true };
  }

  if (settings.lookup.autoGorohLookup) {
    await openGorohForWord(word, settings);
  }

  if (settings.lookup.chatGptPreloadOnForvo) {
    preloadChatGptTab().catch(() => {});
  }

  return { word };
}

async function handleLocalStressResult(word, stressedWord) {
  const status = await writeStatus({
    lastWord: word,
    lastGorohUrl: "",
    lastStressState: "found",
    lastStressSource: "local",
    lastStressCheckedAt: Date.now(),
    lastStressedWord: stressedWord,
    lastStressSample: "",
    lastAction: "local-stress-single-vowel",
    lastError: ""
  });

  await sendForvoStressPanelUpdate(status.lastForvoTabId, {
    word,
    gorohUrl: "",
    stressState: status.lastStressState,
    stressSource: status.lastStressSource,
    stressedWord: status.lastStressedWord,
    stressSample: ""
  });
}

async function openGorohForWord(word, settings) {
  const directUrl = buildGorohLookupUrl(word);
  const useSearchField = settings.lookup.gorohLookupMode === "search-field";
  const tab = await openOrReuseTab({
    url: useSearchField ? "https://goroh.pp.ua/" : directUrl,
    matchPatterns: GOROH_PATTERNS,
    active: settings.lookup.focusLookupTabs,
    reuse: settings.lookup.reuseLookupTabs
  });

  await writeStatus({
    lastGorohUrl: directUrl,
    lastAction: "goroh-opened"
  });

  if (useSearchField && tab.id) {
    await waitForTabComplete(tab.id);
    await sendTabMessage(tab.id, {
      type: MESSAGE_TYPES.FILL_GOROH_SEARCH,
      word
    });
  }

  return tab;
}

async function handleGorohStressResult(message) {
  const currentStatus = await readStatus();
  const resultWord = normalizeLookupWord(message.word);
  const word = preferReferenceWordCasing(currentStatus.lastWord, resultWord);
  const hasStress = Boolean(message.hasStress);
  const stressedWord = hasStress ? String(message.stressedWord || "").trim() : "";
  const stressSample = String(message.sample || "").trim();
  const settings = await readSettings();

  if (isStaleGorohResult(currentStatus.lastWord, resultWord || word)) {
    return { word, hasStress, stale: true };
  }

  const status = await writeStatus({
    lastWord: word,
    lastGorohUrl: message.url || "",
    lastStressState: hasStress ? "found" : "missing",
    lastStressSource: "goroh",
    lastStressCheckedAt: Date.now(),
    lastStressedWord: stressedWord,
    lastStressSample: stressSample,
    lastAction: hasStress ? "goroh-stress-found" : "goroh-stress-missing",
    lastError: ""
  });

  await sendForvoStressPanelUpdate(status.lastForvoTabId, {
    word,
    gorohUrl: status.lastGorohUrl,
    stressState: status.lastStressState,
    stressSource: status.lastStressSource,
    stressedWord: status.lastStressedWord,
    stressSample: status.lastStressSample
  });

  if (!hasStress && word && settings.lookup.chatGptFallbackEnabled) {
    await openChatGptForWord(word, settings);
  }

  return { word, hasStress };
}

function isStaleGorohResult(currentWord, resultWord) {
  return Boolean(currentWord && resultWord) && !lookupWordsEquivalent(currentWord, resultWord);
}

async function sendForvoStressPanelUpdate(tabId, payload) {
  if (!tabId) {
    return;
  }

  await sendTabMessage(tabId, {
    type: MESSAGE_TYPES.FORVO_STRESS_PANEL_UPDATE,
    ...payload
  });
}

async function startRecordingOnActiveTab() {
  const tab = await getActiveTab();

  if (!tab?.id) {
    throw new Error("No active tab is available.");
  }

  const response = await sendTabMessage(tab.id, { type: MESSAGE_TYPES.START_RECORDING });
  return { sent: Boolean(response?.ok) };
}

async function refreshDailyBadge(stats = null) {
  const settings = await readSettings();
  const dailyStats = stats || await readDailySubmissionStats();
  const text = settings.stats.showDailyBadge ? formatDailyBadgeText(dailyStats.count) : "";

  await chrome.action.setBadgeBackgroundColor({ color: "#2f8f5b" });
  await chrome.action.setBadgeText({ text });
}

function scheduleDailyBadgeAlarm() {
  chrome.alarms.create(DAILY_BADGE_ALARM, {
    when: nextLocalMidnightTimestamp()
  });
}

function nextLocalMidnightTimestamp(now = new Date()) {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    5
  ).getTime();
}
