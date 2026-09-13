---
version: 1
slug: "src-components-film-detail-film-detail-tsx"
primary_target: "src/components/film-detail/film-detail.tsx"
related_targets: ["src/components/movie-grid/columns.tsx","src/lib/movie-filters.ts"]
---

# Surface brief: film detail, language, subgenres, and Oscars

## Scope and mode

Route `/`, four additions to the table card: a film detail popover from an info button beside every title; the Display toggle's context line re-purposed for language, subgenres, and the Oscar record; Language, Subgenre, Oscar wins, and Oscar nominations as filter fields; Language and Oscars as Group by options. Starter-hand cards add the language after the director. Mode: Operate.

## Audience, job, proof

The same cold visitor, now able to answer what kind of film exactly, in what language, how decorated, and where it streams tonight, without leaving the ledger. Proof is the popover: real Wikidata subgenres, the Oscar line with its own caveat, live US offers with prices, and outbound links to Metacritic, IMDb, and JustWatch.

## Confirmed decisions (2026-09-13)

- All four placements, taste features for subgenres (1.5) and language (1), and streaming offers inside the detail.
- Awards will arrive as a `movie_awards` table with `award, category, outcome, year, person_slug` and a relation to `people`; the detail renders each line ("Best Actor · Marlon Brando", "Won, 1973") once the table exists and shows Oscar counts alone until then. A missing table is expected, not an error.
- Oscar counts keep the schema's caveat in the popover: "Academy Award counts from Wikidata, indicative rather than complete."
- Facts that filter or group ride in the page payload; the full summary, offers, credits, and awards load on demand for one film with the anon key over public row-level security.

## Direction contract

THESIS: Detail lives inside the row it belongs to. The category default is a film page or a side sheet; this surface refuses both and opens one Paper note beside the title, so the ledger never loses its place.

OWN-WORLD: The Critics' Ledger as recorded in DESIGN.md. The popover is the Popover primitive as shipped for the For you explanation: opaque Paper, Ink-at-10% ring, floating shadow, square (the frosted surface belongs to selects and menus). Playfair for every glyph; Title role for the film's name, Body for the summary, Caption in Faded Ink for subgenres, footnotes, and prices. Marquee Crimson touches nothing new here; the outbound arrows stay Faded Ink. The info button is a 24px ghost icon in Faded Ink that lifts to Ink on hover.

STORY: The visitor reads "English · 2 Oscars, 9 nominations · Gangster, Epic" under a title, opens the info note, reads the full summary, sees it streams on two services and rents from $3.99, and clicks through, or narrows the whole ledger to Japanese-language films with an Oscar nomination and groups them by language.

FIRST VIEWPORT: Unchanged. Each title now ends with the info button after the Metacritic arrow. With the context line on, rows are 48px and carry the new line in Caption. The Group by select lists six options. Below 768px the info button leads the title so it stays on screen. Opening it places a 20rem note to the right of the title (above or below it on narrow screens, whichever has room, scrolling inside the viewport; the scroll box cuts at its bottom edge like any scrolling list): title, "1972 · Francis Ford Coppola · English", subgenres, summary, Oscars block with caveat, "Stream", "Rent from", "Buy from" lines, then the three outbound links.

FORM: Extension of an existing surface inside an established world; the popover reuses the Popover primitive already documented for the For you explanation. No concept-seed run; seed key: none. Code-led: no comp.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions for the builder

- Subgenre labels are cleaned from Wikidata: trailing "film" removed, sentence case, labels equal to any Metacritic genre dropped, ordered by catalogue frequency in the context line (two when an Oscar record shares the line, else three) and alphabetically in the popover. The Display toggle carries the IMDb and Wikidata caveat.
- Language grouping is alphabetical with "Unknown language" last; Oscars bands are 3+ wins, 1–2 wins, Nominated only, No Oscar record.
- Detail results are cached per film for the page's lifetime; the info button hides when the browser-visible Supabase env is missing.
