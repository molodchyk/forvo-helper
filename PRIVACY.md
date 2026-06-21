# Privacy Policy

Forvo Helper is a local browser extension for Forvo recording and Ukrainian stress lookup.

Stored settings may include:

- recording trigger settings
- extension appearance preference
- hover delay and page hotkey
- Goroh lookup mode
- whether lookup tabs should be focused
- ChatGPT fallback URL and prompt template
- whether ChatGPT prompts should be submitted automatically
- whether the toolbar badge should show today's submitted count

The extension also stores a small local status record with the last detected word, the last Goroh stress result, the most recent pending ChatGPT prompt, and today's submitted Forvo recording URLs. This status is used only to keep the popup, toolbar badge, and fallback workflow consistent.

Browser permissions:

- `storage`, used to save extension settings and local workflow status
- `tabs`, used to open or reuse Goroh and ChatGPT tabs and send extension messages to supported tabs
- `alarms`, used to refresh the local daily toolbar badge after midnight

Host permissions:

- `https://forvo.com/*` and `https://*.forvo.com/*`, used to detect Forvo recording pages and activate the record control
- `https://goroh.pp.ua/*` and `https://www.goroh.pp.ua/*`, used to search Goroh and detect stress marks on result pages
- `https://chatgpt.com/*` and `https://chat.openai.com/*`, used only when the optional ChatGPT fallback opens or fills a prompt

Network behavior:

- The extension does not make background analytics, advertising, tracking, or telemetry requests.
- The extension may open browser tabs to Goroh or ChatGPT when the user enables those workflow settings.
- The extension does not run remote hosted JavaScript.

Data sale and sharing:

- The extension does not sell, transfer, or share user data.
- The extension does not use data for creditworthiness, advertising, analytics, or unrelated purposes.

Chrome sync:

- Settings are stored in Chrome sync storage when available, so Chrome may sync them through the user's browser profile according to the user's Chrome sync settings.
- Runtime status is stored locally and is not intended to sync between devices.
