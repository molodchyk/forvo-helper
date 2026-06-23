import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGorohLookupUrl,
  createChatGptPrompt,
  extractForvoWordFromUrl,
  extractGorohWordFromUrl,
  lookupWordsEquivalent,
  normalizeLookupComparisonKey,
  normalizeForvoRecordingUrl,
  normalizeLookupWord,
  preferReferenceWordCasing,
  stripStress
} from "./word.js";

test("extracts and normalizes Forvo record words", () => {
  const word = extractForvoWordFromUrl("https://forvo.com/word-record/%D1%87%D0%B5%D0%BC%D0%BD%D0%B5%D0%BD%D1%8C%D0%BA%D0%BE/uk/");
  assert.equal(word, "чемненько");
});

test("extracts and normalizes Forvo quick record words", () => {
  const word = extractForvoWordFromUrl("https://forvo.com/word-quick-record/%D1%87%D0%B5%D0%BC%D0%BD%D1%96%D1%88%D0%B8%D0%B9/uk/");
  assert.equal(word, "чемніший");
});

test("normalizes Forvo recording URLs across record routes", () => {
  const canonical = "https://forvo.com/word-record/%D1%87%D0%B5%D0%BC%D0%BD%D1%96%D1%88%D0%B8%D0%B9/uk/";

  assert.equal(
    normalizeForvoRecordingUrl("https://forvo.com/word-record/%D1%87%D0%B5%D0%BC%D0%BD%D1%96%D1%88%D0%B8%D0%B9/uk/?next=1"),
    canonical
  );
  assert.equal(
    normalizeForvoRecordingUrl("https://forvo.com/word-quick-record/%D1%87%D0%B5%D0%BC%D0%BD%D1%96%D1%88%D0%B8%D0%B9/uk/#again"),
    canonical
  );
});

test("preserves hyphenated Ukrainian lookup words", () => {
  assert.equal(normalizeLookupWord("Чемерисів-Барських"), "Чемерисів-Барських");
  assert.equal(normalizeLookupWord("Чемерисів – Барських"), "Чемерисів-Барських");
  assert.equal(
    extractForvoWordFromUrl("https://forvo.com/word-record/%D0%A7%D0%B5%D0%BC%D0%B5%D1%80%D0%B8%D1%81%D1%96%D0%B2-%D0%91%D0%B0%D1%80%D1%81%D1%8C%D0%BA%D0%B8%D1%85/uk/"),
    "Чемерисів-Барських"
  );
});

test("matches hyphenated and spaced lookup variants", () => {
  assert.equal(normalizeLookupComparisonKey("Чемерисів-Барських"), "чемерисів барських");
  assert.equal(lookupWordsEquivalent("Чемерисів-Барських", "чемерисів барських"), true);
  assert.equal(lookupWordsEquivalent("чемерисів барських", "чемерисів-барських"), true);
  assert.equal(lookupWordsEquivalent("чемерисів", "чемерисів-барських"), false);
});

test("extracts Goroh lookup words", () => {
  const word = extractGorohWordFromUrl("https://goroh.pp.ua/%D0%A2%D0%BB%D1%83%D0%BC%D0%B0%D1%87%D0%B5%D0%BD%D0%BD%D1%8F/%D1%87%D0%B5%D0%BC%D0%BE%D0%B4%D0%B0%D0%BD%D0%B8%D1%89%D0%B5");
  assert.equal(word, "чемоданище");
});

test("strips stress marks but keeps letters", () => {
  assert.equal(stripStress("ЧЕМОДА́НИЩЕ"), "ЧЕМОДАНИЩЕ");
  assert.equal(normalizeLookupWord("  ЧЕМОДА́НИЩЕ!  "), "ЧЕМОДАНИЩЕ");
});

test("preserves visible Forvo casing when Goroh returns the same lowercase word", () => {
  assert.equal(preferReferenceWordCasing("Чемерлієве", "чемерлієве"), "Чемерлієве");
  assert.equal(preferReferenceWordCasing("Чемерисів-Барських", "чемерисів барських"), "Чемерисів-Барських");
  assert.equal(preferReferenceWordCasing("Чемерисів Барських", "чемерисів-барських"), "Чемерисів Барських");
  assert.equal(preferReferenceWordCasing("", "чемерлієве"), "чемерлієве");
  assert.equal(preferReferenceWordCasing("Крисин", "чемерлієве"), "чемерлієве");
});

test("builds Goroh lookup URLs", () => {
  assert.equal(
    buildGorohLookupUrl("ЧЕМОДА́НИЩЕ"),
    "https://goroh.pp.ua/%D0%A2%D0%BB%D1%83%D0%BC%D0%B0%D1%87%D0%B5%D0%BD%D0%BD%D1%8F/%D1%87%D0%B5%D0%BC%D0%BE%D0%B4%D0%B0%D0%BD%D0%B8%D1%89%D0%B5"
  );
  assert.equal(
    buildGorohLookupUrl("Чемерисів-Барських"),
    "https://goroh.pp.ua/%D0%A2%D0%BB%D1%83%D0%BC%D0%B0%D1%87%D0%B5%D0%BD%D0%BD%D1%8F/%D1%87%D0%B5%D0%BC%D0%B5%D1%80%D0%B8%D1%81%D1%96%D0%B2-%D0%B1%D0%B0%D1%80%D1%81%D1%8C%D0%BA%D0%B8%D1%85"
  );
});

test("creates ChatGPT prompt from template", () => {
  assert.equal(createChatGptPrompt("Stress: {word}", "чемненько"), "Stress: чемненько");
  assert.equal(createChatGptPrompt("Stress: {word}", "Чемерисів-Барських"), "Stress: Чемерисів-Барських");
});
