import assert from "node:assert/strict";
import test from "node:test";
import {
  createRecordingHeatmap,
  formatDailyBadgeText,
  getDailySubmissionStatsFromHistory,
  getLocalDateKey,
  getRecordingHeatmapLevel,
  migrateDailySubmissionStatsToHistory,
  normalizeDailySubmissionStats,
  normalizeRecordingHistory,
  registerRecordingSubmission,
  registerDailySubmission,
  summarizeRecordingHistory
} from "./dailySubmissions.js";

test("creates local date keys", () => {
  assert.equal(getLocalDateKey(new Date(2026, 5, 21, 23, 10)), "2026-06-21");
});

test("counts normalized submission URLs only once per day", () => {
  const now = new Date(2026, 5, 21, 10, 0);
  const first = registerDailySubmission({}, {
    normalizedUrl: "https://forvo.com/word-record/%D1%87%D0%B5%D0%BC%D0%BD%D1%96%D1%88%D0%B8%D0%B9/uk/",
    word: "чемніший",
    sourceUrl: "https://forvo.com/word-quick-record/%D1%87%D0%B5%D0%BC%D0%BD%D1%96%D1%88%D0%B8%D0%B9/uk/"
  }, now);
  const second = registerDailySubmission(first.stats, {
    normalizedUrl: "https://forvo.com/word-record/%D1%87%D0%B5%D0%BC%D0%BD%D1%96%D1%88%D0%B8%D0%B9/uk/",
    word: "чемніший",
    sourceUrl: "https://forvo.com/word-record/%D1%87%D0%B5%D0%BC%D0%BD%D1%96%D1%88%D0%B8%D0%B9/uk/"
  }, new Date(2026, 5, 21, 10, 5));

  const entry = second.stats.entries["https://forvo.com/word-record/%D1%87%D0%B5%D0%BC%D0%BD%D1%96%D1%88%D0%B8%D0%B9/uk/"];
  assert.equal(first.added, true);
  assert.equal(second.added, false);
  assert.equal(second.stats.count, 1);
  assert.equal(entry.attempts, 2);
});

test("resets stale daily submission stats", () => {
  const stats = normalizeDailySubmissionStats({
    date: "2026-06-20",
    entries: {
      "https://forvo.com/word-record/test/uk/": {
        normalizedUrl: "https://forvo.com/word-record/test/uk/",
        attempts: 1
      }
    }
  }, "2026-06-21");

  assert.equal(stats.count, 0);
  assert.deepEqual(stats.entries, {});
});

test("formats daily badge counts compactly", () => {
  assert.equal(formatDailyBadgeText(0), "");
  assert.equal(formatDailyBadgeText(12), "12");
  assert.equal(formatDailyBadgeText(100), "100");
  assert.equal(formatDailyBadgeText(999), "999");
  assert.equal(formatDailyBadgeText(1000), "1000");
  assert.equal(formatDailyBadgeText(9999), "9999");
  assert.equal(formatDailyBadgeText(10000), "∞");
});

test("migrates legacy daily submissions into recording history", () => {
  const now = new Date(2026, 5, 25, 12, 0);
  const migration = migrateDailySubmissionStatsToHistory({}, {
    date: "2026-06-25",
    entries: {
      "https://forvo.com/word-record/test/uk/": {
        normalizedUrl: "https://forvo.com/word-record/test/uk/",
        word: "тест",
        attempts: 1
      }
    }
  }, now);

  assert.equal(migration.migrated, true);
  assert.equal(getDailySubmissionStatsFromHistory(migration.history, now).count, 1);
});

test("recording history counts normalized URLs once per local day", () => {
  const first = registerRecordingSubmission({}, {
    normalizedUrl: "https://forvo.com/word-record/test/uk/",
    word: "тест",
    sourceUrl: "https://forvo.com/word-quick-record/test/uk/"
  }, new Date(2026, 5, 25, 10, 0));
  const second = registerRecordingSubmission(first.history, {
    normalizedUrl: "https://forvo.com/word-record/test/uk/",
    word: "тест",
    sourceUrl: "https://forvo.com/word-record/test/uk/"
  }, new Date(2026, 5, 25, 10, 5));

  const entry = second.history.days["2026-06-25"].entries["https://forvo.com/word-record/test/uk/"];
  assert.equal(first.added, true);
  assert.equal(second.added, false);
  assert.equal(second.stats.count, 1);
  assert.equal(entry.attempts, 2);
});

test("recording history counts the same normalized URL again on a different day", () => {
  const first = registerRecordingSubmission({}, {
    normalizedUrl: "https://forvo.com/word-record/test/uk/"
  }, new Date(2026, 5, 24, 10, 0));
  const second = registerRecordingSubmission(first.history, {
    normalizedUrl: "https://forvo.com/word-record/test/uk/"
  }, new Date(2026, 5, 25, 10, 0));

  assert.equal(second.history.days["2026-06-24"].count, 1);
  assert.equal(second.history.days["2026-06-25"].count, 1);
  assert.equal(second.added, true);
});

test("recording history prunes days older than four hundred local days", () => {
  const history = normalizeRecordingHistory({
    version: 1,
    days: {
      "2025-05-21": {
        date: "2025-05-21",
        entries: {
          old: { normalizedUrl: "old" }
        }
      },
      "2025-05-22": {
        date: "2025-05-22",
        entries: {
          retained: { normalizedUrl: "retained" }
        }
      }
    }
  }, new Date(2026, 5, 25, 12, 0));

  assert.equal(history.days["2025-05-21"], undefined);
  assert.equal(history.days["2025-05-22"].count, 1);
});

test("recording heatmap creates thirteen Monday-first weeks ending at the current week", () => {
  const heatmap = createRecordingHeatmap({}, new Date(2026, 5, 25, 12, 0));

  assert.equal(heatmap.weeks.length, 13);
  assert.equal(heatmap.weeks[0][0].date, "2026-03-30");
  assert.equal(heatmap.weeks[12][0].date, "2026-06-22");
  assert.equal(heatmap.weeks[12][3].date, "2026-06-25");
  assert.equal(heatmap.weeks[12][4].future, true);
});

test("recording heatmap excludes future stored days from visible counts", () => {
  const heatmap = createRecordingHeatmap({
    version: 1,
    days: {
      "2026-06-26": {
        date: "2026-06-26",
        entries: {
          future: { normalizedUrl: "future" }
        }
      }
    }
  }, new Date(2026, 5, 25, 12, 0));

  assert.equal(heatmap.weeks[12][4].future, true);
  assert.equal(heatmap.weeks[12][4].count, 0);
});

test("recording summaries exclude future stored days", () => {
  const summary = summarizeRecordingHistory({
    version: 1,
    days: {
      "2026-06-25": {
        date: "2026-06-25",
        entries: {
          today: { normalizedUrl: "today" }
        }
      },
      "2026-06-26": {
        date: "2026-06-26",
        entries: {
          future: { normalizedUrl: "future" }
        }
      }
    }
  }, new Date(2026, 5, 25, 12, 0));

  assert.equal(summary.last7Days, 1);
  assert.equal(summary.last30Days, 1);
});

test("recording heatmap uses fixed count intensity levels", () => {
  assert.equal(getRecordingHeatmapLevel(0), 0);
  assert.equal(getRecordingHeatmapLevel(1), 1);
  assert.equal(getRecordingHeatmapLevel(4), 1);
  assert.equal(getRecordingHeatmapLevel(5), 2);
  assert.equal(getRecordingHeatmapLevel(9), 2);
  assert.equal(getRecordingHeatmapLevel(10), 3);
  assert.equal(getRecordingHeatmapLevel(19), 3);
  assert.equal(getRecordingHeatmapLevel(20), 4);
});
