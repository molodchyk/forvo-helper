export const RECORDING_HISTORY_VERSION = 1;
export const RECORDING_HISTORY_RETENTION_DAYS = 400;
export const RECORDING_HEATMAP_WEEKS = 13;
export const RECORDING_HEATMAP_DAYS_PER_WEEK = 7;

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function normalizeDailySubmissionStats(input = {}, dateKey = getLocalDateKey()) {
  const normalizedDateKey = isDateKey(dateKey) ? dateKey : getLocalDateKey();
  const source = isPlainObject(input) && input.date === normalizedDateKey ? input : {};
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
    date: normalizedDateKey,
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

export function normalizeRecordingHistory(input = {}, now = new Date()) {
  const sourceDays = isPlainObject(input?.days) ? input.days : {};
  const todayKey = getLocalDateKey(now);
  const cutoffKey = getHistoryCutoffDateKey(now);
  const days = {};

  for (const [dateKey, day] of Object.entries(sourceDays)) {
    if (!isRetainedDateKey(dateKey, cutoffKey, todayKey)) {
      continue;
    }

    const stats = normalizeDailySubmissionStats({ ...day, date: dateKey }, dateKey);
    if (stats.count > 0) {
      days[dateKey] = stats;
    }
  }

  return {
    version: RECORDING_HISTORY_VERSION,
    days
  };
}

export function migrateDailySubmissionStatsToHistory(historyInput = {}, dailyInput = {}, now = new Date()) {
  const history = normalizeRecordingHistory(historyInput, now);
  const legacyDate = isPlainObject(dailyInput) && isDateKey(dailyInput.date) ? dailyInput.date : "";
  const todayKey = getLocalDateKey(now);
  const cutoffKey = getHistoryCutoffDateKey(now);

  if (!isRetainedDateKey(legacyDate, cutoffKey, todayKey)) {
    return { history, migrated: false };
  }

  const legacyStats = normalizeDailySubmissionStats(dailyInput, legacyDate);
  if (legacyStats.count === 0) {
    return { history, migrated: false };
  }

  const existingStats = history.days[legacyDate] || normalizeDailySubmissionStats({ date: legacyDate }, legacyDate);
  const mergedStats = normalizeDailySubmissionStats({
    date: legacyDate,
    entries: {
      ...legacyStats.entries,
      ...existingStats.entries
    }
  }, legacyDate);

  return {
    history: normalizeRecordingHistory({
      version: RECORDING_HISTORY_VERSION,
      days: {
        ...history.days,
        [legacyDate]: mergedStats
      }
    }, now),
    migrated: true
  };
}

export function getDailySubmissionStatsFromHistory(historyInput = {}, date = new Date()) {
  const history = normalizeRecordingHistory(historyInput, date);
  const dateKey = getLocalDateKey(date);

  return history.days[dateKey] || normalizeDailySubmissionStats({ date: dateKey }, dateKey);
}

export function registerRecordingSubmission(historyInput = {}, submission, now = new Date()) {
  const history = normalizeRecordingHistory(historyInput, now);
  const dateKey = getLocalDateKey(now);
  const currentStats = history.days[dateKey] || normalizeDailySubmissionStats({ date: dateKey }, dateKey);
  const result = registerDailySubmission(currentStats, submission, now);
  const nextHistory = normalizeRecordingHistory({
    version: RECORDING_HISTORY_VERSION,
    days: {
      ...history.days,
      [dateKey]: result.stats
    }
  }, now);

  return {
    history: nextHistory,
    stats: nextHistory.days[dateKey] || result.stats,
    added: result.added
  };
}

export function createRecordingHeatmap(historyInput = {}, now = new Date(), weekCount = RECORDING_HEATMAP_WEEKS) {
  const history = normalizeRecordingHistory(historyInput, now);
  const today = startOfLocalDay(now);
  const currentWeekStart = startOfMondayWeek(today);
  const startDate = addLocalDays(currentWeekStart, -(Math.max(1, weekCount) - 1) * RECORDING_HEATMAP_DAYS_PER_WEEK);
  const weeks = [];

  for (let weekIndex = 0; weekIndex < Math.max(1, weekCount); weekIndex += 1) {
    const week = [];

    for (let dayIndex = 0; dayIndex < RECORDING_HEATMAP_DAYS_PER_WEEK; dayIndex += 1) {
      const date = addLocalDays(startDate, (weekIndex * RECORDING_HEATMAP_DAYS_PER_WEEK) + dayIndex);
      const dateKey = getLocalDateKey(date);
      const future = date.getTime() > today.getTime();
      const count = future ? 0 : history.days[dateKey]?.count || 0;

      week.push({
        date: dateKey,
        count,
        level: future ? 0 : getRecordingHeatmapLevel(count),
        future
      });
    }

    weeks.push(week);
  }

  return {
    startDate: getLocalDateKey(startDate),
    endDate: getLocalDateKey(addLocalDays(startDate, (Math.max(1, weekCount) * RECORDING_HEATMAP_DAYS_PER_WEEK) - 1)),
    weeks
  };
}

export function summarizeRecordingHistory(historyInput = {}, now = new Date()) {
  return {
    last7Days: countRecordingHistoryDays(historyInput, 7, now),
    last30Days: countRecordingHistoryDays(historyInput, 30, now)
  };
}

export function getRecordingHeatmapLevel(count) {
  const number = Number(count);

  if (!Number.isFinite(number) || number <= 0) return 0;
  if (number <= 4) return 1;
  if (number <= 9) return 2;
  if (number <= 19) return 3;
  return 4;
}

export function formatDailyBadgeText(count) {
  if (!Number.isFinite(count) || count <= 0) {
    return "";
  }

  return count > 9999 ? "∞" : String(count);
}

function countRecordingHistoryDays(historyInput, dayCount, now) {
  const history = normalizeRecordingHistory(historyInput, now);
  const today = startOfLocalDay(now);
  let total = 0;

  for (let index = 0; index < dayCount; index += 1) {
    const dateKey = getLocalDateKey(addLocalDays(today, -index));
    total += history.days[dateKey]?.count || 0;
  }

  return total;
}

function getHistoryCutoffDateKey(now) {
  return getLocalDateKey(addLocalDays(startOfLocalDay(now), -(RECORDING_HISTORY_RETENTION_DAYS - 1)));
}

function isRetainedDateKey(dateKey, cutoffKey, todayKey) {
  return isDateKey(dateKey) && dateKey >= cutoffKey && dateKey <= todayKey;
}

function isDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMondayWeek(date) {
  const dayIndex = date.getDay();
  const mondayOffset = (dayIndex + 6) % 7;

  return addLocalDays(startOfLocalDay(date), -mondayOffset);
}

function addLocalDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
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
