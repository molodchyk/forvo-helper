import assert from "node:assert/strict";
import test from "node:test";
import { findSendPronunciationButton } from "./sendButtonFinder.js";

function fakeElement(button) {
  return {
    closest(selector) {
      return selector === "#sendAudio" ? button : null;
    }
  };
}

test("finds the enabled Forvo send pronunciation button", () => {
  const button = { tagName: "BUTTON", disabled: false };

  assert.equal(findSendPronunciationButton(fakeElement(button)), button);
});

test("ignores disabled or non-button send targets", () => {
  assert.equal(findSendPronunciationButton(fakeElement({ tagName: "BUTTON", disabled: true })), null);
  assert.equal(findSendPronunciationButton(fakeElement({ tagName: "A", disabled: false })), null);
  assert.equal(findSendPronunciationButton(null), null);
});
