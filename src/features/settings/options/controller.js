import { DEFAULT_SETTINGS, normalizeSettings } from "../core/settings.js";
import { applyI18n, messageOrDefault } from "../../../platform/chrome/i18n.js";
import { readSettings, resetSettings, writeSettings } from "../../../platform/chrome/storage.js";
import { applyTheme } from "../../../platform/dom/theme.js";

export async function startOptions(doc = document) {
  applyI18n(doc);

  const form = doc.getElementById("optionsForm");
  const resetButton = doc.getElementById("resetButton");
  const saveStatus = doc.getElementById("saveStatus");
  let settings = await readSettings();

  applyTheme(doc, settings.appearance.theme);
  renderSettings(doc, settings);
  form.addEventListener("input", () => {
    settings = readSettingsFromForm(doc, settings);
    saveSettings(settings, saveStatus);
  });
  form.addEventListener("change", () => {
    settings = readSettingsFromForm(doc, settings);
    saveSettings(settings, saveStatus);
  });
  resetButton.addEventListener("click", async () => {
    settings = await resetSettings();
    applyTheme(doc, settings.appearance.theme);
    renderSettings(doc, settings);
    showSaved(saveStatus);
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

function getValue(doc, id) {
  return doc.getElementById(id)?.value || "";
}

function setValue(doc, id, value) {
  const element = doc.getElementById(id);
  if (element) element.value = value;
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
