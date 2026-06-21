import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGorohLookupUrl,
  createChatGptPrompt,
  extractForvoWordFromUrl,
  extractGorohWordFromUrl,
  normalizeForvoRecordingUrl,
  normalizeLookupWord,
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

test("extracts Goroh lookup words", () => {
  const word = extractGorohWordFromUrl("https://goroh.pp.ua/%D0%A2%D0%BB%D1%83%D0%BC%D0%B0%D1%87%D0%B5%D0%BD%D0%BD%D1%8F/%D1%87%D0%B5%D0%BC%D0%BE%D0%B4%D0%B0%D0%BD%D0%B8%D1%89%D0%B5");
  assert.equal(word, "чемоданище");
});

test("strips stress marks but keeps letters", () => {
  assert.equal(stripStress("ЧЕМОДА́НИЩЕ"), "ЧЕМОДАНИЩЕ");
  assert.equal(normalizeLookupWord("  ЧЕМОДА́НИЩЕ!  "), "ЧЕМОДАНИЩЕ");
});

test("builds Goroh lookup URLs", () => {
  assert.equal(
    buildGorohLookupUrl("ЧЕМОДА́НИЩЕ"),
    "https://goroh.pp.ua/%D0%A2%D0%BB%D1%83%D0%BC%D0%B0%D1%87%D0%B5%D0%BD%D0%BD%D1%8F/%D1%87%D0%B5%D0%BC%D0%BE%D0%B4%D0%B0%D0%BD%D0%B8%D1%89%D0%B5"
  );
});

test("creates ChatGPT prompt from template", () => {
  assert.equal(createChatGptPrompt("Stress: {word}", "чемненько"), "Stress: чемненько");
});
