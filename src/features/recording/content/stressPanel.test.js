import assert from "node:assert/strict";
import test from "node:test";
import { createStressTextParts } from "./stressPanel.js";

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
