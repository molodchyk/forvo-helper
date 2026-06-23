import { MESSAGE_TYPES } from "../../lookup/core/messages.js";
import {
  FORVO_ACCOUNT_INFO_URL,
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
    const tab = await chrome.tabs.create({
      url: FORVO_ACCOUNT_INFO_URL,
      active: false
    });
    tabId = tab.id || 0;

    if (!tabId) {
      throw new Error("Could not open Forvo for profile refresh.");
    }

    await waitForTabComplete(tabId);
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

    const current = await readForvoProfileStats();
    await writeAndBroadcastForvoProfileStats({
      ...current,
      username,
      profileUrl,
      lastError: ""
    });

    await chrome.tabs.update(tabId, {
      url: profileUrl,
      active: false
    });
    await waitForTabComplete(tabId);

    const profileScan = await scanTabWithRetry(tabId, {
      type: MESSAGE_TYPES.SCAN_FORVO_PROFILE_COUNT
    });
    const totalPronunciations = Number(profileScan?.totalPronunciations);

    if (!Number.isFinite(totalPronunciations)) {
      throw new Error("Could not find the pronounced-word count on the Forvo profile.");
    }

    return writeAndBroadcastForvoProfileStats({
      username,
      profileUrl,
      totalPronunciations,
      updatedAt: now,
      lastError: ""
    });
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

async function writeAndBroadcastForvoProfileStats(stats) {
  const normalized = await writeForvoProfileStats(stats);

  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.FORVO_PROFILE_STATS_UPDATED,
    profileStats: normalized
  }).catch(() => {});

  return normalized;
}

async function scanTabWithRetry(tabId, message, timeoutMs = 10000) {
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
