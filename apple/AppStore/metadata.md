# App Store Connect metadata draft

Values to paste into the app record. Edit freely — this is a starting point in the
product's voice, matching PRODUCT.md and the web site.

## Identity

- **Name:** MovieTable
- **Subtitle (30):** A film for every point of view
- **Bundle ID:** movietable.ai.MovieTable
- **SKU:** movietable
- **Primary category:** Entertainment
- **Secondary category:** Reference
- **Content rights:** does not use third-party content requiring rights proof (scores are factual data; summaries come from the Metacritic dataset)
- **Age rating:** 4+ (no objectionable content; film summaries are neutral)

## Description

MovieTable is a ranked ledger of acclaimed films that you bend toward your own
taste. Every film carries its audience score and its critics score; a single
slider decides how much you trust each, and the whole table reorders around you.

Rate a handful of films — half a star to five — and the For you column learns
what you actually like, then surfaces the films most likely to be worth your
evening. Filter by era, language, genre, popularity, or the streaming services
you already have. Search by title, director, or writer.

Signing in is optional and does one thing: it keeps your ratings in sync across
devices with Sign in with Apple, Google, or an emailed link. The table is open
to everyone, account or not.

A curated dataset of around three thousand films, not live ratings — select any
film to see its current scores on Metacritic.

## Keywords (100)

movie,film,ratings,critics,metacritic,watchlist,streaming,recommendations,what to watch,top films

## URLs

- **Marketing:** https://movietable.ai
- **Support:** https://movietable.ai/support
- **Privacy policy:** https://movietable.ai/privacy

## App Privacy answers

- Data collected, linked to identity, used for app functionality only:
  - Contact Info → Name, Email address (from the sign-in provider, when you sign in)
  - Identifiers → User ID
  - User Content → ratings you give films
- No tracking, no advertising, no data shared with third parties.
- Account and all data can be deleted in the app: account menu → Delete account.

## Review information

- No demo account needed: the full table, filtering, and rating work signed out.
- Sign-in is optional; if the reviewer wants to test it, Sign in with Apple works
  on device. Notes: "All features are available without an account. Signing in
  only syncs ratings across devices. Account deletion is in the account menu."

## Encryption

`ITSAppUsesNonExemptEncryption = false` is declared in Info.plist (HTTPS only),
so no export-compliance step per build.

## Screenshots

`screenshots/` holds raw captures: `iphone-6.9-01-table.png` (1320×2868) and
`ipad-13-01-table.png` (2064×2752). Both sizes are required. Retake or add
detail/rating shots before submission if you want a fuller set.
