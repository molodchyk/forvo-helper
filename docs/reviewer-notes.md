# Reviewer Notes

Forvo Helper is a workflow extension for three explicit websites:

- Forvo recording pages
- Goroh dictionary pages
- ChatGPT pages when the optional fallback is enabled

The extension does not bypass microphone permission. The user must allow microphone access on Forvo through the browser-controlled permission prompt.

Synthetic activation of Forvo's record control depends on Forvo's current page implementation. The extension starts from a real keyboard, hover, or pointer gesture event, then dispatches normal DOM activation events to the detected record button.

The ChatGPT fallback fills the prompt composer. Automatic submission is disabled by default and is controlled by the user in the options page.

The toolbar badge can show today's unique submitted pronunciation count. The count is derived from normalized Forvo recording URLs stored locally for the current day. If Forvo warns that a word was previously pronounced, the extension treats the send as a resubmission and does not increment the daily count.

The popup can refresh a total pronounced-word count from the signed-in Forvo account page and public user profile page. This is a word-count summary, not a listen-count metric.
