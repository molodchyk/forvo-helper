# Changelog

## 1.0.0

- Initial Forvo Helper project.
- Added keyboard, hover-delay, and pointer-circle recording triggers.
- Added Goroh lookup and Ukrainian stress detection.
- Added optional ChatGPT fallback prompt insertion.
- Added optional ChatGPT preloading when Forvo pages open.
- Clarified the options label for the configured ChatGPT target chat URL.
- Added toolbar badge counts for today's unique submitted pronunciations.
- Added popup refresh for the signed-in Forvo profile's total pronounced-word count.
- Reused cached Forvo usernames for profile-count refreshes and waited through Forvo security verification instead of saving a fake zero count.
- Treated Forvo previously-pronounced warnings as resubmissions rather than new daily counts.
- Added system, light, and dark UI modes.
- Targeted Forvo's `canvas#canvas-recorder` control with coordinate-bearing click events.
- Added localization, privacy, store listing, release notes, and validation scripts from the start.
