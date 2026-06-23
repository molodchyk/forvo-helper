import { MESSAGE_TYPES } from "../../lookup/core/messages.js";
import {
  extractForvoPronouncedWordCount,
  extractForvoUsernameFromAccountPage,
  isForvoProfileCountPageReady,
  isForvoSecurityVerificationPage
} from "../core/profileStats.js";
import { addRuntimeMessageListener } from "../../../platform/chrome/runtime.js";

export function startForvoProfileStatsController(doc = document) {
  return addRuntimeMessageListener((message, _sender, sendResponse) => {
    if (message?.type === MESSAGE_TYPES.SCAN_FORVO_ACCOUNT_USERNAME) {
      const html = doc.documentElement?.outerHTML || "";
      const username = extractForvoUsernameFromAccountPage(html);

      sendResponse({
        ready: !isForvoSecurityVerificationPage(html),
        ok: Boolean(username),
        username,
        url: location.href,
        origin: location.origin
      });
      return false;
    }

    if (message?.type === MESSAGE_TYPES.SCAN_FORVO_PROFILE_COUNT) {
      const html = doc.documentElement?.outerHTML || "";
      const totalPronunciations = extractForvoPronouncedWordCount(html);

      sendResponse({
        ready: isForvoProfileCountPageReady(html),
        ok: Number.isFinite(totalPronunciations),
        totalPronunciations,
        url: location.href
      });
      return false;
    }

    return false;
  });
}
