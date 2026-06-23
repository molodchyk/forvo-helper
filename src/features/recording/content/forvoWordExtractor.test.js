import assert from "node:assert/strict";
import test from "node:test";
import { getCurrentForvoWord } from "./forvoWordExtractor.js";

function fakeDocument({ headingText = "", bodyText = "" }) {
  const heading = headingText ? { textContent: headingText } : null;
  return {
    body: {
      innerText: bodyText,
      querySelectorAll() {
        return [];
      }
    },
    querySelector(selector) {
      if (selector === "#displayer > div > section > header > p > strong") {
        return heading;
      }

      return null;
    }
  };
}

test("uses visible Forvo heading casing before URL casing", () => {
  const doc = fakeDocument({ headingText: "\n\tЧемерлієве\n" });
  const word = getCurrentForvoWord(doc, "https://forvo.com/word-record/%D1%87%D0%B5%D0%BC%D0%B5%D1%80%D0%BB%D1%96%D1%94%D0%B2%D0%B5/uk/");

  assert.equal(word, "Чемерлієве");
});

test("falls back to Forvo URL when heading is unavailable", () => {
  const doc = fakeDocument({});
  const word = getCurrentForvoWord(doc, "https://forvo.com/word-record/%D1%87%D0%B5%D0%BC%D0%B5%D1%80%D0%BB%D1%96%D1%94%D0%B2%D0%B5/uk/");

  assert.equal(word, "чемерлієве");
});
