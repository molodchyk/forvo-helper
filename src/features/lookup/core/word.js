const FORVO_RECORD_PATHS = new Set(["word-record", "word-quick-record"]);
const GOROH_LOOKUP_PATH = "Тлумачення";
const STRESS_MARK_PATTERN = /[\u0301\u0341]/g;

export function extractForvoWordFromUrl(href) {
  try {
    const url = new URL(href);
    const recordParts = getForvoRecordParts(url);

    if (!recordParts) {
      return "";
    }

    return normalizeLookupWord(recordParts.word);
  } catch {
    return "";
  }
}

export function normalizeForvoRecordingUrl(href) {
  try {
    const url = new URL(href);
    const recordParts = getForvoRecordParts(url);

    if (!recordParts?.word || !recordParts?.language) {
      return "";
    }

    const word = normalizeLookupWord(recordParts.word).toLocaleLowerCase("uk-UA");
    const language = recordParts.language.toLocaleLowerCase();

    if (!word || !language) {
      return "";
    }

    return `https://forvo.com/word-record/${encodeURIComponent(word)}/${encodeURIComponent(language)}/`;
  } catch {
    return "";
  }
}

export function extractGorohWordFromUrl(href) {
  try {
    const url = new URL(href);
    const parts = url.pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
    const lookupIndex = parts.indexOf(GOROH_LOOKUP_PATH);

    if (lookupIndex === -1 || !parts[lookupIndex + 1]) {
      return "";
    }

    return normalizeLookupWord(parts[lookupIndex + 1]);
  } catch {
    return "";
  }
}

export function normalizeLookupWord(word) {
  return stripStress(String(word || ""))
    .replace(/\+/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{M}'’`\-\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function preferReferenceWordCasing(referenceWord, fallbackWord) {
  const reference = normalizeLookupWord(referenceWord);
  const fallback = normalizeLookupWord(fallbackWord);

  if (!fallback) {
    return reference;
  }

  if (!reference) {
    return fallback;
  }

  return reference.toLocaleLowerCase("uk-UA") === fallback.toLocaleLowerCase("uk-UA")
    ? reference
    : fallback;
}

export function stripStress(word) {
  return String(word || "")
    .normalize("NFD")
    .replace(STRESS_MARK_PATTERN, "")
    .normalize("NFC");
}

export function buildGorohLookupUrl(word) {
  const normalized = normalizeLookupWord(word).toLocaleLowerCase("uk-UA");

  if (!normalized) {
    return "https://goroh.pp.ua/";
  }

  return `https://goroh.pp.ua/${encodeURIComponent(GOROH_LOOKUP_PATH)}/${encodeURIComponent(normalized)}`;
}

export function createChatGptPrompt(template, word) {
  const normalized = normalizeLookupWord(word);
  const safeTemplate = String(template || "").trim() || "Find the Ukrainian stress for \"{word}\".";

  return safeTemplate.replaceAll("{word}", normalized);
}

export function isSupportedForvoUrl(href) {
  return Boolean(extractForvoWordFromUrl(href));
}

function getForvoRecordParts(url) {
  const hostname = url.hostname.toLocaleLowerCase();

  if (hostname !== "forvo.com" && !hostname.endsWith(".forvo.com")) {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const recordIndex = parts.findIndex((part) => FORVO_RECORD_PATHS.has(part));

  if (recordIndex === -1 || !parts[recordIndex + 1]) {
    return null;
  }

  return {
    word: decodeURIComponent(parts[recordIndex + 1]),
    language: parts[recordIndex + 2] ? decodeURIComponent(parts[recordIndex + 2]) : ""
  };
}
