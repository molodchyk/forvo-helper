# Reviewer Notes

Forvo Helper is a workflow extension for three explicit websites:

- Forvo recording pages
- Goroh dictionary pages
- ChatGPT pages when the optional fallback is enabled

The extension does not bypass microphone permission. The user must allow microphone access on Forvo through the browser-controlled permission prompt.

Synthetic activation of Forvo's record control depends on Forvo's current page implementation. The extension starts from a real keyboard, hover, or pointer gesture event, then dispatches normal DOM activation events to the detected record button.

For Ukrainian words with exactly one vowel, the extension marks that vowel locally and does not open Goroh or ChatGPT for stress lookup.

The ChatGPT fallback fills the prompt composer. Automatic submission is disabled by default and is controlled by the user in the options page. Users can separately control whether ChatGPT opens when a Forvo page opens and whether the extension skips a prompt when the latest visible user message already matches it. ChatGPT tab reuse is scoped to the configured ChatGPT target chat URL, so unrelated ChatGPT conversations are ignored. If an existing configured ChatGPT tab was open before extension reload, the extension may attach its packaged content script to that tab without reloading the chat.

The toolbar badge can show today's unique submitted pronunciation count. The popup also shows a compact 13-week recording-history heatmap plus 7-day and 30-day totals. Counts are derived from normalized Forvo recording URLs stored locally for up to 400 days. If Forvo warns that a word was previously pronounced, the extension treats the send as a resubmission and does not increment the daily count or heatmap. Users can clear recording history from the popup without resetting extension settings.

The popup can refresh a total pronounced-word count from the public Forvo user profile page. Refresh opens a temporary inactive Forvo tab and uses the cached username when available. The signed-in account page is opened only when the username has not been cached yet or when the cached public profile cannot be read. This is a word-count summary, not a listen-count metric.
