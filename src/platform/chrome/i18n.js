export function messageOrDefault(key, fallback = "") {
  if (!globalThis.chrome?.i18n?.getMessage) {
    return fallback || key;
  }

  return chrome.i18n.getMessage(key) || fallback || key;
}

export function applyI18n(root = document) {
  const targetRoot = root.documentElement ? root : document;
  const html = targetRoot.documentElement;

  if (html) {
    html.lang = chrome.i18n.getUILanguage?.() || "en";
    html.dir = "ltr";
  }

  for (const element of targetRoot.querySelectorAll("[data-i18n]")) {
    element.textContent = messageOrDefault(element.dataset.i18n, element.textContent);
  }

  for (const element of targetRoot.querySelectorAll("[data-i18n-title]")) {
    element.title = messageOrDefault(element.dataset.i18nTitle, element.title);
  }

  for (const element of targetRoot.querySelectorAll("[data-i18n-placeholder]")) {
    element.placeholder = messageOrDefault(element.dataset.i18nPlaceholder, element.placeholder);
  }
}

