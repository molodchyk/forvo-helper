import assert from "node:assert/strict";
import test from "node:test";
import {
  formatDailyBadgeText,
  getLocalDateKey,
  normalizeDailySubmissionStats,
  registerDailySubmission
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
  assert.equal(formatDailyBadgeText(100), "99+");
});
