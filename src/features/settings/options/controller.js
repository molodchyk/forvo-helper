import { DEFAULT_SETTINGS, normalizeSettings } from "../core/settings.js";
import { MESSAGE_TYPES } from "../../lookup/core/messages.js";
import {
  RECORDING_HOURLY_RANGES,
  createRecordingHeatmap,
  createRecordingHourlyBreakdown,
  summarizeRecordingHistory
} from "../../recording/core/dailySubmissions.js";
import { applyI18n, messageOrDefault } from "../../../platform/chrome/i18n.js";
import { readSettings, resetSettings, writeSettings } from "../../../platform/chrome/storage.js";
import { applyTheme } from "../../../platform/dom/theme.js";

const HOURLY_RANGE_DAYS = Object.freeze({
  [RECORDING_HOURLY_RANGES.MONTH.id]: RECORDING_HOURLY_RANGES.MONTH.days,
  [RECORDING_HOURLY_RANGES.QUARTER.id]: RECORDING_HOURLY_RANGES.QUARTER.days,
  [RECORDING_HOURLY_RANGES.YEAR.id]: RECORDING_HOURLY_RANGES.YEAR.days
});

export async function startOptions(doc = document) {
  applyI18n(doc);

  const form = doc.getElementById("optionsForm");
  const resetButton = doc.getElementById("resetButton");
  const resetConfirm = doc.getElementById("resetConfirm");
  const confirmResetButton = doc.getElementById("confirmResetButton");
  const cancelResetButton = doc.getElementById("cancelResetButton");
  const clearHistoryButton = doc.getElementById("clearRecordingHistoryButton");
  const clearHistoryConfirm = doc.getElementById("clearRecordingHistoryConfirm");
  const confirmClearHistoryButton = doc.getElementById("confirmClearRecordingHistoryButton");
  const cancelClearHistoryButton = doc.getElementById("cancelClearRecordingHistoryButton");
  const saveStatus = doc.getElementById("saveStatus");
  let settings = await readSettings();
  const currentState = await readCurrentState();
  let recordingHistory = currentState.recordingHistory || {};
  let dailyStats = currentState.dailyStats || {};
  let hourlyRangeId = RECORDING_HOURLY_RANGES.YEAR.id;

  applyTheme(doc, settings.appearance.theme);
  renderSettings(doc, settings);
  renderStats(doc, dailyStats, recordingHistory, hourlyRangeId);
  setupTabs(doc);
  setupHourlyRange(doc, (rangeId) => {
    hourlyRangeId = rangeId;
    renderStats(doc, dailyStats, recordingHistory, hourlyRangeId);
  });
  form.addEventListener("input", () => {
    hideResetConfirmation(resetConfirm);
    hideResetConfirmation(clearHistoryConfirm);
    settings = readSettingsFromForm(doc, settings);
    saveSettings(settings, saveStatus);
  });
  form.addEventListener("change", () => {
    hideResetConfirmation(resetConfirm);
    hideResetConfirmation(clearHistoryConfirm);
    settings = readSettingsFromForm(doc, settings);
    saveSettings(settings, saveStatus);
  });
  resetButton.addEventListener("click", () => {
    showResetConfirmation(resetConfirm);
  });
  cancelResetButton.addEventListener("click", () => {
    hideResetConfirmation(resetConfirm);
  });
  confirmResetButton.addEventListener("click", async () => {
    settings = await resetSettings();
    applyTheme(doc, settings.appearance.theme);
    renderSettings(doc, settings);
    hideResetConfirmation(resetConfirm);
    showSaved(saveStatus);
  });
  clearHistoryButton.addEventListener("click", () => {
    showResetConfirmation(clearHistoryConfirm);
  });
  cancelClearHistoryButton.addEventListener("click", () => {
    hideResetConfirmation(clearHistoryConfirm);
  });
  confirmClearHistoryButton.addEventListener("click", async () => {
    const clearedState = await clearRecordingHistory(confirmClearHistoryButton, clearHistoryConfirm, saveStatus);

    if (clearedState) {
      recordingHistory = clearedState.recordingHistory || {};
      dailyStats = clearedState.dailyStats || {};
      renderStats(doc, dailyStats, recordingHistory, hourlyRangeId);
    }
  });
}

function renderSettings(doc, settings) {
  const normalized = normalizeSettings(settings);
  setValue(doc, "theme", normalized.appearance.theme);
  setChecked(doc, "showDailyBadge", normalized.stats.showDailyBadge);
  setChecked(doc, "hoverEnabled", normalized.recording.hoverEnabled);
  setValue(doc, "hoverDelaySeconds", millisecondsToSeconds(normalized.recording.hoverDelayMs));
  setChecked(doc, "gestureEnabled", normalized.recording.gestureEnabled);
  setChecked(doc, "pageHotkeyEnabled", normalized.recording.pageHotkeyEnabled);
  setValue(doc, "hotkey", normalized.recording.hotkey);
  setChecked(doc, "autoGorohLookup", normalized.lookup.autoGorohLookup);
  setValue(doc, "gorohLookupMode", normalized.lookup.gorohLookupMode);
  setChecked(doc, "focusLookupTabs", normalized.lookup.focusLookupTabs);
  setChecked(doc, "chatGptFallbackEnabled", normalized.lookup.chatGptFallbackEnabled);
  setChecked(doc, "chatGptPreloadOnForvo", normalized.lookup.chatGptPreloadOnForvo);
  setValue(doc, "chatGptUrl", normalized.lookup.chatGptUrl);
  setValue(doc, "chatGptPromptTemplate", normalized.lookup.chatGptPromptTemplate);
  setChecked(doc, "chatGptAutoSubmit", normalized.lookup.chatGptAutoSubmit);
  setChecked(doc, "chatGptSkipDuplicatePrompt", normalized.lookup.chatGptSkipDuplicatePrompt);
}

function readSettingsFromForm(doc, previousSettings) {
  return normalizeSettings({
    ...previousSettings,
    appearance: {
      theme: getValue(doc, "theme")
    },
    stats: {
      showDailyBadge: getChecked(doc, "showDailyBadge")
    },
    recording: {
      hoverEnabled: getChecked(doc, "hoverEnabled"),
      hoverDelayMs: secondsToMilliseconds(getValue(doc, "hoverDelaySeconds")),
      gestureEnabled: getChecked(doc, "gestureEnabled"),
      pageHotkeyEnabled: getChecked(doc, "pageHotkeyEnabled"),
      hotkey: getValue(doc, "hotkey"),
      showRecordRing: true
    },
    lookup: {
      ...DEFAULT_SETTINGS.lookup,
      autoGorohLookup: getChecked(doc, "autoGorohLookup"),
      gorohLookupMode: getValue(doc, "gorohLookupMode"),
      focusLookupTabs: getChecked(doc, "focusLookupTabs"),
      chatGptFallbackEnabled: getChecked(doc, "chatGptFallbackEnabled"),
      chatGptPreloadOnForvo: getChecked(doc, "chatGptPreloadOnForvo"),
      chatGptUrl: getValue(doc, "chatGptUrl"),
      chatGptPromptTemplate: getValue(doc, "chatGptPromptTemplate"),
      chatGptAutoSubmit: getChecked(doc, "chatGptAutoSubmit"),
      chatGptSkipDuplicatePrompt: getChecked(doc, "chatGptSkipDuplicatePrompt")
    }
  });
}

async function readCurrentState() {
  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_STATUS });
    return response?.ok ? response : {};
  } catch {
    return {};
  }
}

function setupTabs(doc) {
  const tabs = [...doc.querySelectorAll("[data-tab-target]")];

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      activateTab(doc, tab);
    });
  }
}

function activateTab(doc, activeTab) {
  const tabs = [...doc.querySelectorAll("[data-tab-target]")];

  for (const tab of tabs) {
    const isActive = tab === activeTab;
    const panel = doc.getElementById(tab.dataset.tabTarget);

    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    if (panel) panel.hidden = !isActive;
  }
}

function setupHourlyRange(doc, onChange) {
  const buttons = [...doc.querySelectorAll("[data-hourly-range]")];

  for (const button of buttons) {
    button.addEventListener("click", () => {
      for (const item of buttons) {
        const isActive = item === button;

        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      }

      onChange(button.dataset.hourlyRange);
    });
  }
}

function renderStats(doc, dailyStats = {}, recordingHistory = {}, rangeId = RECORDING_HOURLY_RANGES.YEAR.id) {
  const summary = summarizeRecordingHistory(recordingHistory);

  setText(doc, "statsTodayCount", formatCount(dailyStats.count || 0));
  setText(doc, "stats7DayCount", formatCount(summary.last7Days));
  setText(doc, "stats30DayCount", formatCount(summary.last30Days));
  renderHeatmap(doc, recordingHistory);
  renderHourlyBreakdown(doc, recordingHistory, rangeId);
}

function renderHeatmap(doc, recordingHistory) {
  const heatmapElement = doc.getElementById("optionsRecordingHeatmap");
  const heatmap = createRecordingHeatmap(recordingHistory);

  if (!heatmapElement) {
    return;
  }

  heatmapElement.textContent = "";
  heatmapElement.setAttribute("aria-label", messageOrDefault(
    "optionsRecordingHistoryHeatmapLabel",
    "Daily recordings for the last 13 weeks"
  ));

  for (const week of heatmap.weeks) {
    for (const cell of week) {
      const element = doc.createElement("span");
      const label = recordingHistoryCellLabel(cell.date, cell.count);

      element.className = "history-heatmap__cell";
      element.dataset.level = String(cell.level);
      if (cell.future) element.dataset.future = "true";
      element.dataset.tooltip = label;
      if (cell.count > 0) element.tabIndex = 0;
      element.setAttribute("aria-label", label);
      heatmapElement.append(element);
    }
  }
}

function renderHourlyBreakdown(doc, recordingHistory, rangeId) {
  const chartElement = doc.getElementById("hourlyChart");
  const axisElement = doc.getElementById("hourlyAxis");
  const peakElement = doc.getElementById("hourlyPeakSummary");
  const rangeDays = HOURLY_RANGE_DAYS[rangeId] || RECORDING_HOURLY_RANGES.YEAR.days;
  const breakdown = createRecordingHourlyBreakdown(recordingHistory, new Date(), rangeDays);

  if (!chartElement || !axisElement || !peakElement) {
    return;
  }

  chartElement.textContent = "";
  chartElement.setAttribute("aria-label", messageOrDefault(
    "optionsHourlyBreakdownChartLabel",
    "Hourly recording volume"
  ));

  for (const bucket of breakdown.buckets) {
    const column = doc.createElement("span");
    const bar = doc.createElement("span");
    const label = hourlyBucketLabel(bucket.hour, bucket.count);
    const height = bucket.count > 0 ? Math.max(4, Math.round(bucket.share * 100)) : 0;

    column.className = "hourly-chart__column";
    column.dataset.count = String(bucket.count);
    if (bucket.hour === breakdown.peakHour) column.dataset.peak = "true";
    column.dataset.tooltip = label;
    if (bucket.count > 0) column.tabIndex = 0;
    column.style.setProperty("--tooltip-y", `${height}%`);
    column.setAttribute("aria-label", label);
    bar.className = "hourly-chart__bar";
    bar.style.height = `${height}%`;
    column.append(bar);
    chartElement.append(column);
  }

  axisElement.textContent = "";
  for (let hour = 0; hour < 24; hour += 1) {
    const label = doc.createElement("span");

    label.textContent = String(hour);
    axisElement.append(label);
  }

  peakElement.textContent = breakdown.peakHour === null
    ? messageOrDefault("optionsHourlyNoData", "No recordings in this range")
    : messageOrDefault("optionsHourlyPeak", "Peak: {hour} - {count} recordings")
      .replace("{hour}", formatHour(breakdown.peakHour))
      .replace("{count}", formatCount(breakdown.peakCount));
}

function recordingHistoryCellLabel(date, count) {
  return messageOrDefault("optionsRecordingHistoryDateCount", "{date}: {count} recordings")
    .replace("{date}", date)
    .replace("{count}", formatCount(count));
}

function hourlyBucketLabel(hour, count) {
  return messageOrDefault("optionsHourlyBucketCount", "{hour}: {count} recordings")
    .replace("{hour}", `${formatHour(hour)}-${formatHourEnd(hour)}`)
    .replace("{count}", formatCount(count));
}

async function saveSettings(settings, saveStatus) {
  await writeSettings(settings);
  applyTheme(document, settings.appearance.theme);
  showSaved(saveStatus);
}

function showSaved(saveStatus) {
  saveStatus.textContent = messageOrDefault("optionsSaved", "Saved");
  clearTimeout(showSaved.timeoutId);
  showSaved.timeoutId = setTimeout(() => {
    saveStatus.textContent = "";
  }, 1200);
}

function showResetConfirmation(resetConfirm) {
  if (resetConfirm) resetConfirm.hidden = false;
}

function hideResetConfirmation(resetConfirm) {
  if (resetConfirm) resetConfirm.hidden = true;
}

async function clearRecordingHistory(button, confirmation, saveStatus) {
  button.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.CLEAR_RECORDING_HISTORY });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not clear recording history");
    }

    hideResetConfirmation(confirmation);
    showStatus(saveStatus, messageOrDefault("optionsRecordingHistoryCleared", "Recording history cleared"));
    return response;
  } catch {
    showStatus(saveStatus, messageOrDefault("optionsRecordingHistoryClearError", "Could not clear recording history"));
    return null;
  } finally {
    button.disabled = false;
  }
}

function showStatus(saveStatus, text) {
  saveStatus.textContent = text;
  clearTimeout(showSaved.timeoutId);
  showSaved.timeoutId = setTimeout(() => {
    saveStatus.textContent = "";
  }, 1600);
}

function getValue(doc, id) {
  return doc.getElementById(id)?.value || "";
}

function setValue(doc, id, value) {
  const element = doc.getElementById(id);
  if (element) element.value = value;
}

function setText(doc, id, value) {
  const element = doc.getElementById(id);
  if (element) element.textContent = value;
}

function getChecked(doc, id) {
  return Boolean(doc.getElementById(id)?.checked);
}

function setChecked(doc, id, value) {
  const element = doc.getElementById(id);
  if (element) element.checked = Boolean(value);
}

function millisecondsToSeconds(value) {
  return Number(value / 1000).toFixed(2).replace(/\.?0+$/, "");
}

function secondsToMilliseconds(value) {
  return Math.round(Number(value || 0) * 1000);
}

function formatCount(count) {
  return new Intl.NumberFormat().format(Number(count) || 0);
}

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatHourEnd(hour) {
  return `${String(hour).padStart(2, "0")}:59`;
}
