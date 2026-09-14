# ProofPulse specification index

Version: `0.1`  
Baseline date: `2026-09-14`  
Status: `planning`  
Target internal submission: `2026-09-27 18:00 ICT`

This directory is the source of truth for the first build. It exists to prevent
scope drift, fabricated analytics, inconsistent interface decisions, and a demo
that works only on the author's machine.

## Reading order

| Document | Question it answers | Build gate |
| --- | --- | --- |
| [01 — Product brief](01-product-brief.md) | Who is this for, what problem is solved, and what is in the MVP? | P0 |
| [02 — Product rules](02-product-rules.md) | What must the product always and never do? | P0 |
| [03 — Interface rules](03-interface-rules.md) | How must every screen look and behave? | P0 |
| [04 — Information architecture](04-information-architecture.md) | What routes, states, and screen regions exist? | P0 |
| [05 — Data and scoring](05-data-and-scoring.md) | Which Nansen evidence is used and how are scores derived? | P0 |
| [06 — Technical architecture](06-technical-architecture.md) | How is the product divided, deployed, cached, and observed? | P0 |
| [07 — Security and privacy](07-security-and-privacy.md) | How are secrets, inputs, model calls, and user data protected? | P0 |
| [08 — Testing and acceptance](08-testing-and-acceptance.md) | What evidence proves the MVP is finished? | P0 |
| [09 — Delivery plan](09-delivery-plan.md) | What is built each day and what gets cut first? | P0 |
| [10 — Demo and submission](10-demo-and-submission.md) | How is the value shown and packaged for judges? | P0 |
| [11 — Decisions and open questions](11-decisions-and-open-questions.md) | What has been decided, assumed, or still needs confirmation? | P0 |

## Source-of-truth priority

When two artifacts disagree, use this order:

1. Official Buildathon rules or a written Nansen clarification.
2. Product and safety rules in this directory.
3. Accepted architecture and decision records.
4. Tests and interface stories.
5. Implementation details.

A changed competition rule must be recorded in the decision log and propagated
to affected documents before code is changed.

## Build gates

### Gate A — specification complete

- All P0 documents exist and have no contradictory requirements.
- Competition deadline, team eligibility, submission format, judging rubric,
  and use-of-existing-code rules are either confirmed or visibly marked TBD.
- Product scope fits the available time and API credit budget.

### Gate B — vertical slice

- One real token can be resolved and investigated with live Nansen data.
- Every displayed conclusion links to normalized evidence.
- Missing datasets produce a partial result, not a fabricated result.

### Gate C — demo candidate

- Production deployment, deterministic demo fixture, README, video, and deck are
  complete.
- The acceptance matrix passes on desktop and mobile.
- No secret appears in the repository or browser bundle.

## Shared vocabulary

- **Investigation:** one token, one chain, one primary timeframe, and the
  normalized evidence fetched for that request.
- **Evidence:** a value returned by Nansen or deterministically derived from
  returned values, with source, timeframe, and collection time.
- **Direction:** signed market-flow interpretation from `-100` (distribution)
  to `+100` (accumulation). It is not a price forecast.
- **Confidence:** completeness, recency, breadth, and consistency of the
  evidence from `0` to `100`.
- **Coordination risk:** concentration and observable wallet relationship risk
  from `0` to `100`; it is not proof of manipulation.
- **Brief:** model-assisted prose generated only from cited evidence IDs.
- **Fixture:** a timestamped, sanitized response captured for deterministic
  development and demo fallback.

## External references

- [Buildathon announcement](https://x.com/nansen_ai/status/2099438188934897747)
- [Nansen API documentation](https://docs.nansen.ai/)
- [Nansen API credits](https://docs.nansen.ai/getting-started/credits)
- [arc-payment design reference](https://github.com/mrchaosdev/arc-payment)

The `arc-payment` repository is consulted only for interface craft: visual
hierarchy, flat terminal surfaces, semantic typography, bounded motion, state
clarity, and accessibility. ProofPulse does not reuse its payment logic,
wallet flows, chain configuration, or business rules.
