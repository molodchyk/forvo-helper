import assert from "node:assert/strict";
import test from "node:test";
import { getLocalDateKey } from "../../features/recording/core/dailySubmissions.js";
import { DAILY_SUBMISSIONS_KEY, RECORDING_HISTORY_KEY } from "../../features/settings/core/settings.js";
import { clearRecordingHistory, readDailySubmissionStats, readRecordingHistory } from "./storage.js";

test("storage migrates legacy daily submissions into recording history", async () => {
  const today = getLocalDateKey(new Date());
  const localStore = {
    [DAILY_SUBMISSIONS_KEY]: {
      date: today,
      entries: {
        "https://forvo.com/word-record/test/uk/": {
          normalizedUrl: "https://forvo.com/word-record/test/uk/",
          word: "тест",
          attempts: 1
        }
      }
    }
  };
  const restoreChrome = installChromeStorage({ localStore });

  try {
    const history = await readRecordingHistory();

    assert.equal(history.days[today].count, 1);
    assert.equal(localStore[DAILY_SUBMISSIONS_KEY], undefined);
    assert.equal(localStore[RECORDING_HISTORY_KEY].days[today].count, 1);
  } finally {
    restoreChrome();
  }
});

test("storage clears recording history and legacy daily submissions", async () => {
  const today = getLocalDateKey(new Date());
  const localStore = {
    [RECORDING_HISTORY_KEY]: {
      version: 1,
      days: {
        [today]: {
          date: today,
          entries: {
            current: { normalizedUrl: "current" }
          }
        }
      }
    },
    [DAILY_SUBMISSIONS_KEY]: {
      date: today,
      entries: {
        legacy: { normalizedUrl: "legacy" }
      }
    }
  };
  const restoreChrome = installChromeStorage({ localStore });

  try {
    const history = await clearRecordingHistory();
    const dailyStats = await readDailySubmissionStats();

    assert.deepEqual(history.days, {});
    assert.equal(dailyStats.count, 0);
    assert.equal(localStore[RECORDING_HISTORY_KEY], undefined);
    assert.equal(localStore[DAILY_SUBMISSIONS_KEY], undefined);
  } finally {
    restoreChrome();
  }
});

function installChromeStorage({ localStore = {}, syncStore = {} } = {}) {
  const originalChrome = globalThis.chrome;

  globalThis.chrome = {
    storage: {
      local: createStorageArea(localStore),
      sync: createStorageArea(syncStore),
      onChanged: {
        addListener() {},
        removeListener() {}
      }
    }
  };

  return () => {
    if (originalChrome === undefined) {
      delete globalThis.chrome;
    } else {
      globalThis.chrome = originalChrome;
    }
  };
}

function createStorageArea(store) {
  return {
    async get(keys) {
      if (Array.isArray(keys)) {
        return Object.fromEntries(keys.map((key) => [key, store[key]]));
      }

      if (typeof keys === "string") {
        return { [keys]: store[keys] };
      }

      if (keys && typeof keys === "object") {
        return Object.fromEntries(Object.keys(keys).map((key) => [key, store[key] ?? keys[key]]));
      }

      return { ...store };
    },
    async set(items) {
      Object.assign(store, items);
    },
    async remove(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        delete store[key];
      }
    }
  };
}
