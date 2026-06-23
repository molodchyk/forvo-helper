# Code Structure

Forvo Helper follows the browser extension modularization playbook.

- `src/app/background` contains the MV3 service-worker entry.
- `src/app/content` contains thin content-script entries for Forvo, Goroh, and ChatGPT.
- `src/app/options` and `src/app/popup` contain extension-page entries.
- `src/features/recording` owns Forvo record-button discovery, trigger behavior, and daily submission counting.
- `src/features/lookup` owns Forvo word extraction, Goroh lookup, stress detection, and ChatGPT fallback.
- `src/features/settings` owns settings schema, options UI, and popup UI.
- `src/platform/chrome` wraps Chrome APIs.
- `src/platform/dom` contains small DOM helpers.
- `scripts` contains build, package, audit, and verification commands.

Generated extension output is written to `dist/chrome`. Release zip files are written to `dist`.
