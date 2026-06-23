# Forvo Profile Count

## Product Decision

The extension does not report personal listen counts. Forvo word pages expose shared word-level listen totals, and those totals are not attributable to one user's recording.

The popup reports a safer metric: total pronounced words from the user's Forvo profile.

## Data Source

1. Open `https://uk.forvo.com/account-info/` in a temporary inactive tab with the user's existing Forvo session.
2. Extract only the Forvo username from the account page.
3. Update the popup immediately with the username.
4. Navigate the temporary tab to `https://uk.forvo.com/user/<username>/`.
5. Extract the total pronounced-word count from the public profile page.
6. Close the temporary tab.

The extension stores only the username, public profile URL, total count, refresh time, and a short refresh error if the scan fails.

## UI

The popup shows the cached total immediately and refreshes it when the cache is stale or when the user presses Refresh.
