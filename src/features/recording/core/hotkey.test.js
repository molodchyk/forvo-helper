import assert from "node:assert/strict";
import test from "node:test";
import { eventMatchesHotkey, normalizeHotkey } from "./hotkey.js";

test("normalizes modifiers in a stable order", () => {
  assert.equal(normalizeHotkey("shift + alt + r"), "Alt+Shift+R");
  assert.equal(normalizeHotkey("cmd+space"), "Meta+Space");
});

test("matches keyboard events by key and modifiers", () => {
  assert.equal(eventMatchesHotkey({
    key: "r",
    altKey: true,
    shiftKey: true,
    ctrlKey: false,
    metaKey: false
  }, "Alt+Shift+R"), true);

  assert.equal(eventMatchesHotkey({
    key: "r",
    altKey: true,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false
  }, "Alt+Shift+R"), false);
});

