import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS, normalizeChatGptUrl, normalizeSettings, normalizeStatus } from "./settings.js";

test("normalizes invalid settings to safe defaults", () => {
  const settings = normalizeSettings({
    recording: {
      hoverDelayMs: 999999,
      hotkey: ""
    },
    appearance: {
      lightStyle: "unknown",
      darkStyle: "unknown"
    },
    lookup: {
      gorohLookupMode: "unknown",
      chatGptUrl: "https://example.com/"
    }
  });

  assert.equal(settings.recording.hoverDelayMs, 5000);
  assert.equal(settings.recording.hotkey, DEFAULT_SETTINGS.recording.hotkey);
  assert.equal(settings.appearance.theme, DEFAULT_SETTINGS.appearance.theme);
  assert.equal(settings.appearance.lightStyle, DEFAULT_SETTINGS.appearance.lightStyle);
  assert.equal(settings.appearance.darkStyle, DEFAULT_SETTINGS.appearance.darkStyle);
  assert.equal(settings.stats.showDailyBadge, DEFAULT_SETTINGS.stats.showDailyBadge);
  assert.equal(settings.lookup.gorohLookupMode, DEFAULT_SETTINGS.lookup.gorohLookupMode);
  assert.equal(settings.lookup.chatGptUrl, DEFAULT_SETTINGS.lookup.chatGptUrl);
});

test("accepts daily badge visibility setting", () => {
  assert.equal(normalizeSettings({ stats: { showDailyBadge: false } }).stats.showDailyBadge, false);
  assert.equal(normalizeSettings({ stats: { showDailyBadge: true } }).stats.showDailyBadge, true);
});

test("accepts ChatGPT preload visibility setting", () => {
  assert.equal(normalizeSettings({}).lookup.chatGptPreloadOnForvo, true);
  assert.equal(normalizeSettings({ lookup: { chatGptPreloadOnForvo: false } }).lookup.chatGptPreloadOnForvo, false);
  assert.equal(normalizeSettings({ lookup: { chatGptPreloadOnForvo: true } }).lookup.chatGptPreloadOnForvo, true);
});

test("accepts ChatGPT duplicate prompt prevention setting", () => {
  assert.equal(normalizeSettings({}).lookup.chatGptSkipDuplicatePrompt, true);
  assert.equal(normalizeSettings({ lookup: { chatGptSkipDuplicatePrompt: false } }).lookup.chatGptSkipDuplicatePrompt, false);
  assert.equal(normalizeSettings({ lookup: { chatGptSkipDuplicatePrompt: true } }).lookup.chatGptSkipDuplicatePrompt, true);
});

test("accepts supported UI themes", () => {
  assert.equal(normalizeSettings({ appearance: { theme: "dark" } }).appearance.theme, "dark");
  assert.equal(normalizeSettings({ appearance: { theme: "light" } }).appearance.theme, "light");
  assert.equal(normalizeSettings({ appearance: { theme: "system" } }).appearance.theme, "system");
});

test("accepts supported UI style variants", () => {
  const settings = normalizeSettings({
    appearance: {
      lightStyle: "mint",
      darkStyle: "graphite"
    }
  });

  assert.equal(settings.appearance.lightStyle, "mint");
  assert.equal(settings.appearance.darkStyle, "graphite");
});

test("normalizes stored Forvo stress panel status", () => {
  const status = normalizeStatus({
    lastForvoTabId: 42.4,
    lastStressedWord: "ЧЕМНЕ́НЬКИЙ",
    lastStressSample: "sample",
    lastStressSource: "local"
  });

  assert.equal(status.lastForvoTabId, 42);
  assert.equal(status.lastStressedWord, "ЧЕМНЕ́НЬКИЙ");
  assert.equal(status.lastStressSample, "sample");
  assert.equal(status.lastStressSource, "local");
});

test("accepts supported ChatGPT URLs", () => {
  assert.equal(normalizeChatGptUrl("https://chat.openai.com/g/g-test"), "https://chat.openai.com/g/g-test");
});
