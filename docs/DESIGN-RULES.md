# ProofPulse design rules

Version: `2.2`
Status: `normative`  
Applies to: every public route, application route, component, visualization,
loading state, fixture, screenshot, and demo artifact.

This file is the visual source of truth. A pull request that violates a **must**
rule cannot merge unless this document is changed deliberately in the same pull
request.

## 1. Originality boundary

ProofPulse must not look like
[`arc-payment`](https://github.com/mrchaosdev/arc-payment).

The reference project may teach process-level skills only:

- document visual decisions;
- give every asynchronous region a complete set of states;
- make keyboard and reduced-motion behavior intentional;
- derive visuals from real values; and
- keep reusable primitives separate from product behavior.

### Current direction

Version 2.2 restores light as the default but keeps the stronger hierarchy,
layered surfaces and research-instrument layout developed in version 2.0. The
palette is the product owner's warm Happy Hues selection; dark remains an
optional companion.

The originality boundary did **not** relax. `arc-payment` remains a transaction
terminal with flat dark ground, square surfaces, a warm orange accent and
terminal motifs. ProofPulse is a warm editorial research workspace with rounded
surfaces, a rose action colour, a circular signal lens and a top command bar.

ProofPulse must not reuse the reference project's visual identity:

- no terminal aesthetic;
- no square or cut-corner panels;
- no hairline-rule-dominated composition;
- no orange action colour or single-accent terminal palette;
- no monospace outside raw identifiers, and no uppercase navigation;
- no scanlines, dot matrix, technical grid, pulse sphere, or fluid cursor;
- no persistent dashboard sidebar;
- no component taken from the ChaoUi library, in source or in appearance; and
- no copied component proportions, route composition, copy, logo, or animation.

The `arc-payment` codebase is never imported. React Bits may supply a vetted
interaction primitive when it is adapted into this repository under these
conditions:

- copy only the smallest component needed; do not install a theme or component
  suite;
- replace its visual identity with ProofPulse tokens and semantic class names;
- remove perpetual or nonessential animation;
- retain keyboard, reduced-motion and no-JavaScript fallbacks;
- record the source and license in `THIRD_PARTY_NOTICES.md`; and
- keep Tailwind, dynamic class construction and vendor business logic out of
  the product.

The current approved primitive is a locally adapted React Bits Spotlight Card.
It reports pointer coordinates only; its colour, radius, surface and motion are
owned by the ProofPulse stylesheets.

### Required visual difference

| Dimension | Reference characteristic | ProofPulse rule |
| --- | --- | --- |
| Mental model | transaction terminal | editorial research instrument |
| Ground | flat, near-black, unlit | warm cream with rose and green light fields |
| Main navigation | dashboard/sidebar | compact top command bar |
| Surfaces | square and flat | white, softly rounded and layered |
| Depth | hairline rules | tonal layers, spacing and soft shadow |
| Typography | mono on every address, hash and amount | sentence-case sans everywhere; mono only for raw identifiers |
| Action colour | orange | rose with dark plum text |
| Data accent | LED/terminal signals | rose, green and explicit status series |
| Background motif | dot matrix and pulse sphere | radial colour field only; no dots, grid or sphere |
| Cursor | landing-only fluid cursor | the system cursor, untouched |
| Signature form | cut plate | circular signal lens and curved flow ribbon |

If a screenshot can plausibly be mistaken for `arc-payment` with different text,
the design fails this rule.

## 2. Design concept: Signal Lens

ProofPulse is an editorial research canvas centered on a **signal lens**. The
lens is a circular visualization containing three arcs:

- Direction;
- Confidence; and
- Coordination Risk.

It is not a speedometer and must not resemble a trading terminal gauge. Each arc
has a label, numeric value, and text category. The lens is the single signature
shape; ordinary content uses rounded rectangles and open editorial sections.

The interface should feel calm enough to investigate contradictory evidence. It
must not simulate urgency, market excitement, or a game.

## 3. Color system

The light theme uses the supplied Happy Hues palette exactly for its named
brand and illustration roles. Dark is retained as a semantic companion, not as
the default.

### Light theme — default

| Semantic role | Value | Rule |
| --- | --- | --- |
| Canvas | `#FAEEE7` | page background |
| Headline / stroke | `#33272A` | headings, high-emphasis text and illustration strokes |
| Paragraph | `#594A4E` | body and supporting copy |
| Surface / illustration main | `#FFFFFE` | primary cards and main illustration fill |
| Button / highlight | `#FF8BA7` | primary actions and illustration highlight |
| Button text | `#33272A` | text and icons on primary actions |
| Illustration secondary | `#FFC6C7` | tracks, selected groups and secondary fills |
| Illustration tertiary | `#C3F0CA` | supporting information and tertiary fills |

Derived semantic colours may darken rose or green when text contrast requires
it. They do not replace the exact palette in the named roles above.

Verified contrast on the default theme: headline on canvas `12.60:1`, paragraph
on canvas `7.34:1`, and button text on button `6.49:1`.

### Dark theme — optional companion

| Semantic role | Value | Rule |
| --- | --- | --- |
| Canvas | `#0F0E17` | page ground |
| Canvas tint | `#17161F` | quiet hero/lens field |
| Surface | `#17161F` | primary content cards |
| Surface strong | `#201E2B` | selected rows and grouped controls |
| Surface soft | `#12111C` | low-emphasis content regions |
| Surface lift | `#222035` | tonal highlight inside a surface |
| Ink | `#FFFFFE` | primary text |
| Ink soft | `#B8B7CB` | body and supporting text |
| Ink muted | `#9291A8` | metadata; must retain AA contrast |
| Primary | `#8A3FE8` | primary action fill only |
| Primary hover | `#994FF3` | hovered primary action |
| Primary text | `#B07CF6` | violet used as text or as a link |
| Primary soft | `#241A3D` | selected backgrounds, never body text |
| On primary | `#FFFFFE` | text/icons on the primary fill |
| Cyan | `#4FC4CF` | secondary analytical series and information |
| Cyan soft | `#12313A` | informational background |
| Positive | `#3DDC97` | positive observed values only |
| Positive soft | `#10301F` | positive background |
| Negative | `#FF5C7C` | negative observed values and errors |
| Negative soft | `#3A1420` | negative background |
| Warning | `#FBDD74` | stale, partial, caution |
| Warning soft | `#332B14` | warning background |
| Outline | `#2A2838` | card/control boundary |
| Outline strong | `#45405C` | emphasized control boundary |
| Focus | `#4FC4CF` | keyboard focus ring |

### Color laws

1. Primary rose means action, selection or illustration highlight only.
2. Positive and negative colors are reserved for signed observed values and
   success/error states. They must never decorate the brand.
3. Warning means incomplete, stale, or caution; it does not mean bearish.
4. Every sign and status includes text or shape in addition to color.
5. Charts use no more than five simultaneous hues.
6. Adjacent series must meet non-text contrast requirements or use distinct line
   styles/markers.
7. Raw color literals may appear only in the token stylesheet and test fixtures.
7b. Orange remains prohibited as the action colour so the product cannot drift
    toward the reference project's terminal identity.
8. All text combinations must meet WCAG 2.2 AA.

CSS custom properties may use the required CSS `--` prefix. The class-name ban
on double hyphens does not apply to custom property syntax.

## 4. Typography

- Primary family: `Manrope` for navigation, headings, labels, controls, and body.
- Identifier family: `IBM Plex Mono` only for token addresses, wallet addresses,
  evidence IDs, hashes, timestamps, and unrounded numeric inspection values.
- Navigation, buttons, headings, and card labels use sentence case.
- All-uppercase text is prohibited except unavoidable protocol/token symbols.
- Body size is at least `15px` with line height `1.55`.
- Metadata is at least `12px`; essential information never uses microtext.
- Tabular numerals are required in aligned numeric columns.
- Address truncation requires an adjacent copy action and full accessible name.
- Maximum prose width is `68ch`.

Type scale:

| Role | Desktop | Mobile |
| --- | ---: | ---: |
| Display | `56/60` | `38/42` |
| Page heading | `36/42` | `30/36` |
| Section heading | `24/31` | `22/29` |
| Card heading | `17/24` | `17/24` |
| Body | `15/24` | `15/24` |
| Metadata | `12/18` | `12/18` |

## 5. Shape, elevation, and spacing

- Primary card radius: `18px`.
- Compact control radius: `10px`.
- Pills are allowed only for filters, status, and compact tags.
- The signal lens is circular; no other large decorative circles compete with it.
- Primary cards use a restrained shadow equivalent to
  `0 12px 32px rgba(28, 35, 64, 0.08)` in light mode.
- Nested cards are prohibited. Use grouped rows or a tinted subsection.
- Borders support controls and card separation but must not form a page-wide
  terminal grid.
- Base spacing unit: `4px`.
- Common spacing: `8`, `12`, `16`, `20`, `24`, `32`, `48`, `72`.
- Dense evidence tables may use `8px` vertical row padding; general content may
  not.

## 6. Layout

- Maximum content width: `1360px`.
- Top command bar: `64px` minimum height, horizontally centered.
- No persistent desktop sidebar in P0.
- Landing page uses an asymmetric hero: explanation left, signal lens/example
  right.
- Investigation screen begins with a sticky scope ribbon containing token,
  chain, timeframe, freshness, and refresh.
- Main analytical area uses a twelve-column grid where **every row sums to
  twelve**:
  - signal lens: 4 columns, spanning two rows;
  - evidence overview: 8 columns, beside the lens;
  - cohort chart: 8 columns, beside the lens on the second row;
  - score breakdown and brief: 6 columns each;
  - buyers and sellers: 6 columns each;
  - relationship, ledger and summary sections: full width.

  The earlier 7/5 split assumed the lens did not span two rows. With the span
  it left one column dangling beside the chart and seven columns empty beside
  the breakdown, so the spans were rebalanced rather than the span removed:
  the lens is tall, and the two cards beside it are what stop that height
  becoming a hole.
- Large empty areas are intentional; do not fill every grid cell.
- Desktop page gutter: `32px`; tablet: `24px`; mobile: `16px`.

Responsive behavior:

- `>= 1200px`: asymmetric multi-column research canvas.
- `768–1199px`: two-column overview, then full-width sections.
- `< 768px`: one column; scope ribbon becomes a compact disclosure; lens remains
  no larger than viewport width.
- No horizontal page scroll at `320px`.
- Tables become labeled record lists rather than squeezed columns.

## 7. Class-name law

Every author-written HTML class token must match:

```text
^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$
```

Allowed:

```text
app-shell
signal-lens
signal-lens-title
evidence-row
evidence-row-value
```

Forbidden:

```text
md:grid
score_card
score-card__value
score-card--warning
ScoreCard
card--compact
```

Hard rules:

1. A class token contains lowercase letters, numbers, and single hyphens only.
2. A class token must not contain `:`, `_`, `__`, `--`, brackets, slash,
   backslash, whitespace, or escaped characters.
3. Tailwind utility classes and variant syntax are forbidden in JSX/TSX.
4. BEM double-underscore and double-hyphen syntax is forbidden.
5. CSS Modules are forbidden because generated class names may contain
   implementation-specific underscores or hashes that violate the visible DOM
   naming contract.
6. Dynamic class-name construction is forbidden.
7. Visual variants use attributes such as `data-state="warning"`,
   `data-size="compact"`, or `aria-current="page"`, not modifier classes.
8. Repeated elements share one semantic class; never append an index.
9. Class names describe responsibility, not color or coordinates. Use
   `brief-warning`, not `yellow-left-box`.
10. A source check must scan JSX/TSX class tokens and authored CSS selectors in
    CI. Any invalid token fails the build.

Pseudo-classes such as `:hover` and `:focus-visible` are valid CSS selector
syntax. They are not HTML class tokens and are outside the class-name ban.

## 8. CSS organization

Authored CSS is used instead of utility styling in markup.

```text
src/styles/
  tokens.css
  reset.css
  typography.css
  layout.css
  utilities.css
  components/
    button.css
    field.css
    card.css
    dialog.css
    status.css
  features/
    landing.css
    investigation.css
    signal-lens.css
    evidence.css
    relationships.css
```

Rules:

- `tokens.css` contains color, type, spacing, radius, elevation, and motion
  custom properties.
- `reset.css` contains browser normalization only.
- `typography.css` contains global text roles.
- `layout.css` contains application shell and shared grid rules.
- `components` styles generic reusable UI only.
- `features` styles product-specific compositions.
- Route files must not contain inline style objects except values that are truly
  data-driven, such as chart coordinates.
- `!important` is forbidden unless adapting inaccessible third-party output; the
  exception needs an adjacent comment.
- Selector nesting depth must not exceed three levels.
- IDs are not used for visual styling.
- Stylesheets import in a documented fixed order to prevent cascade accidents.

## 9. Components

### Primary button

- Rose fill in light mode, `44px` minimum height, sentence-case label.
- One primary button per decision region.
- Label uses verb plus object: `Run investigation`.
- Disabled state explains why through nearby text, not a hover-only tooltip.

### Card

- Rounded surface with measured internal spacing.
- Heading, optional status, content, and optional footer.
- No header divider by default; spacing carries hierarchy.
- Each async card implements loading, empty, partial, stale, ready, and error
  states.

### Signal lens

- Displays all three analytical dimensions without merging them.
- Arcs use distinct line styles and textual labels.
- Value changes do not animate through fake intermediate numbers.
- A table/text summary mirrors all values for accessibility.
- Clicking a dimension opens its derivation, not a decorative animation.

### Evidence card

- Observation appears before interpretation.
- Source, timeframe, collected time, and evidence ID are always visible.
- Expanded content shows normalized values and derivation.
- Supporting and contradicting evidence use icons and explicit words.

### Flow chart

- Zero baseline is prominent.
- Bars extend in both directions and display signed values.
- Cohorts are directly labeled.
- A data table duplicates chart content.
- No initial sweep animation.

### Relationship map

- Uses a calm node-link map on a tinted field, not a terminal graph.
- Selected actor is a filled primary-colour node.
- Relation type controls edge style and label.
- Node size maps only to a documented metric.
- Table view is equal in status to graph view.
- First-degree expansion limit is visible.

## 10. System states

| State | Required presentation |
| --- | --- |
| Loading | geometry-matched skeleton plus plain-language task |
| Ready | collection time and source available |
| Partial | amber banner naming missing source and Confidence impact |
| Empty | “No records returned” and scope; never “No activity” |
| Stale | visible age, warning, and bounded refresh action |
| Error | error category, preserved successful evidence, safe retry |
| Fixture | persistent page-level banner with capture timestamp |
| Unsupported | disabled option plus reason before submission |

Skeletons contain no fake metrics. Loading must not render zero-valued charts.

## 11. Motion

- Motion clarifies state change or spatial relationship only.
- Standard duration: `140–220ms`.
- Use opacity and transform for routine transitions.
- The signal lens may draw its arcs once after real evidence arrives, maximum
  `420ms`; reduced-motion users see the final state immediately.
- No perpetual ticker, pulse, particle field, fluid cursor, or background loop.
- Do not animate number values through invented values.
- Stop nonessential motion when the tab is hidden.
- Respect `prefers-reduced-motion` globally.

## 12. Accessibility

- WCAG 2.2 AA is the minimum.
- Every action works by keyboard.
- Focus ring uses the dedicated Focus token and is always visible.
- Minimum interactive target is `44x44px`.
- Heading levels are sequential.
- Tabs implement ARIA relationships and Arrow/Home/End navigation.
- Async announcements are concise and use appropriate live regions.
- Essential content never exists only in a tooltip, graph, color, or animation.
- The relationship map has a complete table alternative.
- Charts expose accessible names, written summaries, and data tables.
- Form errors connect to fields using `aria-describedby`.

## 13. Content design

- Use sentence case throughout.
- Lead with an observation, then interpretation, then limitation.
- Prefer “Smart Traders net flow was +$1.2M over 24h” over “Smart Money is
  bullish.”
- Label generated prose `Model-assisted brief`.
- Label fixture data `Historical fixture — not live`.
- Store timestamps in UTC; render timezone explicitly.
- Compact numbers may appear in overview cards; evidence detail retains precise
  values.
- Prohibited words and product claims follow
  [02-product-rules.md](02-product-rules.md).

## 14. Visual quality gate

Before an interface pull request merges:

- [ ] Every authored class token passes the class-name regex.
- [ ] No class contains `:`, `_`, `__`, or `--`.
- [ ] No Tailwind class or CSS Module is present.
- [ ] Screenshot does not resemble `arc-payment` in theme, structure, shapes,
      typography, or signature graphics.
- [ ] Light theme is complete; dark theme does not change semantics.
- [ ] All async states exist.
- [ ] Desktop, tablet, and `320px` mobile layouts pass.
- [ ] Keyboard path and focus order pass.
- [ ] Reduced motion passes.
- [ ] Color contrast passes WCAG 2.2 AA.
- [ ] Charts have text/table alternatives.
- [ ] No fake metric, decorative market motion, or unsupported claim appears.
