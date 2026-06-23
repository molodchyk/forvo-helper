import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS, normalizeChatGptUrl, normalizeForvoUrl, normalizeSettings, normalizeStatus } from "./settings.js";

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
  assert.equal(settings.appearance.theme, DEFAULT_SETTINGS.appearance.theme);
  assert.equal(settings.stats.showDailyBadge, DEFAULT_SETTINGS.stats.showDailyBadge);
  assert.equal(settings.stats.forvoListenStatsEnabled, DEFAULT_SETTINGS.stats.forvoListenStatsEnabled);
  assert.equal(settings.stats.forvoListenStatsUrl, DEFAULT_SETTINGS.stats.forvoListenStatsUrl);
  assert.equal(settings.lookup.gorohLookupMode, DEFAULT_SETTINGS.lookup.gorohLookupMode);
  assert.equal(settings.lookup.chatGptUrl, DEFAULT_SETTINGS.lookup.chatGptUrl);
});

test("accepts daily badge visibility setting", () => {
  assert.equal(normalizeSettings({ stats: { showDailyBadge: false } }).stats.showDailyBadge, false);
  assert.equal(normalizeSettings({ stats: { showDailyBadge: true } }).stats.showDailyBadge, true);
});

test("accepts Forvo listen stats settings", () => {
  const settings = normalizeSettings({
    stats: {
      forvoListenStatsEnabled: true,
      forvoListenStatsUrl: "https://forvo.com/user/Oleksandr/pronunciations/#top"
    }
  });

  assert.equal(settings.stats.forvoListenStatsEnabled, true);
  assert.equal(settings.stats.forvoListenStatsUrl, "https://forvo.com/user/Oleksandr/pronunciations/");
});

test("accepts supported UI themes", () => {
  assert.equal(normalizeSettings({ appearance: { theme: "dark" } }).appearance.theme, "dark");
  assert.equal(normalizeSettings({ appearance: { theme: "light" } }).appearance.theme, "light");
  assert.equal(normalizeSettings({ appearance: { theme: "system" } }).appearance.theme, "system");
});

test("normalizes stored Forvo stress panel status", () => {
  const status = normalizeStatus({
    lastForvoTabId: 42.4,
    lastStressedWord: "ЧЕМНЕ́НЬКИЙ",
    lastStressSample: "sample"
  });

  assert.equal(status.lastForvoTabId, 42);
  assert.equal(status.lastStressedWord, "ЧЕМНЕ́НЬКИЙ");
  assert.equal(status.lastStressSample, "sample");
});

test("accepts supported ChatGPT URLs", () => {
  assert.equal(normalizeChatGptUrl("https://chat.openai.com/g/g-test"), "https://chat.openai.com/g/g-test");
});

test("accepts only secure Forvo URLs for listen stats", () => {
  assert.equal(normalizeForvoUrl("https://forvo.com/user/Oleksandr/pronunciations/"), "https://forvo.com/user/Oleksandr/pronunciations/");
  assert.equal(normalizeForvoUrl("forvo.com/user/Oleksandr/pronunciations/"), "https://forvo.com/user/Oleksandr/pronunciations/");
  assert.equal(normalizeForvoUrl("https://uk.forvo.com/user/Oleksandr/pronunciations/"), "https://uk.forvo.com/user/Oleksandr/pronunciations/");
  assert.equal(normalizeForvoUrl("http://forvo.com/user/Oleksandr/pronunciations/"), "");
  assert.equal(normalizeForvoUrl("https://example.com/user/Oleksandr/pronunciations/"), "");
});
