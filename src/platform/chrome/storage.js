import {
  DAILY_SUBMISSIONS_KEY,
  DEFAULT_SETTINGS,
  PENDING_CHATGPT_PROMPT_KEY,
  RECORDING_HISTORY_KEY,
  SETTINGS_KEY,
  STATUS_KEY,
  createDefaultStatus,
  normalizeSettings,
  normalizeStatus
} from "../../features/settings/core/settings.js";
import {
  getDailySubmissionStatsFromHistory,
  migrateDailySubmissionStatsToHistory,
  normalizeDailySubmissionStats,
  normalizeRecordingHistory,
  registerRecordingSubmission
} from "../../features/recording/core/dailySubmissions.js";
import {
  FORVO_PROFILE_STATS_KEY,
  createDefaultForvoProfileStats,
  normalizeForvoProfileStats
} from "../../features/profile-stats/core/profileStats.js";

export async function readSettings() {
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  return normalizeSettings(result[SETTINGS_KEY] || DEFAULT_SETTINGS);
}

export async function writeSettings(settings) {
  const normalized = normalizeSettings(settings);
  await chrome.storage.sync.set({ [SETTINGS_KEY]: normalized });
  return normalized;
}

export async function resetSettings() {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
  await chrome.storage.local.set({ [STATUS_KEY]: createDefaultStatus() });
  await chrome.storage.local.remove([PENDING_CHATGPT_PROMPT_KEY, FORVO_PROFILE_STATS_KEY]);
  return DEFAULT_SETTINGS;
}

export async function readStatus() {
  const result = await chrome.storage.local.get(STATUS_KEY);
  return normalizeStatus(result[STATUS_KEY] || createDefaultStatus());
}

export async function readDailySubmissionStats() {
  return getDailySubmissionStatsFromHistory(await readRecordingHistory());
}

export async function writeDailySubmissionStats(stats) {
  const current = await readRecordingHistory();
  const dateKey = stats?.date;
  const normalized = normalizeDailySubmissionStats(stats, dateKey);
  const history = normalizeRecordingHistory({
    version: 1,
    days: {
      ...current.days,
      [normalized.date]: normalized
    }
  });

  await chrome.storage.local.set({ [RECORDING_HISTORY_KEY]: history });
  await chrome.storage.local.remove(DAILY_SUBMISSIONS_KEY);
  return normalized;
}

export async function readRecordingHistory() {
  const result = await chrome.storage.local.get([RECORDING_HISTORY_KEY, DAILY_SUBMISSIONS_KEY]);
  const hasHistory = result[RECORDING_HISTORY_KEY] !== undefined;
  const hasLegacyDailyStats = result[DAILY_SUBMISSIONS_KEY] !== undefined;
  const migration = migrateDailySubmissionStatsToHistory(
    result[RECORDING_HISTORY_KEY],
    result[DAILY_SUBMISSIONS_KEY]
  );

  if (hasHistory || hasLegacyDailyStats) {
    await chrome.storage.local.set({ [RECORDING_HISTORY_KEY]: migration.history });
  }

  if (hasLegacyDailyStats) {
    await chrome.storage.local.remove(DAILY_SUBMISSIONS_KEY);
  }

  return migration.history;
}

export async function recordDailySubmission(submission) {
  const current = await readRecordingHistory();
  const result = registerRecordingSubmission(current, submission);
  await chrome.storage.local.set({ [RECORDING_HISTORY_KEY]: result.history });
  return result;
}

export async function clearRecordingHistory() {
  const history = normalizeRecordingHistory({});
  await chrome.storage.local.remove([RECORDING_HISTORY_KEY, DAILY_SUBMISSIONS_KEY]);
  return history;
}

export async function readForvoProfileStats() {
  const result = await chrome.storage.local.get(FORVO_PROFILE_STATS_KEY);
  return normalizeForvoProfileStats(result[FORVO_PROFILE_STATS_KEY] || createDefaultForvoProfileStats());
}

export async function writeForvoProfileStats(stats) {
  const normalized = normalizeForvoProfileStats(stats);
  await chrome.storage.local.set({ [FORVO_PROFILE_STATS_KEY]: normalized });
  return normalized;
}

export async function writeStatus(patch) {
  const current = await readStatus();
  const next = normalizeStatus({ ...current, ...patch });
  await chrome.storage.local.set({ [STATUS_KEY]: next });
  return next;
}

export async function readPendingChatGptPrompt() {
  const result = await chrome.storage.local.get(PENDING_CHATGPT_PROMPT_KEY);
  return result[PENDING_CHATGPT_PROMPT_KEY] || null;
}

export async function writePendingChatGptPrompt(prompt) {
  await chrome.storage.local.set({ [PENDING_CHATGPT_PROMPT_KEY]: prompt });
}

export async function clearPendingChatGptPrompt() {
  await chrome.storage.local.remove(PENDING_CHATGPT_PROMPT_KEY);
}

export function onSettingsChanged(callback) {
  const listener = (changes, areaName) => {
    if (areaName !== "sync" || !changes[SETTINGS_KEY]) {
      return;
    }

    callback(normalizeSettings(changes[SETTINGS_KEY].newValue || DEFAULT_SETTINGS));
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
