---
version: 1
slug: "src-app-layout-tsx"
primary_target: "src/app/layout.tsx"
related_targets: ["scripts/generate-brand-assets.tsx"]
---

## Scope

Social card (Open Graph and Twitter image, 1200x630) and the favicon set for movietable.ai, rendered by `scripts/generate-brand-assets.tsx` and served from Supabase Storage. Mode: Persuade. The visitor is someone seeing a shared link in a feed; they must know what MovieTable is, why it is different, and what to do, in one glance.

## Direction contract

THESIS: One page of the ledger, lifted out and set large. It refuses the social-card default of a gradient field with a floating logo and tagline; instead it is the product's own title block on Paper, ruled and typeset.
OWN-WORLD: Paper ground, zero-chroma grays, Playfair Display for every word, square surfaces, hairline rules, Marquee Crimson only where the ledger allows it: the wordmark's period, the slider fill, the one primary button.
STORY: "MovieTable ranks the top Metacritic films by how much I trust critics versus crowds; I can go find tonight's film." The three stacked glyphs (popcorn, film strip, film reel) say "films" before a word is read.
FIRST VIEWPORT: Top row: the avatar-group mark of three overlapping Paper Tint circles at left, the domain and the live film count and year range at right. Middle: the wordmark at 136px with the crimson period, the lede in Faded Ink beneath at 36px on two lines. Bottom, above a hairline: the crimson "Find your next film" button at left, the score-bias slider drawn at mid, Users to Critics, at right.
FORM: The ledger's own title block, first on the list; a precise brief, no concept seed run.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Favicon

One glyph carries the mark at 16px: the Phosphor film reel in Ink on Paper with the wordmark's crimson period at the lower right. Transparent SVG with a dark-scheme swap to Chalk; PNGs at 32, 180, 192, 512 on Paper; favicon.ico wraps the 32px PNG.
