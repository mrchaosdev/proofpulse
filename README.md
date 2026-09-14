# ProofPulse

**See who moved, why it matters, and what would break the thesis.**

ProofPulse is an explainable onchain signal investigator for the Nansen Meridian
Buildathon. It turns Nansen token flows, wallet relationships, and trader
performance into an evidence-first investigation instead of an opaque buy/sell
call.

## Current phase

The vertical slice works end to end. A landing page, an investigation workspace,
and a methodology page are backed by verified Nansen adapters, a deterministic
scoring core at formula version `score-v0.1`, and a timestamped demo fixture.

```bash
npm install
npm run dev          # http://localhost:3000
npm run quality      # format, lint, types, class names, secrets, unit, contract, integration, build
npm run test-e2e     # browser journeys against the fixture (needs: npx playwright install chromium)
```

No credential is needed to try it. Without `NANSEN_API_KEY` the workspace runs
in fixture mode and says so on every screen. Open the demo directly at
`/investigate/ethereum/0x514910771af9ca656af840dff83e8264ecf986ca?timeframe=1d&mode=fixture`.

Live mode needs a Nansen key in `.env.local`; see `.env.example`. One
investigation costs four credits.

### Not built yet

- On-demand related-wallet expansion, so Coordination Risk stays preliminary.
- The model-assisted brief. Scores and the evidence ledger work without it.
- Comparison, shareable snapshots, and local history (all P1).

## Product documentation

The complete specification is indexed in [`docs/README.md`](docs/README.md):

- product brief, boundaries, and success criteria;
- non-negotiable product, design, and codebase rules;
- route map and screen contracts;
- Nansen data contracts and transparent scoring;
- technical architecture and security model;
- test plan, delivery schedule, and submission checklist; and
- decision log with unresolved competition questions.

## Intended stack

- Nansen API
- Next.js, React, and TypeScript
- authored semantic CSS with enforced class-name rules
- React Flow and Recharts
- a server-side LLM adapter for evidence-grounded summaries

The stack is a target, not yet an implementation. Exact versions will be pinned
when scaffolding begins.

## Security

Nansen API keys and model-provider credentials remain server-side. They must
never be exposed through `NEXT_PUBLIC_*`, client bundles, logs, screenshots, or
commits.

## References

- [Nansen Meridian Buildathon announcement](https://x.com/nansen_ai/status/2099438188934897747)
- [Nansen API endpoint overview](https://docs.nansen.ai/about/endpoints-overview)
- [Normative design rules](docs/DESIGN-RULES.md)
- [Normative codebase rules](docs/CODEBASE-RULES.md)
- [Process-learning reference: arc-payment](https://github.com/mrchaosdev/arc-payment)
