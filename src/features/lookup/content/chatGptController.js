import { MESSAGE_TYPES } from "../core/messages.js";
import { addRuntimeMessageListener, sendRuntimeMessage } from "../../../platform/chrome/runtime.js";
import { readPendingChatGptPrompt } from "../../../platform/chrome/storage.js";

export function startChatGptController() {
  addRuntimeMessageListener((message, _sender, sendResponse) => {
    if (message?.type !== MESSAGE_TYPES.SET_CHATGPT_PROMPT) {
      return false;
    }

    insertPromptWithRetries(message.prompt, message.autoSubmit).then((ok) => sendResponse({ ok }));
    return true;
  });

  setTimeout(fillPendingPrompt, 900);
}

async function fillPendingPrompt() {
  const pending = await readPendingChatGptPrompt();

  if (!pending?.prompt || pending.filledAt) {
    return;
  }

  await insertPromptWithRetries(pending.prompt, pending.autoSubmit);
}

async function insertPromptWithRetries(prompt, autoSubmit = false) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const ok = insertPrompt(prompt, autoSubmit);

    if (ok) {
      sendRuntimeMessage({
        type: MESSAGE_TYPES.CHATGPT_PROMPT_INSERTED,
        prompt
      });
      return true;
    }

    await delay(500);
  }

  return false;
}

function insertPrompt(prompt, autoSubmit) {
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

  if (autoSubmit) {
    setTimeout(clickSendButton, 250);
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
  const button = document.querySelector("button[data-testid='send-button'],button[aria-label*='Send' i],form button[type='submit']");

  if (button instanceof HTMLButtonElement && !button.disabled) {
    button.click();
  }
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
