import assert from "node:assert/strict";
import test from "node:test";
import { createStressTextParts, matchDisplayCase } from "./stressPanel.js";

test("splits stressed Goroh words into display parts", () => {
  assert.deepEqual(createStressTextParts("ЧЕМНЕ́НЬКИЙ"), [
    { text: "Ч", stressed: false },
    { text: "Е", stressed: false },
    { text: "М", stressed: false },
    { text: "Н", stressed: false },
    { text: "Е", stressed: true },
    { text: "Н", stressed: false },
    { text: "Ь", stressed: false },
    { text: "К", stressed: false },
    { text: "И", stressed: false },
    { text: "Й", stressed: false }
  ]);
});

test("keeps non-stress combining marks in display text", () => {
  assert.deepEqual(createStressTextParts("Ї́ХАТИ"), [
    { text: "Ї", stressed: true },
    { text: "Х", stressed: false },
    { text: "А", stressed: false },
    { text: "Т", stressed: false },
    { text: "И", stressed: false }
  ]);
});

test("matches Goroh uppercase display to lowercase Forvo words", () => {
  assert.equal(matchDisplayCase("ЧЕМНЕ́НЬКИЙ", "чемненький"), "чемне́нький");
});

test("matches Goroh uppercase display to title-case Forvo words", () => {
  assert.equal(matchDisplayCase("ЧЕМНЕ́НЬКИЙ", "Чемненький"), "Чемне́нький");
});

test("preserves uppercase when the Forvo word is uppercase", () => {
  assert.equal(matchDisplayCase("НАТО́", "НАТО"), "НАТО́");
});

test("preserves unusual mixed casing", () => {
  assert.equal(matchDisplayCase("TEST́", "TeSt"), "TEST́");
});

test("matches locally stressed single-vowel words to Forvo casing", () => {
  assert.equal(matchDisplayCase("Че́н", "чен"), "че́н");
  assert.equal(matchDisplayCase("че́н", "Чен"), "Че́н");
});
