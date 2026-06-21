import { MESSAGE_TYPES } from "../../lookup/core/messages.js";
import { applyI18n, messageOrDefault } from "../../../platform/chrome/i18n.js";
import { applyTheme } from "../../../platform/dom/theme.js";

export async function startPopup(doc = document) {
  applyI18n(doc);

  const state = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_STATUS });
  const status = state?.status || {};
  const dailyStats = state?.dailyStats || {};

  applyTheme(doc, state?.settings?.appearance?.theme);
  renderStatus(doc, status, dailyStats);
  doc.getElementById("recordButton").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.POPUP_START_RECORDING });
  });
  doc.getElementById("gorohButton").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.POPUP_OPEN_GOROH });
  });
  doc.getElementById("optionsButton").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}

function renderStatus(doc, status, dailyStats) {
  const wordElement = doc.getElementById("currentWord");
  const stressElement = doc.getElementById("stressState");
  const todayElement = doc.getElementById("todaySubmittedCount");
  const hasWord = Boolean(status.lastWord);

  wordElement.textContent = status.lastWord || messageOrDefault("popupNoWord", "No Forvo word detected");
  stressElement.textContent = stressLabel(status.lastStressState);
  todayElement.textContent = submittedCountLabel(dailyStats.count || 0);
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
