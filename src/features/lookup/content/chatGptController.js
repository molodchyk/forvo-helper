import { MESSAGE_TYPES } from "../core/messages.js";
import { addRuntimeMessageListener, sendRuntimeMessage } from "../../../platform/chrome/runtime.js";
import { readPendingChatGptPrompt } from "../../../platform/chrome/storage.js";
import {
  latestUserMessageMatchesPrompt,
  shouldWaitForChatGptThread
} from "./chatGptThread.js";

const INSERTED = "inserted";
const SKIPPED_DUPLICATE = "skipped-duplicate";
const FAILED = "failed";
const RETRY_ATTEMPTS = 60;
const RETRY_DELAY_MS = 500;
const DUPLICATE_THREAD_WAIT_ATTEMPTS = 20;

export function startChatGptController() {
  if (globalThis.__forvoHelperChatGptControllerStarted) {
    return;
  }
  globalThis.__forvoHelperChatGptControllerStarted = true;

  addRuntimeMessageListener((message, _sender, sendResponse) => {
    if (message?.type === MESSAGE_TYPES.PING_CHATGPT) {
      sendResponse({ ok: true });
      return false;
    }

    if (message?.type !== MESSAGE_TYPES.SET_CHATGPT_PROMPT) {
      return false;
    }

    insertPromptWithRetries(message.prompt, {
      autoSubmit: message.autoSubmit,
      skipDuplicatePrompt: message.skipDuplicatePrompt
    }).then((result) => sendResponse(result));
    return true;
  });

  setTimeout(fillPendingPrompt, 900);
}

async function fillPendingPrompt() {
  const pending = await readPendingChatGptPrompt();

  if (!pending?.prompt || pending.filledAt) {
    return;
  }

  await insertPromptWithRetries(pending.prompt, {
    autoSubmit: pending.autoSubmit,
    skipDuplicatePrompt: pending.skipDuplicatePrompt
  });
}

async function insertPromptWithRetries(prompt, options = {}) {
  const result = options.autoSubmit
    ? await insertAndSubmitPromptWithRetries(prompt, options)
    : await insertPromptOnlyWithRetries(prompt, options);

  if (result === INSERTED) {
    sendRuntimeMessage({
      type: MESSAGE_TYPES.CHATGPT_PROMPT_INSERTED,
      prompt
    });
  }

  if (result === SKIPPED_DUPLICATE) {
    sendRuntimeMessage({
      type: MESSAGE_TYPES.CHATGPT_PROMPT_SKIPPED_DUPLICATE,
      prompt
    });
  }

  return {
    ok: result !== FAILED,
    skippedDuplicate: result === SKIPPED_DUPLICATE
  };
}

async function insertPromptOnlyWithRetries(prompt, options) {
  let duplicateWaits = options.skipDuplicatePrompt ? DUPLICATE_THREAD_WAIT_ATTEMPTS : 0;

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
    const duplicateState = duplicatePromptState(prompt, options.skipDuplicatePrompt, duplicateWaits);

    if (duplicateState === SKIPPED_DUPLICATE) {
      return SKIPPED_DUPLICATE;
    }

    if (duplicateState === "wait") {
      duplicateWaits -= 1;
      await delay(RETRY_DELAY_MS);
      continue;
    }

    if (insertPrompt(prompt)) {
      return INSERTED;
    }
    await delay(RETRY_DELAY_MS);
  }

  return FAILED;
}

async function insertAndSubmitPromptWithRetries(prompt, options) {
  let duplicateWaits = options.skipDuplicatePrompt ? DUPLICATE_THREAD_WAIT_ATTEMPTS : 0;

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
    const duplicateState = duplicatePromptState(prompt, options.skipDuplicatePrompt, duplicateWaits);

    if (duplicateState === SKIPPED_DUPLICATE) {
      return SKIPPED_DUPLICATE;
    }

    if (duplicateState === "wait") {
      duplicateWaits -= 1;
      await delay(RETRY_DELAY_MS);
      continue;
    }

    const composer = findComposer();

    if (composer) {
      if (!composerContainsPrompt(composer, prompt)) {
        insertPrompt(prompt);
      }

      if (composerContainsPrompt(composer, prompt) && clickSendButton()) {
        return INSERTED;
      }
    }

    await delay(RETRY_DELAY_MS);
  }

  return FAILED;
}

function duplicatePromptState(prompt, skipDuplicatePrompt, duplicateWaits) {
  if (!skipDuplicatePrompt) {
    return "continue";
  }

  if (latestUserMessageMatchesPrompt(document, prompt)) {
    return SKIPPED_DUPLICATE;
  }

  if (duplicateWaits > 0 && shouldWaitForChatGptThread(document, globalThis.location?.href || "")) {
    return "wait";
  }

  return "continue";
}

function insertPrompt(prompt) {
  const composer = findComposer();

  if (!composer) {
    return false;
  }

  composer.focus({ preventScroll: true });

  const ok = composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement
    ? insertIntoTextField(composer, prompt)
    : insertIntoEditableComposer(composer, prompt);

  if (!ok) {
    return false;
  }

  return true;
}

function findComposer() {
  const selectors = [
    "div#prompt-textarea[contenteditable='true']",
    "#prompt-textarea.ProseMirror[contenteditable='true']",
    "div.ProseMirror[contenteditable='true']",
    "[contenteditable='true'][aria-label*='Chat with ChatGPT' i]",
    "div[data-testid*='composer' i][contenteditable='true']",
    "textarea#prompt-textarea",
    "textarea[data-testid*='composer' i]",
    "form textarea",
    "textarea",
    "div[contenteditable='true']"
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement && isVisible(element)) {
      return element;
    }
  }

  return null;
}

function insertIntoTextField(field, prompt) {
  setNativeValue(field, prompt);
  dispatchTextInputEvents(field, prompt);
  return field.value === prompt;
}

function insertIntoEditableComposer(composer, prompt) {
  selectEditableContents(composer);

  if (document.queryCommandSupported?.("insertText") && document.execCommand("insertText", false, prompt)) {
    dispatchTextInputEvents(composer, prompt);
    return composer.textContent?.includes(prompt);
  }

  replaceEditableContents(composer, prompt);
  dispatchTextInputEvents(composer, prompt);
  return composer.textContent?.includes(prompt);
}

function composerContainsPrompt(composer, prompt) {
  if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
    return composer.value === prompt;
  }

  return Boolean(composer.textContent?.includes(prompt));
}

function selectEditableContents(element) {
  const selection = element.ownerDocument.getSelection?.() || globalThis.getSelection?.();

  if (!selection) {
    return;
  }

  const range = element.ownerDocument.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

function replaceEditableContents(element, prompt) {
  const paragraph = document.createElement("p");
  paragraph.textContent = prompt;
  element.replaceChildren(paragraph);

  const selection = element.ownerDocument.getSelection?.() || globalThis.getSelection?.();
  if (!selection) {
    return;
  }

  const range = element.ownerDocument.createRange();
  range.selectNodeContents(paragraph);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function dispatchTextInputEvents(element, prompt) {
  element.dispatchEvent(new InputEvent("beforeinput", {
    bubbles: true,
    cancelable: true,
    composed: true,
    inputType: "insertText",
    data: prompt
  }));
  element.dispatchEvent(new InputEvent("input", {
    bubbles: true,
    composed: true,
    inputType: "insertText",
    data: prompt
  }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function clickSendButton() {
  const button = document.querySelector([
    "#composer-submit-button",
    "button[data-testid='send-button']",
    "button[aria-label='Send prompt']",
    "button[aria-label*='Send' i]",
    "form button[type='submit']"
  ].join(","));

  if (button instanceof HTMLButtonElement && isEnabledButton(button)) {
    button.click();
    return true;
  }

  return false;
}

function isEnabledButton(button) {
  return !button.disabled
    && button.getAttribute("aria-disabled") !== "true"
    && !button.matches("[disabled], .disabled, [data-disabled='true']");
}

function setNativeValue(field, value) {
  const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor?.set) {
    descriptor.set.call(field, value);
  } else {
    field.value = value;
  }
}

function isVisible(element) {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);

  return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
