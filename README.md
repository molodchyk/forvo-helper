# Forvo Helper

Forvo Helper helps contributors start Forvo recordings without a mouse click and check Ukrainian word stress through Goroh.

It watches supported Forvo recording pages, extracts the word being pronounced, and can open a matching Goroh lookup. If Goroh does not show a stress mark, Forvo Helper can open a configured ChatGPT tab and place a stress-lookup prompt there.

This project is not affiliated with Forvo, Goroh, OpenAI, or ChatGPT.

## Features

- Start the Forvo record button with `Alt+Shift+R`.
- Optionally start recording after a configurable hover delay on the record button.
- Optionally start recording after circling the record button with the pointer.
- Open or reuse a Goroh lookup tab for the current Forvo word.
- Detect Ukrainian stress marks on Goroh pages.
- Optionally open or reuse a configured ChatGPT tab when a Forvo page opens.
- Open or reuse a configured ChatGPT tab when Goroh has no stress mark.
- Show today's unique submitted pronunciation count on the toolbar badge.
- Treat Forvo's previously-pronounced warning as a resubmission instead of a new daily count.
- Refresh and show your total Forvo pronounced-word count in the popup.
- Choose system, light, or dark UI for extension pages.
- Store all settings in Chrome extension storage.

## Load Unpacked

1. Run `npm install`.
2. Run `npm run build`.
3. Open `chrome://extensions`.
4. Enable Developer mode.
5. Choose Load unpacked.
6. Select this generated folder:

```text
C:\Users\molod\Documents\Personal\settings\forvo-helper\dist\chrome
```

Do not select the project root folder `forvo-helper`. The root contains source files and build scripts, while Chrome needs the bundled extension output in `dist/chrome`. If Chrome shows `Could not load javascript 'app/content/forvo.js'`, the project root was selected instead of the generated extension folder.

Chrome controls microphone permission. Forvo must still be allowed to use the microphone before the extension can start recording.

## Checks

Run the release checks before packaging:

```powershell
npm run release:check
```

Useful focused checks:

```powershell
npm test
npm run audit:file-sizes
npm run audit:folder-density
npm run verify:manifest
npm run verify:imports
npm run verify:locales
npm run verify:package
```

## Privacy

Forvo Helper stores user settings and a small local status record. It does not collect analytics, show ads, sell data, or send telemetry.

The extension uses content scripts only on Forvo, Goroh, and ChatGPT pages listed in `manifest.json`. It does not inject remote executable code.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Source

Open source under the GPL-3.0 license:
https://github.com/molodchyk/forvo-helper

## Support

If this extension saves you time and you want to support its development:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-FFDD00?logo=buymeacoffee&logoColor=000)](https://buymeacoffee.com/molodchyk)
[![Patreon](https://img.shields.io/badge/Patreon-support-F96854?logo=patreon&logoColor=fff)](https://www.patreon.com/OMolodchyk)

## License

GPL-3.0-only. See [LICENSE](LICENSE).
