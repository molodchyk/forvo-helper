import assert from "node:assert/strict";
import test from "node:test";
import { createSingleVowelStress, hasStressMark, summarizeStressResult } from "./stress.js";

test("detects combining acute stress marks", () => {
  assert.equal(hasStressMark("ЧЕМОДА́НИЩЕ"), true);
  assert.equal(hasStressMark("ЧЕМОДАНИЩЕ"), false);
});

test("returns a compact stress sample", () => {
  const sample = summarizeStressResult("слово ЧЕМОДА́НИЩЕ приклад");
  assert.match(sample, /ЧЕМОДА́НИЩЕ/u);
});

test("marks stress locally when a Ukrainian word has one vowel", () => {
  assert.equal(createSingleVowelStress("Чен"), "Че́н");
  assert.equal(createSingleVowelStress("Їж"), "Ї́ж");
  assert.equal(createSingleVowelStress("чемненький"), "");
  assert.equal(createSingleVowelStress("Чемерисів-Барських"), "");
});
