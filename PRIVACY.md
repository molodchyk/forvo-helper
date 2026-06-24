# Privacy Policy

Forvo Helper is a local browser extension for Forvo recording and Ukrainian stress lookup.

Stored settings may include:

- recording trigger settings
- extension appearance preference
- hover delay and page hotkey
- Goroh lookup mode
- whether lookup tabs should be focused
- ChatGPT target chat URL and fallback prompt template
- whether ChatGPT prompts should be submitted automatically
- whether duplicate ChatGPT prompts should be skipped
- whether ChatGPT should open when a Forvo page opens
- whether the toolbar badge should show today's submitted count

The extension also stores local workflow records with the last detected word, the last Goroh stress result, the most recent pending ChatGPT prompt, today's submitted Forvo recording URLs, and the last refreshed Forvo profile word count. These records are used only to keep the popup, toolbar badge, and fallback workflow consistent.

Browser permissions:

- `storage`, used to save extension settings and local workflow status
- `tabs`, used to open or reuse Goroh and ChatGPT tabs and send extension messages to supported tabs
- `alarms`, used to refresh the local daily toolbar badge after midnight
- `scripting`, used to attach the packaged ChatGPT content script to an existing ChatGPT tab after extension reload without reloading the chat

Host permissions:

- `https://forvo.com/*` and `https://*.forvo.com/*`, used to detect Forvo recording pages and activate the record control
- `https://goroh.pp.ua/*` and `https://www.goroh.pp.ua/*`, used to search Goroh and detect stress marks on result pages
- `https://chatgpt.com/*` and `https://chat.openai.com/*`, used when the optional ChatGPT preload or fallback opens, fills a prompt, or compares the latest visible user message to avoid a duplicate prompt

Network behavior:

- The extension does not make background analytics, advertising, tracking, or telemetry requests.
- The extension may open browser tabs to Goroh or ChatGPT when the user enables those workflow settings.
- The extension may open a temporary inactive Forvo public profile tab to refresh the popup's total pronounced-word count. It opens the Forvo account page only when the username has not been cached yet or the cached public profile cannot be read. It stores only the username, profile URL, total count, refresh time, and a short error message when refresh fails.
- The extension does not run remote hosted JavaScript.

Data sale and sharing:

- The extension does not sell, transfer, or share user data.
- The extension does not use data for creditworthiness, advertising, analytics, or unrelated purposes.

Chrome sync:

- Settings are stored in Chrome sync storage when available, so Chrome may sync them through the user's browser profile according to the user's Chrome sync settings.
- Runtime status is stored locally and is not intended to sync between devices.
