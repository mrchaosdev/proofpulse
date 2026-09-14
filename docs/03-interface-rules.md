# 03 — Interface rules

## Design lineage

ProofPulse studies interface craft from
[`mrchaosdev/arc-payment`](https://github.com/mrchaosdev/arc-payment): flat
terminal surfaces, hairline structure, semantic monospace, restrained motion,
explicit system states, and accessible keyboard behavior.

What is intentionally not copied:

- payment, wallet, checkout, receipt, or chain-switching logic;
- Arc network constants or payment-specific component names;
- ChaosPay branding, logo, exact palette, content, or route structure; and
- visual effects that do not explain ProofPulse data.

The result should feel authored by the same design discipline, not cloned from
the same product.

## 1. Visual principles

### Evidence is the visual hierarchy

The largest elements are the token identity and three analytical outputs.
Generated prose is secondary. A chart or graph must answer a named question; it
must not exist as decoration.

### Flat, precise, and inspectable

- One page ground with stepped surfaces.
- One-pixel borders create hierarchy.
- Cards use square corners; the optional cut-corner motif is reserved for the
  hero investigation frame and modal, never every element.
- No drop shadows, glassmorphism, glossy gradients, or floating card stacks.
- Whitespace and rules create depth.

### Color has one job at a time

- Violet is the product action/selection color.
- Green and red are reserved for positive and negative observed values.
- Amber is reserved for warning, stale, or partial data.
- Neutral gray represents missing or inactive data.
- Direction must never be communicated by color alone.

### Derived, not predicted

Visuals animate only when new evidence arrives or the user changes scope.
Decorative market motion, fake live tickers, and random numbers are forbidden.

## 2. Design tokens

Tokens are semantic; components must not embed raw palette values.

### Dark theme — default

| Token | Value | Use |
| --- | --- | --- |
| `--app-bg` | `#090B10` | page ground |
| `--surface` | `#0F131B` | panel surface |
| `--surface-soft` | `#171D28` | selected or secondary surface |
| `--border` | `#252D3A` | standard hairline |
| `--border-strong` | `#3A4658` | focus hierarchy |
| `--text-primary` | `#F4F6FA` | primary copy |
| `--text-secondary` | `#C4CAD4` | supporting copy |
| `--text-muted` | `#858E9F` | metadata |
| `--action` | `#9B8CFF` | primary action and selection |
| `--action-hover` | `#B0A5FF` | hovered action |
| `--on-action` | `#090B10` | text on action |
| `--positive` | `#4FD1A1` | positive observed value |
| `--negative` | `#FF6B7A` | negative observed value |
| `--warning` | `#F6C85F` | stale, partial, caution |
| `--info` | `#70B7FF` | neutral informational state |

### Light theme

| Token | Value | Use |
| --- | --- | --- |
| `--app-bg` | `#F5F6F8` | page ground |
| `--surface` | `#FFFFFF` | panel surface |
| `--surface-soft` | `#ECEEF3` | selected or secondary surface |
| `--border` | `#D7DAE2` | standard hairline |
| `--border-strong` | `#AEB5C2` | focus hierarchy |
| `--text-primary` | `#141823` | primary copy |
| `--text-secondary` | `#414958` | supporting copy |
| `--text-muted` | `#646D7D` | metadata |
| `--action` | `#6657D9` | primary action and selection |
| `--action-hover` | `#5547C2` | hovered action |
| `--on-action` | `#FFFFFF` | text on action |
| `--positive` | `#087A59` | positive observed value |
| `--negative` | `#C53C51` | negative observed value |
| `--warning` | `#946200` | stale, partial, caution |
| `--info` | `#1769AA` | neutral informational state |

All text/background combinations must meet WCAG 2.2 AA contrast. Token values may
be adjusted during implementation only when automated contrast tests document the
reason.

## 3. Typography

- Sans: Geist Sans for headings, explanation, instructions, and body copy.
- Mono: Geist Mono for token addresses, wallet addresses, hashes, timeframes,
  timestamps, numeric metrics, evidence IDs, labels, and controls with compact
  technical meaning.
- Tabular numerals are mandatory in aligned metrics and tables.
- Uppercase mono labels use `10–11px` with `0.12–0.18em` tracking.
- Body copy uses at least `14px / 1.6` on desktop and `15px / 1.6` on mobile.
- Primary page title: `32–44px`; section heading: `20–28px`; panel heading:
  `11px` uppercase mono.
- Wallet and token addresses may be visually truncated only when the full value
  is available to copy and exposed through an accessible label.

## 4. Layout

- Maximum workspace width: `1440px`.
- Desktop sidebar: `248px`, collapsible to `72px`.
- Top bar minimum height: `56px`.
- Desktop content gutter: `24–32px`; mobile gutter: `16px`.
- Base spacing unit: `4px`; common gaps: `8`, `12`, `16`, `24`, `32`, `48`.
- Analytical panels align to a twelve-column desktop grid.
- Reading copy never exceeds `72ch`.
- No horizontal page scroll at `320px` viewport width.

### Responsive behavior

- `>= 1200px`: full sidebar, three-score rail, two-column investigation body.
- `768–1199px`: collapsed sidebar, score cards in a three-column row.
- `< 768px`: no persistent sidebar; bottom or top compact navigation; scores
  stack; graph becomes a full-width pan/zoom region.
- Tables switch to labeled rows on narrow screens; they must not simply shrink
  unreadably.

## 5. Core components

### Button

- Height `40px` minimum; touch target `44x44px` on mobile.
- Primary fill appears once per decision region.
- Secondary uses a strong hairline; ghost is for low-risk navigation.
- Destructive style is reserved for clearing local data, not negative market
  states.
- Labels use verb + object: `Run investigation`, `Expand wallet evidence`.

### Panel

- Square surface, one-pixel border, optional header divider.
- Header contains title left and freshness/status right.
- A panel always owns its loading, empty, partial, ready, stale, and error states.
- Nested card-on-card stacks are forbidden; use rows and dividers inside a panel.

### Score module

- Always shows numeric value, category label, short definition, and `How derived`.
- Direction includes a centered zero baseline and signed value.
- Confidence and Coordination Risk use a 0–100 scale but distinct labels/icons.
- Tooltips repeat information available by keyboard/click; no hover-only facts.

### Evidence row

- Shows evidence ID, source, observation, timeframe, and contribution.
- Expand reveals raw normalized fields and derivation, not API headers or secrets.
- Supporting and contradicting evidence have text labels and icons in addition to
  color.

### Charts

- Every chart has a written question as its title.
- Axes include units; timestamps include timezone; zero baselines are visible.
- Legends are directly labeled where possible.
- Tooltips are keyboard reachable and duplicate values in an accessible table.
- Animation is disabled for initial chart comprehension and reduced-motion users.
- Green/red palettes must include shape, line style, or sign labels.

### Wallet graph

- The selected actor is visually and textually identified.
- Node size represents a documented metric only.
- Edge style represents Nansen relationship type, never inferred ownership.
- A list/table alternative is mandatory.
- Graph expansion is limited and user initiated to control cost and complexity.

## 6. State language

| State | Visual treatment | Required copy |
| --- | --- | --- |
| Loading | skeleton matching final geometry | what is being fetched |
| Partial | amber rule/chip | which source failed and effect on Confidence |
| Empty | neutral bordered region | “No records returned,” not “No activity” |
| Stale | amber timestamp | age and refresh action |
| Error | concise negative state | cause category and safe retry |
| Fixture | persistent violet/amber banner | capture time and “not live” |
| Unsupported | disabled control | unsupported chain/timeframe reason |

Skeletons must not contain fake values. Layout must not jump materially when data
arrives.

## 7. Motion

- Animate only `transform` and `opacity` for routine transitions.
- Standard durations: `120ms` state feedback, `180–220ms` panel transitions.
- No looping animation except a low-frequency live status dot while a request is
  active.
- Stop nonessential work when the page is hidden.
- Respect `prefers-reduced-motion` and render the final state without animation.
- Score changes may briefly highlight the changed contribution; numbers must not
  roll through invented intermediate values.

## 8. Accessibility

- Target WCAG 2.2 AA.
- All actions and graph alternatives work with keyboard alone.
- Visible focus uses the action token and at least a one-pixel outline with offset.
- Tabs follow ARIA tab semantics and support Arrow keys, Home, and End.
- Async updates use restrained `aria-live`; do not announce every chart point.
- Headings form a valid hierarchy; panels do not replace semantic sections.
- Error messages are linked to fields with `aria-describedby`.
- Color is never the sole carrier of sign, status, or severity.
- Minimum touch target is `44x44px`.

## 9. Content rules

- Lead with observation, then interpretation, then limitation.
- Prefer “Smart Traders net flow was +$1.2M over 24h” to “Smart Money is bullish.”
- Use UTC in stored data and show local time with explicit timezone in UI.
- Use compact number formatting in summaries and full values in evidence detail.
- Never abbreviate a token address without a copy control.
- Explain jargon once; methodology may use specialist terminology.
- Generated copy is visually labeled `Model-assisted brief`.

## 10. CSS and component rules

- Semantic tokens are defined once; raw color literals are forbidden in feature
  components.
- Reusable primitives have neutral names; feature classes use functional
  kebab-case such as `investigation-score-panel`.
- No numbered CSS classes for repeated list items.
- Prefer CSS transitions for simple state changes.
- A heavy visual dependency must be lazy loaded and have a measured purpose.
- Third-party widgets must be visually integrated without breaking their
  accessibility semantics.

## 11. Forbidden interface patterns

- Opaque “AI says buy” hero cards.
- Green/red full-page washes that imply certainty.
- Glass cards, excessive radius, decorative 3D tilt, and background video.
- Auto-playing financial tickers unrelated to the current investigation.
- Hover-only evidence, unlabeled icons, and tooltips containing essential facts.
- Default-zero charts while data is loading.
- Hiding errors behind a generic “Something went wrong.”
- A chat box as the primary product surface.
