# Reviewer Notes

Forvo Helper is a workflow extension for three explicit websites:

- Forvo recording pages
- Goroh dictionary pages
- ChatGPT pages when the optional fallback is enabled

The extension does not bypass microphone permission. The user must allow microphone access on Forvo through the browser-controlled permission prompt.

Synthetic activation of Forvo's record control depends on Forvo's current page implementation. The extension starts from a real keyboard, hover, or pointer gesture event, then dispatches normal DOM activation events to the detected record button.

The ChatGPT fallback fills the prompt composer. Automatic submission is disabled by default and is controlled by the user in the options page.

