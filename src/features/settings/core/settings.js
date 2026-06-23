export const SETTINGS_KEY = "forvoHelperSettings";
export const STATUS_KEY = "forvoHelperStatus";
export const PENDING_CHATGPT_PROMPT_KEY = "forvoHelperPendingChatGptPrompt";
export const DAILY_SUBMISSIONS_KEY = "forvoHelperDailySubmissions";

export const DEFAULT_SETTINGS = Object.freeze({
  version: 1,
  appearance: {
    theme: "system"
  },
  stats: {
    showDailyBadge: true,
    forvoStatsEnabled: false,
    forvoStatsSourceUrl: ""
  },
  recording: {
    hoverEnabled: true,
    hoverDelayMs: 900,
    gestureEnabled: false,
    pageHotkeyEnabled: true,
    hotkey: "Alt+Shift+R",
    showRecordRing: true
  },
  lookup: {
    autoGorohLookup: true,
    gorohLookupMode: "direct-url",
    reuseLookupTabs: true,
    focusLookupTabs: false,
    chatGptFallbackEnabled: true,
    chatGptUrl: "https://chatgpt.com/",
    chatGptPromptTemplate: "Find the Ukrainian stress for \"{word}\". Reply with the word marked with an acute accent and one brief note if needed.",
    chatGptAutoSubmit: false
  }
});

const GOROH_LOOKUP_MODES = new Set(["direct-url", "search-field"]);
const CHATGPT_HOSTS = new Set(["chatgpt.com", "chat.openai.com"]);
const FORVO_HOST_PATTERN = /(^|\.)forvo\.com$/;
const THEMES = new Set(["system", "light", "dark"]);

export function normalizeSettings(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const appearance = isPlainObject(source.appearance) ? source.appearance : {};
  const stats = isPlainObject(source.stats) ? source.stats : {};
  const recording = isPlainObject(source.recording) ? source.recording : {};
  const lookup = isPlainObject(source.lookup) ? source.lookup : {};

  return {
    version: 1,
    appearance: {
      theme: THEMES.has(appearance.theme) ? appearance.theme : DEFAULT_SETTINGS.appearance.theme
    },
    stats: {
      showDailyBadge: asBoolean(stats.showDailyBadge, DEFAULT_SETTINGS.stats.showDailyBadge),
      forvoStatsEnabled: asBoolean(
        stats.forvoStatsEnabled,
        asBoolean(stats.forvoListenStatsEnabled, DEFAULT_SETTINGS.stats.forvoStatsEnabled)
      ),
      forvoStatsSourceUrl: normalizeForvoUrl(stats.forvoStatsSourceUrl || stats.forvoListenStatsUrl)
    },
    recording: {
      hoverEnabled: asBoolean(recording.hoverEnabled, DEFAULT_SETTINGS.recording.hoverEnabled),
      hoverDelayMs: clampInteger(recording.hoverDelayMs, 250, 5000, DEFAULT_SETTINGS.recording.hoverDelayMs),
      gestureEnabled: asBoolean(recording.gestureEnabled, DEFAULT_SETTINGS.recording.gestureEnabled),
      pageHotkeyEnabled: asBoolean(recording.pageHotkeyEnabled, DEFAULT_SETTINGS.recording.pageHotkeyEnabled),
      hotkey: normalizeHotkeyValue(recording.hotkey, DEFAULT_SETTINGS.recording.hotkey),
      showRecordRing: asBoolean(recording.showRecordRing, DEFAULT_SETTINGS.recording.showRecordRing)
    },
    lookup: {
      autoGorohLookup: asBoolean(lookup.autoGorohLookup, DEFAULT_SETTINGS.lookup.autoGorohLookup),
      gorohLookupMode: GOROH_LOOKUP_MODES.has(lookup.gorohLookupMode) ? lookup.gorohLookupMode : DEFAULT_SETTINGS.lookup.gorohLookupMode,
      reuseLookupTabs: asBoolean(lookup.reuseLookupTabs, DEFAULT_SETTINGS.lookup.reuseLookupTabs),
      focusLookupTabs: asBoolean(lookup.focusLookupTabs, DEFAULT_SETTINGS.lookup.focusLookupTabs),
      chatGptFallbackEnabled: asBoolean(lookup.chatGptFallbackEnabled, DEFAULT_SETTINGS.lookup.chatGptFallbackEnabled),
      chatGptUrl: normalizeChatGptUrl(lookup.chatGptUrl),
      chatGptPromptTemplate: normalizePromptTemplate(lookup.chatGptPromptTemplate),
      chatGptAutoSubmit: asBoolean(lookup.chatGptAutoSubmit, DEFAULT_SETTINGS.lookup.chatGptAutoSubmit)
    }
  };
}

export function createDefaultStatus() {
  return {
    lastWord: "",
    lastForvoUrl: "",
    lastForvoTabId: 0,
    lastGorohUrl: "",
    lastStressState: "unknown",
    lastStressCheckedAt: 0,
    lastStressedWord: "",
    lastStressSample: "",
    lastAction: "",
    lastError: ""
  };
}

export function normalizeStatus(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const defaultStatus = createDefaultStatus();

  return {
    lastWord: asString(source.lastWord, defaultStatus.lastWord),
    lastForvoUrl: asString(source.lastForvoUrl, defaultStatus.lastForvoUrl),
    lastForvoTabId: clampInteger(source.lastForvoTabId, 0, Number.MAX_SAFE_INTEGER, defaultStatus.lastForvoTabId),
    lastGorohUrl: asString(source.lastGorohUrl, defaultStatus.lastGorohUrl),
    lastStressState: ["unknown", "found", "missing"].includes(source.lastStressState) ? source.lastStressState : defaultStatus.lastStressState,
    lastStressCheckedAt: clampInteger(source.lastStressCheckedAt, 0, Number.MAX_SAFE_INTEGER, defaultStatus.lastStressCheckedAt),
    lastStressedWord: asString(source.lastStressedWord, defaultStatus.lastStressedWord),
    lastStressSample: asString(source.lastStressSample, defaultStatus.lastStressSample),
    lastAction: asString(source.lastAction, defaultStatus.lastAction),
    lastError: asString(source.lastError, defaultStatus.lastError)
  };
}

export function normalizeChatGptUrl(value) {
  const fallback = DEFAULT_SETTINGS.lookup.chatGptUrl;

  try {
    const url = new URL(asString(value, fallback));
    if (url.protocol !== "https:" || !CHATGPT_HOSTS.has(url.hostname)) {
      return fallback;
    }

    return url.toString();
  } catch {
    return fallback;
  }
}

export function normalizeForvoUrl(value) {
  let text = asString(value, "").trim();

  if (!text) {
    return "";
  }

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) {
    text = `https://${text}`;
  }

  try {
    const url = new URL(text);
    if (url.protocol !== "https:" || !FORVO_HOST_PATTERN.test(url.hostname)) {
      return "";
    }

    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function normalizePromptTemplate(value) {
  const text = asString(value, DEFAULT_SETTINGS.lookup.chatGptPromptTemplate).trim();

  if (!text) {
    return DEFAULT_SETTINGS.lookup.chatGptPromptTemplate;
  }

  return text.includes("{word}") ? text : `${text} {word}`;
}

function normalizeHotkeyValue(value, fallback) {
  const text = asString(value, fallback).trim();

  if (!text || text.length > 80) {
    return fallback;
  }

  return text;
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(number)));
}

function asBoolean(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function asString(value, fallback) {
  return typeof value === "string" ? value : fallback;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
