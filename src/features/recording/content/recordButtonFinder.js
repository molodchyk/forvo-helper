const SELECTORS = [
  "button",
  "[role='button']",
  "a",
  "label",
  "[onclick]",
  "[class*='record' i]",
  "[id*='record' i]",
  "[class*='recorder' i]",
  "[id*='recorder' i]",
  "[class*='micro' i]",
  "[class*='mic' i]",
  "[aria-label*='record' i]",
  "[title*='record' i]"
];
const RECORD_TEXT_PATTERN = /(press\s+to\s+record|record|recorder|microphone|mic|запис)/i;
const NEGATIVE_TEXT_PATTERN = /(send\s+pronunciation|search|language|blog|users|categories)/i;

export function findRecordButton(doc = document) {
  const candidates = new Set();

  for (const selector of SELECTORS) {
    for (const element of doc.querySelectorAll(selector)) {
      candidates.add(element);
    }
  }

  for (const label of findShortRecordTextElements(doc)) {
    for (const element of nearbyElements(label)) {
      candidates.add(element);
    }
  }

  const scored = [...candidates]
    .map((element) => ({ element, score: scoreCandidate(element, doc) }))
    .filter((candidate) => candidate.score >= 35)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.element || null;
}

function scoreCandidate(element, doc) {
  if (!(element instanceof Element) || !isVisible(element)) {
    return 0;
  }

  const text = candidateText(element);
  const rect = element.getBoundingClientRect();
  let score = 0;

  if (element.tagName === "BUTTON") score += 26;
  if (element.getAttribute("role") === "button") score += 20;
  if (element.hasAttribute("onclick")) score += 16;
  if (getComputedStyle(element).cursor === "pointer") score += 12;
  if (RECORD_TEXT_PATTERN.test(text)) score += 44;
  if (NEGATIVE_TEXT_PATTERN.test(text)) score -= 32;
  if (isRoundish(rect)) score += 10;
  if (hasRedBackground(element)) score += 18;
  if (isNearRecordLabel(element, doc)) score += 28;
  if (rect.width >= 32 && rect.width <= 220 && rect.height >= 32 && rect.height <= 220) score += 8;

  return score;
}

function candidateText(element) {
  return [
    element.id,
    element.className,
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.getAttribute("data-action"),
    element.textContent
  ].filter(Boolean).join(" ");
}

function findShortRecordTextElements(doc) {
  return [...doc.querySelectorAll("body *")].filter((element) => {
    const text = element.textContent?.replace(/\s+/g, " ").trim() || "";
    return text.length > 0 && text.length <= 80 && RECORD_TEXT_PATTERN.test(text);
  });
}

function nearbyElements(label) {
  const elements = new Set();
  let parent = label.parentElement;

  for (let depth = 0; parent && depth < 4; depth += 1) {
    elements.add(parent);
    for (const child of parent.querySelectorAll("button,[role='button'],[onclick],[class*='record' i],[class*='mic' i],a,div,span")) {
      elements.add(child);
    }

    parent = parent.parentElement;
  }

  return elements;
}

function isNearRecordLabel(element, doc) {
  const rect = element.getBoundingClientRect();
  const center = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };

  return findShortRecordTextElements(doc).some((label) => {
    const labelRect = label.getBoundingClientRect();
    const labelCenter = {
      x: labelRect.left + labelRect.width / 2,
      y: labelRect.top + labelRect.height / 2
    };

    return Math.hypot(center.x - labelCenter.x, center.y - labelCenter.y) < 190;
  });
}

function hasRedBackground(element) {
  const rgb = getComputedStyle(element).backgroundColor.match(/\d+(?:\.\d+)?/g)?.map(Number);

  if (!rgb || rgb.length < 3) {
    return false;
  }

  return rgb[0] > 150 && rgb[1] < 150 && rgb[2] < 150;
}

function isRoundish(rect) {
  if (!rect.width || !rect.height) {
    return false;
  }

  return Math.abs(rect.width - rect.height) <= Math.max(rect.width, rect.height) * 0.25;
}

function isVisible(element) {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);

  return rect.width > 1
    && rect.height > 1
    && style.display !== "none"
    && style.visibility !== "hidden"
    && Number(style.opacity || 1) > 0.05;
}

