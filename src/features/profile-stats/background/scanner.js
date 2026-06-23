import { MESSAGE_TYPES } from "../../lookup/core/messages.js";
import {
  FORVO_ACCOUNT_INFO_URL,
  buildCachedForvoProfileTarget,
  buildForvoUserProfileUrl
} from "../core/profileStats.js";
import {
  readForvoProfileStats,
  writeForvoProfileStats
} from "../../../platform/chrome/storage.js";
import { sendTabMessage, waitForTabComplete } from "../../../platform/chrome/tabs.js";

export async function refreshForvoProfileStats(now = Date.now()) {
  let tabId = 0;

  try {
    const current = await readForvoProfileStats();
    const cachedTarget = buildCachedForvoProfileTarget(current);
    const initialUrl = cachedTarget.profileUrl || FORVO_ACCOUNT_INFO_URL;
    const tab = await chrome.tabs.create({
      url: initialUrl,
      active: false
    });
    tabId = tab.id || 0;

    if (!tabId) {
      throw new Error("Could not open Forvo for profile refresh.");
    }

    await waitForTabComplete(tabId);
    if (cachedTarget.profileUrl) {
      const cachedScan = await scanCachedProfile(tabId, cachedTarget);

      if (cachedScan) {
        return writeProfileCount(cachedScan, now);
      }
    }

    const target = await scanAccountUsername(tabId, current);
    return scanProfileCount(tabId, target, now);
  } catch (error) {
    const current = await readForvoProfileStats();

    return writeAndBroadcastForvoProfileStats({
      ...current,
      lastError: error instanceof Error ? error.message : "Could not refresh Forvo profile stats."
    });
  } finally {
    if (tabId) {
      chrome.tabs.remove(tabId).catch(() => {});
    }
  }
}

async function scanCachedProfile(tabId, target) {
  try {
    return {
      ...target,
      totalPronunciations: await scanProfileCountFromCurrentTab(tabId)
    };
  } catch {
    await chrome.tabs.update(tabId, {
      url: FORVO_ACCOUNT_INFO_URL,
      active: false
    });
    await waitForTabComplete(tabId);
    return null;
  }
}

async function scanAccountUsername(tabId, current) {
  const accountScan = await scanTabWithRetry(tabId, {
    type: MESSAGE_TYPES.SCAN_FORVO_ACCOUNT_USERNAME
  });
  const username = accountScan?.username || "";

  if (!username) {
    throw new Error("Could not find the Forvo username. Sign in to Forvo and try again.");
  }

  const profileUrl = buildForvoUserProfileUrl(username, accountScan.origin || FORVO_ACCOUNT_INFO_URL);

  if (!profileUrl) {
    throw new Error("Could not build a Forvo profile URL.");
  }

  await writeAndBroadcastForvoProfileStats({
    ...current,
    username,
    profileUrl,
    lastError: ""
  });

  return { username, profileUrl };
}

async function scanProfileCount(tabId, target, now) {
  try {
    await chrome.tabs.update(tabId, {
      url: target.profileUrl,
      active: false
    });
    await waitForTabComplete(tabId);
  } catch {
    throw new Error("Could not open the Forvo profile page.");
  }

  const totalPronunciations = await scanProfileCountFromCurrentTab(tabId);

  return writeProfileCount({ ...target, totalPronunciations }, now);
}

function writeProfileCount(result, now) {
  return writeAndBroadcastForvoProfileStats({
    username: result.username,
    profileUrl: result.profileUrl,
    totalPronunciations: result.totalPronunciations,
    updatedAt: now,
    lastError: ""
  });
}

async function scanProfileCountFromCurrentTab(tabId) {
  const profileScan = await scanTabWithRetry(tabId, {
    type: MESSAGE_TYPES.SCAN_FORVO_PROFILE_COUNT
  });
  const totalPronunciations = profileScan?.totalPronunciations;

  if (!Number.isFinite(totalPronunciations)) {
    throw new Error("Could not find the pronounced-word count on the Forvo profile.");
  }

  return totalPronunciations;
}

async function writeAndBroadcastForvoProfileStats(stats) {
  const normalized = await writeForvoProfileStats(stats);

  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.FORVO_PROFILE_STATS_UPDATED,
    profileStats: normalized
  }).catch(() => {});

  return normalized;
}

async function scanTabWithRetry(tabId, message, timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await sendTabMessage(tabId, message);

    if (response?.ready) {
      return response;
    }

    await delay(150);
  }

  throw new Error("Could not read the Forvo page.");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
