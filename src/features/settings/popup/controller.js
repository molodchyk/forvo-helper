import { MESSAGE_TYPES } from "../../lookup/core/messages.js";
import { shouldRefreshForvoProfileStats } from "../../profile-stats/core/profileStats.js";
import { summarizeRecordingHistory } from "../../recording/core/dailySubmissions.js";
import { applyI18n, messageOrDefault } from "../../../platform/chrome/i18n.js";
import { addRuntimeMessageListener } from "../../../platform/chrome/runtime.js";
import { applyTheme } from "../../../platform/dom/theme.js";

export async function startPopup(doc = document) {
  applyI18n(doc);

  const state = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_STATUS });
  const dailyStats = state?.dailyStats || {};
  const profileStats = state?.profileStats || {};
  const recordingHistory = state?.recordingHistory || {};

  applyTheme(doc, state?.settings?.appearance?.theme);
  renderStatus(doc, dailyStats, profileStats, recordingHistory);
  doc.getElementById("optionsButton").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  doc.getElementById("refreshProfileStatsButton").addEventListener("click", () => {
    refreshProfileStats(doc);
  });
  addRuntimeMessageListener((message, _sender, sendResponse) => {
    if (message?.type === MESSAGE_TYPES.FORVO_PROFILE_STATS_UPDATED) {
      renderProfileStats(doc, message.profileStats);
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });

  if (shouldRefreshForvoProfileStats(profileStats)) {
    refreshProfileStats(doc, { quiet: Boolean(profileStats.totalPronunciations) });
  }
}

function renderStatus(doc, dailyStats, profileStats, recordingHistory) {
  const todayElement = doc.getElementById("todaySubmittedCount");

  todayElement.textContent = submittedCountLabel(dailyStats.count || 0);
  renderRecordingHistory(doc, recordingHistory);
  renderProfileStats(doc, profileStats);
}

function submittedCountLabel(count) {
  return messageOrDefault("popupSubmittedCount", "{count} submitted").replace("{count}", String(count));
}

function renderRecordingHistory(doc, recordingHistory = {}) {
  const summary = summarizeRecordingHistory(recordingHistory);

  doc.getElementById("history7DayCount").textContent = formatCount(summary.last7Days);
  doc.getElementById("history30DayCount").textContent = formatCount(summary.last30Days);
}

async function refreshProfileStats(doc, options = {}) {
  const button = doc.getElementById("refreshProfileStatsButton");

  button.disabled = true;
  if (!options.quiet) {
    doc.getElementById("profileStatsMeta").textContent = messageOrDefault("popupProfileRefreshing", "Refreshing...");
  }

  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.POPUP_REFRESH_FORVO_PROFILE_STATS });

    renderProfileStats(doc, response?.profileStats || {
      lastError: response?.error || messageOrDefault("popupProfileError", "Could not refresh")
    });
  } catch {
    renderProfileStats(doc, {
      lastError: messageOrDefault("popupProfileError", "Could not refresh")
    });
  } finally {
    button.disabled = false;
  }
}

function formatCount(count) {
  return new Intl.NumberFormat().format(Number(count) || 0);
}

function renderProfileStats(doc, stats = {}) {
  const countElement = doc.getElementById("profilePronunciationCount");
  const metaElement = doc.getElementById("profileStatsMeta");
  const count = Number(stats.totalPronunciations);

  if (Number.isFinite(count) && stats.updatedAt) {
    countElement.textContent = messageOrDefault("popupPronouncedCount", "{count} pronounced")
      .replace("{count}", new Intl.NumberFormat().format(count));
  } else if (stats.username) {
    countElement.textContent = stats.username;
  } else {
    countElement.textContent = messageOrDefault("popupProfileNotRefreshed", "Not refreshed yet");
  }

  if (stats.lastError) {
    metaElement.textContent = stats.lastError;
    return;
  }

  if (stats.username && stats.updatedAt) {
    metaElement.textContent = messageOrDefault("popupProfileMeta", "{username} - updated {date}")
      .replace("{username}", stats.username)
      .replace("{date}", new Date(stats.updatedAt).toLocaleString());
    return;
  }

  if (stats.username) {
    metaElement.textContent = messageOrDefault("popupProfileCounting", "Finding total...");
    return;
  }

  metaElement.textContent = messageOrDefault("popupProfileHint", "Refresh from Forvo profile");
}
