# 09 — Delivery plan

## Planning assumptions

- Work begins `2026-09-14`.
- The public Nansen countdown observed on launch day implies an approximate end
  around `2026-09-28 00:00 UTC` (`07:00 ICT`). This is not treated as confirmed
  until official rules are visible after login.
- Internal submission target is `2026-09-27 18:00 ICT` to preserve a buffer.
- Plan fits one full-stack builder. If more people join, workstreams can split but
  scope and acceptance gates do not change.

## Milestones

| Date | Milestone | Exit condition |
| --- | --- | --- |
| Sep 14 | Specification baseline | P0 documents committed; open questions visible |
| Sep 15 | API feasibility spike | one live token flow normalized; costs and semantics recorded |
| Sep 17 | Vertical slice | address → live evidence → deterministic Direction on one chain |
| Sep 20 | Core investigation | three chains where supported, partial states, all core evidence |
| Sep 22 | Explainability | scores, evidence ledger, validated brief/fallback |
| Sep 24 | Demo candidate | relationship graph, responsive UI, fixture path, deployment |
| Sep 25 | User test and hardening | five tests or equivalent structured review; P0 defects triaged |
| Sep 26 | Release candidate | acceptance suite, security scan, final content |
| Sep 27 | Submission package | video, deck, README, source, form submitted by 18:00 ICT |

## Daily plan

### Sep 14 — documentation and competition access

- Finish product, interface, data, architecture, safety, test, and demo documents.
- Log into Nansen and locate official rules/submission instructions.
- Create API key without storing it in the repository.
- Convert unresolved competition items into confirmed decisions.
- Create GitHub issues for P0 milestones.

Deliverable: accepted specification baseline and competition checklist.

### Sep 15 — Nansen API spike

- Test token context, Flow Intelligence, and Who Bought/Sold with one token.
- Record actual response shapes, latency, warnings, supported timeframe/chain
  combinations, and observed credit consumption.
- Verify exchange-flow sign semantics.
- Decide token information source.
- Capture sanitized contract fixtures.

Deliverable: one script or server test that turns a real response into normalized
domain data, plus decisions recorded in document 11.

### Sep 16 — scaffold and domain

- Scaffold pinned Next.js/TypeScript project.
- Add semantic tokens, fonts, lint, test runner, and CI.
- Implement domain schemas, evidence builder, and pure scoring functions.
- Add unit tests for missing values, outliers, and thresholds.

Deliverable: green CI with score/evidence tests; no polished interface required.

### Sep 17 — first vertical slice

- Implement server-only Nansen client and cache interface.
- Add one investigation route and one supported chain.
- Render token header, source states, Direction, and evidence rows.
- Ensure invalid input makes zero paid calls.

Deliverable: deployed or local vertical slice using live data.

### Sep 18 — core data adapters

- Add buyers, sellers, Flow Intelligence, and token context normalizers.
- Use settled parallel requests and partial result envelope.
- Implement structured upstream errors and retry boundaries.
- Expand contract fixtures.

Deliverable: complete core investigation payload with per-source status.

### Sep 19 — investigation interface

- Build workspace shell, input, token identity, score rail, and status strip.
- Build cohort flow comparison and accessible data table.
- Implement all loading, empty, partial, stale, and error states.

Deliverable: desktop core journey meeting interface rules.

### Sep 20 — supported scope and responsive pass

- Add Ethereum, Solana, and Base validation/capability matrix.
- Add timeframe controls and canonical URLs.
- Implement mobile layout and keyboard flow.
- Test unsupported combinations explicitly.

Deliverable: core journey on target chains where API evidence is supported.

### Sep 21 — evidence and methodology

- Finish evidence ledger and score contribution drawers.
- Build server-rendered methodology page from implemented formula constants.
- Add copy/export with timestamp, mode, and limitation.

Deliverable: every score is auditable without model output.

### Sep 22 — grounded brief

- Implement provider-neutral model adapter and schema.
- Add evidence-ID, numeric, and prohibited-language validation.
- Implement deterministic brief fallback.
- Add injection, hallucination, timeout, and invalid-ID tests.

Deliverable: generated prose cannot bypass evidence rules.

### Sep 23 — relationship investigation

- Add on-demand Related Wallets adapter.
- Add graph and table views with first-degree cap.
- Implement preliminary/full Coordination Risk rules.
- Verify calls are not repeated by navigation or re-render.

Deliverable: selected actor expands into inspectable relationship evidence.

### Sep 24 — landing and demo fixture

- Build landing page around problem, example, process, and limitations.
- Capture and sanitize the intended demo fixture.
- Make live/fixture adapter parity test pass.
- Deploy preview and run complete demo path.

Deliverable: demo candidate that survives external API failure.

### Sep 25 — user tests

- Test with five target-like users when available.
- Measure task completion, score comprehension, evidence discovery time, and
  language misinterpretation.
- Fix P0 usability and honesty issues; log P1 requests without expanding scope.

Deliverable: findings table and revised interface copy.

### Sep 26 — release candidate

- Run unit, contract, integration, browser, accessibility, and performance checks.
- Scan source, Git history, fixture files, and client bundle for secrets.
- Verify production security headers and cache/rate-limit behavior.
- Freeze features and fix only release blockers.

Deliverable: tagged or recorded release-candidate commit.

### Sep 27 — submission

- Run one controlled live smoke test.
- Record 90–120 second demo video.
- Finish concise public README, architecture image, screenshots, and pitch deck.
- Verify every external link in an incognito session.
- Submit by `18:00 ICT` and save confirmation.

Deliverable: accepted submission package with buffer before inferred deadline.

## Work split for a three-person team

| Workstream | Primary responsibility |
| --- | --- |
| Data/backend | Nansen adapters, schemas, cache, scoring, security |
| Product/frontend | design system, investigation UI, charts, graph, accessibility |
| Narrative/quality | grounded brief, fixtures, tests, user research, demo/deck |

All three review product semantics and the final demo. No workstream can change
score meaning independently.

## GitHub workflow

- `main` remains deployable.
- Branches: `feat/...`, `fix/...`, `docs/...`, `test/...`.
- Conventional commits with one coherent purpose.
- P0 work maps to GitHub issues carrying requirement IDs from document 8.
- Pull requests include screenshots for interface changes and test evidence.
- Formula or product-rule changes update docs and tests in the same pull request.
- No force push to shared `main`.

Suggested issue labels:

- `p0`, `p1`, `blocked`
- `product`, `data`, `ui`, `security`, `testing`, `submission`
- `credit-cost`, `needs-nansen-confirmation`

## Scope-cut order

If behind schedule, cut in this order:

1. Compare route.
2. Shareable server snapshots.
3. Local recent history beyond the current session.
4. Model-generated prose; deterministic brief remains.
5. Relationship graph animation; table remains.
6. Light theme only if contrast/accessibility cannot be completed safely.
7. Reduce supported chains based on live API evidence.

Never cut evidence traceability, error/fixture labeling, secret protection,
methodology, core tests, or the offline demo fallback.

## Daily operating rules

- Start with the riskiest unproven assumption, not visual polish.
- End each day with a runnable main branch and a short decision/update note.
- Track real API calls and approximate credits consumed.
- Do not add a dependency without stating the problem it solves.
- Freeze P1 work until Gate B passes.
- After Sep 24, new features require replacing an existing feature of equal or
  greater cost.
