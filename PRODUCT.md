# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Regular people deciding what movie to watch next. They arrive at the public site with no account and no onboarding, and they want a ranked, filterable list they can bend toward their own taste: more weight on critics, more weight on audiences, only popular films, only a certain era. Some know exactly what they are looking for and search by title; most are browsing for a pick tonight.

A second audience is confirmed: people evaluating Scott Guthart's work. MovieTable is the premier app demonstrating his skill set, so the site must credit him and link to his resume. The site owner is Scott Guthart; the project is public at movietable.scottguthart.com.

## Product Purpose

MovieTable is a single-page ranking of the all-time top films on Metacritic. Its core move is a **score bias** slider that blends the Metacritic user score and the Metascore into one Final Score, so the whole table re-ranks as the visitor slides between "Users" and "Critics". Around that sit search, quick numeric filters, an advanced boolean filter editor, sortable columns, and pagination.

Success is a visitor finding a film they want to watch and clicking through to its Metacritic page.

## Positioning

The visitor controls the weighting between critics and audiences, and every film is ranked by that personal blend across one merged dataset. Metacritic, IMDb, and Letterboxd each show fixed scores from a single constituency; none let the visitor re-rank the catalogue by how much they trust critics versus crowds.

Planned extension of the same idea: a **taste profile** recommender. The visitor rates a handful of films, the app builds a profile from those ratings, and the table re-ranks against it. This keeps the product's stance that the visitor's taste, not an editorial one, sets the order.

## Operating Context

- Public website that works without an account. Signing in (Google, GitHub, or an emailed link through the self-hosted Supabase Auth) is optional and does one thing: it saves taste ratings to the account so they follow the visitor across devices. Guests keep ratings in localStorage.
- The catalogue is read from Supabase (fetches cached for a day) and the page renders per request because the view (filters, search, grouping, score bias) lives in the URL and can be shared; all scoring, filtering, sorting, and grouping run client-side. Directors, writers, genres, and subscription provider ids ship inline with every film; a film's synopsis, full cast, streaming offers, IMDb link, and awards come from `/api/film/[slug]` when its row opens.
- Stack: Next.js 16 App Router, React 19, TypeScript, Bun, Tailwind CSS 4, shadcn (base-nova style, tabler icons), REUI data-grid and filters registry components, TanStack Table.
- Dev command: `bun run dev`. Tests: `bun test src/lib`. Lint: `bun run lint`. Typecheck: `bun run typecheck`.
- Data lives in the Supabase project (tables `movies`, `people`, `genres`, `credits`, `movie_genres`; schema in `supabase/migrations`), read over PostgREST by `src/lib/catalogue.ts` using `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `.env`. Rows are normalized in `src/lib/movies.ts`; scoring, taste, and filter logic are unit-tested in `src/lib` with inline fixtures.
- Default view on load: release year 2000–2024, popularity 300–100,000, sorted by Final Score descending, 25 rows per page, score bias at equal weight (0.5).
- Deployed at movietable.scottguthart.com.

## Capabilities and Constraints

**Confirmed capabilities**

- Score bias slider, 0 to 1 in steps of 0.1. Final Score is `floor((1 - w) * users + w * critics)`; at the extremes it is the single constituency's score; when either input is missing the blend is unavailable.
- Free-text search across title, year, and all numeric columns.
- Quick filter chips and an advanced editor supporting and/or groups over year, popularity, users, critics, and Final Score with operators such as at least, at most, between, not between.
- Sortable columns, paginated results, "Clear filters" and "Reset view" actions.
- Every film links out to its Metacritic page.

**Terminology** (binding for copy and labels)

- **Users**: Metacritic user score, 0–100.
- **Critics**: Metascore, 0–100.
- **Popularity**: number of audience ratings on Metacritic.
- **Final Score**: the visitor-weighted blend, rounded down.
- **Score bias**: the critic-weight slider.
- Unavailable values render as an em dash, never as zero and never imputed.

**Data constraints**

- The dataset is a snapshot. The Supabase catalogue holds 1,506 films (1916–2026) with genres, credits, and summaries, produced by `scripts/scrape-metacritic.ts` and loaded by `scripts/seed-supabase.ts`. Only films with both a Metascore and a user score are kept.
- Counts and year ranges derive from the data at build time, including the page's metadata description in `src/app/page.tsx` (`src/app/layout.tsx` keeps a static fallback). A "last updated" signal still has no source: the schema has no timestamp column.
- The UI must never present scores as live. The existing footer states this and future surfaces must keep an equivalent disclosure.

**Built: taste-profile recommender** (shaped and built 2026-09-12)

- Job: visitor rates a few films, the app builds a taste profile, and the table re-ranks against it.
- Engine: client-side metadata similarity over genres, director, writers, cast, and decade from the Metacritic scrape. No model service, no server route, no API key. Every match explains itself with the attributes it matched.
- Input: a star rating in half-star steps, half a star to five, on every table row (REUI rating, adapted to real buttons in Marquee Crimson; the left half of a star gives the half step, arrow keys move by half a star), plus a starter hand of twelve popular films dealt in an inline panel to solve cold start, each with a "Haven't seen" skip. No free text, no imports.
- Ranking: a new sortable **For you** column, 0–100, blending similarity with the current Final Score under a quality floor. Appears at the first four- or five-star rating and becomes the default sort. Final Score and the score bias slider are unchanged; the slider still feeds the quality term.
- Persistence: rated film slugs and verdicts in localStorage under a versioned key. The profile is derived at runtime, never stored. Reset view does not clear ratings.
- Copy: "built from your ratings". Never described as AI.
- Match: cosine similarity between the profile and each film's weighted attributes (director 3, genre 2, writer 1.5, cast 1, decade 1), each rated film scaled from three stars as neutral so five speaks fully for a film (+1) and half a star fully against it (−1), with half-star steps in between; rescaled so the best unrated film reads 1. For you = floor(60 × match + 0.4 × Final Score).
- Attributes come from the same Supabase tables through the static `/api/taste-data` route (revalidated daily, about 240 KB gzipped, cast capped at eight, summaries trimmed to 160 characters), fetched only when the panel opens or saved ratings exist. Films without attributes show an em dash.
- Deferred: shareable profile in the URL hash, "hide rated films" toggle.

**Built: account sync for ratings** (2026-09-12)

- Sign-in page at `/sign-in` (adapted REUI `auth-16` block): Google, GitHub, or a one-time emailed link, all through Supabase Auth at `api.movietable.ai`. The header shows "Sign in" for guests and, for signed-in visitors, an account menu with sync status, "Clear ratings" (the only place ratings are cleared: an alert dialog confirms, then the account's saved ratings and this browser's go and the taste ranking resets), appearance, and sign out.
- Storage: table `taste_ratings (user_id, slug, verdict, stars, updated_at)` under row-level security, `verdict` being `rated` with `stars` in half steps from 0.5 to 5, or `skip`; each visitor reads and writes only their own rows (`supabase/migrations/20260912020000_taste_ratings.sql`).
- Merge on sign-in: union of local and account ratings, newer `updated_at` wins, ties go to the account. Thumbs saved before the star scale read as four stars (like) and two (pass). Afterwards every local change is pushed after a short pause; localStorage stays the offline mirror. Signing out clears local ratings so a shared device starts clean.
- Browser needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the anon key only ever reaches rows the policies allow.
**Built: language, subgenres, Oscars, and where to watch** (2026-09-13)

- Source: another session's IMDb and Wikidata enrichment (`movie_imdb` with language and Oscar counts, `movie_subgenres`) and JustWatch offers (`streaming_offers`, `providers`). Coverage at build: 2,976 of 3,040 films matched to IMDb; 286 Wikidata subgenres; US offers only.
- Page payload carries language, cleaned subgenres, and Oscar counts per film; they drive the context line ("English · Gangster, Epic · 2 Oscars, 9 nominations"), the Language and Subgenre pickers and Oscar numeric filters, the Language and Oscars groupings, and two new taste features (subgenre weight 1.5, language weight 1).
- Opening a film row (the disclosure at the end of its title, or the row itself) reveals a detail band fetched for that film alone from `/api/film/[slug]`: full summary, language and subgenres, Oscar line with the Wikidata caveat, credits, streaming services, cheapest rent and buy per provider, and links to IMDb and JustWatch. The band replaced an earlier info-button popover so a title carries one disclosure.
- Awards by category render in the band from `movie_awards`, another session's Wikidata scrape (4,459 records over 835 of 3,040 films: `movie_slug, award_name, result, year, person_name, person_slug`). Wins come first, then up to five nominations with a count of the rest: "Best Actor · Marlon Brando" / "Won, 1973". People who shared an award share a line, and a win drops that person's nomination record for the same category. The source only holds awards attributed to a person, so awards to the film itself, Best Picture among them, are absent; the note says so.
- Subgenre labels are cleaned from Wikidata (trailing "film" removed, sentence case, Metacritic genres dropped).

**Built: rating on phones** (2026-09-13)

- Below 640px the Your rating column folds under the title as a touch-size control (24px stars in 32 by 36px buttons), Year narrows to 64px so all five stars stay clear of the pinned For you column, and the starter hand becomes a one-film carousel (REUI carousel on Embla) with Previous, "3 of 12", and Next in place of the snap strip and swipe hint. Title and stars are always in view together on a portrait phone.

- Appearance: light and dark themes, following the system setting by default; signed-in visitors choose Match system, Light, or Dark from the account menu (stored in localStorage under `movietable.theme`). Guests get the system setting.

## Brand Commitments

- The name **MovieTable** and the domain movietable.scottguthart.com are binding.
- **Metacritic attribution and per-film outbound links are binding.** Every film keeps its link to Metacritic and the dataset credit stays visible.
- **Maker credit is binding.** The site says it was made by Scott Guthart and links to his resume at https://guth.art. Confirmed 2026-09-12; it lives in the page footer and in site authorship metadata.
- The current tagline and header copy are not binding and may be rewritten.
- No logo, color, or typography commitment was made during init. Visual direction is decided in later design work.

## Evidence on Hand

- Real dataset: the Supabase catalogue (1,506 Metacritic films with real scores, credits, and links). The earlier static snapshots (`src/components/data.json`, 3,963 films, and `data.json.old`) were removed on 2026-09-12 once the app read from Supabase.
- Existing raster assets: `public/favicon.ico`, `public/logo192.png`, `public/logo512.png`, `public/thumbnail.png`, carried over from the original Create React App build. `public/manifest.json` still reads "Create React App Sample" and does not describe this product.
- README at repo root describes the product in two sentences.
- Resume and portfolio: https://guth.art (Scott Guthart).
- No testimonials, usage metrics, press, or user research exist. Do not fabricate any.

## Product Principles

1. **The visitor sets the ranking.** Every ranking control, the score bias today and the taste profile later, must visibly re-order the table. Nothing is ranked by an editorial opinion the visitor cannot change.
2. **Be honest about the data.** It is a snapshot, not live. Missing values are shown as missing. Counts and ranges come from the data, not from copy.
3. **Metacritic gets the click.** MovieTable helps choose; the source of record is one link away and always credited.
4. **Zero friction.** No gates, no required account, no loading spinner between the visitor and the full catalogue. Sign-in exists only to carry ratings between devices and never blocks the table. Anything that adds a step must earn it.
5. **Table first, always.** New capabilities, including the recommender and data refresh, extend the table rather than replacing it with a feed or a chat.
