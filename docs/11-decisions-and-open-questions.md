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
| P-01 | Which exact endpoint best resolves exact-address token context? | compare Token Information and Token Screener in live spike | Sep 15 |
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
