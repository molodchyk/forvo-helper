import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS, normalizeChatGptUrl, normalizeSettings } from "./settings.js";

test("normalizes invalid settings to safe defaults", () => {
  const settings = normalizeSettings({
    recording: {
      hoverDelayMs: 999999,
      hotkey: ""
    },
    lookup: {
      gorohLookupMode: "unknown",
      chatGptUrl: "https://example.com/"
    }
  });

  assert.equal(settings.recording.hoverDelayMs, 5000);
  assert.equal(settings.recording.hotkey, DEFAULT_SETTINGS.recording.hotkey);
  assert.equal(settings.lookup.gorohLookupMode, DEFAULT_SETTINGS.lookup.gorohLookupMode);
  assert.equal(settings.lookup.chatGptUrl, DEFAULT_SETTINGS.lookup.chatGptUrl);
});

test("accepts supported ChatGPT URLs", () => {
  assert.equal(normalizeChatGptUrl("https://chat.openai.com/g/g-test"), "https://chat.openai.com/g/g-test");
});

