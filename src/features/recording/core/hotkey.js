const MODIFIER_ORDER = ["Ctrl", "Alt", "Shift", "Meta"];
const MODIFIER_ALIASES = new Map([
  ["control", "Ctrl"],
  ["ctrl", "Ctrl"],
  ["option", "Alt"],
  ["alt", "Alt"],
  ["shift", "Shift"],
  ["cmd", "Meta"],
  ["command", "Meta"],
  ["meta", "Meta"],
  ["win", "Meta"],
  ["windows", "Meta"]
]);

export function normalizeHotkey(hotkey) {
  const parts = String(hotkey || "")
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  const modifiers = new Set();
  let key = "";

  for (const part of parts) {
    const normalizedModifier = MODIFIER_ALIASES.get(part.toLowerCase());

    if (normalizedModifier) {
      modifiers.add(normalizedModifier);
      continue;
    }

    key = normalizeKey(part);
  }

  if (!key) {
    return "";
  }

  return [...MODIFIER_ORDER.filter((modifier) => modifiers.has(modifier)), key].join("+");
}

export function eventMatchesHotkey(event, hotkey) {
  const normalized = normalizeHotkey(hotkey);

  if (!normalized) {
    return false;
  }

  const parts = normalized.split("+");
  const expectedKey = parts.at(-1);
  const expectedModifiers = new Set(parts.slice(0, -1));

  return event.ctrlKey === expectedModifiers.has("Ctrl")
    && event.altKey === expectedModifiers.has("Alt")
    && event.shiftKey === expectedModifiers.has("Shift")
    && event.metaKey === expectedModifiers.has("Meta")
    && normalizeKey(event.key) === expectedKey;
}

function normalizeKey(key) {
  const text = String(key || "").trim();

  if (text.length === 1) {
    return text.toUpperCase();
  }

  const lower = text.toLowerCase();

  if (lower === "space" || lower === "spacebar") return "Space";
  if (lower === "escape" || lower === "esc") return "Escape";
  if (lower.startsWith("arrow")) {
    return `Arrow${lower.slice(5, 6).toUpperCase()}${lower.slice(6)}`;
  }

  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

