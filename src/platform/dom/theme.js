import { DEFAULT_SETTINGS, normalizeSettings } from "../../features/settings/core/settings.js";

export function applyTheme(doc = document, appearance = DEFAULT_SETTINGS.appearance) {
  const appearanceInput = typeof appearance === "string" ? { theme: appearance } : appearance;
  const normalized = normalizeSettings({ appearance: appearanceInput }).appearance;
  const root = doc.documentElement;

  root.dataset.theme = normalized.theme;
  root.dataset.lightStyle = normalized.lightStyle;
  root.dataset.darkStyle = normalized.darkStyle;
  root.style.colorScheme = normalized.theme === "dark" ? "dark" : normalized.theme === "light" ? "light" : "light dark";
}
