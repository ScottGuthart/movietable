# MovieTable for iPhone, iPad, and Mac

Native SwiftUI port of the MovieTable web app in the parent directory. The
web app stays the source of truth for product rules; read `../PRODUCT.md`
and `../DESIGN.md` before changing copy, scoring, or visual language.

## Toolchain

- One multiplatform SwiftUI app target for iPhone, iPad, and Mac; minimums
  iOS 26, iPadOS 26, macOS 26. Swift 6 with strict concurrency. No Mac
  Catalyst, no UIKit. visionOS is deferred.
- Unit and integration tests use Swift Testing. XCTest is allowed only for
  XCUITest UI automation and `measure` performance tests. Never mix
  `#expect` and `XCTAssert` in one test function.
- Open `apple/` as the project root in Xcode (`apple/MovieTable.xcodeproj`). Never edit `project.pbxproj` by
  hand; add files through Xcode or keep them inside a Swift package.
- Code lives in Swift packages so every agent edits plain folders:
  - `Packages/MovieTableCore`: models, scoring, filtering, grouping, taste
    profile, ratings merge. No UI, no networking.
  - `Packages/MovieTableData`: Supabase client, PostgREST queries, cache.
  - `Packages/MovieTableUI`: views and view models.
- Build and test before claiming done, on both destinations:
  `xcodebuild -scheme MovieTable -destination 'platform=iOS Simulator,name=iPhone 17' build test`
  `xcodebuild -scheme MovieTable -destination 'platform=macOS' build test`
- Persistence is Codable JSON in Application Support (catalogue snapshot,
  guest ratings, film detail cache), written atomically. No SwiftData, no
  Core Data. If a real query need appears, use GRDB, not SwiftData.
- Secrets: `SUPABASE_URL` and the anon key go in `Config.xcconfig` (gitignored)
  and are read from `Info.plist`. Never paste keys into Swift source.

## Data

- Backend is the self-hosted Supabase stack at `https://api.movietable.ai`,
  reached with `supabase-swift` over PostgREST. Schema is in
  `../supabase/migrations`; tables used: `movies`, `people`, `credits`,
  `genres`, `movie_genres`, `movie_subgenres`, `movie_imdb`, `movie_awards`,
  `streaming_offers`, `providers`, `taste_ratings`.
- The catalogue is a snapshot, not live ratings. Cache it on disk and show a
  designed offline state, never a network error page.
- Supabase is the only remote store. Never add CloudKit or iCloud sync;
  ratings must round-trip with the website through `taste_ratings`.
- `taste_ratings (user_id, slug, verdict, stars, updated_at)` is protected by
  row-level security; the anon key only reaches the signed-in user's rows.
- Auth: Sign in with Apple and Google through `signInWithIdToken`; magic link
  through a universal link callback. Sign in with Apple is required by App
  Store guideline 4.8 because Google and GitHub are offered.

## Shared assets and context

The web app owns every asset and token. Reuse from these paths; never
redraw, re-export by hand, or invent a colour that DESIGN.md does not name.

- Brand marks: generated, never hand-drawn. `../scripts/brand/mark.tsx`
  renders the film-reel mark with the crimson period at any size;
  `../scripts/generate-brand-assets.tsx` writes `../public/icon-192.png`,
  `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, and
  `favicon.ico`, and uploads the Open Graph card and icon set to Supabase
  Storage with the URLs in `../src/lib/brand-assets.json`. For the App Store
  add a 1024x1024 render to that script (no alpha, no rounded corners) and
  place it in the asset catalog; do not upscale `icon-512.png`.
- Colour tokens: `../DESIGN.md` under "Colors" names every role (Marquee
  Crimson, Lit Crimson, Blush White, Ink, Chalk, Charcoal, Graphite, Faded
  Ink, Pencil Gray, Hairline, Paper, Paper Tint, Alert Red, and the signal
  hues) with canonical oklch values and a light/dark table.
  `../.impeccable/design.json` is the machine-readable sidecar
  (`extensions.colorMeta`, `typographyMeta`, `shadows`, `borders`,
  `surfaces`, `themes`, `motion`). `../scripts/brand/tokens.ts` already
  converts the oklch roles to sRGB hex with `oklchToHex`; port that function
  or run it to fill the asset catalog. Define each role once as a Color Set
  with light and dark appearances, named exactly as DESIGN.md names it.
- Typography: Playfair Display is the one face, loaded on the web through
  next/font. Bundle the variable TTF from Google Fonts (SIL Open Font
  License) and register it in Info.plist; use `tabular-nums` equivalents
  (`.monospacedDigit()`) wherever DESIGN.md's Tabular Figures Rule applies.
  The type scale is under "Typography" in DESIGN.md.
- Component specimens: `../DESIGN.md` under "Components" describes every
  shipped surface, and `../.impeccable/surfaces/*.md` records the table,
  film detail band, taste panel, and sign-in page as built. Match their
  hierarchy and copy, not their HTML.
- Provider marks: `providers.icon_url` from Supabase (JustWatch images).
  Render 16px, grayscale at rest, colour on hover or selection, with a
  one-letter outline chip fallback, as `../src/components/movie-grid/provider-icon.tsx` does.
- Sign-in marks: Google's G is `../src/components/ui/svgs/google.tsx`
  (keeps its own colours); GitHub's is `../src/components/ui/svgs/githubLight.tsx`
  (drawn in the current text colour).
- Test fixtures and previews: `../seed/*.json` is the full catalogue of
  5,207 films as loaded into Supabase (movies, people, credits, genres, subgenres, awards,
  IMDb, providers, streaming offers). Use it for SwiftUI previews and for
  offline tests; the TypeScript tests in `../src/lib/*.test.ts` hold the
  small inline fixtures that parity tests must reproduce.
- Schema: `../supabase/migrations/*.sql`, applied in filename order, is the
  source of truth for column names, types, and the `taste_ratings` policy.
- Deploy: the website redeploys from Coolify on pushes to master. Commits
  that only touch `apple/` should not trigger it; if they do, the Watch Paths
  setting on the Coolify app is missing.

## Binding product rules

Port these from `../src/lib` and keep parity with its tests in
`../src/lib/*.test.ts`. When in doubt, the TypeScript is the reference.

- Terminology for all copy and labels: **Users** (Metacritic user score),
  **Critics** (Metascore), **Popularity** (count of audience ratings),
  **Final Score** (the visitor-weighted blend), **Score bias** (the critic
  weight slider). Never describe the taste ranking as AI; say "built from
  your ratings".
- Missing values render as an em dash, never zero and never imputed.
- Final Score: `base = (1 - w) * users + w * critics` where `w` is score bias
  (0 to 1 in steps of 0.1, default 0.5). A popularity weight `p` (default 0)
  then blends `base` with the film's popularity percentile. At weight 0 or 1
  the single input is used as is; otherwise a missing input makes the result
  unavailable. The result is rounded down.
- Taste profile: features weighted director 3, genre 2, subgenre 1.5,
  writer 1.5, cast 1, language 1, decade 1. A rating scales each rated film's
  features by `(stars - 3) / 2` at or above three stars and `(stars - 3) / 2.5`
  below, so five is +1, three is neutral, half a star is -1. Match is cosine
  similarity, rescaled so the best unrated film reads 1. The For you column
  exists only once a film has four or more stars.
- For you = `floor(60 * match + 0.4 * finalScore)`; nil when either is nil.
- Stars are half steps from 0.5 to 5; a verdict is stars or `skip`.
- Ratings merge on sign-in: union of local and account, newer `updated_at`
  wins, ties go to the account. Signing out clears local ratings. "Clear
  ratings" is the only place ratings are deleted and must confirm first.
- Default view: release year 2000 to 2024, popularity 300 to 100,000, sorted
  by Final Score descending, score bias 0.5.

## UI

- Follow `../DESIGN.md`: Marquee Crimson accent, serif ledger type, light and
  dark themes. Use system materials and iOS 26 idioms rather than copying web
  chrome.
- Use `Table` with a `SortComparator` binding for the film list; it renders
  sortable columns on iPad and Mac and collapses to one column on iPhone,
  where each row is a designed cell. Branch on `horizontalSizeClass`, never
  on device model.
- Mac needs menu `Commands` for sort, filter, and reset view, keyboard
  shortcuts, and a default window size. Sign in with Apple must work on
  every platform.
- The score bias slider is the hero control; re-score on release, not on
  every tick. Keep the scored list precomputed in an `@Observable` store with
  stable row ids so the table stays fast at 5,000+ rows.
- Star rating uses `sensoryFeedback` haptics; the left half of a star gives
  the half step.
- Every film links out to its Metacritic page.
