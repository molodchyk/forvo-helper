import { MESSAGE_TYPES } from "../core/messages.js";
import { extractGorohWordFromUrl, normalizeLookupWord } from "../core/word.js";
import { hasStressMark, summarizeStressResult } from "../core/stress.js";
import { addRuntimeMessageListener, sendRuntimeMessage } from "../../../platform/chrome/runtime.js";
import { collectVisibleText } from "../../../platform/dom/visibleText.js";

export function startGorohController() {
  addRuntimeMessageListener((message, _sender, sendResponse) => {
    if (message?.type !== MESSAGE_TYPES.FILL_GOROH_SEARCH) {
      return false;
    }

    sendResponse({ ok: fillGorohSearchField(message.word) });
    return true;
  });

  waitForPageToSettle().then(reportStressResult);
}

function reportStressResult() {
  const text = collectVisibleText(document.body);
  const word = extractGorohWordFromUrl(location.href) || extractTitleWord();
  const hasStress = hasStressMark(text);

  sendRuntimeMessage({
    type: MESSAGE_TYPES.GOROH_STRESS_RESULT,
    word,
    url: location.href,
    hasStress,
    sample: summarizeStressResult(text)
  });
}

function fillGorohSearchField(word) {
  const normalized = normalizeLookupWord(word);
  const field = findSearchField();

  if (!normalized || !field) {
    return false;
  }

  field.focus();
  setNativeValue(field, normalized);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));

  const form = field.closest("form");
  if (form?.requestSubmit) {
    form.requestSubmit();
    return true;
  }

  const button = document.querySelector("button[type='submit'],button[aria-label*='search' i],[class*='search' i] button");
  if (button instanceof HTMLElement) {
    button.click();
    return true;
  }

  field.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
  return true;
}

function findSearchField() {
  return document.querySelector("input[type='search'],input[name*='search' i],input[placeholder*='слов' i],input[placeholder*='word' i],input");
}

function setNativeValue(field, value) {
  const prototype = field instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (descriptor?.set) {
    descriptor.set.call(field, value);
  } else {
    field.value = value;
  }
}

function extractTitleWord() {
  const title = document.title.split(/[—|-]/)[0] || "";
  return normalizeLookupWord(title);
}

function waitForPageToSettle() {
  return new Promise((resolve) => {
    let timeout = setTimeout(done, 1200);
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(done, 700);
    });

    function done() {
      observer.disconnect();
      resolve();
    }

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    setTimeout(done, 4500);
  });
}
