# Storage

## `forvoHelperSettings`

- Area: `chrome.storage.sync`
- Owner: `src/features/settings`
- Shape version: `1`
- Purpose: user configuration for appearance mode/style, recording triggers, Goroh lookup, ChatGPT preload/fallback, duplicate ChatGPT prompt prevention, and toolbar badge display
- Retention: until reset or uninstall
- Quota risk: low; values are short strings, booleans, and numbers

## `forvoHelperStatus`

- Area: `chrome.storage.local`
- Owner: `src/features/lookup`
- Purpose: last detected word, last stress result and source, last workflow action
- Retention: overwritten by new activity or cleared on reset
- Quota risk: low

## `forvoHelperPendingChatGptPrompt`

- Area: `chrome.storage.local`
- Owner: `src/features/lookup`
- Purpose: handoff prompt and duplicate-prevention flags for the ChatGPT content script
- Retention: overwritten by new fallback and marked as inserted or skipped when handled
- Quota risk: low

## `forvoHelperRecordingHistory`

- Area: `chrome.storage.local`
- Owner: `src/features/recording`
- Shape version: `1`
- Purpose: 400-day local recording history used for the popup summary and heatmap, Options stats heatmap, hourly breakdown, 7-day and 30-day summaries, and today's toolbar badge count
- Retention: pruned to the last 400 local days and clearable from the Options stats tab
- Quota risk: low for normal use; stores one compact entry per unique submitted recording URL per local day

## `forvoHelperDailySubmissions`

- Area: `chrome.storage.local`
- Owner: `src/features/recording`
- Purpose: legacy current-day submission key from earlier builds
- Retention: migrated into `forvoHelperRecordingHistory` on read and then removed
- Quota risk: low

## `forvoHelperProfileStats`

- Area: `chrome.storage.local`
- Owner: `src/features/profile-stats`
- Purpose: last refreshed Forvo username, public profile URL, total pronounced-word count, refresh timestamp, and short refresh error
- Retention: until reset or uninstall
- Quota risk: low; stores one compact profile summary
