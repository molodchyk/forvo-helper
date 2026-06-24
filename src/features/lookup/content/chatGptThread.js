export function latestUserMessageMatchesPrompt(doc, prompt) {
  const latest = findLatestUserMessageText(doc);

  return Boolean(latest) && normalizeMessageText(latest) === normalizeMessageText(prompt);
}

export function shouldWaitForChatGptThread(doc, url) {
  return isChatGptConversationUrl(url) && !findLatestUserMessageText(doc);
}

export function findLatestUserMessageText(doc) {
  const root = findThreadRoot(doc);
  const explicit = findLatestExplicitUserMessage(root);

  if (explicit) {
    return explicit;
  }

  const candidates = findAll(root, "[class*='whitespace-pre-wrap'],[class*='overflow-wrap']");

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = candidates[index];
    const text = normalizeMessageText(candidate.textContent);

    if (text && isLikelyUserMessageElement(candidate, root)) {
      return text;
    }
  }

  return "";
}

export function normalizeMessageText(value) {
  return String(value || "").replace(/\u00a0/gu, " ").replace(/\s+/gu, " ").trim();
}

function findLatestExplicitUserMessage(root) {
  const nodes = findAll(root, "[data-message-author-role='user']");

  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const text = findMessageText(nodes[index]);

    if (text) {
      return text;
    }
  }

  return "";
}

function findMessageText(node) {
  const textNodes = findAll(node, "[class*='whitespace-pre-wrap'],[class*='overflow-wrap'],p,div");

  for (let index = textNodes.length - 1; index >= 0; index -= 1) {
    const text = normalizeMessageText(textNodes[index].textContent);

    if (text && !isComposerElement(textNodes[index]) && isVisible(textNodes[index])) {
      return text;
    }
  }

  return isVisible(node) ? normalizeMessageText(node.textContent) : "";
}

function isLikelyUserMessageElement(element, root) {
  if (!isVisible(element) || isComposerElement(element) || closest(element, "[data-message-author-role='assistant']")) {
    return false;
  }

  if (closest(element, "[data-message-author-role='user']")) {
    return true;
  }

  const classText = ancestorClassText(element, root);

  if (/\b(self-end|items-end|justify-end|ml-auto|ms-auto|bg-token-message-surface)\b/u.test(classText)) {
    return true;
  }

  return isRightAligned(element, root);
}

function isComposerElement(element) {
  return Boolean(closest(element, "form,#prompt-textarea,textarea,[contenteditable='true'][aria-label*='Chat with ChatGPT' i]"));
}

function isRightAligned(element, root) {
  const rect = getRect(element);
  const rootRect = getRect(root);

  if (!rect || !rootRect || rootRect.width <= 0 || rect.width <= 0) {
    return false;
  }

  const midpoint = rootRect.left + rootRect.width * 0.5;
  const rightZone = rootRect.left + rootRect.width * 0.62;

  return rect.left >= midpoint || rect.right >= rightZone;
}

function ancestorClassText(element, root) {
  const parts = [];

  for (let current = element; current && current !== root; current = current.parentElement) {
    parts.push(String(current.className || ""));
  }

  return parts.join(" ");
}

function findThreadRoot(doc) {
  return doc?.querySelector?.("#thread")
    || doc?.querySelector?.("main")
    || doc?.body
    || doc;
}

function findAll(root, selector) {
  return Array.from(root?.querySelectorAll?.(selector) || []);
}

function closest(element, selector) {
  return element?.closest?.(selector) || null;
}

function getRect(element) {
  const rect = element?.getBoundingClientRect?.();

  return rect && Number.isFinite(rect.width) ? rect : null;
}

function isVisible(element) {
  const rect = getRect(element);

  return !rect || rect.width > 0 && rect.height > 0;
}

function isChatGptConversationUrl(value) {
  try {
    const url = new URL(value || "");

    return url.protocol === "https:"
      && (url.hostname === "chatgpt.com" || url.hostname === "chat.openai.com")
      && url.pathname.startsWith("/c/");
  } catch {
    return false;
  }
}
