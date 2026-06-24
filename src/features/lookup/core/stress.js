const STRESS_MARK_PATTERN = /[\u0301\u0341]/u;
const UKRAINIAN_VOWELS = new Set([...("аеєиіїоуюяАЕЄИІЇОУЮЯ")]);

export function hasStressMark(text) {
  return STRESS_MARK_PATTERN.test(String(text || "").normalize("NFD"));
}

export function summarizeStressResult(text) {
  const normalized = String(text || "").normalize("NFD");
  const index = normalized.search(STRESS_MARK_PATTERN);

  if (index === -1) {
    return "";
  }

  const start = Math.max(0, index - 28);
  const end = Math.min(normalized.length, index + 32);

  return normalized.slice(start, end).replace(/\s+/g, " ").trim();
}

export function createSingleVowelStress(word) {
  const characters = [...String(word || "")];
  const vowelIndexes = characters
    .map((character, index) => UKRAINIAN_VOWELS.has(character) ? index : -1)
    .filter((index) => index !== -1);

  if (vowelIndexes.length !== 1) {
    return "";
  }

  const index = vowelIndexes[0];
  characters[index] = `${characters[index]}\u0301`;

  return characters.join("").normalize("NFC");
}
