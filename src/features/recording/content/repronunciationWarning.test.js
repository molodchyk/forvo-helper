import assert from "node:assert/strict";
import test from "node:test";
import { hasRepronunciationWarning } from "./repronunciationWarning.js";

function fakeDocument({ noticeTexts = [], hasSendButton = true, hasRecorder = true } = {}) {
  const section = {
    querySelector(selector) {
      if (selector === "#sendAudio") {
        return hasSendButton ? { id: "sendAudio" } : null;
      }

      if (selector === "#recorder, #canvas-recorder, canvas#canvas-recorder") {
        return hasRecorder ? { id: "recorder" } : null;
      }

      return null;
    }
  };
  const notices = noticeTexts.map((textContent) => ({
    textContent,
    closest(selector) {
      return selector === "section" ? section : null;
    }
  }));

  return {
    querySelectorAll(selector) {
      return selector === "#displayer > div > section > p.notice.error,#displayer section.main_section > p.notice.error"
        ? notices
        : [];
    }
  };
}

test("detects Forvo previously-pronounced warning from page structure", () => {
  const doc = fakeDocument({
    noticeTexts: [
      "You are going to pronounce a word you have previously pronounced. Votes will also be removed. This action cannot be undone."
    ]
  });

  assert.equal(hasRepronunciationWarning(doc), true);
});

test("detects localized Forvo previously-pronounced warning without matching text", () => {
  const doc = fakeDocument({
    noticeTexts: [
      "Ви збираєтеся вимовити слово, яке колись вже записували. Попередня вимова та голоси за неї будуть втрачені. Цю дію не можна скасувати."
    ]
  });

  assert.equal(hasRepronunciationWarning(doc), true);
});

test("ignores warning notices when the send workflow is unavailable", () => {
  const doc = fakeDocument({
    noticeTexts: ["Please enable your microphone."],
    hasSendButton: false
  });

  assert.equal(hasRepronunciationWarning(doc), false);
});

test("falls back to English warning text when recorder workflow selectors fail", () => {
  const doc = fakeDocument({
    noticeTexts: [
      "You are going to pronounce a word you have previously pronounced. Votes will also be removed. This action cannot be undone."
    ],
    hasSendButton: false,
    hasRecorder: false
  });

  assert.equal(hasRepronunciationWarning(doc), true);
});

test("falls back to Ukrainian warning text when recorder workflow selectors fail", () => {
  const doc = fakeDocument({
    noticeTexts: [
      "Ви збираєтеся вимовити слово, яке колись вже записували. Попередня вимова та голоси за неї будуть втрачені. Цю дію не можна скасувати."
    ],
    hasSendButton: false,
    hasRecorder: false
  });

  assert.equal(hasRepronunciationWarning(doc), true);
});

test("ignores warning notices outside the recorder workflow", () => {
  const doc = fakeDocument({
    noticeTexts: ["Please enable your microphone."],
    hasRecorder: false
  });

  assert.equal(hasRepronunciationWarning(doc), false);
});
