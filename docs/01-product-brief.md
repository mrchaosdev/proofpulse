# 01 — Product brief

## Product statement

ProofPulse is an evidence-first onchain investigation workspace. A trader enters
a token and receives three separate answers:

1. Are observed participant flows leaning toward accumulation or distribution?
2. How complete and internally consistent is the available evidence?
3. Is activity concentrated among related or unusually dominant wallets?

The product explains each answer with inspectable Nansen evidence. It does not
issue a buy/sell recommendation or predict price.

## Problem

Token researchers commonly see a price move, social post, or wallet alert before
they understand its cause. Answering basic follow-up questions requires switching
among token dashboards, wallet pages, flow tables, and notes. This creates three
failure modes:

- speed wins over verification;
- a single impressive wallet is mistaken for broad conviction; and
- AI summaries sound authoritative without showing which data supports them.

## Target user

Primary persona: an active onchain trader or researcher who understands token
addresses and wallet activity but needs a faster, defensible first-pass review.

Secondary persona: a community analyst who needs a shareable explanation of a
token move without exposing private notes or API credentials.

Not a target persona for the MVP: a first-time crypto user expecting portfolio
management, a fully automated trading desk, or an investigator requiring legal
attribution of wallet ownership.

## Jobs to be done

- “When a token starts moving, help me determine whether credible cohorts are
  accumulating or distributing before I spend time on a full thesis.”
- “When a small number of wallets dominate activity, show me observable links
  and concentration so I do not mistake coordination for consensus.”
- “When I share a conclusion, give me evidence, timestamps, and limitations so
  another person can challenge it.”

## Value proposition

### Fast

One token investigation should reach a useful partial result within five seconds
and a complete result within fifteen seconds under normal API conditions.

### Explainable

Every headline statement expands to the source dataset, value, timeframe,
collection time, and derivation note.

### Honest

Direction, confidence, and coordination risk are separate. Missing or stale data
reduces confidence instead of being silently treated as neutral.

### Native to Nansen

The core experience depends on Nansen cohort flows, wallet relationships, and
trader performance. Replacing Nansen with a generic price API should materially
degrade the product.

## MVP promise

Given a supported chain and valid token address, the user can:

- run an investigation over `1h`, `6h`, `1d`, or `7d` where supported;
- inspect token context and cohort net flows;
- see top net buyers and sellers;
- expand selected actors into related-wallet evidence;
- view Direction, Confidence, and Coordination Risk with component breakdowns;
- read a short evidence-grounded brief and explicit invalidation conditions;
- copy a compact investigation summary; and
- understand data freshness, partial failures, and product limitations.

## MVP scope

### P0 — must ship

- Public landing page with one clear example and limitations.
- Token investigation workspace.
- Initial chain support: Ethereum, Solana, and Base.
- Address-first search; symbol lookup may assist but never silently chooses.
- Flow Intelligence, Who Bought/Sold, and Token Screener integration.
- Related Wallets lookup on user-selected actors, not automatically for every
  actor.
- Transparent three-score model.
- Evidence drawer and generated brief.
- Dark and light themes.
- Responsive desktop and mobile layouts.
- Live mode plus a clearly labeled timestamped demo fixture.
- Methodology page.

### P1 — ship only after P0 acceptance

- Investigation comparison between two timeframes.
- Local recent-investigation history.
- Shareable, server-stored snapshot with expiry.
- Alert handoff to Telegram or Discord.
- Export as image or Markdown.

### Explicitly out of scope

- Trade execution, swaps, wallet connection, custody, or transaction signing.
- Autonomous trading or portfolio rebalancing.
- Price targets, return forecasts, and “buy/sell” commands.
- Claims that related wallets have the same owner.
- Full historical backtesting beyond Nansen retention limits.
- User accounts, billing, teams, and persistent watchlists.
- A general-purpose chat interface.

## Core journey

1. User opens the workspace and selects a chain.
2. User pastes a token address; ProofPulse validates before making a paid call.
3. Token identity is shown and the user confirms if resolution is ambiguous.
4. The product fetches independent datasets in parallel.
5. Useful sections appear progressively, each with freshness and status.
6. Deterministic scoring runs only over available normalized evidence.
7. The brief is generated from evidence IDs and checked before display.
8. User inspects a score contribution or expands one wallet relationship.
9. User copies a summary that contains timestamp and limitations.

## Success criteria

### Buildathon success

- A judge understands the problem and differentiated Nansen use in 20 seconds.
- The live demo completes one investigation without manual data editing.
- At least three distinct Nansen capabilities visibly affect the output.
- A judge can click from any conclusion to supporting evidence.
- The demo continues with a labeled fixture if an external service fails.

### Product success for five test users

- Four of five can start an investigation without instruction.
- Four of five correctly explain the difference between Direction and Confidence.
- No tester interprets Coordination Risk as proof of fraud after reading the UI.
- Median time to identify the strongest supporting and contradicting evidence is
  under 60 seconds.
- System Usability Scale target: at least 75.

## Product narrative

The demo should not say “AI found the next token.” It should say:

> A token moved. ProofPulse separated direction from evidence quality, exposed
> concentration among related actors, and produced a brief that can be audited.

## Constraints

- Build window is approximately two weeks.
- Nansen credits are finite and Free-plan calls consume more credits than Pro
  calls; caching and on-demand wallet expansion are product requirements.
- API coverage and data retention vary by endpoint and chain.
- The official public announcement does not yet expose the complete eligibility,
  judging, and submission rulebook; unresolved items are tracked in
  [11-decisions-and-open-questions.md](11-decisions-and-open-questions.md).
