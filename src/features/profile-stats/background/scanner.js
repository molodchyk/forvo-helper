import {
  FORVO_ACCOUNT_INFO_URL,
  buildForvoUserProfileUrl,
  extractForvoPronouncedWordCount,
  extractForvoUsernameFromAccountPage
} from "../core/profileStats.js";
import {
  readForvoProfileStats,
  writeForvoProfileStats
} from "../../../platform/chrome/storage.js";

export async function refreshForvoProfileStats(fetchImpl = fetch, now = Date.now()) {
  try {
    const accountHtml = await fetchForvoText(FORVO_ACCOUNT_INFO_URL, fetchImpl);
    const username = extractForvoUsernameFromAccountPage(accountHtml);

    if (!username) {
      throw new Error("Could not find the Forvo username. Sign in to Forvo and try again.");
    }

    const profileUrl = buildForvoUserProfileUrl(username, FORVO_ACCOUNT_INFO_URL);

    if (!profileUrl) {
      throw new Error("Could not build a Forvo profile URL.");
    }

    const profileHtml = await fetchForvoText(profileUrl, fetchImpl);
    const totalPronunciations = extractForvoPronouncedWordCount(profileHtml);

    if (!Number.isFinite(totalPronunciations)) {
      throw new Error("Could not find the pronounced-word count on the Forvo profile.");
    }

    return writeForvoProfileStats({
      username,
      profileUrl,
      totalPronunciations,
      updatedAt: now,
      lastError: ""
    });
  } catch (error) {
    const current = await readForvoProfileStats();

    return writeForvoProfileStats({
      ...current,
      lastError: error instanceof Error ? error.message : "Could not refresh Forvo profile stats."
    });
  }
}

async function fetchForvoText(url, fetchImpl) {
  const response = await fetchImpl(url, {
    credentials: "include",
    cache: "no-store"
  });

  if (!response?.ok) {
    const status = response?.status ? ` (${response.status})` : "";

    throw new Error(`Could not load Forvo${status}.`);
  }

  return response.text();
}
