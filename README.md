# ProofPulse

**See who moved, why it matters, and what would break the thesis.**

ProofPulse is an explainable onchain signal investigator for the Nansen Meridian
Buildathon. It turns Nansen token flows, wallet relationships, and trader
performance into an evidence-first investigation instead of an opaque buy/sell
call.

## Current phase

Specification first. Product implementation does not begin until the P0 product,
interface, data, security, and acceptance rules are documented and reviewed.

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
