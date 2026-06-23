import assert from "node:assert/strict";
import test from "node:test";
import { hasRepronunciationWarning } from "./repronunciationWarning.js";

function fakeDocument(noticeTexts) {
  const notices = noticeTexts.map((textContent) => ({ textContent }));

  return {
    querySelectorAll(selector) {
      return selector === "#displayer > div > section > p.notice.error"
        ? notices
        : [];
    }
  };
}

test("detects Forvo previously-pronounced warning", () => {
  const doc = fakeDocument([
    "You are going to pronounce a word you have previously pronounced. Votes will also be removed. This action cannot be undone."
  ]);

  assert.equal(hasRepronunciationWarning(doc), true);
});

test("ignores unrelated Forvo error notices", () => {
  const doc = fakeDocument(["Please enable your microphone."]);

  assert.equal(hasRepronunciationWarning(doc), false);
});
