# Forvo Stats Plan

## Current Evidence

- The logged-in account pronunciations page, such as `https://uk.forvo.com/account-info/pronunciations/`, lists the user's own recorded words, dates, languages, and votes.
- That account page does not expose listen counts.
- Individual word pages expose a visible word-level listen total, such as `Кількість прослухувань: 117`.
- The word-level listen total is not proven to belong to one user pronunciation. It can include listens across multiple speakers or languages for the same word.

## Product Decision

Do not label word-page listen totals as "my listens" unless Forvo exposes a per-pronunciation or per-user listen count.

The first useful stats feature should be exact account inventory:

- number of own pronunciations
- words, languages, and recording dates
- votes shown on the account pronunciations page
- pagination coverage and last scan time

If word pages are scanned later, show those counts as shared word-page listen totals, not personal listen totals.

## Implementation Steps

1. Parse the configured Forvo pronunciations list page and pagination.
2. Store a local scan cache with words, languages, dates, votes, page count, and scan time.
3. Show exact account inventory in the popup or options page.
4. Add an optional word-page scan that fetches each word URL and stores shared listen totals with a clear label.
5. Only add "my total listens" if a per-pronunciation source is found in Forvo HTML, page data, or an official API response.
