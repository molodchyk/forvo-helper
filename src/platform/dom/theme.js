import { DEFAULT_SETTINGS, normalizeSettings } from "../../features/settings/core/settings.js";

export function applyTheme(doc = document, theme = DEFAULT_SETTINGS.appearance.theme) {
  const normalized = normalizeSettings({ appearance: { theme } }).appearance.theme;
  const root = doc.documentElement;

  root.dataset.theme = normalized;
  root.style.colorScheme = normalized === "dark" ? "dark" : normalized === "light" ? "light" : "light dark";
}

