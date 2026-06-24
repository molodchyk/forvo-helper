# Local Browser Testing

Do not run automated Chrome load-smoke commands on this workstation.

Cold Turkey and FocusMe can block or kill Chrome when it is launched from a terminal with a temporary profile, `--load-extension`, or headless flags. That disrupts the user's normal browser session and can make the smoke test fail for reasons unrelated to the extension.

Use the automated Node checks for normal verification:

```powershell
npm run release:check
```

When browser validation is needed on this workstation, use a manual Chrome extension reload through `chrome://extensions` or ask the user before launching Chrome from the terminal.
