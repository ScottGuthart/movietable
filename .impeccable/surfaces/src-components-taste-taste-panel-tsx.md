---
version: 1
slug: "src-components-taste-taste-panel-tsx"
primary_target: "src/components/taste/taste-panel.tsx"
related_targets: ["src/components/MovieTable.tsx","src/components/movie-grid/columns.tsx"]
---

# Surface brief: taste-profile recommender (For you)

## Scope and mode

Route `/`, an extension of the MovieTable table card. Adds a third ranking control ("Your taste") to the preferences row, an inline "Tune to your taste" panel inside the table card, a Rate control on every film row, and a sortable **For you** column. Mode: Operate. Header, search, score-bias slider, filters, advanced editor, grouping toolbar, footnote, and footer are untouched. The catalogue now comes from Supabase at build time (1,506 films with genres, credits, and summaries); `data.json` is no longer read.

## Audience, job, proof

Cold visitor, no account, picking a film for tonight. They have opinions about films they have seen but cannot express them as numeric filters. Task: like or pass on a handful of films, watch the whole table re-rank under For you, click through to Metacritic. Proof is transparency: every For you cell names the attributes it matched (director, genre, writer, cast, decade). Copy says "built from your ratings"; it never says AI.

## Confirmed decisions (2026-09-12)

- Engine: client-side similarity over genres, directors, writers, top-billed cast, and decade. No server route beyond a static JSON of film attributes, fetched on first panel open or when saved ratings exist.
- Input: one to five stars on every film row (REUI rating adapted to real buttons), plus a starter hand of twelve popular, varied films in the panel with a "Haven't seen" action. No free text, no imports. Thumbs were replaced by the scale on 2026-09-12 at the user's request.
- Ranking: For you, 0–100, blends match strength with the current Final Score under a quality floor. Appears at the first four- or five-star rating, becomes the default sort, and switches grouping to For you bands. Final Score and the slider are unchanged; the slider still feeds the quality term.
- Persistence: verdicts by film slug in localStorage under a versioned key. Profile is derived at runtime. Reset view does not clear ratings; Clear ratings does.
- Catalogue: Supabase only (user choice). Films lacking attributes show an em dash in For you.

## Direction contract

THESIS: The visitor's own likes become the ledger's ordering. The category default is a separate "recommended for you" feed or a modal quiz; this surface refuses both and lets taste enter the same table as a third control and one more ruled column, so the mechanism stays visible and reversible.

OWN-WORLD: The Critics' Ledger as recorded in DESIGN.md: Playfair Display for every glyph, square surfaces, hairline rules, Paper Tint bands, no shadows on the page plane. Marquee Crimson marks the visitor's own number and marks: the filled stars of a rating, the For you chip while a profile is active (the Final Score chip demotes to a plain numeral at the same moment). Empty stars sit in Pencil Gray. The starter hand is one ruled sheet, cells divided by hairlines, never a grid of bordered cards.

STORY: The visitor sees "Your taste · Not set" beside the slider and a "Rate films" button. Opening it reveals twelve familiar titles with a summary each. One four-star rating, and a For you column slides in, the table regroups into "90+" and "80–89" bands of their own score, and the field reads "Built from 1 film · Crime · Coppola". They hover a chip and read why. They rate a few more, watch the order sharpen, and click a title.

FIRST VIEWPORT: Unchanged wordmark and lede. Preferences row: Find a film, Score bias, and Your taste (label, status output, one outline button, one helper line). Two fields per row from 768px, with Your taste on its own row beneath, and three across from 1024px; three across at 768px squeezed the slider to about 150px. Below, the table card header unchanged; when the panel is open it sits as a Paper Tint band between the header and the grouping toolbar: heading "Tune to your taste" left, "Deal another hand" right, one line of guidance, then the twelve-cell ruled sheet (four columns from 1024px, two from 640px; below 640 the same hairline cells run as a horizontal snap strip with a swipe hint, because twelve stacked cells pushed the table 1,600px down the phone). The grid gains a Your rating column after Title and a For you column after Final Score; below 1024px, where the grid scrolls sideways, the For you column sticks to the grid's right edge so the visitor's number stays in view while Title scrolls. No primary button anywhere; the surface's action is a star.

FORM: Extension of an existing surface inside an established world; first and only structure on the list (third field → inline band → two new columns). No concept-seed run; seed key: none. Code-led: no comp; the ambition is carried by this contract.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions for the builder

- Attribute payload is served by a static route handler (`/api/taste-data`) revalidated daily; cast is capped at the eight top-billed names per film.
- Match strength is cosine similarity between the profile vector and the film's weighted attribute vector, rescaled so the best match in the catalogue reads 100; For you = floor(60 × match + 0.4 × Final Score).
- The starter hand is dealt deterministically: films ordered by popularity, one per unseen decade-and-genre combination first, then the rest; "Deal another hand" advances by twelve.
- Hydration: verdicts are read after mount through a subscribable store so the server render never disagrees with the client.
- The For you chip's explanation opens on hover, tap, or Enter through the popover primitive (frosted floating surface), so touch has the same path as pointer and keyboard.
- Band rows carry an average under both Final Score and For you when grouped by For you band, each under its own column header.
