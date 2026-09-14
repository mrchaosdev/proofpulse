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
| P-03 | Which target chain has the most compelling reliable demo token? | sample three chains with fixed call budget | Sep 16 |
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
