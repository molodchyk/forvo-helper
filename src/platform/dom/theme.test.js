import assert from "node:assert/strict";
import test from "node:test";
import { applyTheme } from "./theme.js";

test("applies theme mode and dependent style attributes", () => {
  const doc = {
    documentElement: {
      dataset: {},
      style: {}
    }
  };

  applyTheme(doc, {
    theme: "system",
    lightStyle: "mint",
    darkStyle: "graphite"
  });

  assert.equal(doc.documentElement.dataset.theme, "system");
  assert.equal(doc.documentElement.dataset.lightStyle, "mint");
  assert.equal(doc.documentElement.dataset.darkStyle, "graphite");
  assert.equal(doc.documentElement.style.colorScheme, "light dark");
});

