# Release Notes

## 1.0.0

Initial stable release for local testing.

- Starts Forvo recording with a keyboard command, hover delay, or optional circle gesture.
- Targets Forvo's `canvas#canvas-recorder` control with coordinate-bearing click events.
- Opens or reuses Goroh for the current Forvo word.
- Detects combining acute stress marks on Goroh pages.
- Opens ChatGPT fallback when Goroh does not expose a stress mark.
- Shows today's unique submitted pronunciation count on the toolbar badge.
- Shows the refreshed total pronounced-word count from the signed-in Forvo profile in the popup.
- Does not increase the daily count when Forvo warns that the word was previously pronounced.
