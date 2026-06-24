import { MESSAGE_TYPES } from "../core/messages.js";
import { buildChatGptReusePatterns } from "../core/chatGptUrl.js";
import { createChatGptPrompt } from "../core/word.js";
import {
  readPendingChatGptPrompt,
  readSettings,
  writePendingChatGptPrompt,
  writeStatus
} from "../../../platform/chrome/storage.js";
import { injectScriptFile, openOrReuseTab, sendTabMessage, waitForTabComplete } from "../../../platform/chrome/tabs.js";

let preloadPromise = null;

export async function openChatGptForWord(word, settings) {
  const existingPending = await readPendingChatGptPrompt();
  const prompt = createChatGptPrompt(settings.lookup.chatGptPromptTemplate, word);
  const reusePending = existingPending?.word === word && existingPending?.prompt === prompt && !existingPending?.filledAt;
  const pending = {
    word,
    prompt,
    autoSubmit: settings.lookup.chatGptAutoSubmit,
    skipDuplicatePrompt: settings.lookup.chatGptSkipDuplicatePrompt,
    createdAt: reusePending ? existingPending.createdAt : Date.now(),
    lastOpenedAt: Date.now(),
    filledAt: 0
  };

  await writePendingChatGptPrompt(pending);

  const tab = await openOrReuseTab({
    url: settings.lookup.chatGptUrl,
    matchPatterns: buildChatGptReusePatterns(settings.lookup.chatGptUrl),
    active: settings.lookup.focusLookupTabs,
    reuse: settings.lookup.reuseLookupTabs,
    updateExistingUrl: false
  });

  if (tab.id) {
    await waitForTabComplete(tab.id);
    await ensureChatGptContentScript(tab.id);
    await sendTabMessage(tab.id, {
      type: MESSAGE_TYPES.SET_CHATGPT_PROMPT,
      prompt,
      autoSubmit: settings.lookup.chatGptAutoSubmit,
      skipDuplicatePrompt: settings.lookup.chatGptSkipDuplicatePrompt
    });
  }

  await writeStatus({ lastAction: "chatgpt-fallback-opened" });
  return tab;
}

export function preloadChatGptForForvoUrl(url) {
  if (!isForvoPreloadUrl(url)) {
    return;
  }

  preloadChatGptTab().catch(() => {});
}

export function preloadChatGptTab() {
  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    const settings = await readSettings();

    if (!settings.lookup.chatGptPreloadOnForvo) {
      return null;
    }

    const tab = await openOrReuseTab({
      url: settings.lookup.chatGptUrl,
      matchPatterns: buildChatGptReusePatterns(settings.lookup.chatGptUrl),
      active: false,
      reuse: true,
      updateExistingUrl: false
    });

    if (tab.id) {
      await waitForTabComplete(tab.id);
      await ensureChatGptContentScript(tab.id);
    }

    return tab;
  })().finally(() => {
    preloadPromise = null;
  });

  return preloadPromise;
}

export async function handleChatGptPromptInserted(message) {
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

export async function handleChatGptPromptSkippedDuplicate(message) {
  const pending = await readPendingChatGptPrompt();

  if (!pending || pending.prompt !== message.prompt) {
    return {};
  }

  const skippedAt = Date.now();
  await writePendingChatGptPrompt({
    ...pending,
    filledAt: skippedAt,
    skippedDuplicateAt: skippedAt
  });
  await writeStatus({ lastAction: "chatgpt-duplicate-skipped" });
  return {};
}

async function ensureChatGptContentScript(tabId) {
  const ping = await sendTabMessage(tabId, { type: MESSAGE_TYPES.PING_CHATGPT });

  if (ping?.ok) {
    return true;
  }

  await injectScriptFile(tabId, "app/content/chatgpt.js");

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const retryPing = await sendTabMessage(tabId, { type: MESSAGE_TYPES.PING_CHATGPT });

    if (retryPing?.ok) {
      return true;
    }

    await delay(150);
  }

  return false;
}

function isForvoPreloadUrl(url) {
  if (!isForvoUrl(url)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return !isPathOrChild(parsed.pathname, "/account-info") && !isPathOrChild(parsed.pathname, "/user");
  } catch {
    return false;
  }
}

function isForvoUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:"
      && (parsed.hostname === "forvo.com" || parsed.hostname.endsWith(".forvo.com"));
  } catch {
    return false;
  }
}

function isPathOrChild(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
