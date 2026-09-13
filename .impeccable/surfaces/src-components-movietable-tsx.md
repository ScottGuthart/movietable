---
version: 1
slug: "src-components-movietable-tsx"
primary_target: "src/components/MovieTable.tsx"
related_targets: ["src/components/movie-grid/movie-grid.tsx","src/components/movie-grid/detail-row.tsx"]
---

# Surface brief: MovieTable table card (grouped grid with credits and streaming)

## Scope and mode

Route `/`, the table card rendered by `src/components/MovieTable.tsx` and `src/components/movie-grid/*`. Mode: Operate. Second extension of the grouped grid: credits (director, writers, cast) and streaming availability from the Supabase catalogue join the ledger. Page header, slider, band mechanics, sticky band, advanced editor, taste controls, sign-in, and the footer credit are untouched.

## Audience, job, proof

Same public film-picker, with a sharper question: "can I watch this tonight, and who made it?" Availability becomes the second scan signal after Final Score; credits give the portfolio audience visible data depth. Real data only: 1,506 films, 24,397 people, 33,112 credits (median 1 director, 2 writers, 20 cast), 24 genres, 159 providers, 12,221 US offers; 1,041 films streamable on a subscription, 1,446 with any offer, 60 with none; synopsis 37 to 2,060 characters.

## Confirmed decisions (2026-09-12)

- Watch column after Title, before the numbers: up to four 16px JustWatch provider icons, grayscale at rest and full color on row hover, then "+n"; subscription only; free-with-ads shows one outline "Free" badge; no offer shows nothing; a failed icon falls back to a one-letter outline chip.
- Film rows open on whole-row click (title link and Rate controls excepted) and through a 24px ghost disclosure at the end of the Title cell. Multiple films may be open.
- Detail band beneath an open film: full table width, Paper Tint 20%, card side padding, two columns from 768px. Left: synopsis clamped to three lines with "More" opening the REUI c-popover-9 pattern (inline dashed-underline trigger, compact popover with a bordered header line) holding the full text; genres as outline badges; Directed by, Written by, Cast (top 8 with character in Faded Ink), names linking to metacritic.com/person/<slug>/, then "+n more on Metacritic". Right, "Where to watch": Stream, Free, Rent, Buy lists, each row an outbound link with mono icon, provider name, quality and USD price in Faded Ink tabular; "All options on JustWatch" closes it. Skeleton while loading; inline error with Retry; empty copy "Not streaming in the US right now".
- My services popover in the toolbar band beside Group by: searchable provider checklist ordered by film count, a switch "Only films I can stream", a checkbox "Count free with ads"; remembered in localStorage on this device; count badge on the trigger; bands re-form when it filters.
- Group by Director: directors with two or more films in the current view ordered by count then name; the rest gather in a closing "Other directors" band; co-directed films sit under the first-billed director.
- Genre joins the advanced filter fields as a multiselect ("has any of").
- Search matches titles, directors, and writers; cast is not searched. The context line under a title starts with the director.
- Data: directors, writers, genres, and subscription provider ids ship inline with each film through the catalogue load; cast, characters, full synopsis, and all offers come from a per-film API route with daily revalidation, fetched when a row opens and cached in memory.
- The view is shareable as a link (added mid-build at the user's request, with nuqs): the filter tree (`q`), search, grouping override (`group`), and score bias (`bias`) live in the URL with defaults cleared; density, the context line, open films, and My services stay on the device. The page renders per request so a shared link serves the right view server-side.

## Direction contract

THESIS: The ledger answers "who made it and where can I watch it" without leaving the row. The category default is a detail page per film; this surface refuses it and opens the film in place, inside its band, with availability visible before the click.

OWN-WORLD: The Critics' Ledger unchanged: Playfair Display, square surfaces, hairlines, Paper Tint bands, crimson only on the score chip, slider, checked switch, and active sort arrow. Provider logos are the one new foreign element and enter mono: grayscale at rest, color on hover, 16px. The detail band is a quieter Paper Tint (20%) than band rows (45%), typeset as two columns of Body and Caption with outline badges and Ink links carrying the film-title arrow treatment.

STORY: The visitor scans bands, notices mono marks in the Watch column, opens a row, reads the synopsis, sees who directed and wrote it and the top cast, and clicks straight to the provider or to Metacritic. With My services set, the table shows only what they can stream tonight.

FIRST VIEWPORT: Header, controls, card header, and toolbar band as before, with My services added between Group by and the right-hand buttons. The grid gains a 120px Watch column after Title (after Rate when the taste column is present). The first band "90+" is open with mono provider marks on most rows; one film may be opened by the visitor into a detail band spanning the full grid width.

FORM: Extension of an existing surface inside an established world; single structure (card header → toolbar band → grouped virtual grid with expandable film rows). No concept-seed run; seed key: none.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions for the builder

- The detail band renders as a synthetic sub-row of the film row inside the virtualized grid; its content lives in the first cell and spans the table width, so the virtualizer measures the real height.
- Provider icons hotlink from images.justwatch.com with a plain img, lazy loading, and no referrer.
- "Other directors" threshold is two films; cast cutoff is eight.
- Reset view closes open films and resets grouping, but keeps My services (a device preference).
