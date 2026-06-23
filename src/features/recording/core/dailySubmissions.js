export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function normalizeDailySubmissionStats(input = {}, dateKey = getLocalDateKey()) {
  const source = isPlainObject(input) && input.date === dateKey ? input : {};
  const sourceEntries = isPlainObject(source.entries) ? source.entries : {};
  const entries = {};

  for (const [normalizedUrl, entry] of Object.entries(sourceEntries)) {
    if (!normalizedUrl || !isPlainObject(entry)) {
      continue;
    }

    entries[normalizedUrl] = {
      normalizedUrl,
      word: asString(entry.word),
      sourceUrl: asString(entry.sourceUrl),
      firstSubmittedAt: asTimestamp(entry.firstSubmittedAt),
      lastSubmittedAt: asTimestamp(entry.lastSubmittedAt),
      attempts: Math.max(1, asInteger(entry.attempts, 1))
    };
  }

  return {
    date: dateKey,
    count: Object.keys(entries).length,
    entries
  };
}

export function registerDailySubmission(input, submission, now = new Date()) {
  const dateKey = getLocalDateKey(now);
  const current = normalizeDailySubmissionStats(input, dateKey);
  const normalizedUrl = asString(submission?.normalizedUrl);

  if (!normalizedUrl) {
    return { stats: current, added: false };
  }

  const submittedAt = now.getTime();
  const existing = current.entries[normalizedUrl];
  const entries = {
    ...current.entries,
    [normalizedUrl]: {
      normalizedUrl,
      word: asString(submission.word || existing?.word),
      sourceUrl: asString(submission.sourceUrl || existing?.sourceUrl),
      firstSubmittedAt: existing?.firstSubmittedAt || submittedAt,
      lastSubmittedAt: submittedAt,
      attempts: (existing?.attempts || 0) + 1
    }
  };

  return {
    stats: {
      date: dateKey,
      count: Object.keys(entries).length,
      entries
    },
    added: !existing
  };
}

export function formatDailyBadgeText(count) {
  if (!Number.isFinite(count) || count <= 0) {
    return "";
  }

  return count > 9999 ? "∞" : String(count);
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

function asInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
}

function asTimestamp(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : 0;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
