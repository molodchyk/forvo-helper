import { DEFAULT_SETTINGS, normalizeSettings } from "../../features/settings/core/settings.js";

export function applyTheme(doc = document, appearance = DEFAULT_SETTINGS.appearance) {
  const appearanceInput = typeof appearance === "string" ? { theme: appearance } : appearance;
  const normalized = normalizeSettings({ appearance: appearanceInput }).appearance;
  const root = doc.documentElement;

  root.removeAttribute("data-light-style");
  root.removeAttribute("data-dark-style");

  if (normalized.theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.dataset.theme = normalized.theme;
  }

  if (normalized.themeStyle === "default") {
    root.removeAttribute("data-theme-style");
  } else {
    root.dataset.themeStyle = normalized.themeStyle;
  }

  root.style.colorScheme = normalized.theme === "dark" ? "dark" : normalized.theme === "light" ? "light" : "light dark";
}
