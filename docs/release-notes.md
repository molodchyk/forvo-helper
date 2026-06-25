# Release Notes

## 1.0.0

Initial stable release for local testing.

- Starts Forvo recording with a keyboard command, hover delay, or optional circle gesture.
- Targets Forvo's `canvas#canvas-recorder` control with coordinate-bearing click events.
- Opens or reuses Goroh for the current Forvo word.
- Detects combining acute stress marks on Goroh pages.
- Opens ChatGPT fallback when Goroh does not expose a stress mark.
- Can open ChatGPT when a Forvo page opens, controlled by a separate options-page setting.
- Labels the configured ChatGPT destination as a target chat URL.
- Shows today's unique submitted pronunciation count on the toolbar badge.
- Shows today, 7-day, and 30-day recording summaries plus a compact heatmap in the popup.
- Shows a 13-week local recording-history heatmap and hourly breakdown in the Options stats tab.
- Shows the refreshed total pronounced-word count from the signed-in Forvo profile in the popup.
- Reuses the cached Forvo username for total-count refreshes and waits through Forvo security verification before reading the profile.
- Does not increase the daily count when Forvo warns that the word was previously pronounced.
