# Forvo Profile Count

## Product Decision

The extension does not report personal listen counts. Forvo word pages expose shared word-level listen totals, and those totals are not attributable to one user's recording.

The popup reports a safer metric: total pronounced words from the user's Forvo profile.

## Data Source

1. Use the cached username and public profile URL when they are already stored.
2. If the username is missing, open `https://uk.forvo.com/account-info/` in a temporary inactive tab with the user's existing Forvo session and extract only the Forvo username.
3. Update the popup immediately with the username when it is newly discovered.
4. Open `https://uk.forvo.com/user/<username>/` in the temporary inactive tab.
5. Wait while Forvo security verification is still showing.
6. Extract the total pronounced-word count from the public profile page.
7. Close the temporary tab.

If the cached public profile cannot be read, the extension falls back to the account page once to rediscover the username. The extension stores only the username, public profile URL, total count, refresh time, and a short refresh error if the scan fails.

## UI

The popup shows the cached total immediately and refreshes it when the cache is stale or when the user presses Refresh.
