# 11 — Decisions and open questions

## Decision log

### D-001 — Build an investigation workspace, not a trading agent

- Date: `2026-09-14`
- Status: accepted
- Decision: ProofPulse analyzes and explains; it does not connect wallets or
  execute trades.
- Reason: stronger safety boundary, smaller scope, and a clearer demonstration of
  Nansen's differentiated data.

### D-002 — Separate Direction, Confidence, and Coordination Risk

- Date: `2026-09-14`
- Status: accepted
- Decision: no single opaque “signal score.”
- Reason: direction, evidence quality, and concentration answer different
  questions. Merging them would invite overconfidence.

### D-003 — Address-first input

- Date: `2026-09-14`
- Status: accepted
- Decision: canonical chain plus token address identifies an investigation.
  Symbol search may assist but cannot silently resolve ambiguity.
- Reason: token symbols collide across chains and contracts.

### D-004 — Server-only Nansen access

- Date: `2026-09-14`
- Status: accepted
- Decision: all Nansen requests pass through server adapters and cache.
- Reason: credential safety, runtime validation, consistent error handling, and
  credit control.

### D-005 — Deterministic analytics before model prose

- Date: `2026-09-14`
- Status: accepted
- Decision: evidence and scores work without an LLM. The model only writes a
  validated brief.
- Reason: core value must survive model failure and remain auditable.

### D-006 — Fixture parity

- Date: `2026-09-14`
- Status: accepted
- Decision: live and fixture modes share the same normalization, scoring, and UI.
- Reason: the demo fallback must prove real product behavior, not a separate mock.

### D-007 — Learn interface craft, not product logic, from arc-payment

- Date: `2026-09-14`
- Status: accepted
- Decision: learn process discipline only: documented design decisions, complete
  states, accessibility, bounded performance, and clean component boundaries.
  ProofPulse must use a different light-first editorial research canvas, rounded
  spatial surfaces, indigo/cyan palette, top navigation, signal-lens signature,
  typography, content structure, and motion language. Do not copy or resemble
  payment logic, routes, branding, network configuration, content, or visuals.
- Source: [arc-payment](https://github.com/mrchaosdev/arc-payment)

### D-010 — Semantic CSS and strict class-name grammar

- Date: `2026-09-14`
- Status: accepted
- Decision: authored HTML class tokens match
  `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`. Class tokens containing `:`, `_`, `__`, or
  `--` are forbidden. Tailwind utilities, CSS Modules, CSS-in-JS, and dynamic
  class construction are excluded.
- Reason: keep markup readable, enforce one naming grammar, and make class
  quality mechanically testable.

### D-011 — Clean folder ownership

- Date: `2026-09-14`
- Status: accepted
- Decision: executable product code lives under `src`, tests under `tests`,
  scripts under `scripts`, static assets under `public`, and documentation under
  `docs`. Root source files and miscellaneous dumping folders are forbidden.
- Reason: every file must have one obvious owner and dependency direction.

### D-008 — Initial chain scope

- Date: `2026-09-14`
- Status: provisional
- Decision: target Ethereum, Solana, and Base.
- Review trigger: live spike shows a required capability or timeframe is not
  consistently available on one chain.

### D-009 — Internal deadline

- Date: `2026-09-14`
- Status: provisional
- Decision: submit by `2026-09-27 18:00 ICT`.
- Reason: the launch-day countdown implied an approximate official end at
  `2026-09-28 00:00 UTC`; a buffer is required.

### D-012 — Pinned scaffold stack

- Date: `2026-09-15`
- Status: accepted
- Decision: Next.js `16.3.5`, React `19.3.0`, TypeScript `5.9.3`, Zod `4.6.5`,
  Vitest `5.0.0`, Playwright `1.63.0`, Prettier `3.9.6`, ESLint `9.39.5`.
  Recharts and React Flow are deferred until the routes that need them exist.
- Reason: exact versions must be pinned at scaffolding. ESLint is held at 9
  because `eslint-config-next@16.3.5` bundles `eslint-plugin-react`, which
  fails to load under ESLint 10; `>=9.0.0` is the supported peer range.
  Visualization libraries are added when a route needs them, not in advance
  (CODEBASE-RULES 13).

### D-013 — EVM checksum verification sits outside the domain layer

- Date: `2026-09-15`
- Status: accepted
- Decision: `src/domain/investigation/address.ts` validates EVM address format
  (`0x` plus 40 hexadecimal characters) and canonicalizes to lowercase. It does
  not verify EIP-55 mixed-case checksums. Solana addresses are base58-decoded
  and must be 32 bytes.
- Reason: checksum verification needs keccak256, and the domain layer imports
  nothing outside domain (CODEBASE-RULES 4). Format validation already satisfies
  the rule that no paid call is made for an invalid address
  (02-product-rules 6.1). If a mistyped-but-well-formed address proves to be a
  real source of wasted credits, checksum verification is added in the
  integration layer, not the domain.

### D-014 — The preliminary coordination cap is unreachable at score-v0.1

- Date: `2026-09-15`
- Status: accepted
- Decision: the 59-point preliminary ceiling stays in the code and the
  specification, but it is documented as a safety ceiling rather than a binding
  limit.
- Reason: without relationship evidence only top-actor concentration (40) and
  effective actor diversity (10) can contribute, so a preliminary score cannot
  exceed 50. The unit test asserts the invariant (never reaching the elevated
  band) instead of an exact capped value, so the cap remains correct if
  component maxima are recalibrated later.

### D-015 — Confidence awards no quality points without a usable dataset

- Date: `2026-09-15`
- Status: accepted
- Decision: when no required dataset returns usable records, the
  warning/schema-quality component contributes 0 rather than its residual after
  penalties.
- Reason: an investigation where every source failed scored 2 out of 100 instead
  of 0. With no evidence there is no evidence quality to score, and a non-zero
  Confidence would misrepresent a total failure.

### D-016 — API spike deferred; scaffold and domain brought forward

- Date: `2026-09-15`
- Status: superseded by D-017 later the same day, once a key was supplied
- Decision: the Sep 15 Nansen spike is blocked because no API key is available
  in the build environment. The Sep 16 scaffold, domain, scoring, and CI work
  was completed first. `scripts/spike-nansen.mjs` is ready and runs as soon as
  `NANSEN_API_KEY` exists.
- Reason: the plan's rule is to start with the riskiest unproven assumption, but
  a blocked task cannot be started. Endpoint paths, request bodies, and the
  authentication header in the spike script are unverified assumptions marked as
  such in the file; they must be confirmed before any adapter is written against
  them. Open questions P-01 and P-02 remain open and their due dates now depend
  on credential availability.

### D-017 — Verified Nansen API contract

- Date: `2026-09-15`
- Status: accepted
- Decision: all four core endpoints were exercised against the live API. Base
  `https://api.nansen.ai`, version prefix `/api/v1`, method `POST`,
  authentication header `apikey` (lowercase). Request bodies are flat: `chain`
  and `token_address` at the top level, not wrapped in a `parameters` object.
  Verified paths are recorded in
  [05-data-and-scoring.md](05-data-and-scoring.md#core-endpoint-budget).
- Reason: the pre-spike assumptions in the script were wrong in three separate
  ways — header casing, body nesting, and field naming — and Token Screener sits
  outside the `tgm/` prefix that the specification assumed. Verifying before
  writing adapters cost five credits and avoided building against fiction.

### D-018 — Per-endpoint timeframe translation

- Date: `2026-09-15`
- Status: accepted
- Decision: the adapter translates a domain timeframe per endpoint. Flow
  Intelligence takes `1d`; Token Screener takes `24h` for the same window; Who
  Bought/Sold takes an explicit ISO 8601 `from`/`to` window derived from the
  timeframe and one injected clock read.
- Reason: the endpoints publish different timeframe enums. Sending `1d` to Token
  Screener returns `422 invalid_field_value`. The four domain timeframes
  (`1h`, `6h`, `1d`, `7d`) all translate cleanly, so the supported scope in the
  product brief survives unchanged.

### D-019 — Untracked wallet counts normalize to null

- Date: `2026-09-15`
- Status: accepted
- Decision: `exchange_wallet_count` and `fresh_wallets_wallet_count` normalize
  to `null`, not `0`. Token name stays `null` because Token Screener has no name
  field. Actor net USD is derived from `bought - sold`. An empty
  `address_label` normalizes to `null`.
- Reason: Flow Intelligence states in its own `warnings` that those two counts
  are always 0 and not tracked, even when the matching net flow is non-zero.
  Passing `0` through would convert missing data into an observed zero, which
  rule 1.4 forbids, and would deflate the Confidence participant-breadth
  component without anyone noticing. A `0` from a tracked cohort is preserved as
  a genuine observation; contract tests pin both behaviours apart.

### D-020 — Credits, not latency, are the binding constraint

- Date: `2026-09-15`
- Status: accepted
- Decision: budget planning uses `1` credit per call on both Free and Pro, not
  the `1 / 10` figure previously recorded. A core investigation costs `4`
  credits.
- Reason: measured latency was `461-806ms` per call, far inside the five-second
  partial-result target. The Free plan grants `100` one-time credits and then
  tops up only to `10` per day, so a depleted Free balance affords roughly two
  complete investigations per day. Caching, the on-demand relationship
  expansion, and the fixture demo path are therefore survival requirements
  rather than optimizations, and the demo must not depend on live calls being
  available on the day.

### D-021 — Fixture mode is the default without a credential

- Date: `2026-09-15`
- Status: accepted
- Decision: when no `NANSEN_API_KEY` is configured, the workspace runs in
  fixture mode and labels every screen accordingly, rather than failing. Fixture
  mode is also reachable deliberately through `?mode=fixture`. It is never
  entered silently after a live call has already failed.
- Reason: the product must be openable by a judge with no credential, and the
  Free-plan credit ceiling (D-020) makes a live-only demo fragile. Rule 5.7
  forbids fixture data that could be mistaken for live data, so the banner,
  the source-level `live: false` flag, and the Confidence cap all stay visible.
  When the requested token differs from the captured one, an amber banner says
  so instead of quietly showing a different token as if it were the request.

### D-022 — The page renders the score, the service owns the data source

- Date: `2026-09-15`
- Status: accepted
- Decision: the investigation route is a server component that calls
  `runInvestigation` directly. `POST /api/investigations` remains for
  programmatic use and carries the same validation and rate limiting.
- Reason: a server component calling the use case avoids a self-fetch and keeps
  secrets server-side by construction. Both paths share one orchestration
  function, so live and fixture behaviour cannot drift apart.

### D-023 — Command bar wraps below 480px

- Date: `2026-09-15`
- Status: accepted
- Decision: the top command bar wraps and its link list moves to its own row
  below `480px`.
- Reason: a Playwright viewport test found the navigation pushing the page
  `53px` past the viewport at `320px`, which breaks the no-horizontal-scroll
  rule. Caught by acceptance case U-01, which is exactly what that test exists
  for. The evidence ledger is still wider than a phone, but it lives inside its
  own `overflow-x: auto` container, which the design rules permit.

### D-024 — Actor selection travels in the URL

- Date: `2026-09-16`
- Status: accepted
- Decision: the inspected actor is a query parameter (`?inspect=<address>`) and
  the server recomputes the whole investigation with the new evidence. The
  relationship controls are links, so selection needs no client JavaScript.
  `POST /api/investigations/relationships` remains for programmatic use.
- Reason: a client-side fetch would have left the signal lens showing a
  preliminary Coordination Risk while the panel below it showed an assessed
  one — two different numbers for the same thing on one screen. Routing the
  selection through the server keeps a single value. The expansion is cached
  for 30 minutes, so re-selecting an actor costs no credits, and the canonical
  URL makes an expanded investigation shareable and reproducible.

### D-025 — Actor membership is verified before any expansion

- Date: `2026-09-16`
- Status: accepted
- Decision: relationship expansion only runs for an address that is already an
  actor in the investigation. The page path checks the in-memory actor list;
  the standalone API route checks the cached buyer and seller sets and refuses
  with `INVESTIGATION_EXPIRED` when that cache has gone.
- Reason: without the check, any address could trigger a paid call through a
  crafted request. Refusing on an expired cache is deliberate: re-running a
  four-credit investigation just to prove membership would spend more than the
  expansion itself.

### D-026 — No graph library

- Date: `2026-09-16`
- Status: accepted
- Decision: the relationship map is hand-written SVG, not React Flow, despite
  the target stack naming React Flow. Nodes are laid out in a ring around the
  selected actor and all nodes are the same size.
- Reason: P0 needs one first-degree star layout with at most 21 nodes and no
  panning, dragging, or custom node editing. A dependency is added only when
  platform code cannot reasonably solve the requirement (CODEBASE-RULES 13),
  and React Flow would add a heavy client bundle for a drawing that is roughly
  fifty lines of SVG. Node size maps to no metric, which the panel states,
  because the design rules allow node size to encode only a documented metric
  and none has been verified.

### D-027 — Verified against this Next.js version's own documentation

- Date: `2026-09-16`
- Status: accepted
- Decision: `params` and `searchParams` are awaited promises, and
  `export const dynamic = "force-dynamic"` stays on the investigation route.
- Reason: `AGENTS.md` requires checking `node_modules/next/dist/docs` rather
  than relying on remembered conventions. That check confirmed the promise-based
  props are correct for this version, and that `dynamic` is removed only when
  the `cacheComponents` flag is enabled, which this project does not enable. The
  same docs confirm `fetch` is uncached by default here, so the framework
  cannot silently serve a stale paid response as fresh evidence.

### D-028 — Fonts are self-hosted, not loaded through next/font

- Date: `2026-09-16`
- Status: accepted
- Decision: Manrope and IBM Plex Mono (latin subset, 53 KB total) are served
  from `public/fonts` and declared with authored `@font-face` rules in
  `src/styles/fonts.css`. Licences are recorded in `public/fonts/LICENSE.md`.
- Reason: the fonts the design rules mandate were declared in the tokens but
  never actually loaded, so every screen had been rendering in a fallback
  system font. `next/font` would fix the loading but emits a generated class
  token containing `__` and a hash, which the class-name law forbids and which
  is the same reason CSS Modules are banned (DESIGN-RULES 7.5). Self-hosting
  also keeps the browser from contacting a third-party font host.

### D-029 — The lens uses concentric rings with a marked zero

- Date: `2026-09-16`
- Status: accepted
- Decision: three concentric full-circle rings, square stroke caps, and an
  explicit zero marker on the bipolar Direction ring, which fills clockwise for
  accumulation and anticlockwise for distribution. Readout rows carry a colour
  swatch tying each row to its ring.
- Reason: two earlier attempts failed when looked at rather than asserted on.
  Round caps rendered a Direction of `+1` as a dot that read as a rendering
  artefact; splitting the circle into three angular bands read as a broken ring
  rather than as three dimensions. Square caps plus a visible zero make a small
  value legible as a small value, which matters because a near-zero Direction
  is a real and common result that the product must not dramatise or hide.

### D-030 — Screenshots are part of interface review

- Date: `2026-09-16`
- Status: accepted
- Decision: an interface change is reviewed by rendering it and looking at the
  image, not by asserting on the DOM alone.
- Reason: the whole interface passed its tests while being visually broken. The
  tests confirmed that text and roles existed; they could not see unloaded
  fonts, a chart that looked like an artefact, or several hundred pixels of
  accidental empty space. Acceptance case U-13 already requires a documented
  screenshot review; this makes it routine rather than a release-day step.

### D-031 — The brief ships without a model provider

- Date: `2026-09-16`
- Status: accepted
- Decision: the full brief pipeline exists — grounded input, provider
  interface, schema and evidence validation, deterministic fallback — but no
  provider adapter is wired, so every brief currently renders as the
  deterministic one and says so on screen.
- Reason: the product value is the validation, not the generation. A brief that
  cannot cite evidence is refused whether a model wrote it or not, and core
  analytics never wait for a provider (decision D-005). Wiring a provider is
  now a single adapter behind `BriefGenerator`. Labelling the fallback plainly
  is required by rule 9.2: a deterministic brief must not pass itself off as
  model output.

### D-032 — Number extraction must respect identifier boundaries

- Date: `2026-09-16`
- Status: accepted
- Decision: `extractNumbers` ignores digits inside identifiers, so the "1" in
  `0xaaa1`, the "01" in `FLOW-SM-01`, and the "09" in a date are not read as
  claimed values.
- Reason: found by the deterministic brief failing its own validator. Without
  the boundaries, any brief that named a wallet or cited an evidence ID was
  rejected for stating numbers it never stated, which would have made the
  validator useless in exactly the cases it exists for.

### D-033 — Refresh and retry are bounded by a cache marker

- Date: `2026-09-16`
- Status: accepted
- Decision: a refresh or single-source retry travels in the URL, bypasses that
  capability's cache entry once, and writes a marker that expires with the data
  it refreshed. A reload of the same URL inside the window is served from cache.
- Reason: rule 5.6 forbids an accidental credit loop, and a refresh link that
  spent credits on every reload or browser back-navigation would be exactly
  that. Each control states its credit-impact category before it is used
  (rule 4.4).

### D-034 — Chain support verified on all three chains

- Date: `2026-09-16`
- Status: accepted
- Decision: Ethereum, Solana, and Base are supported. Solana and Base were
  exercised live on `2026-09-16` and return the same schema as Ethereum, with
  the same two wallet-count warnings. Captures are committed as contract
  fixtures.
- Reason: the initial chain scope (D-008) was asserted but never tested. One
  set of normalizers serving all three chains is a claim that needed evidence,
  and the untracked-wallet-count behaviour behind D-019 needed confirming as
  chain-wide rather than an Ethereum quirk. Cost: four credits, two per chain.
  Ten credits used in total to date.

### D-035 — Synthetic fixtures are labelled as synthetic

- Date: `2026-09-16`
- Status: accepted
- Decision: error envelopes, malformed payloads, one-sided cohort samples, and
  prompt-injection metadata live in `tests/fixtures/nansen/synthetic`, each
  carrying a `synthetic: true` flag and a note. Captured responses stay in the
  parent directory and are never edited.
- Reason: the fixture policy forbids modifying values to create a stronger
  story. A `402` envelope cannot be captured from a healthy API, so it has to
  be authored — but the boundary between recorded truth and authored test input
  must be visible in the file itself, not only in a directory name.

### D-036 — A streamed not-found is a soft 404

- Date: `2026-09-16`
- Status: accepted
- Decision: an unsupported chain or a malformed address renders the not-found
  page with the correct copy, but the HTTP status stays `200` and Next injects
  `noindex`. A URL matching no route at all still returns a real `404`.
- Reason: this version's own documentation states that `notFound()` returns
  `200` for streamed responses and `404` only for non-streamed ones, and that
  a real status needs the check to run before the response streams. The
  investigation route streams because it is dynamic and has a loading shell.
  The product requirement is that a bad address produces no interpretive claim
  and spends no credits, which holds. If the status itself matters for search
  or monitoring, the fix is a pre-stream check in `proxy`, not a change here.

### D-037 — Loading, error, and not-found states exist as route files

- Date: `2026-09-16`
- Status: accepted
- Decision: the investigation route has `loading.tsx` and `error.tsx`, and the
  application has `not-found.tsx`. The skeleton matches the real layout
  geometry, names the task in words, and contains no digits.
- Reason: found by auditing rather than by a failing test. In live mode the
  route does four upstream calls, so without a loading shell the visitor saw
  nothing at all for one to three seconds. A skeleton carrying numbers would
  have been worse than none, because rule 1.4 and DESIGN-RULES 10 both forbid
  implying a value the product does not have.

### D-038 — Content Security Policy

- Date: `2026-09-16`
- Status: accepted
- Decision: a CSP is served on every response. `connect-src 'self'` is the
  enforcement of rule 6.5: the browser cannot reach Nansen or a model provider
  even if a future change tried. `script-src` and `style-src` still allow
  `'unsafe-inline'`.
- Reason: the policy was required by 07-security-and-privacy and was simply
  missing; the other four headers had been configured and it had not. The
  inline allowance is a real framework constraint, not a preference: the App
  Router emits inline bootstrap script and style. Tightening it needs nonce
  plumbing and is recorded as follow-up rather than claimed as done.

### D-039 — The secret gate scans unpublished files and knows the Nansen key format

- Date: `2026-09-16`
- Status: accepted
- Decision: `check-secrets` scans tracked files **and** new, non-ignored files,
  and carries a pattern for `nsn_` keys. Both behaviours are verified by
  planting a key and watching the gate fail.
- Reason: two holes, found by testing the gate instead of trusting it. It read
  only `git ls-files`, so a newly authored file carrying a credential passed
  until the moment it was committed — exactly when it is too late. And it had
  no pattern for Nansen keys at all, so the one credential this repository
  actually handles was the one it could not detect. A security check that has
  never been shown to fail is not evidence of anything.

### D-040 — Submission artefacts are generated from the running product

- Date: `2026-09-16`
- Status: accepted
- Decision: screenshots are captured from the built application by script, the
  architecture diagram is authored SVG using the product's own colour tokens,
  and both live in `docs/`. The demo script and deck are written documents, not
  slides, so they can be reviewed in the repository.
- Reason: a screenshot drawn by hand or a diagram that no longer matches the
  code is a claim rather than evidence. Regenerating them is one command, so
  they can be refreshed whenever the interface changes rather than going stale
  between now and submission.

### D-041 — The five design rules that were skipped

- Date: `2026-09-16`
- Status: accepted
- Decision: implemented the radial canvas field, the curved flow ribbon, the
  sticky scope ribbon, the lens draw-once animation, and the documented 7/5
  grid split.
- Reason: a second round of "the interface looks bad" sent me back through
  DESIGN-RULES line by line, and five **must** rules had not been built:
  - **§1 background** — "quiet radial colour field" was a flat fill. This row
    sits in the required-difference table, so skipping it removed the thing
    that separates this product from a technical grid.
  - **§1 signature form** — "circular lens **and curved flow ribbon**". Only
    the lens existed, so half the visual identity was missing.
  - **§6 scope ribbon** — specified as sticky, was not.
  - **§11 motion** — the lens is allowed to draw its arcs once in `420ms`. I
    deleted that transition while rewriting the lens, leaving the product with
    no motion at all.
  - **§6 grid** — I had changed the documented 7/5 split to 8/6 to plug a gap
    rather than fixing what caused the gap.

  The pattern is the point: every rule I followed had a script enforcing it —
  class names, tokens, states, accessibility — and every rule I skipped was one
  that only an eye could check. A quality gate that cannot see is not a
  substitute for looking, which is what D-030 already said and what I had still
  not fully absorbed.

### D-042 — The flow ribbon is derived, never decorative

- Date: `2026-09-16`
- Status: accepted
- Decision: the ribbon's two halves are proportional to the summed positive and
  negative cohort net flow actually returned. Both totals are printed beside
  it, a cohort with no returned value contributes nothing, and the ribbon
  renders nothing at all when no flow was returned.
- Reason: a signature shape that carried invented proportions would be exactly
  the "fake metric" the visual quality gate forbids. Deriving it from real
  values makes it satisfy both §1 and the rule that visuals come from evidence.

### D-043 — Derivations are rounded for reading

- Date: `2026-09-16`
- Status: accepted
- Decision: score component details round their inputs. The unrounded values
  remain available in the evidence ledger's expanded normalized record.
- Reason: the breakdown was rendering `tanh(2993.392000738665 /
  318312.10384017567)` in a five-column card, which is precision no reader can
  use. DESIGN-RULES 13 asks for compact numbers in overview and precise values
  in evidence detail; the ledger is the evidence detail, and it still carries
  full precision.

### D-044 — In-page refinements keep the reader's place

- Date: `2026-09-16`
- Status: accepted
- Decision: every link that only changes a query parameter — inspect an actor,
  clear the selection, refresh, retry a source — uses `scroll={false}` and
  shows inline pending feedback through `useLinkStatus` on the clicked control
  itself.
- Reason: reported as "navigation is extremely slow". Measurement showed the
  opposite: the server answered in `20ms` and the click completed in `89ms`.
  What was actually happening is that Next scrolls to the top by default, so
  expanding an actor near the bottom of the page threw the reader back to the
  header and left them hunting for the result they had just requested. A
  correct, fast navigation can still feel broken. The fix is not performance
  work; it is keeping the viewport still and acknowledging the click.

### D-045 — Development-mode timings are not the product's timings

- Date: `2026-09-16`
- Status: accepted
- Decision: interface performance is judged against `npm run build && npm run
  start`, and that is stated in the README.
- Reason: measured on the same machine, the investigation route answers in
  `20ms` in production and takes `1.0s` cold in development, because `next dev`
  compiles each route on first request. Navigation from the landing page paints
  a skeleton at `58ms` and full content at `70ms` in production against
  `262ms` in development. Reviewing the interface in development had been
  producing an impression of the product that no visitor will ever have.

### D-046 — The empty workspace got a real layout

- Date: `2026-09-16`
- Status: accepted
- Decision: `/investigate` uses an asymmetric split — the form in a column it
  fits, and an aside that states what a run does and what it costs. Timeframe
  options are a segmented control.
- Reason: the form card had been stretched across the full `1360px` content
  width for three short fields, and the four timeframe options rendered as
  small circles. Both read as unfinished. This is the page a judge lands on
  from the navigation, and it had never once been looked at.

### D-047 — DESIGN-RULES 2.0: a dark instrument, deliberately different from arc-payment

- Date: `2026-09-16`
- Status: accepted, supersedes the visual half of D-007
- Decision: the interface is dark by default, on a Happy Hues ground with cool
  violet and cyan accents. `DESIGN-RULES.md` was rewritten to version 2.0 in
  the same change, because the document forbids violating a **must** rule
  without changing it deliberately.
- Reason: the project owner judged the light editorial canvas too plain for an
  onchain audience and asked for a web3 look, naming the ChaoUi library,
  reactbits and Happy Hues as references.

  Checking those references first changed what got built. `arc-payment`
  describes itself as "flat ground, hairline rules, square corners, **one warm
  accent**", "Geist Mono on every address", a "dot-matrix pulse sphere", a
  "fluid cursor", and a design language **"adapted from the ChaoUi library"**.
  Taking ChaoUi components plus a warm Happy Hues palette would have rebuilt
  arc-payment — the exact outcome the originality boundary exists to prevent,
  with open question C-09 on what counts as original work still unanswered.

  So the ban relaxed on one axis only. Dark is now allowed; the warm accent,
  the mono-everywhere typography, the square corners, the dot matrix, the pulse
  sphere, the fluid cursor and any ChaoUi import all stay banned, and the
  required-difference table was rewritten to keep the two apart now that both
  are dark.

### D-048 — Accessibility outranks the source palette

- Date: `2026-09-16`
- Status: accepted
- Decision: two Happy Hues values were corrected. The action fill is darkened
  to `#8A3FE8` so white label text reaches `5.30:1`; violet **text** uses a
  lifted `#B07CF6` at `6.44:1`. In the light companion, positive and negative
  were darkened so they clear `4.5:1` on the strong surface.
- Reason: the palette as published fails WCAG 2.2 AA at these sizes — white on
  `#994FF3` is `4.40:1` and violet text on the ground is `4.35:1`. Section 12
  is not part of the aesthetic and did not change with the rest. Every text and
  ground pair in both themes is now verified by calculation, not by eye.

### D-049 — Dark means dark, not "whatever the system says"

- Date: `2026-09-16`
- Status: accepted
- Decision: the product default is dark regardless of the operating system.
  Following the system is a third explicit choice, written as
  `data-theme="system"`.
- Reason: the first attempt kept `@media (prefers-color-scheme: light)`
  applying to any document without an explicit choice, so a visitor whose
  machine prefers light would never have seen the product's own default. The
  screenshot proved it: the page rendered light immediately after the palette
  was swapped.

### D-050 — Light is the product default with an owner-supplied palette

- Date: `2026-09-16`
- Status: accepted, supersedes D-047 and D-049 on default theme and colour
- Decision: the default is light with canvas `#FAEEE7`, headline and
  illustration stroke `#33272A`, paragraph `#594A4E`, action and highlight
  `#FF8BA7`, white illustration main, `#FFC6C7` secondary and `#C3F0CA`
  tertiary. Dark remains an explicit option and System remains available.
  Theme choices use sun, moon and display icons with accessible names.
- Reason: the project owner supplied the final light palette and explicitly
  selected light as the default. The visual hierarchy and React Bits spotlight
  treatment remain; only semantic colour roles and the compact theme control
  changed.

### D-051 — The policy allows eval in development only

- Date: `2026-09-16`
- Status: accepted
- Decision: `script-src` gains `'unsafe-eval'` when `NODE_ENV` is
  `development`, and never in a production build. An end-to-end test asserts
  the production policy does not contain it.
- Reason: the CSP added in D-038 broke the development server. React's
  development build uses eval to reconstruct call stacks across environments,
  so the browser reported "eval() is not supported in this environment" and the
  debugging features stopped working. React does not use eval in production, so
  the allowance has no reason to ship. The failure only appeared in a browser
  running `next dev` — no test covered it, because every test runs against a
  production build. The new assertion covers the direction that matters:
  production must stay clean even if someone widens the policy to fix
  development again.

### D-052 — A track never shares a colour with a value

- Date: `2026-09-16`
- Status: accepted
- Decision: the signal lens track uses `--outline-strong`. No unfilled
  remainder may be drawn in a token that also renders a value.
- Reason: the track took `--illustration-secondary`, which in dark resolves to
  `#4FC4CF` — the same value as `--cyan`, the confidence arc. The empty part
  of each ring and the filled part were the same colour, so all three rings
  read as complete and the figure carried no information at all. This is the
  second bug of this exact shape after `--cyan` equalling `--positive`
  (D-042). Two tokens being equal is not a problem; two tokens being equal
  while meaning "empty" and "full" in the same figure is.

### D-053 — The evidence ledger is bounded, never abridged

- Date: `2026-09-16`
- Status: accepted
- Decision: the ledger keeps every evidence item and gains a bounded scroll
  region with a sticky column header. Nothing is hidden behind a "show more".
- Reason: 04-information-architecture requires the ledger to list every
  normalized item, including items that contradict the dominant direction. It
  measured 3562px — forty per cent of an 8869px report — which pushed the
  takeaway below it and made the page unreadable. A bounded region satisfies
  the contract exactly: every row is still present, rendered and reachable.
  The report is now 6129px.

### D-054 — One notice per fact

- Date: `2026-09-16`
- Status: accepted
- Decision: fixture substitution and the capture caveat render as a single
  banner whose title and first sentence change with `showsDifferentToken`.
- Reason: two stacked banners cost 330px and said the same thing from two
  sides. On a 390px phone, the first number sat below the fold.

### D-055 — The sticky bar's height is a declared token, verified by test

- Date: `2026-09-16`
- Status: accepted
- Decision: `--sticky-offset` states the bar's measured height, `html` sets
  `scroll-padding-block-start` from it, and the bar's two-row layout is
  decided by a media query at 783px rather than by text wrapping. A test
  asserts the token equals the rendered height at seven widths and that every
  methodology index link leaves its heading clear of the bar.
- Reason: no page set `scroll-margin` or `scroll-padding`, so clicking any
  methodology index link put the heading exactly under the sticky bar —
  entirely hidden by 121px of chrome at 390px. The scope ribbon had the same
  fault between 768 and 1023px, sticking at 76px behind a 121px bar. Letting
  content decide the wrap made the threshold unstable: 780px in one
  measurement, 783px in the next, and the first version of the test caught
  that drift immediately. The lesson from D-030 holds — every rule that held
  had a script behind it.

### D-056 — Back to top, hidden by visibility

- Date: `2026-09-16`
- Status: accepted
- Decision: a floating control appears past 900px of scroll, returns the page
  to the top and moves focus to `main`. Its hidden state uses `visibility`,
  not opacity, and it carries no `aria-hidden`.
- Reason: a report runs to 6129px on a desktop and 11431px on a phone, where
  every card stacks into one column, and the scope header is the only place
  that names the token and timeframe being read. Opacity alone would leave a
  focusable, announced button that nobody can see; `aria-hidden` on a
  focusable element is worse. Scrolling moves the page and not the focus, so
  without the focus call a keyboard reader watches the page return to the top
  and then tabs straight back into the footer.

### D-057 — A narrow layout is decided, not left to wrapping

- Date: `2026-09-16`
- Status: accepted
- Decision: at 320px the timeframe control becomes an auto-column grid, the
  hero signal strip takes one row per signal, and the actor row puts the
  identity on its own line with the label ordered last. Tests assert the
  timeframe options stay on one row and that actor rows take at most one
  height per label state.
- Reason: each of these fitted at 390px and came apart at 320px, the documented
  minimum width. The timeframe control needed 278px inside a 248px card and
  broke three-plus-one, which reads as a rendering fault rather than a layout.
  Actor rows measured 145px and 177px in the same list because the copy control
  wrapped only behind the longer labels. Ordering the label last makes the
  break point independent of its text.

### D-058 — A narrow override must follow the rule it overrides

- Date: `2026-09-16`
- Status: accepted
- Decision: narrow-width blocks are placed after every rule they override, and
  the placement is verified by measuring the rendered result, not by reading
  the stylesheet.
- Reason: two overrides in this round silently did nothing. `.hero-signals`
  was re-asserted at three columns by a later `max-width: 767px` block, and
  the actor row overrides sat above `.actor-value` and `.actor-inspect`.
  Both lost on source order at equal specificity, and both looked correct in
  the diff. Only measuring the rendered layout caught them, which is D-030
  again in a different form.

### D-059 — The evidence status strip is a tinted subsection

- Date: `2026-09-16`
- Status: accepted
- Decision: the five source cards lose their individual borders, radii and
  grounds. The strip is one tinted panel whose 1px grid gap over a darker
  ground draws the separators.
- Reason: each item carried a border, a radius and a surface inside the
  Evidence status card, which DESIGN-RULES 5 prohibits as nested cards. Five
  rounded outlines inside a sixth also read as clutter before they read as
  status. Drawing the separators with the gap means no item owns a border, so
  the rule holds at any number of wrapped columns rather than needing
  first-child exceptions.

### D-060 — A count is not a positive value

- Date: `2026-09-16`
- Status: accepted
- Decision: `.hero-panel-badge` and `.example-label` take neutral surface
  and ink tokens instead of `--cyan-soft` and `--cyan`.
- Reason: "4 credits" is a cost and "Case 001" is a name, but both rendered in
  the positive token — green in light, teal in dark — so a price read as a
  success state. Colour law 2 reserves those for signed observed values and
  success or error states. The neutral pair measures 8.33:1 in dark and 6.45:1
  in light.

### D-061 — Authored controls draw their own marks

- Date: `2026-09-16`
- Status: accepted
- Decision: `.field-select` sets `appearance: none` and draws its chevron
  from two `currentColor` gradients. The landing hero is sized by its content
  rather than the viewport, its signal rules fade out instead of ruling the
  column, the two investigate cards share a height, and the three landing score
  cards align on a subgrid.
- Reason: the chevron was drawn by the operating system, ignored every token in
  the sheet and sat beside authored controls looking borrowed; gradients in
  `currentColor` follow the theme and keep colour law 7, which allows raw
  literals only in the token sheet. A `100vh` hero forced 854px around 570px
  of content, leaving about 140px empty at each end. The two investigate cards
  started at the top and the shorter one ended 61px early, so the pair read as
  an L. The three score cards sized their own rows, putting Coordination's
  number 6px below the other two.

### D-062 — No animation library; the reveal is CSS plus an observer

- Date: `2026-09-17`
- Status: accepted
- Decision: GSAP is not added. Scroll reveal uses
  `animation-timeline: view()` in `src/styles/motion.css`, wrapped in
  `@supports` and `prefers-reduced-motion: no-preference`. It applies to the
  landing sections and the investigate cards, and to neither the report nor the
  methodology document.
- Reason: the blocker was never GSAP. The content security policy allows a
  bundled copy, since it is served from `'self'`, and GSAP core needs no
  `eval`. DESIGN-RULES 11 is what rules out its use: no perpetual ticker,
  pulse, particle field, fluid cursor or background loop, motion only for state
  change or spatial relationship, 140–220ms, and no number animated through
  invented values. That removes nearly every effect the library is good at, and
  the motion the rules do permit is short opacity and transform work that CSS
  already does. Buying 35–40KB gzipped for prohibited effects fails
  CODEBASE-RULES 13, which admits a package only when platform code cannot
  reasonably serve. A scroll reveal states where a block came from, which is
  the spatial relationship the rule allows, so no rule needed changing.
- Excluded surfaces: the report is a working surface scanned for numbers, where
  motion is noise. The methodology document is jumped around through an index,
  so a reveal adds risk to anchor navigation for no reading benefit.
- Safety: the whole file sits behind `@supports`, so an engine without a view
  timeline never hides what it cannot reveal. Three failure modes would each
  strand content at opacity 0 — no support, a viewport too tall for the page to
  scroll, and reduced motion — and nine tests cover them across three routes.
  Measured behaviour: the reveal runs from a card top at y=896 to y=520 in a
  900px viewport, staggered about 60px per card.

### D-063 — Entrance motion on every route, driven by an observer

- Date: `2026-09-17`
- Status: accepted, supersedes the view-timeline mechanism in D-062
- Decision: `RevealOnView` observes the main block of each route with an
  `IntersectionObserver` and writes `data-revealed`. The first screen of each
  route animates on load from CSS instead, because nothing can be scrolled
  into a position it already occupies. Both landing and report are covered;
  no route is excluded.
- Reason: the `animation-timeline: view()` version ran only in Chromium.
  Every other engine fell through the `@supports` guard and showed nothing,
  which is exactly the report that prompted this. `IntersectionObserver` runs
  everywhere and needs no package, so D-062's conclusion about GSAP stands.
- Three failure modes, each covered by a test on all four routes: script that
  never runs (markup ships visible; only script adds the hidden state), a
  window taller than the document, and `prefers-reduced-motion`, where no
  attribute is written at all.
- Two defects the tests found rather than review:
  - A percentage `rootMargin` of −10% becomes 600px on a 6000px window, more
    travel than a page may have left. It is now 80px, and an element that
    could never be scrolled into view is never hidden in the first place.
  - A jump — the End key, a deep anchor, a restored scroll position — carries
    an element from below the window to above it between two frames, so it
    never intersects and stays hidden. The root now extends far above the
    window, so anything scrolled past is revealed. The test jumps rather than
    stepping, because stepping never reproduced it.
- One test in this round was itself wrong: it asserted the report cannot
  scroll on a 6000px window, but the ledger is sized in `vh`, so the document
  grows with the window. The assertion was replaced with the invariant that
  matters — after scrolling, nothing is left hidden.

### D-064 — Whatever hides content owes the document a way back

- Date: `2026-09-17`
- Status: accepted
- Decision: `RevealOnView`'s cleanup removes every attribute it wrote, and
  arming skips only an element that has already finished revealing, never one
  that merely carries the attribute. The bookkeeping moved into
  `reveal-state.ts` so it can be tested without a browser.
- Reason: the first version disconnected the observer on cleanup and left
  `data-revealed="false"` on the document, while the next mount skipped
  anything carrying the attribute. `reactStrictMode` is on, so React mounts,
  unmounts and remounts effects in development: every block below the fold on
  the landing page stayed at opacity 0 permanently. The page rendered as a hero
  above an empty screen, and that is how the project owner found it.
- Why no test caught it: the entire browser suite runs against
  `npm run start`, a production build, where an effect mounts once. Nothing
  in the project ever exercised development behaviour. A second dev server
  cannot be started — Next refuses while one is running — so a Playwright
  project against `next dev` would fail whenever the developer has one open.
  The bookkeeping was extracted instead, and six unit tests now cover the
  mount/unmount/remount sequence directly, including the case where a release
  is missed entirely.
- Standing lesson, after D-030 and D-058: a rule held only where a script
  enforced it. This one was never scripted because the suite quietly tested a
  single environment.

### D-065 — Nansen has no gas endpoint, so there is no gas tracker

- Date: `2026-09-17`
- Status: accepted
- Decision: the gas-tracker idea is dropped. The deeper Nansen integration is
  the token screener's list form instead.
- Reason: the endpoint catalogue has no gas or gas-price endpoint at all. The
  API covers trading activity, wallet analysis and market data, not network
  conditions. Building one would have meant a second provider or a fabricated
  figure, and the second is what this product exists not to do.

### D-066 — Liquidity is compared, and stablecoins are excluded from it

- Date: `2026-09-17`
- Status: accepted
- Decision: `/token-screener` gains a second use, in list form, returning the
  deepest non-stablecoin pools on the chain with the subject marked among them.
  `include_stablecoins` and `include_native_tokens` are both false.
- Reason: a liquidity figure alone says nothing — thirty million dollars is
  thin for one token and enormous for another. The comparison supplies the
  scale. With stablecoins included, seven of the ten deepest Ethereum pools
  were stablecoins and LINK did not appear at all; excluded, LINK sits third at
  $30.4M, which is an answer. A pool that exists to hold a peg is not a
  comparison for a token that floats.

### D-067 — The seven-day history plots units, not dollars

- Date: `2026-09-17`
- Status: accepted
- Decision: the history uses `POST /api/v1/tgm/flows` with
  `label: smart_money` and an explicit seven-day window — one call, one
  credit. Hourly buckets are collapsed to one point per UTC day by taking the
  day's last bucket. The chart plots `token_amount`; `value_usd` is reported
  in words beside it. The axis starts at zero.
- Reason, and the finding that justifies the whole panel: over the captured
  week the smart money position in LINK was flat at 25,036 tokens from day two
  onward, while its dollar value moved between $272.4K and $297.1K. A reader
  shown only the dollar line would conclude smart money was selling. It sold
  once, 747 tokens on day two, and has not moved since. The rest is price.
  Units change only when somebody trades.
- Three mechanical consequences:
  - Buckets are never summed. Adding two snapshots of the same holdings would
    invent a quantity nobody holds, so a day takes its last bucket.
  - The day in progress is drawn hollow and excluded from the change, because
    `is_complete` is false and a part-day is not a reading.
  - The axis starts at zero. Anchored at the lowest value, a 2.9% fall filled
    the frame and read as a collapse — the exact misreading the panel exists
    to prevent.
- Rejected alternatives, each verified against the live API first:
  `smart-money/netflow` returns rolling windows ending at request time, not a
  series. `token-screener/historical` returns one aggregated row per token per
  call, has no `token_address` filter, and costs 5–25 credits, so a week would
  have been seven calls and up to 175 credits.

### D-068 — Both panels are opt-in, like wallet relationships

- Date: `2026-09-17`
- Status: accepted
- Decision: neither dataset joins the core four. `?context=on` requests both,
  the offer states the cost, and fixture mode carries them already.
- Reason: each costs a credit. This is the bargain relationships already make —
  context worth paying for when a reader wants it and worth nothing when they
  do not.

### D-069 — The fixture is parsed once per process

- Date: `2026-09-17`
- Status: accepted
- Decision: `loadFixtureInvestigation` memoizes everything except the clock.
- Reason: the capture is immutable at runtime, but parsing it is real work —
  the history alone is 168 hourly buckets through a Zod schema — and it ran on
  every render of the demo route.

### D-070 — The example lens is one surface, not two panels

- Date: `2026-09-17`
- Status: accepted
- Decision: the landing example loses its `--canvas-tint` half, its dividing
  rule and its three bordered score boxes. The figure sits on the same surface
  as the copy beside it with one soft field behind it, and the three scores
  become a tinted subsection divided by its own grid gap. The figure shrinks
  from 360px to 300px.
- Reason, in the order the problems showed up:
  - `--canvas-tint` resolves to `#FFC6C7` in light, which is the negative
    family. Half the showcase was a loud pink slab behind a graphic that
    carries no warning.
  - A full-height rule split the card, which DESIGN-RULES 5 calls the ruling of
    a table. Removing it left a hard step between two different surfaces, so
    both halves now share one.
  - The three score cards were bordered, rounded and filled inside the card
    that already surrounded them — the nested cards rule 5 prohibits, and the
    same shape already fixed on the evidence status strip in D-059.
  - At 360px the figure made the lens column 669px tall against 348px of copy,
    leaving about 160px empty above and below the text. It is now 575px.

### D-071 — The lens track is its own token

- Date: `2026-09-17`
- Status: accepted
- Decision: `--lens-track` aliases `--outline` in light and
  `--outline-strong` in dark. No new colour literal.
- Reason: one value cannot serve both themes. `--outline-strong` is
  `#B99E9A` in light, a mauve-brown that reads as dirt behind the arcs;
  `--outline` is `#2A2838` in dark, too faint to keep the ring a complete
  shape, which is the whole reason the track is drawn. `--surface-strong` was
  tried and lost the ring almost entirely.
- The first edit reached only two of the three theme blocks: the
  `prefers-color-scheme: dark` block indents by four spaces, so a two-space
  pattern missed it and anyone on System with a dark system would have had the
  faint track. Counting the declarations caught it.

### D-072 — shadcn/ui is adopted, and Tailwind with it

- Date: `2026-09-17`
- Status: accepted, supersedes D-062 and the authored-CSS-only position
- Decision: the project adopts shadcn/ui. Tailwind v4 is installed as a
  PostCSS plugin, `class-variance-authority`, `cn`, `radix-ui` and
  `lucide-react` join it, and DESIGN-RULES 7 is rewritten as two vocabularies
  rather than one ban. The project owner asked for this directly after several
  rounds of incremental styling did not converge.
- What was argued against it, and answered: shadcn supplies primitives, and the
  complaints were about composition — empty space, no focal point, blocks of
  equal weight — which primitives do not fix. The owner made the call anyway;
  it is their product.
- What is kept, deliberately:
  - **The palette.** `tokens.css` stays the single source of colour and the
    shadcn variable names are defined *from* it in `@theme inline`. Without
    that mapping the product would arrive looking like every other shadcn app,
    and the Happy Hues set the owner supplied would be gone.
  - **The 44px target.** Upstream sizes run 24–40px. Button, Input, Select,
    Toggle and ToggleGroup were all raised, because DESIGN-RULES 12 and WCAG
    2.2 outrank a library default and an audit of this project once found 264
    targets under the minimum.
  - **The class-name law, for what this project names.** 7b still applies to
    every authored class, and the checker now recognises Tailwind's real
    grammar — `@container/name`, `*:data-[slot=x]:flex`, `-mx-1`,
    `max-h-(--radix-…)` — while still failing BEM, PascalCase, CSS Modules
    and a class built from a value. A utility carrying a colour literal fails
    too, which keeps colour law 7 intact.
- Two things that had to be fixed before anything rendered:
  - Authored CSS loaded after Tailwind won every tie, so
    `reset.css`'s `button { background: none }` erased `bg-primary` and
    every shadcn button rendered with no fill. Authored rules now sit inside
    Tailwind's `base` and `components` layers, so utilities override them.
  - The CLI installed `cn` alongside the `clsx` and `tailwind-merge` pair
    already added. Two libraries for one concern breaks CODEBASE-RULES 13, so
    the pair was removed and the official package kept.
- Migrated so far: the investigation form (Select, Input, Label,
  ToggleGroup), and every button on every route — fourteen sites across ten
  files, with links becoming `<Button asChild>` so an anchor stays an anchor.
  `components/button.css` is deleted. The remaining authored stylesheets
  still render everything else; the two systems coexist by design while the
  migration proceeds.

### D-073 — GSAP is adopted and DESIGN-RULES 11 is amended for it

- Date: `2026-09-17`
- Status: accepted, supersedes D-062 and D-063
- Decision: GSAP 3.15 with ScrollTrigger replaces the hand-written
  `IntersectionObserver` reveal. Rule 11 is rewritten to permit entrance
  motion, orchestrated staggers, scroll-linked movement, and a 900ms ceiling
  for a sequence.
- A correction worth stating plainly: the project owner asked for GSAP on the
  basis that Tailwind had unblocked it. Tailwind was never the blocker —
  D-062 recorded that the content security policy allows a bundled copy and
  that rule 11 was what ruled it out. The rule has now been changed
  deliberately, in the same change as the code, which is what the rules
  document requires.
- What did not change, because these are the reasons the rule existed:
  - No perpetual loop. Every trigger is `once: true`. A reader must be able
    to finish a page and have it hold still.
  - No number counts up through values the evidence does not support.
  - Nothing is carried by motion alone.
  - `prefers-reduced-motion` is honoured through `gsap.matchMedia`, which
    never creates the tween, so there is no start state to undo.
- The failure that had to be handled again: on a window taller than the
  document there is almost no scroll to spend, and an element below the
  trigger line waited for a position the reader could never reach. The hand
  written version needed an explicit reachability guard; ScrollTrigger needed
  one too, comparing each trigger's start against `ScrollTrigger.maxScroll`
  after every refresh. The test that caught it the first time caught it again.
- `gsap` and `@gsap/react` ship under GSAP's standard no-charge licence.

### D-074 — The chosen theme is applied before the first paint

- Date: `2026-09-17`
- Status: accepted
- Decision: a small synchronous script at the top of `<body>` reads the
  stored theme and sets `data-theme` while the document is still parsing.
  `<html>` carries `suppressHydrationWarning`, and the storage key lives in
  one module shared with ThemeToggle.
- Reason: the server renders `data-theme="light"`, and ThemeToggle only read
  storage from an effect. An effect runs after the first paint by definition,
  so a reader who had chosen dark watched the page flash white and then turn
  over. Nothing in React can fix that; only something that runs before paint
  can. The content security policy already allows `'unsafe-inline'` for
  scripts, so no policy change was needed.
- Measured: with dark stored, `data-theme` is `dark` and the canvas is
  `rgb(15, 14, 23)` at DOMContentLoaded, at the first animation frame and at
  load. The served HTML still says `light`, which is what proves the script
  is doing the work. No console warning, and the toggle shows Dark after
  hydration.
- A test records the attribute at those three moments for both themes and
  fails if any early sample disagrees with the reader's choice.

### D-075 — The loading skeleton is asserted against the stream

- Date: `2026-09-17`
- Status: accepted
- Decision: the skeleton test reads the streamed HTML rather than racing the
  browser for it.
- Reason: it delayed the document route and looked for `role="status"` in the
  page, which worked only while the server was slow. Memoizing the fixture
  parse (D-069) made the report render almost immediately, the skeleton stopped
  appearing, and the locator began matching every other live region on the
  finished page — forty-seven of them. Next puts the loading shell in the
  initial stream, so it can be read with certainty instead of caught in
  passing. The contract tested is unchanged: the shell names the task and no
  skeleton carries a digit.

## Open competition questions

These must be answered from official rules or a written organizer response. Do
not infer them from the promotional post.

| ID | Question | Why it matters | Owner | Due |
| --- | --- | --- | --- | --- |
| C-01 | Exact deadline and timezone? | submission buffer and video timing | project owner | Sep 14 |
| C-02 | Is `10,000 USDC` one prize or total prize pool? | public copy and pitch accuracy | project owner | Sep 14 |
| C-03 | Who is eligible and what countries are excluded? | valid participation | project owner | Sep 14 |
| C-04 | Solo/team rules and maximum team size? | contributor plan | project owner | Sep 14 |
| C-05 | Required registration and submission platform? | avoid invalid submission | project owner | Sep 14 |
| C-06 | Required artifacts and demo-video limit? | submission package | project owner | Sep 15 |
| C-07 | Official judging criteria and weights? | prioritize demo and implementation | project owner | Sep 15 |
| C-08 | Must the repository be public? | repository visibility/license | project owner | Sep 15 |
| C-09 | What qualifies as new/original work? | use of prior UI knowledge/assets | project owner | Sep 15 |
| C-10 | Are paid services and purchased API credits allowed equally? | budget/equity and deployment | project owner | Sep 15 |
| C-11 | Are production deployment and open-source license required? | release/legal plan | project owner | Sep 15 |
| C-12 | How and when are winners paid; KYC/tax requirements? | eligibility and prize handling | project owner | Sep 16 |

## Open product/data questions

| ID | Question | Planned resolution | Due |
| --- | --- | --- | --- |
| ~~P-01~~ | ~~Which exact endpoint best resolves exact-address token context?~~ | resolved: Token Screener with `filters.token_address`, verified Sep 15 (D-017) | closed |
| P-02 | What is the precise sign meaning of exchange net flow? | inspect docs and live response; ask Nansen if ambiguous | Sep 15 |
| ~~P-03~~ | ~~Which target chain has the most compelling reliable demo token?~~ | partially resolved: all three chains verified live (D-034); the demo token remains the Ethereum capture | Sep 16 |
| P-04 | Are source timestamps available consistently enough for timing concentration? | inspect live schemas; disable component if absent | Sep 18 |
| P-05 | What model/provider will generate the brief? | benchmark one small structured-output model and fallback | Sep 21 |
| P-06 | Does production hosting support reliable server cache/rate limiting? | verify selected host; choose managed Redis if needed | Sep 18 |
| P-07 | What license should the public repository use? | decide after official original-work rules are confirmed | Sep 15 |

## Assumption register

| Assumption | Risk if wrong | Mitigation |
| --- | --- | --- |
| Approximately two weeks are available | compressed or invalid schedule | confirm C-01 immediately; keep Sep 27 internal target |
| Core endpoints support target chains/timeframes | scope and demo fail | live spike before UI build; reduce chains, never fake support |
| Four core calls fit available credits | blocked testing/deployment | cache, record calls, buy credits only after spike if needed |
| Related-wallet evidence is useful on a selected demo actor | weaker differentiation | keep relationship feature on demand; demo cohort evidence still stands |
| A model brief improves comprehension | adds latency without value | core analytics and deterministic brief remain complete |

## Change protocol

When an open question is answered:

1. Link or quote the authoritative source without exposing private credentials.
2. Convert the item into a dated decision.
3. Update affected product, interface, data, delivery, test, and demo documents.
4. Create or update acceptance tests.
5. Note any scope or deadline effect in the GitHub issue tracker.

No resolved question should remain documented only in chat or personal notes.
