---
version: 1
slug: "src-components-movietable-tsx"
primary_target: "src/components/MovieTable.tsx"
related_targets: ["src/components/movie-grid/movie-grid.tsx"]
---

# Surface brief: MovieTable table card (grouped grid)

## Scope and mode

Route `/`, the table card rendered by `src/components/MovieTable.tsx`. Mode: Operate. Replaces the flat paginated grid (`examples/c-filters-10.tsx`) with a grouped, virtual-scrolled grid built on the installed REUI grouping block and `DataGridTableVirtual`. Page header, search field, score-bias slider, advanced filter chips and inline editor, footnote, and the "not live" footer are untouched.

## Audience, job, proof

Public film-picker arriving cold, no account. Task: scan films in bands of Final Score, open a band, pick a film, click through to Metacritic. Proof is the product's own mechanism: moving the score-bias slider re-forms the bands live, and counts and averages update with it. Real data only: 3,963 films, 390 on default filters.

## Confirmed decisions (2026-09-12)

- Production-ready; old grid deleted.
- Group by Final Score band by default (90+, 80–89, 70–79, 60–69, under 60, Unscored last); switchable to Decade (2020s … 1910s) and Popularity tier (10,000+, 2,500+, 1,000+, 300+, under 300, no data) via a 28px "Group by" select in a new toolbar band under the card header.
- Bands keep fixed order; column sort applies within each band.
- Group row carries count of films and average Final Score. Display popover keeps density (compact / comfortable) and a context line toggle. One outline "Expand groups / Collapse groups" button.
- Virtual scroll, no pagination. **Sticky band rows** while scrolling a band's films: the user chose to extend the renderer.
- No stage dots, no signal colors on bands, no icon tiles, avatars, rings, toasts, or a primary button on this surface.

## Direction contract

THESIS: The ledger groups itself by the visitor's own score. A flat top-N list is the category default; this surface refuses it and shows the whole catalogue as bands that reshuffle when the slider moves, so the mechanism is visible instead of implied.

OWN-WORLD: The Critics' Ledger as recorded in DESIGN.md: Playfair Display everywhere, square surfaces, hairline rules, Paper Tint bands, Marquee Crimson only on the Final Score chip, slider fill, checked switch, active sort arrow. Group rows are 44px Paper Tint at 45% with a chevron, band label, outline count badge, and an average Final Score in Faded Ink. Film rows are the existing six columns, 36px compact, with an optional Caption context line.

STORY: The visitor sees the catalogue already sorted into "90+", "80–89", and so on for their current bias. They drag the slider and watch films change bands. They open a band, scan titles and figures, and click through to Metacritic.

FIRST VIEWPORT: Unchanged page header, search, and slider above the card. Card header: "Your movie list", live count, Advanced filter, Advanced editor. New toolbar band beneath: "Group by" select left; Display popover and Expand/Collapse groups right. Then the grid with a sticky column header, the first band row "90+" pinned as its films scroll, and roughly twelve film rows visible inside the 640px cap. No primary button: the surface's action is the film title link.

FORM: Extension of an existing surface inside an established world; first and only structure on the list (card header → toolbar band → grouped virtual grid). No concept-seed run; seed key: none.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open decisions for the builder

- Sticky bands are implemented as a composed overlay driven by the virtualizer's scroll state, not by editing the REUI file, so registry updates do not overwrite it.
- Sorting is manual: films are sorted by the table's sorting state before grouping so bands never reorder.
- Density and group-by are in-memory only; no persistence.
