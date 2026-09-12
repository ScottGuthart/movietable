---
name: MovieTable
description: A ranked ledger of Metacritic films, re-ordered by how much the visitor trusts critics versus crowds.
colors:
  marquee-crimson: "oklch(0.525 0.223 3.958)"
  blush-white: "oklch(0.971 0.014 343.198)"
  ink: "oklch(0.145 0 0)"
  header-ink: "oklch(0.21 0.006 285.885)"
  faded-ink: "oklch(0.556 0 0)"
  pencil-gray: "oklch(0.708 0 0)"
  hairline: "oklch(0.922 0 0)"
  secondary-paper: "oklch(0.967 0.001 286.375)"
  paper-tint: "oklch(0.97 0 0)"
  paper: "oklch(1 0 0)"
  alert-red: "oklch(0.577 0.245 27.325)"
  alert-red-ink: "oklch(0.444 0.177 26.899)"
  signal-green: "oklch(0.696 0.17 162.48)"
  signal-green-ink: "oklch(0.378 0.077 168.94)"
  signal-yellow: "oklch(0.795 0.184 86.047)"
  signal-yellow-ink: "oklch(0.421 0.095 57.708)"
  signal-violet: "oklch(0.606 0.25 292.717)"
  signal-violet-ink: "oklch(0.38 0.189 293.745)"
  chart-sky: "oklch(0.685 0.169 237.323)"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  page-heading:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3333
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
  lede:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4285
  label:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.375
  column-header:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.3846
  caption:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3333
  score:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4285
    fontFeature: "tnum"
rounded:
  none: "0px"
  pill: "9999px"
spacing:
  "1": "4px"
  "1.5": "6px"
  "2": "8px"
  "2.5": "10px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
components:
  button-primary:
    backgroundColor: "{colors.marquee-crimson}"
    textColor: "{colors.blush-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "oklch(0.525 0.223 3.958 / 0.8)"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "32px"
  button-outline-hover:
    backgroundColor: "{colors.paper-tint}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.paper-tint}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
    height: "32px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
  # card-footer belongs to the pagination footer; the grouped grid renders no card footer.
  card-footer:
    backgroundColor: "oklch(0.97 0 0 / 0.5)"
    padding: "16px 20px"
  toolbar-band:
    backgroundColor: "oklch(0.97 0 0 / 0.2)"
    padding: "12px 20px"
  editor-band:
    backgroundColor: "oklch(0.97 0 0 / 0.4)"
    padding: "20px"
  score-chip:
    backgroundColor: "oklch(0.525 0.223 3.958 / 0.1)"
    textColor: "{colors.marquee-crimson}"
    typography: "{typography.score}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
    width: "40px"
  badge-secondary:
    backgroundColor: "{colors.secondary-paper}"
    textColor: "{colors.header-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "2px 5px"
    height: "20px"
  badge-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "2px 5px"
    height: "20px"
  badge-success:
    backgroundColor: "oklch(0.696 0.17 162.48 / 0.1)"
    textColor: "{colors.signal-green-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "2px 5px"
    height: "20px"
  badge-warning:
    backgroundColor: "oklch(0.795 0.184 86.047 / 0.1)"
    textColor: "{colors.signal-yellow-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "2px 5px"
    height: "20px"
  badge-destructive:
    backgroundColor: "oklch(0.577 0.245 27.325 / 0.1)"
    textColor: "{colors.alert-red-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "2px 5px"
    height: "20px"
  badge-info:
    backgroundColor: "oklch(0.606 0.25 292.717 / 0.1)"
    textColor: "{colors.signal-violet-ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    padding: "2px 5px"
    height: "20px"
  table-header:
    textColor: "oklch(0.21 0.006 285.885 / 0.8)"
    typography: "{typography.column-header}"
    padding: "0 8px"
    height: "24px"
  table-cell:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "6px 8px"
  table-row-hover:
    backgroundColor: "oklch(0.97 0 0 / 0.4)"
  group-row:
    backgroundColor: "oklch(0.97 0 0 / 0.45)"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    height: "44px"
  band-average:
    textColor: "{colors.faded-ink}"
    typography: "{typography.body}"
  sticky-band:
    backgroundColor: "{colors.paper}"
    height: "44px"
  film-row:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "41px"
  film-row-with-context:
    height: "49px"
  film-row-comfortable:
    height: "48px"
  film-row-comfortable-with-context:
    height: "60px"
  context-line:
    textColor: "{colors.faded-ink}"
    typography: "{typography.caption}"
  # icon-tile, page-current, avatar, completion-ring, and toggle-pill are defined only by the
  # unrouted demo block (src/components/blocks/data-grid-grouping-1), not by the shipped page.
  # The header's signed-in control uses account-pill and account-avatar (24px) below instead.
  icon-tile:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "28px"
  page-current:
    backgroundColor: "{colors.marquee-crimson}"
    textColor: "{colors.blush-white}"
    rounded: "{rounded.none}"
    size: "28px"
  slider-track:
    backgroundColor: "{colors.paper-tint}"
    rounded: "{rounded.pill}"
    height: "4px"
  slider-range:
    backgroundColor: "{colors.marquee-crimson}"
  slider-thumb:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    size: "12px"
  switch:
    backgroundColor: "{colors.hairline}"
    rounded: "{rounded.pill}"
    width: "32px"
    height: "18.4px"
  switch-checked:
    backgroundColor: "{colors.marquee-crimson}"
  switch-thumb:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    size: "16px"
  switch-sm:
    rounded: "{rounded.pill}"
    width: "24px"
    height: "14px"
  toggle-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "28px"
  toggle-pill-active:
    backgroundColor: "{colors.secondary-paper}"
    textColor: "{colors.header-ink}"
  avatar:
    backgroundColor: "{colors.paper-tint}"
    rounded: "{rounded.pill}"
    size: "20px"
  completion-ring:
    rounded: "{rounded.pill}"
    size: "20px"
  filter-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.faded-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0 10px"
    height: "28px"
  popover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px"
  metric-label:
    textColor: "{colors.faded-ink}"
    typography: "{typography.caption}"
  footer-credit:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
  # Taste controls: the Rate thumbs, the For you chip, the taste field and panel, the ruled hand
  # sheet, and the For you column pinned below 1024px.
  rate-thumb:
    backgroundColor: "transparent"
    textColor: "{colors.faded-ink}"
    rounded: "{rounded.none}"
    size: "28px"
  rate-thumb-sheet:
    size: "32px"
  rate-thumb-hover:
    backgroundColor: "{colors.paper-tint}"
    textColor: "{colors.ink}"
  rate-thumb-liked:
    textColor: "{colors.marquee-crimson}"
  rate-thumb-passed:
    textColor: "{colors.ink}"
  for-you-chip:
    backgroundColor: "oklch(0.525 0.223 3.958 / 0.1)"
    textColor: "{colors.marquee-crimson}"
    typography: "{typography.score}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
    width: "40px"
  final-score-demoted:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
  explanation-popover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    width: "256px"
  taste-status:
    textColor: "{colors.faded-ink}"
    typography: "{typography.body}"
  taste-band:
    backgroundColor: "oklch(0.97 0 0 / 0.4)"
    padding: "20px"
  hand-sheet:
    backgroundColor: "{colors.hairline}"
    rounded: "{rounded.none}"
  hand-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "16px"
    width: "256px"
  hand-cell-credit:
    textColor: "{colors.faded-ink}"
    typography: "{typography.caption}"
  hand-cell-skeleton:
    backgroundColor: "{colors.paper-tint}"
    rounded: "{rounded.none}"
  pinned-column:
    backgroundColor: "{colors.paper}"
    padding: "0 24px 0 20px"
    width: "116px"
  pinned-column-band:
    backgroundColor: "color-mix(in oklch, oklch(0.97 0 0) 45%, oklch(1 0 0))"
  pinned-column-hover:
    backgroundColor: "color-mix(in oklch, oklch(0.97 0 0) 40%, oklch(1 0 0))"
  # Sign-in page and header account control: the provider buttons and their marks, the "or"
  # rule, the alert line, the footnote, the account pill and its avatar, and the account menu.
  provider-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px 0 8px"
    height: "32px"
    width: "100%"
  provider-button-hover:
    backgroundColor: "{colors.paper-tint}"
  provider-mark:
    size: "16px"
  or-rule:
    backgroundColor: "{colors.hairline}"
    height: "1px"
  or-label:
    textColor: "{colors.faded-ink}"
    typography: "{typography.caption}"
  alert-line:
    textColor: "{colors.alert-red}"
    typography: "{typography.body}"
  sign-in-footnote:
    textColor: "{colors.faded-ink}"
    typography: "{typography.body}"
  account-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "0 10px 0 4px"
    height: "32px"
  account-pill-expanded:
    backgroundColor: "{colors.paper-tint}"
  account-avatar:
    backgroundColor: "{colors.paper-tint}"
    textColor: "{colors.faded-ink}"
    rounded: "{rounded.pill}"
    size: "24px"
  account-menu:
    backgroundColor: "oklch(1 0 0 / 0.7)"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px"
    width: "256px"
  account-menu-label:
    textColor: "{colors.faded-ink}"
    typography: "{typography.caption}"
    padding: "4px 6px"
  account-menu-status-error:
    textColor: "{colors.alert-red}"
  account-menu-item:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "4px 6px"
  account-menu-item-highlighted:
    backgroundColor: "oklch(0.145 0 0 / 0.1)"
---

# Design System: MovieTable

## Overview

**Creative North Star: "The Critics' Ledger"**

MovieTable looks like a page from a bound ledger of film scores. One serif face, Playfair Display, sets everything from the wordmark down to the last numeral in the table, so the whole page reads as typeset rather than assembled. Rows are separated by hairline rules, corners are square, neutrals are pure gray with no tint, and the dominant color is a single crimson that behaves like red ink: it marks the visitor's own number, the Final Score, where they are, and the one action that commits.

The mood is bookish, warm, and unhurried. The lede reads like a sentence from a review, the title block breathes, and the table is dense but never cramped. Nothing animates for its own sake. The page is content to be read slowly, and the visitor's attention is carried by type, tone, and rule lines rather than by fills, gradients, or shadows.

Controls are tactile and confident within that restraint: 32px tall, square, hairline-bordered, and they nudge down a pixel when pressed. Primary actions fill solid crimson; everything else stays paper-colored and steps one tone darker on hover. Floating menus are the one place the page lifts, with a soft shadow and a frosted, translucent surface.

The ledger also knows how to group. The table card sorts the catalogue into bands by the visitor's own Final Score, by decade, or by popularity tier. A band row is 44px on Paper Tint at 45% and carries only a ghost chevron, the band label, an outline count badge, and the band's average Final Score in Faded Ink; the band that owns the top of the scroll box stays pinned beneath the column header while its films pass underneath. Nothing on a band is colored. The REUI demo block the grid was built from (`src/components/blocks/data-grid-grouping-1`) is not wired into any route, but it still defines a quiet family of signal tints for green, yellow, violet, and red, along with status dots, avatars, completion rings, and toggle pills. Those signals are the only hues beside crimson, and they live in badges, dots, and rings, never on controls or surfaces.

Taste enters the same page as a third control and one more ruled column, never as a feed or a quiz. Beside the slider, a Your taste field holds a label, a status readout, one outline button, and a helper line. Opening it drops a Paper Tint band into the table card that deals twelve familiar films as one ruled sheet: Paper cells divided by hairlines, each with a title link, a credit line, genres, a two-line summary, a pair of ghost thumbs, and a Haven't seen action. Every film row gains the same thumbs in a Rate column, and the first Like brings a For you column into the grid. At that moment the crimson chip moves: For you takes it and the Final Score chip becomes a plain numeral, so each row still carries exactly one crimson number. Hovering, tapping, or pressing Enter on the chip opens a small Paper popover that names the attributes it matched.

Sign-in is a side door, not a gate. A separate page at `/sign-in` is one more typeset sheet: the wordmark at 1rem beside the film icon, a ghost way back to the table, and a centred 24rem column holding a page heading, one sentence, two outline provider buttons, an "or" rule, an Email field, and one Faded Ink footnote. The only colour beyond the ledger's is each provider's own mark at 16px inside its outline button. The table page's header gains a quiet account control above the dataset meta: a ghost "Sign in" for guests, and for a signed-in visitor a 32px outline pill wrapping a 24px round avatar, their name at Caption size, and a selector glyph. The pill opens a menu that says whether their ratings are saved and lets them delete the saved copy or sign out. The first primary button on a shipped surface appears here, and only once the visitor is signed in: "Back to the table".

**Key Characteristics:**
- One typeface, Playfair Display, for every role including numerals and UI chrome
- Square surfaces and controls; round only for things that are continuous or circular (slider, switch, the account pill with its 24px avatar, and the demo block's avatars, dots, rings, and toggle pills)
- Pure grayscale neutrals with crimson as ink, plus four signal tints reserved for badges, dots, and rings
- Hairline rules and tone carry structure; nothing on the page plane casts a shadow
- Dense, tabular data with right-aligned figures and tabular numerals, grouped into 44px band rows that pin under the column header while their films scroll
- Tactile 32px controls with a one-pixel press
- Taste as a third control, one ruled sheet, and two more columns: ghost thumbs on every row, and one crimson number per row that moves from Final Score to For you once a profile is active
- Sign-in as a side door: a 24rem typeset column of outline buttons, one field, and one footnote, with a provider's brand mark as the only foreign colour and no primary button until the visitor is signed in

## Colors

A white page, gray ink in three strengths, one hairline, one crimson stamp, and four signal tints that stay inside badges and marks. On the sign-in page, Google's and GitHub's marks are the only colours that are not the ledger's.

### Primary
- **Marquee Crimson** (`oklch(0.525 0.223 3.958)`): The single accent. On the shipped page it appears in exactly six places: it fills the score-bias slider and the checked switch in the Display popover; it tints the Final Score chip at 10% with crimson text on top; it colors the active sort arrow, the eyebrow line, and the period that ends the wordmark. The current pagination square keeps its crimson fill in the component library but is not on any surface; the primary button appears once, as "Back to the table" on the sign-in page's signed-in state. On the sign-in page crimson also sets the 20px film icon and the period of the 1rem wordmark, and nothing else. It is never a border, a background wash, or body text. Once the visitor rates a film it gains two more places: the filled Liked thumb, and the For you chip, which takes the 10% tint and crimson numeral from the Final Score chip while a profile is active.
- **Blush White** (`oklch(0.971 0.014 343.198)`): Text on crimson fills. Faintly pink so it reads as the same ink family, never stark white.

### Neutral
- **Ink** (`oklch(0.145 0 0)`): Headings, titles, table titles, labels, and primary body text. The filled Not for me thumb sets in Ink, so a pass reads as a mark and never as a score. On the sign-in page: the page heading, the Email label, the sent-state status line with the address at weight 500, and the address at weight 500 inside the signed-in line. In the header, the account menu's items are Ink.
- **Header Ink** (`oklch(0.21 0.006 285.885)`): Column headers at 80% opacity, secondary badge text, and the `invert` token. A hair cooler than Ink so headers sit back from the cells beneath them.
- **Faded Ink** (`oklch(0.556 0 0)`): Secondary text: the lede, dataset meta, year column, footnotes, the footer disclosure, result counts, chip attribute labels, the band average ("avg 91"), the film context line, the band chevron at rest, the outbound arrow beside a title at 40% opacity, and the em dash for missing values. In the demo block it also sets metric labels and the backlog stage dot at 70%. On the taste surface it sets the unset thumbs, the field's status readout and helper line, the panel's guidance line, the hand cell's credit, genres, and summary, the Haven't seen action, the For you band average, the swipe hint, and the em dash for a film that cannot be ranked. On the sign-in page and in the header: the one-sentence lede under the page heading, the field helper, the "or" label, the footnote, the initials inside the account avatar, the selector glyph on the account pill at 60%, and the account menu's label block, which stacks the name at weight 500, the email, and the sync status.
- **Pencil Gray** (`oklch(0.708 0 0)`): Focus rings at 50% opacity and the slider thumb border.
- **Hairline** (`oklch(0.922 0 0)`): Every rule: table row borders, input and outline-button borders, badge outlines, icon-tile borders, card section dividers, the unchecked switch track, and the completion ring's track. The card's outer edge uses Ink at 10% instead, which lands within a hair of the same gray. The starter hand's outer border and the 1px gaps between its cells are Hairline, and so is the rule at the seam of the pinned For you column. The two rules flanking "or" on the sign-in page are Hairline, and so are the account pill's border and the ring around its avatar.
- **Secondary Paper** (`oklch(0.967 0.001 286.375)`): Hover fill on column-header sort buttons, the secondary button and badge, and the active state of a toggle pill.
- **Paper Tint** (`oklch(0.97 0 0)`): Slider track, outline and ghost button hover, film row hover at 40%, band rows and the pinned band at 45%, the advanced editor band at 40%, and the grid toolbar band at 20%. In the library only: the card footer at 50% and avatar fallbacks. The taste panel is a 40% band like the advanced editor, and the skeleton blocks shown while the hand loads are Paper Tint at full strength. The account pill fills Paper Tint while its menu is open, and its avatar fallback is Paper Tint behind the initials.
- **Paper** (`oklch(1 0 0)`): Page, card, the sticky column header, the opaque backing beneath the pinned band, popover, input, chip, badge-outline, and icon-tile backgrounds. Hand cells and the pinned For you column sit on opaque Paper. The 24px avatar inside the account pill wears a 1px Paper border inside its Hairline ring.

### Signal
Signal hues come from Tailwind's palette through the `success`, `warning`, `info`, and `destructive` tokens. Each has a bright value for dots, rings, and 10% tints, and a dark "ink" value for badge text. Only Alert Red appears on a shipped surface, as text in the sign-in page's alert lines and the account menu's error status; a band in the grouped grid carries no state, so the other uses below are the demo block's.
- **Signal Green** (`oklch(0.696 0.17 162.48)`, emerald-500) with **Signal Green Ink** (`oklch(0.378 0.077 168.94)`, emerald-900): On track, Done, the Done stage dot, completion rings at 75% and above, Revenue and Reliability label dots.
- **Signal Yellow** (`oklch(0.795 0.184 86.047)`, yellow-500) with **Signal Yellow Ink** (`oklch(0.421 0.095 57.708)`, yellow-900): At risk, the To Do stage dot, Messaging label dot.
- **Signal Violet** (`oklch(0.606 0.25 292.717)`, violet-500) with **Signal Violet Ink** (`oklch(0.38 0.189 293.745)`, violet-900): Info badges, Knowledge and Mobile label dots.
- **Alert Red** (`oklch(0.577 0.245 27.325)`) with **Alert Red Ink** (`oklch(0.444 0.177 26.899)`, red-800): Blocked, invalid fields, destructive actions, Access label dot. Kept distinct from Marquee Crimson by hue (27 versus 4) so an error never reads as a score. On the sign-in page it is the text of every `role="alert"` line: a failed provider sign-in beneath the provider buttons, a failed link send beneath the Email field (which also turns the label and the input border red), and a failed sign-out; in the account menu it sets the status line when sync, deletion, or sign-out fails. Always text, never a fill.
- **Chart Sky** (`oklch(0.685 0.169 237.323)`, chart-2 / sky-500): The In Progress stage dot. The five `chart-*` tokens are a sky ramp reserved for charts and stage marks.

The demo block at `src/components/blocks/data-grid-grouping-1` still writes three raw palette classes for its completion ring (`emerald-500`, `amber-500`, `rose-500`) and two for stage dots (`yellow-500`, `sky-500`). The block is not wired into any route and the shipped grid takes only its structure, not its marks; if any part of it is ever mounted, map those classes to the tokens above so a theme change moves them too.

### Named Rules
**The Ink and Signal Rule.** Marquee Crimson marks the visitor's number, the visitor's position, and the one primary action: the Final Score chip, the slider fill, the checked switch, the current page, the active sort arrow, the eyebrow, the wordmark's period, and the primary button. Signal hues mark state, and only inside a badge, a dot, or a ring, at a 10% tint behind their ink shade. Neither family ever fills a card, a row, a border, or a paragraph.

**The Gray Ground Rule.** Every neutral has zero chroma. No warm cream, no cool slate. Warmth comes from the serif, not from tinted grays.

**The Dormant Dark Rule.** A `.dark` token set exists in `globals.css` but nothing applies the class and no toggle exists. The system is light-only. Do not design for dark mode or reference dark tokens until a toggle ships.

**The One Crimson Number Rule.** A film row carries exactly one crimson number. Without a taste profile it is the Final Score chip; the moment a profile is active it is the For you chip, and Final Score demotes to a plain Ink numeral. The two chips are never crimson together, and the only other crimson on a row is a thumb the visitor has set to Liked.

**The Provider Mark Exception.** A third party's brand mark keeps its own colours, at 16px, inside an outline button, and nowhere else. Google's four-colour G and GitHub's near-black mark are the only hues on the sign-in page that are not the ledger's; they are never enlarged, recoloured, or set on a fill.

## Typography

**Display Font:** Playfair Display (with Georgia, serif), loaded through next/font as `--font-serif`
**Body Font:** Playfair Display (with Georgia, serif)
**Label/Mono Font:** none; tabular figures come from Playfair's `tnum` feature via `tabular-nums`

**Character:** A high-contrast transitional serif doing every job on the page. At 48px it is a masthead; at 14px in a table cell it reads like a printed listings column; at 12px in a badge it is a printed tally. The single face is what makes the page feel bound rather than built.

### Hierarchy
- **Display** (600, 2.25rem on mobile rising to 3rem from 640px, line-height 1, tracking -0.025em): The wordmark only. "MovieTable" in Ink with the trailing period in Marquee Crimson. Balanced wrapping. On the sign-in page the wordmark shrinks to 1rem at weight 600 with the same tracking, 8px from a 20px film icon in Marquee Crimson, and links home with an underline on hover offset 4px.
- **Page Heading** (600, 1.5rem, line-height 1.33, tracking -0.025em): The heading of a secondary page: "Keep your ratings everywhere.", "You're signed in.", and "Sign-in isn't available here." on the sign-in page. Balanced wrapping, centred, with a Body sentence in Faded Ink 6px beneath. It sits between Display and Headline; the table page does not use it.
- **Headline** (600, 1.25rem, line-height 1.4, tracking -0.025em): The title of a grid view such as "Roadmap Queue" in the demo block, paired with a Body subtitle in Faded Ink. The shipped card uses Title instead.
- **Title** (500, 1rem, line-height 1.375): Card and section titles such as "Your movie list" and "Build your own filter". Sentence case, no tracking.
- **Lede** (400, 1rem, line-height 1.625): The introductory sentence beneath the wordmark, in Faded Ink, capped at 32rem so it wraps to two lines.
- **Body** (400, 0.875rem, line-height 1.43): Table cells, the band average, footnotes, meta lines, chip text, the footer. The dominant size on the page. Explanatory paragraphs use line-height 1.625 instead. On the taste surface: the field's status readout and helper line, the panel's guidance line, and the hand cell's summary at line-height 1.625, clamped to two lines. On the sign-in page: the lede under the page heading and the signed-in line in Faded Ink, the field helper, the alert lines in Alert Red, the sent-state status line in Ink at line-height 1.625, and the footnote in Faded Ink, which drops to 0.75rem on a 20px line below 640px. The account menu's two items are Body.
- **Label** (500, 0.875rem, line-height 1.375): Form labels ("Find a film", "Score bias"), button text, title links in the table, band labels ("90+", "2010s"), and the maker's name in the footer. "Group by" drops to weight 400 because it sits beside its select rather than above it. The taste field label ("Your taste"), the panel heading ("Tune to your taste"), and the title link in a hand cell are Label too. On the sign-in page and in the header: "Continue with Google", "Continue with GitHub", "Send me a sign-in link", "Back to the table", "Sign in", "Sign out", "Use a different email", and the Email field label.
- **Column Header** (400, 0.8125rem, line-height 1.38): Table column headers in Header Ink at 80%, lighter weight than the cells beneath so the data leads.
- **Caption** (500, 0.75rem, line-height 1.33): Badge text ("11 films"), the Display popover's section label ("Rows"), and the film context line at weight 400 ("Users 90 · Critics 96 · 1,773 ratings"). In a hand cell the credit line ("2010 · Christopher Nolan", tabular) is Caption and the genre line drops to weight 400; the swipe hint under the mobile strip and the explanation popover are 12px at weight 400, the popover at line-height 1.625. On the sign-in page the "or" between the provider buttons and the Email field is Caption at weight 400 in Faded Ink. The account pill sets the visitor's name in Caption at weight 500, and the account menu's label block is Caption throughout: the name at weight 500, then the email and the status line at weight 400, all in Faded Ink, the status in Alert Red on failure.
- **Score** (600, 0.875rem, tabular): The Final Score numeral inside its crimson chip. The For you numeral uses the same role; whichever of the two is the chip carries it, and the demoted Final Score falls back to Body with tabular figures.
- **Eyebrow** (500, 0.875rem): The one-line crimson strapline above the wordmark, paired with a 20px film icon.

### Named Rules
**The One Face Rule.** Playfair Display sets everything. Hierarchy comes from size, weight, and ink strength, never from a second family. Do not add a sans for UI chrome or a mono for numbers.

**The Tabular Figures Rule.** Any column of numbers, any percentage, and any date inside a badge uses `tabular-nums`. Numerals in prose keep Playfair's proportional figures.

**The Sentence Case Rule.** Labels, headers, buttons, badges, and chips are sentence case. Nothing is set in uppercase with tracking.

## Layout

A single centered column, 72rem (1152px) wide, with gutters of 16px that widen to 32px from 640px. Page padding-top and bottom step 32px, 48px from 640px, 64px from 1024px. The page is a vertical stack separated by 40px: the title block, the table module, and the footer; inside the module the controls row, the card, and the footnote row sit 24px apart.

The title block is two columns from 640px: wordmark and lede on the left, dataset meta right-aligned on the right. The controls row is two columns from 768px: the search field capped at 28rem on the left, the score-bias slider capped at 24rem on the right; below that they stack with 24px between them. A third field, Your taste, capped at 24rem, joins them: from 768px the three sit in a two-column grid with 32px column gaps and 24px row gaps, Your taste on its own row beneath; from 1024px all three sit across one row.

The table card spans the full column and stacks header, editor band, toolbar band, and grid with nothing beneath: there is no card footer. The header carries the title, result count, and actions with 20px side padding (24px from 640px) and 16px vertical padding. The advanced editor, when open, is a full-width Paper Tint band between header and toolbar. The taste panel, when open, is another: Paper Tint at 40% with a hairline above, between the header and the toolbar band and above the advanced editor when both are open. Its heading row uses the card's 20px side padding (24px from 640px) and 20px top padding; the ruled sheet follows 16px below it with 20px beneath. The toolbar band below it, Paper Tint at 20% with a hairline above and 12px vertical padding, uses the header's 20px and 24px side padding so "Group by" aligns with the card title. The grid is hemmed by hairline rules top and bottom, has a minimum width of 760px, scrolls horizontally inside the card on narrow viewports, and virtual-scrolls vertically inside a 640px cap instead of paginating. Its column header is sticky at the top of that scroll box on Paper, 32px tall in compact density and 40px in comfortable. Rows are dense: 6px vertical and 8px horizontal cell padding, with the first column indented 24px and the last column padded 24px on the right. Numeric columns are right-aligned; the Title column is the only wide one at 340px. Two more columns join it once taste is on the page: Rate, 72px and centred, directly after Title; and For you, 116px and right-aligned, after Final Score, present only while a profile is active and taking the 24px end padding that Final Score gives up.

Inside the grid, films sit in bands. Band rows are 44px on Paper Tint at 45%. Film rows are 41px in compact density, where the 28px score chip plus 6px of cell padding above and below sets the floor; 49px compact with the context line; 48px in comfortable density; 60px comfortable with the context line. The band that owns the top of the scroll box is pinned directly beneath the column header as a copy of its row, and as the next band arrives the pinned copy is pushed upward and clipped at 44px so the two never overlap. Band order is fixed by the group key: Final Score bands run 90+, 80–89, 70–79, 60–69, Under 60, then Unscored; decades run 2020s back to 1910s; popularity tiers run 10,000+ down to Under 300, then No popularity data. For you bands reuse the Final Score edges, 90+ down to Under 60, with Not yet ranked last; while a profile is active the grid groups by For you band and sorts For you descending until the visitor chooses otherwise. A column sort re-orders films inside each band and never moves a band. The demo block this grid was built from ships in an 80rem container with its own title row, metrics, and footer line; none of that layout is on the page.

Below 1024px, where the grid scrolls sideways, the For you column is pinned to the grid's right edge: its header and cells are sticky on opaque Paper with a 20px gutter on the left, a 1px Hairline rule and a soft leftward shadow at the seam, and the band tint and row hover recomputed as opaque mixes so a scrolling title never shows through the visitor's number. From 1024px the column scrolls with the rest and the seam disappears. The starter hand inside the taste panel is four cells across from 1024px and two from 640px; below 640px the same hairline-divided cells run as a horizontal snap strip, each cell 256px wide, with a thin Hairline scrollbar and a Caption swipe hint 8px beneath.

The footer is Body text in Faded Ink: one stacked column below 640px, and from 640px two paragraphs on a shared baseline with 32px between them, the dataset disclosure on the left and "Made by Scott Guthart" on the right.

The title block's right column holds two things from top to bottom, 8px apart: the account control, then the dataset meta. Both align left below 640px and right from 640px. The ghost "Sign in" is pulled out by its own 10px padding on the aligned side so its label, not its hit area, meets the column edge; the signed-in account pill, an outline control, meets the edge with its border. While the session loads a 32px blank holds the space.

The sign-in page is its own sheet on a viewport-tall column. A header in the same 72rem column with the page's 16px gutters (32px from 640px) and 20px vertical padding (24px from 640px) holds the 1rem wordmark on the left and a ghost "Back to the table" on the right, pulled out 10px like the header control. The main region fills the rest of the viewport with 24px side padding (32px from 640px) and 40px vertical padding (48px from 640px) and centres a 24rem column both ways. Inside it blocks sit 24px apart: the heading pair 6px apart, the two provider buttons 10px apart, the "or" rule with 12px to each side, and the email form with 16px between the field and its submit; the field stacks label, input, and helper 8px apart. The footer mirrors the header's gutters with 40px vertical padding (48px from 640px) and centres one Faded Ink sentence capped at 28rem.

Breakpoints follow Tailwind defaults: 640px, 768px, 1024px. Below 640px, filter rows in the advanced editor wrap so the field, operator, and value stack vertically beneath the combinator; the toolbar band stacks with 12px between its rows, the "Group by" select staying on its label's line and the Display and Collapse groups buttons wrapping onto a second line, left-aligned; the grid scrolls horizontally; the footer's two paragraphs stack 12px apart. Below 768px the three preference fields stack; below 640px the starter hand becomes the snap strip. Below 640px the header account control aligns left with the wordmark, the sign-in header tightens to 16px gutters and 20px vertical padding, and the sign-in footnote drops to 0.75rem.

## Elevation & Depth

Surfaces on the page plane are flat. Depth is drawn with 1px Hairline rules, a 1px Ink-at-10% ring around the card, and tone shifts into Paper Tint for the toolbar and editor bands, band rows, and hover states. Nothing sitting on the page casts a shadow: not the card, not rows, not band rows, not the pinned band, not the sticky column header, not badges, not chips, not buttons. The pinned band separates from the films sliding beneath it with opaque Paper under its 45% tint and the hairline along its bottom edge, and the sticky header does the same with its Paper fill and hairline. The demo block's stacked avatars separate with a 2px Paper ring rather than a shadow.

The exception is anything that leaves the page plane. Popovers, selects, and dropdown menus float with a medium shadow and the same Ink-at-10% ring, and menus are translucent: 70% Paper over a 2xl backdrop blur with 150% saturation, so the ledger shows faintly through them. The account menu in the header is one of these: 256px wide, anchored to the account pill's end 8px below it, with the floating-menu shadow, the Ink-at-10% ring, and the frosted surface.

One element that stays on the page plane also carries a shadow, because the ledger slides beneath it: the For you column pinned to the grid's right edge below 1024px. Its seam is a 1px Hairline drawn as a shadow plus a soft leftward shadow, on opaque Paper, and both vanish from 1024px when the column stops being pinned. The band rows, the sticky band, and the column header still carry none. The explanation popover on a For you chip leaves the page plane and takes the floating-menu shadow and Ink-at-10% ring on opaque Paper.

### Shadow Vocabulary
- **Floating menu** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): Popovers, select lists, dropdown menus. Always paired with `ring: 1px oklch(0.145 0 0 / 0.1)`.
- **Submenu** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): Nested dropdown panels only.
- **Pinned row separator** (`box-shadow: 0 2px 0 rgba(0,0,0,0.03)`): Available in the REUI data grid for pinned rows; unused. Band rows set `shadow-none` and the pinned band composites without a shadow.
- **Pinned column edge** (`box-shadow: -1px 0 0 var(--border), -8px 0 10px -8px rgba(0,0,0,0.18)`): The seam of the For you column while it is pinned to the grid's right edge below 1024px. The first layer is the Hairline rule; the second is the only soft shadow on the page plane.

### Named Rules
**The Ruled Page Rule.** On the page plane, structure is a hairline or a tone, never a shadow. If an element needs separation, give it a 1px Hairline rule or a Paper Tint fill at 20%, 40%, 45%, or 50%.

**The Floating Menu Exception.** Only elements that open above the page (popover, select, dropdown) may carry a shadow, and they carry exactly the floating-menu shadow with the Ink-at-10% ring and frosted surface.

**The Pinned Edge Exception.** A column pinned to the grid's edge while the other columns scroll beneath it may carry the pinned-column-edge shadow, and only while it is pinned. Nothing else on the page plane earns a shadow by this rule.

## Shapes

Surfaces and controls are square. The root radius is 0 and every `rounded-*` utility derives from it, so buttons, inputs, cards, badges, chips, popovers, icon tiles, and the score chip all have sharp corners. Borders are 1px hairlines. Edges are hemmed, not rounded. The starter hand follows the same law: one ruled sheet with a 1px Hairline border and 1px Hairline gaps between Paper cells, drawn by letting the sheet's Hairline background show through the gaps, never a grid of bordered cards. The thumbs, the For you chip, the explanation popover, the pinned column, and the loading skeleton blocks are all square.

Round is reserved for things that are continuous or circular by nature, and they use `rounded-full` explicitly: the score-bias slider's 4px track and 12px thumb, the switch and its thumb (the 24px by 14px small size with a 12px thumb in the Display popover), the header's 32px account pill and the 24px avatar inside it, and, in the unrouted demo block only, 20px avatars, 6px label dots and 10px stage dots, the 20px completion ring, and 28px toggle pills. On the shipped pages only the slider, the switch, and the signed-in account pill with its avatar are round; every element of the sign-in page is square. A pill reads as a state or a mark; a square reads as a surface or a control. The account pill is the one round control, and it is round because of the avatar it wraps; no control without one takes the shape.

### Named Rules
**The Square Surface Rule.** Radius is 0 for every surface and control. Do not add `rounded-*` overrides to individual components; if the ledger ever softens, it softens by changing the root radius once.

**The Round Mark Exception.** `rounded-full` is allowed on the slider, the switch, avatars, dots, rings, toggle pills, and the one control that wraps an avatar: the header's account pill. Nothing else.

## Components

Controls are tactile and confident: 32px tall, square, hairline-bordered, serif-labelled, with a 1px downward nudge on press. Hover is one tone step; focus is a 3px Pencil Gray ring at 50%.

### Buttons
- **Shape:** Square (0px), 32px tall, 10px side padding, 6px gap to a 16px icon. Small variant is 28px tall with 14px icons; extra-small is 24px.
- **Primary:** Marquee Crimson fill, Blush White text, weight 500. Hover fades the fill to 80%. At most one per surface. The one shipped instance is "Back to the table" on the sign-in page's signed-in state, beside an outline "Sign out"; the table page has none, and the unrouted demo block's "New task" is the only other in the codebase.
- **Outline:** Paper fill, Hairline border, Ink text. Hover and expanded states fill Paper Tint. This is the workhorse: "Advanced filter", "Advanced editor", "Reset view", "Display", and the one "Collapse groups" / "Expand groups" button. On the taste surface: "Rate films", which becomes "Edit ratings" once anything is rated, with a trailing 16px chevron that turns 180 degrees over 150ms while the panel is open; "Deal another hand" with a leading shuffle icon, disabled until the catalogue is loaded and there are more than twelve films to deal; and "Try again" when the catalogue fails to load. On the sign-in page: the two provider buttons, full width of the 24rem column with their contents centred and a 16px provider mark leading the label; "Send me a sign-in link", full width, with a trailing 16px arrow; "Sign out" beside the primary; and the not-configured state's "Back to the table". While a provider or the link is pending, a 16px spinning loader replaces the mark or leads the label and every provider button is disabled at 50%. In the table page's header, the account pill is the outline variant bent into a pill: 32px, `rounded-full`, 4px left and 10px right padding, a 24px avatar, the name in Caption weight 500, and a 14px selector glyph at 60%; it fills Paper Tint while its menu is open.
- **Secondary:** Secondary Paper fill, Header Ink text. Used for the active state of the demo block's toggle pills.
- **Ghost:** Transparent, Ink text; hover fills Paper Tint. Used for "Clear filters" and the band chevron, which is the 24px icon-xs size with a 12px chevron in Faded Ink that turns Ink on hover. Disabled drops to 50% opacity. The Rate thumbs are ghost icon buttons; "Clear ratings" is a ghost beside the outline toggle; "Haven't seen" in a hand cell is the 28px small size with a 14px eye-off icon in Faded Ink that turns Ink on hover. In the headers: "Sign in" for guests, "Back to the table" on the sign-in page with a leading 16px arrow, and "Use a different email" after a link is sent.
- **Link:** Marquee Crimson text, underline on hover with a 4px offset.
- **Edge alignment:** A ghost that sits at a column edge is pulled out by its own 10px side padding, a negative margin on the aligned side, so its label and not its hit area meets the edge: "Sign in" in the title block's right column and "Back to the table" in the sign-in header. An outline control at the same edge, such as the account pill, meets it with its border instead.
- **Press / Focus:** Active state translates 1px down (except menu triggers). Focus-visible draws a 3px Pencil Gray ring at 50% and swaps the border to Pencil Gray.

### Badges
- **Shape:** Square, 20px tall, 5px side padding, Caption type, 12px icons with a 4px gap. Larger sizes step to 22px and 24px.
- **Outline:** Paper fill, Hairline border, Ink text. The film count on a band row ("11 films", "170 films", tabular). In the demo block: stage counts, label badges (with a 6px signal dot), and due dates (with a 14px calendar icon at weight 400).
- **Secondary:** Secondary Paper fill, Header Ink text. Neutral counts and the Queued signal.
- **Signal tints:** `success-light`, `warning-light`, `info-light`, `destructive-light`: the signal hue at 10% behind its ink shade, with a 15% border of the same hue. On track and Done are green, At risk is yellow, Blocked is red. Metrics switch from Secondary to a tint when their count is above zero.
- **Rule:** A badge is a tally or a state, never a button. On the shipped page the only badge is the outline count. Signal tints live in the demo block; solid signal fills (`success`, `warning`, `info`, `destructive` with white text) exist in the component but are not used anywhere.

### Chips
- **Style:** Filter rules render as a button group of 28px-tall square segments: attribute label in Faded Ink on Paper, then operator and value segments in Ink, each hairline-separated, with a 16px overflow menu at the end.
- **State:** Hovering a segment fills it Marquee Crimson with Blush White text (the accent token is the primary). An incomplete rule shows its value segment in Ink rather than Faded Ink. In the inline editor, chips reorder by a drag handle.

### Toggle Pills
- **Style:** 28px-tall `rounded-full` buttons for showing and hiding columns in the demo block's Display popover. Inactive is Outline; active is Secondary with an Ink-at-10% border and a leading 16px check icon. They wrap in a 6px gap. The shipped Display popover has no pills; the token stays only because the unrouted block still defines it.

### Switch
- **Style:** 32px by 18.4px pill, Hairline track, 16px Paper thumb; the small size is 24px by 14px with a 12px thumb. Checked fills the track Marquee Crimson and slides the thumb right. Hit area extends 12px sideways and 8px vertically. On the shipped page the small size sits in the Display popover's "Scores under the title" row: label left at weight 400, switch right, 36px row.

### Cards / Containers
- **Corner Style:** Square (0px).
- **Background:** Paper, with the advanced editor band in Paper Tint at 40% and the toolbar band at 20%. The 50% footer tone belongs to the pagination footer, which the grouped grid does not render.
- **Shadow Strategy:** None. A 1px ring of Ink at 10% is the whole edge.
- **Border:** Hairline rules separate header, editor band, toolbar band, and grid.
- **Internal Padding:** 16px vertical, 20px horizontal, 24px horizontal from 640px. The table region has zero side padding so rows run to the card edge.

### Toolbar Band
- **Style:** A full-width band in Paper Tint at 20% beneath the card header, with a hairline above it and the grid's top rule beneath, 12px vertical padding, and the card's 20px side padding (24px from 640px) so its contents align with the header's. It carries view controls, not a title.
- **Left:** "Group by" as a weight-400 label 12px before a 28px select, 176px wide, offering Final Score band, Decade, and Popularity tier.
- **Right:** The Display popover trigger and the "Collapse groups" / "Expand groups" outline button, both 32px, 8px apart.
- **Mobile:** Below 640px the two sides stack 12px apart; the select stays on its label's line and the buttons wrap onto a second line, left-aligned.

### Inputs / Fields
- **Style:** 32px tall, square, 1px Hairline border, transparent fill, 10px side padding, body size text (16px on touch viewports, 14px from 768px to avoid zoom). Placeholder in Faded Ink. The search field is an input group with a 16px magnifier at the start and a 24px or 28px ghost clear button at the end when there is text.
- **Focus:** Border to Pencil Gray plus a 3px ring at 50%.
- **Error / Disabled:** Invalid swaps the border to Alert Red with a 3px ring at 20%. Disabled sits at 50% opacity on a Hairline-at-50% fill.
- **Labels:** 14px, weight 500, Ink, 8px above the control. The slider label pairs with a live value readout in Faded Ink on the same line. Inside a popover or the toolbar band, labels drop to weight 400 and sit left of their control: a 36px row in the popover, 12px before the select in the band. The Your taste label shares its line with a Body status readout in Faded Ink ("Not set", "3 films rated") the way the slider label shares its line with the weighting readout; a Body helper line in Faded Ink follows the control.
- **Email field (sign-in):** The one field on the sign-in page: a Label "Email" 8px above a full-width input with the placeholder you@example.com, and 8px below it a Body helper in Faded Ink, "We email you a link. No password to remember." On a failed send the helper is replaced by an Alert Red `role="alert"` line, the label turns Alert Red with it, and the input takes the invalid border and 20% ring; while sending, the input is disabled.

### Selects and Popovers
- **Trigger:** Same anatomy as an outline button with a 16px up-down chevron in Faded Ink. The 28px small variant is the norm inside chrome: the "Group by" select in the toolbar band (176px), the "Density" select in the Display popover (132px), and the selects inside filter rows.
- **Surface:** Square, 10px padding, floating-menu shadow, Ink-at-10% ring, 70% Paper with backdrop blur. Items are 14px with 6px by 4px padding; highlighted items fill Ink at 10%. Opens with a 100ms fade and 95% zoom from the anchored side.
- **Display popover:** 300px wide with zero padding, anchored to the trigger's end. One Field Group with 14px side and 12px vertical padding: a Caption section label "Rows" in Faded Ink, then two 36px horizontal field rows with weight-400 labels: "Density" with a 28px select (Compact / Comfortable) and "Scores under the title" with a small switch. No column toggles.
- **Explanation popover:** Anchored to the left of a For you chip, 4px away, at most 256px wide with 12px side and 8px vertical padding, on opaque Paper with the floating-menu shadow and Ink-at-10% ring. One 12px line at weight 400 and line-height 1.625: "Because you liked: Christopher Nolan · Thriller · Jonathan Nolan", or "No shared attributes yet. Ranked by Final Score." Opens on hover after 150ms, on tap, and on Enter; the chip is its trigger.
- **Dropdown checklists (demo block):** A Caption label, then checkbox items that stay open on click, then a separator and a reset item once anything is checked. The trigger shows a Secondary count badge when filters are active.
- **Account menu:** Opens from the account pill, anchored to its end 8px below, 256px wide with 4px padding, on 70% Paper over the blur with the floating-menu shadow and Ink-at-10% ring. A label block with 6px by 4px padding stacks three Caption lines 2px apart in Faded Ink: the name at weight 500, the email, and a `role="status"` line that reads "Syncing your ratings…", "Ratings saved to your account.", "Saved ratings deleted.", or the error in Alert Red. Rules in Ink at 5% frame a 14px "Delete saved ratings" item with a 16px trash icon, disabled at 50% while nothing is rated; a first click rewrites it as "Delete 3 saved ratings? Click again" and keeps the menu open, and a second deletes and reports in the status line. Last comes "Sign out" with a 16px logout icon as the menu's destructive item. Items fill Ink at 10% when highlighted. The dropdown primitive forces destructive items to the accent-foreground token, which this theme sets to Blush White, so Sign out currently renders near-invisible on the frosted surface; that is a defect of the primitive to fix, not a colour of the system.

### Data Table (signature)
- **Header:** Sticky at the top of the grid's scroll box on Paper, 32px tall in compact density and 40px in comfortable, with a hairline beneath. Inside it, 24px-tall sort buttons in Column Header type, Header Ink at 80%, weight 400. Hover fills Secondary Paper. The active sort shows a 16px Marquee Crimson arrow; inactive columns show a 14px up-down glyph at 60%.
- **Rows:** Hairline rule beneath every row; hover fills Paper Tint at 40%. No zebra striping. Film rows keep the default cursor; only band rows show a pointer.
- **Cells:** Body type, 6px by 8px padding, tabular numerals, numeric columns right-aligned. Year in Faded Ink. Title is a weight-500 Ink link with a 16px outbound arrow at 40% opacity that reaches 100% on hover, and an underline on hover. A Rate column follows Title: 72px, centred, header not sortable, holding the two ghost thumbs with zero vertical cell padding so the 28px pair fits a compact row.
- **Context line:** With "Scores under the title" on, a Caption line at weight 400 in Faded Ink, tabular, sits under the title: "Users 90 · Critics 96 · 1,773 ratings", with "Popularity —" when the count is missing. It lifts a compact row from 41px to 49px and a comfortable row from 48px to 60px.
- **Score chip:** The Final Score cell is a 40px-minimum square chip: Marquee Crimson at 10% behind Marquee Crimson text, weight 600, 4px by 8px padding. It is the only colored cell in the table. While a taste profile is active it demotes to a plain Ink numeral in Body with tabular figures and the For you chip takes the crimson.
- **Empty:** A single Faded Ink line, "No movies match. Try a different search or reset your view."

### Grouped Data Grid (signature)
The ledger's table, banded by the visitor's own number. Bands keep a fixed order; the column sort works inside them.
- **Group keys:** Final Score band (90+, 80–89, 70–79, 60–69, Under 60, with Unscored last), Decade (2020s back to 1910s, newest first), Popularity tier (10,000+ ratings down to Under 300 ratings, with No popularity data last). Empty bands are omitted. Changing the key expands every band.
- **Band row:** 44px tall on Paper Tint at 45%, no hover change, no shadow, pointer cursor across the whole row, and a click anywhere on it toggles the band. Left to right: in the Year column, a 24px ghost chevron in Faded Ink that turns Ink on hover and rotates 90 degrees over 150ms when open; in the Title column, the band label in Label type followed 8px later by an outline count badge ("11 films"); in the Final Score column, the band's average Final Score right-aligned in Faded Ink, tabular, as "avg 91" with "Average Final Score" for screen readers. The middle columns are empty. A band with no scored films shows an em dash for its average.
- **Film row:** The Data Table row unchanged: 41px in compact density, 49px with the context line, 48px comfortable, 60px comfortable with the context line. No indent past the band, no icon tile, no avatars, no rings, no action menu.
- **Sticky Band:** Whichever band owns the top of the scroll box is pinned directly beneath the sticky column header as a copy of its row: 44px, Paper Tint at 45% over opaque Paper, hairline beneath, no shadow, the same chevron, label, count, and average. It is rendered inside the scroll content as a zero-height sticky anchor, so it scrolls sideways with the columns and clicks land on it while the wheel still reaches the grid. As the next band scrolls up to meet it, the pinned copy is pushed upward by the overlap and clipped at 44px, so the arriving band takes over without the two ever stacking. Clicking the pinned band toggles its band and scrolls the real band row to the top. The copy is hidden from assistive technology and its chevron is out of the tab order; the real row keeps the accessible name and the control.
- **Density and context:** The Display popover sets Compact or Comfortable density and toggles the context line with a switch. One outline button reads "Collapse groups" when every band is open and "Expand groups" otherwise. A band the visitor collapsed stays collapsed through filter and slider changes; a band that appears for the first time opens.
- **Scrolling:** Virtual rows inside the 640px cap, no pagination, no footer line, no row count beneath the grid; the card header's "390 of 3,963 movies" is the only count.
- **Color:** Marquee Crimson appears only on the Final Score chip and the active sort arrow. Bands carry no stage dot, signal tint, or color of any kind. With a profile active the chip is For you's, and a Liked thumb is the one other crimson mark on a row.
- **With a profile:** Bands carry a second average, "avg 94" under For you in Faded Ink, tabular, with "Average For you" for screen readers, beside the Final Score average under its own header; a band with nothing ranked shows an em dash. The Group by select gains a For you band option, the grid defaults to it and to a For you descending sort, and For you bands reuse the Final Score edges with Not yet ranked last.
- **Empty:** "No movies match. Try a different search or reset your view."

### Taste Controls (signature)
The visitor's likes enter the ledger as a field, a ruled sheet, and two columns. No stars, no numeric scale, no primary button: the action is a thumb.
- **Rate control:** A `role="group"` labelled "Rate {title}" holding two ghost icon buttons 2px apart, thumb up then thumb down, each with `aria-pressed`. In a film row they are the 28px icon-sm size; on the starter hand the 32px icon size. Unset, both are outline glyphs in Faded Ink at full strength that turn Ink on hover over a Paper Tint fill. Liked sets the filled glyph in Marquee Crimson and stays crimson on hover; Not for me sets the filled glyph in Ink. Pressing a set thumb clears it. Nothing else changes colour: no fill, no border, no badge.
- **For you chip:** The same anatomy as the Final Score chip, 40px minimum, Marquee Crimson at 10% behind a crimson Score numeral, 4px by 8px padding, and it is a button: its accessible name is "For you 95. Show why", its focus ring is 2px Pencil Gray at 50%, and it opens the explanation popover on hover after 150ms, on tap, and on Enter. Cells fade in over 300ms when the column arrives, honouring reduced motion. A film that cannot be ranked shows an em dash in Faded Ink with the reason as its title and accessible name.
- **Taste field:** Capped at 24rem beside the slider. Label row: "Your taste" in Label with a Body status readout in Faded Ink at the far end ("Not set", then "3 films rated"). Control row, 8px apart: the outline toggle ("Rate films", then "Edit ratings") with its turning chevron, and a ghost "Clear ratings" once anything is rated. Below, one Body helper line in Faded Ink that says what happens next: "Like or pass on films you've seen.", "Like a film to build your ranking.", "Loading film details…", then "Built from 3 films · Action · Adventure · Christopher Nolan" once a profile is active; "Ratings won't save in this browser." when storage is unavailable, and "Film details didn't load. Open the panel to retry." on failure.
- **Taste panel:** A Paper Tint band at 40% with a hairline above, inside the card between the header and the toolbar band. Heading row: "Tune to your taste" in Label with a Body guidance line in Faded Ink 4px beneath it ("Like or pass on films you've seen. Your list re-ranks as you go.", "Passes alone can't build a ranking. Like at least one film.", "Rate a few more for a sharper match.", "Keep going here, or rate straight from the table."), and the outline "Deal another hand" at the far end. On failure the body is a `role="alert"` line beside an outline "Try again"; when every dealable film is judged it is one Faded Ink line.
- **Ruled hand sheet:** Twelve films as one sheet: a list labelled "Films to rate" with a 1px Hairline border and a Hairline background that shows through 1px gaps, so the Paper cells read as ruled, not carded. Four columns from 1024px, two from 640px; below 640px a horizontal snap strip of 256px cells with a thin Hairline scrollbar and the hint "Swipe sideways for all 12 films." in Caption weight 400, 8px beneath. Each cell has 16px padding and a 12px vertical gap: the title as a Label link with the table's 16px outbound arrow at 40% opacity; a Caption credit line, tabular ("2010 · Christopher Nolan"); the genres at Caption weight 400; a Body summary at line-height 1.625 clamped to two lines, all in Faded Ink; then a bottom row with the 32px Rate control on the left and the 28px ghost "Haven't seen" on the right. Cells fade in over 300ms. While the catalogue loads the sheet shows twelve skeleton cells of square Paper Tint blocks pulsing.
- **Pinned For you column:** Below 1024px the For you header and cells are sticky at the grid's right edge, above the other cells, on opaque Paper with a 20px left gutter and the grid's 24px end padding; the seam is the pinned-column-edge shadow (a Hairline rule plus a soft leftward shadow). Band rows and row hover under the pinned cell use opaque mixes of Paper Tint into Paper at 45% and 40% so the tints match the rest of the row without letting titles show through. From 1024px the column is ordinary.

### Sign-in and Account (signature)
Sign-in is a side door, not a gate. The page refuses the welcome-screen pattern: no logo wall, no pitch, no terms paragraph, and no primary button until the visitor is signed in.
- **Page:** A viewport-tall column on Paper: header, a main region that centres a 24rem column both ways, footer. The header holds the wordmark at 1rem, weight 600, with the 20px film icon in Marquee Crimson 8px before it and the crimson period, linking home, and a ghost "Back to the table" with a leading arrow, pulled out 10px to meet the column edge.
- **Heading pair:** A Page Heading, balanced and centred, with a Body sentence in Faded Ink 6px beneath: "Keep your ratings everywhere." over "Sign in to save your likes and passes to an account and pick them up on any device."
- **Providers:** Two full-width outline buttons 10px apart, "Continue with Google" then "Continue with GitHub", each with its 16px brand mark leading the label and its contents centred. The pressed one swaps its mark for a spinning loader and both disable. A failure prints a centred Alert Red alert line beneath them.
- **Or rule:** Two Hairline rules flanking "or" in Caption at weight 400, Faded Ink, 12px to each side.
- **Email:** The Email field, then 16px below it a full-width outline "Send me a sign-in link" with a trailing arrow.
- **Sent:** The form gives way to a centred Body status line in Ink at line-height 1.625 with the address at weight 500, "Check you@example.com for a sign-in link. It works once and opens the table signed in.", and 12px beneath it a ghost "Use a different email".
- **Signed in:** The same column, centred: Page Heading "You're signed in.", a Body line in Faded Ink with the address in Ink at weight 500, then a wrapping row 8px apart of the one primary "Back to the table" and an outline "Sign out". A failed sign-out adds an Alert Red alert line.
- **Not configured:** When no account service is set, the heading reads "Sign-in isn't available here." over one Faded Ink sentence and an outline "Back to the table", 16px apart; the header account control renders nothing at all.
- **Footnote:** One centred Faded Ink sentence capped at 28rem: "Signing in keeps your ratings together with the name, email address, and picture your provider shares. The table stays open to everyone." Body from 640px, 0.75rem on a 20px line below.
- **Header account control:** Above the dataset meta in the title block's right column, 8px apart. Guests see a ghost "Sign in" linking to the page. A signed-in visitor sees the account pill: the outline button at 32px with `rounded-full`, 4px left and 10px right padding, named "Account, {name}" for assistive technology, holding a 24px round avatar (the provider's picture, or up to two initials at 0.625rem in Faded Ink on Paper Tint) with a 1px Paper border inside a Hairline ring, then the name or email in Caption weight 500 truncated at 10rem, then a 14px selector glyph at 60%. It fills Paper Tint while its menu is open and is the only round control on any surface. While the session loads a 32px blank holds the row.
- **Account menu:** Name, email, and status in a Caption label block; "Delete saved ratings" with a second-click confirmation; "Sign out", which clears this browser's ratings and keeps the account's. Measurements under Selects and Popovers.
- **Provider marks:** Google's four-colour G and GitHub's near-black mark are inline SVGs at 16px with their own hex fills, hidden from assistive technology, and appear nowhere else.

### Slider (signature)
- **Track:** 4px pill in Paper Tint; the filled range is Marquee Crimson.
- **Thumb:** 12px circle, Paper fill, 1px Pencil Gray border, with an invisible 8px hit halo. Hover, focus, and drag draw a 3px Pencil Gray ring at 50%.
- **Labelling:** "Users" and "Critics" in Faded Ink at either end; the readout above says "Equal weight" at the midpoint or "70% critics" elsewhere.

### Pagination
- **Status:** Not on the shipped page. The grouped grid virtual-scrolls inside its 640px cap, and no route renders the REUI pagination component.
- **Style (library):** 28px square outline buttons for previous, next, and page numbers, 14px text. The current page fills Marquee Crimson with Blush White text. Range text ("1–25 of 390") and "Rows per page" sit in Faded Ink beside a 28px select.

### Toasts
- The unrouted demo block imports `toast` from `sonner`, which the install added as a dependency. No `Toaster` is mounted in the app layout and the shipped grid raises no toasts, so nothing renders. When toasts are needed, mount one provider and decide between `sonner` and the shadcn Base UI `toast` component; do not run both.

### Footer
- **Style:** Body text in Faded Ink, line-height 1.625, two paragraphs: the dataset disclosure ("A curated dataset, not live ratings. Select any film to see its current scores on Metacritic.") and the maker credit ("Made by Scott Guthart"). Stacked 12px apart below 640px; from 640px on one baseline with 32px between them, disclosure left, credit right.
- **Credit link:** "Scott Guthart" is a weight-500 Ink link to https://guth.art with the same treatment as a film title: a 16px outbound arrow in Faded Ink at 40% opacity that reaches 100% on hover, an underline on hover with a 4px offset, a 2px focus outline offset 4px, and "(resume, opens in a new tab)" for screen readers. It opens in a new tab with `rel="author"`.

## Do's and Don'ts

### Do:
- **Do** set every text role in Playfair Display and build hierarchy from size, weight, and Ink strength.
- **Do** use `tabular-nums` on any column of figures, any percentage, and any date inside a badge, and right-align numeric columns.
- **Do** keep Marquee Crimson to the visitor's number, position, and the one primary action: the score chip, slider fill, checked switch, current page, active sort arrow, eyebrow, the wordmark's period, and the primary button.
- **Do** keep signal hues inside badges, dots, and rings at a 10% tint behind their ink shade, using the `success`, `warning`, `info`, and `destructive` tokens.
- **Do** separate regions with 1px Hairline rules or a Paper Tint band; the card's outer edge is a 1px ring of Ink at 10%.
- **Do** keep controls 32px tall (28px for selects in the toolbar band, filter rows, and popovers), square, and pressable with the 1px nudge.
- **Do** render missing values as an em dash in Faded Ink.
- **Do** let a table keep its minimum width and scroll horizontally inside its container on narrow viewports.
- **Do** use sentence case on every label, header, button, badge, and chip.
- **Do** band the grid on Paper Tint at 45%, 44px tall, with a ghost chevron in Faded Ink, the band label, an outline count badge, and the average Final Score right-aligned in Faded Ink; make the whole row the toggle with a pointer cursor.
- **Do** pin the band that owns the top of the scroll box beneath the sticky column header on opaque Paper, hidden from assistive technology, and let the next band push it up and clip it at 44px.
- **Do** keep bands in their fixed order under any column sort, and virtual-scroll inside the 640px cap instead of paginating.
- **Do** give every film row a Rate control: two 28px ghost thumbs 2px apart, Faded Ink at rest, Liked filled in Marquee Crimson, Not for me filled in Ink, each with `aria-pressed`.
- **Do** move the crimson chip from Final Score to For you the moment a profile is active and demote Final Score to a plain Ink numeral; one crimson number per row.
- **Do** lay the starter hand out as one ruled sheet: a Hairline border and 1px Hairline gaps between Paper cells, four across from 1024px, two from 640px, and a horizontal snap strip of 256px cells with a swipe hint below 640px.
- **Do** pin the For you column to the grid's right edge below 1024px on opaque Paper with a 20px gutter, a Hairline rule, and the pinned-column-edge shadow; unpin it from 1024px.
- **Do** explain a For you number in a popover that opens on hover, tap, and Enter and names the matched attributes in plain words.
- **Do** keep sign-in a side door: a 24rem column of one Page Heading, one sentence, two outline provider buttons with 16px marks, an "or" rule, one Email field, and one Faded Ink footnote, with no primary button until the visitor is signed in.
- **Do** pull a ghost button at a column edge out by its 10px padding so its label, not its hit area, meets the edge; an outline control at the same edge meets it with its border.
- **Do** report an auth failure as an Alert Red text line with `role="alert"` beneath the control that failed, never as a filled banner.
- **Do** confirm a destructive menu action with a second click on the same item, its label restated with the count, and keep the menu open; no dialog.

### Don't:
- **Don't** add a second typeface, including a sans for controls or a mono for numbers.
- **Don't** round a surface or a control. The root radius is 0; `rounded-full` belongs only to the slider, the switch, avatars, dots, rings, toggle pills, and the account pill that wraps an avatar.
- **Don't** put a shadow on the card, a row, a band row, the pinned band, the sticky header, a badge, a chip, or a button; shadows belong to floating menus only, with the pinned For you column's seam below 1024px as the one exception on the page plane.
- **Don't** tint a neutral warm or cool. Every gray has zero chroma.
- **Don't** use Marquee Crimson or a signal hue as a background wash, a border, or paragraph text.
- **Don't** write raw palette classes such as `sky-500`, `amber-500`, or `rose-500`; map them to the signal and chart tokens.
- **Don't** zebra-stripe the table; hover tone and hairlines carry the rows.
- **Don't** put a stage dot, a signal tint, an icon tile, an avatar, a ring, a toast, or a primary button on the grouped grid; a band carries a label, a count, and an average, and Marquee Crimson stays on the score chip and the sort arrow.
- **Don't** let the pinned band take focus or an accessible name; the real band row keeps the control.
- **Don't** set labels in uppercase or add letter-spacing to them.
- **Don't** design against the `.dark` tokens; the system is light-only until a toggle exists.
- **Don't** rate with stars, a number scale, or free text; the ledger's verdict is a thumb pair, and no taste control is a primary button.
- **Don't** show two crimson chips on one row, or set a Not for me thumb in crimson.
- **Don't** render the starter hand as bordered cards with their own edges, shadows, or radii, or move it into a modal; it is one ruled sheet inside the table card.
- **Don't** put the pinned-column-edge shadow on anything but a column pinned while the grid scrolls sideways.
- **Don't** put a provider's brand colours anywhere but its own 16px mark inside an outline button; never enlarge, recolour, or fill with them.
- **Don't** put a primary button on the sign-in page before the visitor is signed in; the side door earns one crimson action only once the visitor is through it.
- **Don't** wrap anything but an avatar in a pill-shaped control; the account pill is round because of what it holds, and no other trigger inherits the shape.
