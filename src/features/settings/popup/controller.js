import { MESSAGE_TYPES } from "../../lookup/core/messages.js";
import { shouldRefreshForvoProfileStats } from "../../profile-stats/core/profileStats.js";
import { applyI18n, messageOrDefault } from "../../../platform/chrome/i18n.js";
import { applyTheme } from "../../../platform/dom/theme.js";

export async function startPopup(doc = document) {
  applyI18n(doc);

  const state = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_STATUS });
  const status = state?.status || {};
  const dailyStats = state?.dailyStats || {};
  const profileStats = state?.profileStats || {};

  applyTheme(doc, state?.settings?.appearance?.theme);
  renderStatus(doc, status, dailyStats, profileStats);
  doc.getElementById("recordButton").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.POPUP_START_RECORDING });
  });
  doc.getElementById("gorohButton").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.POPUP_OPEN_GOROH });
  });
  doc.getElementById("optionsButton").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  doc.getElementById("refreshProfileStatsButton").addEventListener("click", () => {
    refreshProfileStats(doc);
  });

  if (shouldRefreshForvoProfileStats(profileStats)) {
    refreshProfileStats(doc, { quiet: Boolean(profileStats.totalPronunciations) });
  }
}

function renderStatus(doc, status, dailyStats, profileStats) {
  const wordElement = doc.getElementById("currentWord");
  const stressElement = doc.getElementById("stressState");
  const todayElement = doc.getElementById("todaySubmittedCount");
  const hasWord = Boolean(status.lastWord);

  wordElement.textContent = status.lastWord || messageOrDefault("popupNoWord", "No Forvo word detected");
  stressElement.textContent = stressLabel(status.lastStressState);
  todayElement.textContent = submittedCountLabel(dailyStats.count || 0);
  renderProfileStats(doc, profileStats);
  doc.getElementById("gorohButton").disabled = !hasWord;
}

function stressLabel(state) {
  if (state === "found") return messageOrDefault("popupStressFound", "Found on Goroh");
  if (state === "missing") return messageOrDefault("popupStressMissing", "Missing on Goroh");
  return messageOrDefault("popupStressUnknown", "Not checked yet");
}

function submittedCountLabel(count) {
  return messageOrDefault("popupSubmittedCount", "{count} submitted").replace("{count}", String(count));
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

function renderProfileStats(doc, stats = {}) {
  const countElement = doc.getElementById("profilePronunciationCount");
  const metaElement = doc.getElementById("profileStatsMeta");
  const count = Number(stats.totalPronunciations);

  if (Number.isFinite(count) && stats.updatedAt) {
    countElement.textContent = messageOrDefault("popupPronouncedCount", "{count} pronounced")
      .replace("{count}", new Intl.NumberFormat().format(count));
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

  metaElement.textContent = messageOrDefault("popupProfileHint", "Refresh from Forvo profile");
}
