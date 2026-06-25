import assert from "node:assert/strict";
import test from "node:test";
import { applyTheme } from "./theme.js";

test("applies theme mode and style attributes", () => {
  const doc = {
    documentElement: {
      dataset: {},
      style: {},
      removeAttribute(name) {
        if (name === "data-theme") delete this.dataset.theme;
        if (name === "data-theme-style") delete this.dataset.themeStyle;
        if (name === "data-light-style") delete this.dataset.lightStyle;
        if (name === "data-dark-style") delete this.dataset.darkStyle;
      }
    }
  };

  applyTheme(doc, {
    theme: "dark",
    themeStyle: "forest"
  });

  assert.equal(doc.documentElement.dataset.theme, "dark");
  assert.equal(doc.documentElement.dataset.themeStyle, "forest");
  assert.equal(doc.documentElement.style.colorScheme, "dark");
});

test("removes theme attributes for system and default style", () => {
  const doc = {
    documentElement: {
      dataset: {
        theme: "dark",
        themeStyle: "forest",
        lightStyle: "mint",
        darkStyle: "graphite"
      },
      style: {},
      removeAttribute(name) {
        if (name === "data-theme") delete this.dataset.theme;
        if (name === "data-theme-style") delete this.dataset.themeStyle;
        if (name === "data-light-style") delete this.dataset.lightStyle;
        if (name === "data-dark-style") delete this.dataset.darkStyle;
      }
    }
  };

  applyTheme(doc, {
    theme: "system",
    themeStyle: "default"
  });

  assert.equal(doc.documentElement.dataset.theme, undefined);
  assert.equal(doc.documentElement.dataset.themeStyle, undefined);
  assert.equal(doc.documentElement.dataset.lightStyle, undefined);
  assert.equal(doc.documentElement.dataset.darkStyle, undefined);
  assert.equal(doc.documentElement.style.colorScheme, "light dark");
});
