export const FORVO_PROFILE_STATS_KEY = "forvoHelperProfileStats";
export const FORVO_ACCOUNT_INFO_URL = "https://uk.forvo.com/account-info/";
export const FORVO_PROFILE_STATS_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export function normalizeForvoProfileStats(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const totalPronunciations = asNonNegativeInteger(source.totalPronunciations, 0);

  return {
    username: normalizeForvoUsername(source.username),
    profileUrl: normalizeForvoProfileUrl(source.profileUrl),
    totalPronunciations,
    updatedAt: asNonNegativeInteger(source.updatedAt, 0),
    lastError: asString(source.lastError).slice(0, 180)
  };
}

export function createDefaultForvoProfileStats() {
  return normalizeForvoProfileStats();
}

export function shouldRefreshForvoProfileStats(stats, now = Date.now()) {
  const normalized = normalizeForvoProfileStats(stats);

  if (!normalized.updatedAt) {
    return true;
  }

  return now - normalized.updatedAt > FORVO_PROFILE_STATS_MAX_AGE_MS;
}

export function extractForvoUsernameFromAccountPage(html) {
  const source = asString(html);
  const inputValue = findInputValue(source, ["username", "user_name", "user-name", "nickname", "nick"]);

  if (inputValue) {
    return inputValue;
  }

  const text = htmlToVisibleText(source);
  const labelMatch = text.match(/(?:Ім[’'`]?я користувача|Username|User name)\s*:?\s*([^\s<>()|]+)/iu);

  if (labelMatch) {
    return normalizeForvoUsername(labelMatch[1]);
  }

  return "";
}

export function extractForvoPronouncedWordCount(html) {
  const text = htmlToVisibleText(html);
  const patterns = [
    /(?:Вимовлених\s+слів|Вимовлені\s+слова)\s*:?\s*\(?\s*([\d\s.,]+)/iu,
    /(?:Pronounced\s+words|Words\s+pronounced)\s*:?\s*\(?\s*([\d\s.,]+)/iu
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    const count = parseLocalizedCount(match?.[1]);

    if (Number.isFinite(count)) {
      return count;
    }
  }

  return null;
}

export function buildForvoUserProfileUrl(username, origin = "https://uk.forvo.com") {
  const normalizedUsername = normalizeForvoUsername(username);

  if (!normalizedUsername) {
    return "";
  }

  try {
    const url = new URL(`/user/${encodeURIComponent(normalizedUsername)}/`, origin);

    if (url.protocol !== "https:" || !isForvoHost(url.hostname)) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

export function normalizeForvoUsername(value) {
  const text = asString(value).trim();

  if (!/^[\p{L}\p{N}][\p{L}\p{N}._-]{1,60}$/u.test(text)) {
    return "";
  }

  return text;
}

function normalizeForvoProfileUrl(value) {
  const text = asString(value).trim();

  if (!text) {
    return "";
  }

  try {
    const url = new URL(text);

    if (url.protocol !== "https:" || !isForvoHost(url.hostname) || !url.pathname.startsWith("/user/")) {
      return "";
    }

    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function findInputValue(html, acceptedNames) {
  const inputPattern = /<input\b[^>]*>/giu;
  let match;

  while ((match = inputPattern.exec(html))) {
    const tag = match[0];
    const name = getAttribute(tag, "name") || getAttribute(tag, "id");

    if (!acceptedNames.includes(name?.toLocaleLowerCase("en-US"))) {
      continue;
    }

    const value = normalizeForvoUsername(getAttribute(tag, "value"));

    if (value) {
      return value;
    }
  }

  return "";
}

function getAttribute(tag, name) {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "iu");
  const match = tag.match(pattern);

  return match ? decodeHtmlEntities(match[2]) : "";
}

function htmlToVisibleText(html) {
  return decodeHtmlEntities(asString(html))
    .replace(/<script\b[\s\S]*?<\/script>/giu, " ")
    .replace(/<style\b[\s\S]*?<\/style>/giu, " ")
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<\/(?:p|div|li|tr|td|th|h[1-6]|section|article)>/giu, "\n")
    .replace(/<[^>]+>/gu, " ")
    .replace(/[ \t\r\f\v\u00a0]+/gu, " ")
    .replace(/\s*\n\s*/gu, "\n")
    .trim();
}

function decodeHtmlEntities(value) {
  return asString(value)
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, "\"")
    .replace(/&#39;/gu, "'")
    .replace(/&#x([0-9a-f]+);/giu, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/gu, (_match, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)));
}

function parseLocalizedCount(value) {
  const digits = asString(value).replace(/[^\d]/gu, "");

  if (!digits) {
    return null;
  }

  const number = Number.parseInt(digits, 10);
  return Number.isSafeInteger(number) ? number : null;
}

function asNonNegativeInteger(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return fallback;
  }

  return Math.round(number);
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

function isForvoHost(hostname) {
  return hostname === "forvo.com" || hostname.endsWith(".forvo.com");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
