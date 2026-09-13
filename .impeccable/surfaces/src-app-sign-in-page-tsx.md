---
version: 1
slug: "src-app-sign-in-page-tsx"
primary_target: "src/app/sign-in/page.tsx"
related_targets: ["src/components/auth/account.tsx","src/components/blocks/auth-16/components/auth.tsx"]
---

# Surface brief: sign-in page and account control

## Scope and mode

Route `/sign-in` (adapted REUI `auth-16` block) and the account control in the page header on `/`. Mode: Operate. Sign-in is optional and exists only to save taste ratings to an account; the table itself never requires it.

## Audience, job, proof

A visitor who has rated films on one device and wants them on another, or who wants their ratings to outlive this browser. Task: sign in with Google or GitHub, or ask for a one-time emailed link, then land back on the table with the two rating sets merged. Proof is the account menu's status line ("Ratings saved to your account.") and the same For you ranking on the next device.

## Confirmed decisions (2026-09-12)

- Keep the whole `auth-16` block as a page at `/sign-in`, adapted to MovieTable copy. GitHub and Google stay; SSO, the workspace link, the logo wall, and the terms paragraph go (no such documents exist).
- Email continues as a magic link through Supabase Auth's OTP flow; the form swaps to a "check your email" line once sent.
- Header: guests see a ghost "Sign in" link beside the dataset meta; signed-in visitors see a 20px avatar, their name, and a menu with email, sync status, and Sign out.
- Merge on sign-in: union, newer `updated_at` wins, ties to the account; then local changes push after 600ms. Sign-out clears local ratings.

## Direction contract

THESIS: Sign-in is a side door, not a gate. The category default is a SaaS welcome screen with social proof and a workspace pitch; this page refuses that and reads as one more typeset sheet from the ledger: a wordmark, one sentence of purpose, two provider buttons, one email field, one honest footnote.

OWN-WORLD: The Critics' Ledger as recorded in DESIGN.md. Playfair Display for every glyph, square outline buttons at 32px, hairline separators, Paper ground, Marquee Crimson only on the wordmark's period, the film icon, and the one primary button on the signed-in state ("Back to the table"). Provider marks are the only non-ledger colour and stay at 16px inside outline buttons.

STORY: The visitor clicks "Sign in" in the header, reads "Keep your ratings everywhere.", picks Google or GitHub, or types an email and reads that a link is on its way. They return to the table already signed in, see their name in the header, open the menu, and read that their ratings are saved.

FIRST VIEWPORT: Header with the small MovieTable wordmark left and a ghost "Back to the table" right. Centered 24rem column: heading, one-line lede, two outline provider buttons stacked, an "or" rule, the Email field with its helper, an outline "Send me a sign-in link" button. Footer: one Faded Ink sentence about what sign-in stores. No primary button until the visitor is signed in.

FORM: Extension of an established world using the user-pinned `auth-16` structure; no concept-seed run; seed key: none. Code-led: no comp.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions for the builder

- OAuth uses supabase-js PKCE in the browser; the code on the return URL is exchanged on the table page itself, so no server callback route exists.
- The auth server's redirect allow list covers movietable.ai, its subdomains, and localhost:3000; a deployment on another host lands on movietable.ai after sign-in until it is added.
