# Storage

## `forvoHelperSettings`

- Area: `chrome.storage.sync`
- Owner: `src/features/settings`
- Shape version: `1`
- Purpose: user configuration for recording triggers, Goroh lookup, and ChatGPT fallback
- Retention: until reset or uninstall
- Quota risk: low; values are short strings, booleans, and numbers

## `forvoHelperStatus`

- Area: `chrome.storage.local`
- Owner: `src/features/lookup`
- Purpose: last detected word, last Goroh stress result, last workflow action
- Retention: overwritten by new activity or cleared on reset
- Quota risk: low

## `forvoHelperPendingChatGptPrompt`

- Area: `chrome.storage.local`
- Owner: `src/features/lookup`
- Purpose: handoff prompt for the ChatGPT content script
- Retention: overwritten by new fallback and marked as inserted when filled
- Quota risk: low

