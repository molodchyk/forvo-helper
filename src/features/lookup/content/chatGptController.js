import { MESSAGE_TYPES } from "../core/messages.js";
import { readPendingChatGptPrompt } from "../../../platform/chrome/storage.js";

export function startChatGptController() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const ok = insertPrompt(prompt, autoSubmit);

    if (ok) {
      chrome.runtime.sendMessage({
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

  composer.focus();

  if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
    setNativeValue(composer, prompt);
  } else {
    composer.textContent = prompt;
  }

  composer.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
  composer.dispatchEvent(new Event("change", { bubbles: true }));

  if (autoSubmit) {
    setTimeout(clickSendButton, 150);
  }

  return true;
}

function findComposer() {
  const selectors = [
    "textarea#prompt-textarea",
    "textarea[data-testid*='composer' i]",
    "div#prompt-textarea[contenteditable='true']",
    "div[data-testid*='composer' i][contenteditable='true']",
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

