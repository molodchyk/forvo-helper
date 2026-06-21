import { MESSAGE_TYPES } from "../core/messages.js";
import { buildGorohLookupUrl, createChatGptPrompt, normalizeLookupWord } from "../core/word.js";
import {
  readPendingChatGptPrompt,
  readSettings,
  readStatus,
  writePendingChatGptPrompt,
  writeSettings,
  writeStatus
} from "../../../platform/chrome/storage.js";
import { getActiveTab, openOrReuseTab, sendTabMessage, waitForTabComplete } from "../../../platform/chrome/tabs.js";

const GOROH_PATTERNS = ["https://goroh.pp.ua/*", "https://www.goroh.pp.ua/*"];
const CHATGPT_PATTERNS = ["https://chatgpt.com/*", "https://chat.openai.com/*"];

export function registerLookupCoordinator() {
  chrome.runtime.onInstalled.addListener(() => {
    readSettings().then(writeSettings);
  });
  chrome.commands.onCommand.addListener((command) => {
    if (command === "trigger-recording") {
      startRecordingOnActiveTab();
    }
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then((response) => sendResponse({ ok: true, ...response }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  });
}

async function handleMessage(message, sender) {
  switch (message?.type) {
    case MESSAGE_TYPES.GET_STATUS:
      return {
        settings: await readSettings(),
        status: await readStatus()
      };
    case MESSAGE_TYPES.POPUP_START_RECORDING:
      return startRecordingOnActiveTab();
    case MESSAGE_TYPES.POPUP_OPEN_GOROH:
      return openGorohFromStatus();
    case MESSAGE_TYPES.FORVO_WORD_DETECTED:
      return handleForvoWordDetected(message, sender);
    case MESSAGE_TYPES.RECORDING_TRIGGERED:
      return writeStatus({
        lastAction: message.ok ? `recording:${message.source}` : "recording-target-missing",
        lastError: message.ok ? "" : "Could not find the Forvo record button."
      });
    case MESSAGE_TYPES.GOROH_STRESS_RESULT:
      return handleGorohStressResult(message, sender);
    case MESSAGE_TYPES.CHATGPT_PROMPT_INSERTED:
      return handleChatGptPromptInserted(message);
    default:
      return {};
  }
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
    lastStressState: "unknown",
    lastAction: "forvo-word-detected",
    lastError: ""
  });

  if (settings.lookup.autoGorohLookup) {
    await openGorohForWord(word, settings);
  }

  return { word };
}

async function openGorohFromStatus() {
  const settings = await readSettings();
  const status = await readStatus();

  if (!status.lastWord) {
    throw new Error("No current word is available.");
  }

  await openGorohForWord(status.lastWord, settings);
  return { word: status.lastWord };
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
  const word = normalizeLookupWord(message.word) || (await readStatus()).lastWord;
  const hasStress = Boolean(message.hasStress);
  const settings = await readSettings();

  await writeStatus({
    lastWord: word,
    lastGorohUrl: message.url || "",
    lastStressState: hasStress ? "found" : "missing",
    lastStressCheckedAt: Date.now(),
    lastAction: hasStress ? "goroh-stress-found" : "goroh-stress-missing",
    lastError: ""
  });

  if (!hasStress && word && settings.lookup.chatGptFallbackEnabled) {
    await openChatGptForWord(word, settings);
  }

  return { word, hasStress };
}

async function openChatGptForWord(word, settings) {
  const existingPending = await readPendingChatGptPrompt();
  const prompt = createChatGptPrompt(settings.lookup.chatGptPromptTemplate, word);

  if (existingPending?.word === word && existingPending?.prompt === prompt && !existingPending?.filledAt) {
    return null;
  }

  const pending = {
    word,
    prompt,
    autoSubmit: settings.lookup.chatGptAutoSubmit,
    createdAt: Date.now(),
    filledAt: 0
  };

  await writePendingChatGptPrompt(pending);

  const tab = await openOrReuseTab({
    url: settings.lookup.chatGptUrl,
    matchPatterns: CHATGPT_PATTERNS,
    active: settings.lookup.focusLookupTabs,
    reuse: settings.lookup.reuseLookupTabs
  });

  if (tab.id) {
    await waitForTabComplete(tab.id);
    await sendTabMessage(tab.id, {
      type: MESSAGE_TYPES.SET_CHATGPT_PROMPT,
      prompt,
      autoSubmit: settings.lookup.chatGptAutoSubmit
    });
  }

  await writeStatus({ lastAction: "chatgpt-fallback-opened" });
  return tab;
}

async function handleChatGptPromptInserted(message) {
  const pending = await readPendingChatGptPrompt();

  if (!pending || pending.prompt !== message.prompt) {
    return {};
  }

  await writePendingChatGptPrompt({
    ...pending,
    filledAt: Date.now()
  });
  await writeStatus({ lastAction: "chatgpt-prompt-inserted" });
  return {};
}

async function startRecordingOnActiveTab() {
  const tab = await getActiveTab();

  if (!tab?.id) {
    throw new Error("No active tab is available.");
  }

  const response = await sendTabMessage(tab.id, { type: MESSAGE_TYPES.START_RECORDING });
  return { sent: Boolean(response?.ok) };
}

