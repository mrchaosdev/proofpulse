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
