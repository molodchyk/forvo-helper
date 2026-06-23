import { extractForvoWordFromUrl, normalizeLookupWord } from "../../lookup/core/word.js";

export function getCurrentForvoWord(doc = document, href = location.href) {
  return extractWordFromHeading(doc) || extractWordFromPage(doc) || extractForvoWordFromUrl(href);
}

function extractWordFromHeading(doc) {
  const selectors = [
    "#displayer > div > section > header > p > strong",
    ".mainpage.page_word-record .main_section > header p strong",
    "section.main_section > header p strong"
  ];

  for (const selector of selectors) {
    const word = normalizeLookupWord(doc.querySelector(selector)?.textContent);

    if (isLikelyPronouncedWord(word)) {
      return word;
    }
  }

  return "";
}

function extractWordFromPage(doc) {
  const regions = [
    doc.querySelector(".mainpage.page_word-record .main_section header"),
    doc.querySelector("section.main_section header"),
    doc.body
  ].filter(Boolean);

  for (const region of regions) {
    const word = extractWordNearPronouncingLabel(region, doc);

    if (word) {
      return word;
    }
  }

  return "";
}

function extractWordNearPronouncingLabel(region, doc) {
  const lines = (region.innerText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const labelIndex = lines.findIndex((line) => /you are pronouncing/i.test(line));

  if (labelIndex !== -1) {
    const word = lines.slice(labelIndex + 1, labelIndex + 4)
      .map(normalizeLookupWord)
      .find(isLikelyPronouncedWord);

    if (word) {
      return word;
    }
  }

  const label = [...region.querySelectorAll("*")]
    .find((element) => /you are pronouncing/i.test(element.textContent || ""));

  if (!label) {
    return "";
  }

  const labelRegion = label.closest("section,article,main,div") || doc.body;
  const candidates = [...labelRegion.querySelectorAll("strong,b,h1,h2,h3,[class*='word' i]")]
    .map((element) => normalizeLookupWord(element.textContent))
    .filter(isLikelyPronouncedWord);

  return candidates[0] || "";
}

function isLikelyPronouncedWord(text) {
  if (!text || text.length <= 1) {
    return false;
  }

  return !/(you are pronouncing|ukrainian|pronounce|record|send|language)/i.test(text);
}
