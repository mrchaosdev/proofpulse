# 05 — Data and scoring

## Data philosophy

ProofPulse is a presentation and derivation layer over Nansen evidence. It does
not present its scores as Nansen scores, and it must not imply that Nansen
endorses ProofPulse's interpretations.

Official references:

- [Endpoint overview](https://docs.nansen.ai/about/endpoints-overview)
- [Token Screener](https://docs.nansen.ai/api/token-god-mode/token-screener)
- [Flow Intelligence](https://docs.nansen.ai/api/token-god-mode/flow-intelligence)
- [Who Bought/Sold](https://docs.nansen.ai/api/token-god-mode/who-bought-sold)
- [Related Wallets](https://docs.nansen.ai/api/profiler/address-related-wallets)
- [Address PnL](https://docs.nansen.ai/api/profiler/address-pnl-and-trade-performance)
- [Credits and pricing](https://docs.nansen.ai/getting-started/credits)

Only stable `/api/v1` endpoints are allowed. Deprecated `/beta` endpoints are
forbidden.

## Core endpoint budget

Credit costs below are planning values from the Nansen documentation and must be
checked again when implementation starts.

| Dataset | Nansen capability | P0 use | Pro / Free credits per call |
| --- | --- | --- | ---: |
| Token universe/context | `tgm/token-screener` | identify market/liquidity context | `1 / 10` |
| Cohort flows | `tgm/flow-intelligence` | primary directional evidence | `1 / 10` |
| Buyers | `tgm/who-bought-sold` with `BUY` | actor concentration | `1 / 10` |
| Sellers | `tgm/who-bought-sold` with `SELL` | actor concentration | `1 / 10` |
| Related wallets | `profiler/address/related-wallets` | on-demand relationship evidence | `1 / 10` |
| Wallet performance | `profiler/address/pnl-summary` | optional actor context | `1 / 10` |
| Smart Money market scan | `smart-money/netflow` | P1 discovery, not core investigation | `5 / 50` |
| Address labels | `profiler/address/labels` | excluded from automatic MVP flow | high cost |

Normal P0 investigation target: four calls before optional expansion. The system
may use a different token-information endpoint if live testing shows it is more
reliable than Token Screener for exact-address context; record that as a decision.

## Supported scope

Initial chains:

- `ethereum`
- `solana`
- `base`

Primary timeframes:

- `1h`
- `6h`
- `1d`
- `7d`

An endpoint may support a different set. The adapter must expose support metadata
and refuse invalid combinations rather than approximating them silently.

## Normalized contracts

These are domain contracts, not copies of Nansen response objects.

```ts
type Chain = "ethereum" | "solana" | "base";
type Timeframe = "1h" | "6h" | "1d" | "7d";

type InvestigationInput = {
  chain: Chain;
  tokenAddress: string;
  timeframe: Timeframe;
  mode: "live" | "fixture";
};

type SourceMeta = {
  provider: "nansen";
  capability: string;
  collectedAt: string;
  sourceFrom?: string;
  sourceTo?: string;
  live: boolean;
  warnings: string[];
};

type SegmentFlow = {
  segment:
    | "smart_trader"
    | "top_pnl"
    | "whale"
    | "fresh_wallet"
    | "public_figure"
    | "exchange";
  netFlowUsd: number | null;
  averageFlowUsd: number | null;
  walletCount: number | null;
  source: SourceMeta;
};

type Actor = {
  address: string;
  displayLabel: string | null;
  boughtUsd: number | null;
  soldUsd: number | null;
  netUsd: number | null;
  side: "buyer" | "seller";
  source: SourceMeta;
};

type Relationship = {
  sourceAddress: string;
  targetAddress: string;
  targetLabel: string | null;
  relation: string;
  transactionHash: string | null;
  observedAt: string | null;
  source: SourceMeta;
};

type Evidence = {
  id: string;
  kind: "observation" | "derivation" | "warning";
  statement: string;
  numericValue?: number;
  unit?: "usd" | "count" | "ratio" | "score";
  polarity: "supports_accumulation" | "supports_distribution" | "neutral";
  sourceEvidenceIds: string[];
  source: SourceMeta;
};
```

All external values are parsed with a runtime schema. Invalid records are dropped
with a warning; an entire response is not trusted because its HTTP status is 200.

## Evidence IDs

Evidence IDs are stable within an investigation, readable, and non-secret:

```text
FLOW-SM-01      Smart Trader net flow
FLOW-WHALE-01   Whale net flow
ACTOR-BUY-03    Third-ranked buyer
REL-01-04       Relationship from selected actor to fourth related wallet
DER-DIR-01      Direction derivation
WARN-SRC-02     Source warning or missing dataset
```

A model brief may reference only IDs included in its input.

## Freshness and caching

| Dataset | Fresh target | Cache TTL | Stale after |
| --- | ---: | ---: | ---: |
| Token context | 60 seconds | 60 seconds | 5 minutes |
| Flow Intelligence | 2 minutes | 2 minutes | 10 minutes |
| Who Bought/Sold | 5 minutes | 5 minutes | 15 minutes |
| Related Wallets | 30 minutes | 30 minutes | 24 hours |
| PnL summary | 15 minutes | 15 minutes | 60 minutes |
| Generated brief | same as evidence hash | until evidence changes | when evidence changes |

Cache keys include endpoint version, chain, canonical address, timeframe/date
range, normalized filters, and schema version. Errors are not cached longer than
30 seconds. Credentials are never part of a cache key.

## Score model

The three outputs answer different questions and must not be merged.

### 1. Direction: `-100..+100`

Question: **Do observed participant flows lean toward distribution or
accumulation?**

For each returned segment `i`:

```text
normalized_flow_i = tanh(net_flow_usd_i / scale)
scale = max(token_liquidity_usd × 0.01, 50,000)
```

If reliable liquidity is unavailable:

```text
scale = max(median(abs(returned_segment_flows)), 50,000)
```

Weights:

| Segment | Weight | Sign convention |
| --- | ---: | --- |
| Smart Traders | `0.35` | positive flow supports accumulation |
| Top PnL | `0.25` | positive flow supports accumulation |
| Whales | `0.15` | positive flow supports accumulation |
| Fresh Wallets | `0.10` | positive flow supports accumulation, lower trust |
| Public Figures | `0.05` | positive flow supports accumulation, lower trust |
| Exchanges | `0.10` | positive deposits are treated as distribution pressure only if endpoint semantics confirm this |

Weights of missing segments are removed and remaining weights are renormalized.
Exchange sign must be verified during the live API spike; until verified, its
weight is zero and it remains visible as context.

```text
direction = round(100 × weighted_mean(normalized_flow_i))
```

Labels:

- `+35..+100`: accumulation-leaning
- `-34..+34`: mixed
- `-100..-35`: distribution-leaning

This measures flow direction only. It is not bullish/bearish price probability.

### 2. Confidence: `0..100`

Question: **How much trust should be placed in this investigation's evidence
coverage and consistency?**

| Component | Maximum | Rule |
| --- | ---: | --- |
| Required-source coverage | 30 | proportional to valid token, flow, buyer, and seller datasets |
| Freshness | 20 | full when within fresh target; linearly decays to zero at stale threshold |
| Participant breadth | 20 | based on returned cohort wallet counts, capped to resist outliers |
| Cross-segment consistency | 20 | higher when independent higher-trust cohorts agree; never removes contradicting evidence |
| Warning/schema quality | 10 | reduced by Nansen warnings, dropped records, fallbacks, or unverified semantics |

Labels:

- `0..44`: low confidence
- `45..69`: medium confidence
- `70..100`: high confidence

Fixture mode caps displayed Confidence at 69 and adds “historical fixture” next
to the label; this prevents a deterministic demo from appearing live.

### 3. Coordination Risk: `0..100`

Question: **How concentrated or relationally connected is the observed actor
activity?**

| Component | Maximum | Rule |
| --- | ---: | --- |
| Top-actor concentration | 40 | share of absolute actor net volume held by top 1 and top 3 actors |
| Related-wallet density | 30 | observed first-degree related nodes/edges among inspected actors, capped |
| Timing concentration | 20 | only if source timestamps support a defined activity window |
| Effective actor diversity | 10 | inverse normalized diversity of actor contribution |

Labels:

- `0..29`: low
- `30..59`: moderate
- `60..100`: elevated

If no relationship request has run, the output is `Not assessed`, not zero. If
only concentration is available, show `Preliminary` and cap the score at 59.

## Score safeguards

- Clamp only final numeric results; log out-of-range intermediate values as a
  derivation warning.
- Never include missing fields as zeros.
- Round display values only after calculations.
- Exact formula version is stored with the investigation, starting `score-v0.1`.
- Every contribution generates a derivation evidence item.
- Thresholds are hypotheses for the Buildathon MVP and require calibration on
  sample tokens before any production claim.

## Brief contract

```ts
type InvestigationBrief = {
  observation: string;
  support: Array<{ text: string; evidenceIds: string[] }>;
  contradiction: Array<{ text: string; evidenceIds: string[] }>;
  invalidationConditions: Array<{ text: string; evidenceIds: string[] }>;
  limitations: string[];
};
```

Validation pipeline:

1. Parse schema.
2. Reject unknown evidence IDs.
3. Extract every rendered number and compare with cited normalized values.
4. Reject prohibited recommendation language.
5. If any check fails, render the deterministic summary.

## Fixture policy

- Capture only Nansen response bodies needed for the demo; strip headers and
  credentials before writing.
- Record capture timestamp, chain, address, timeframe, endpoint version, and
  schema version.
- Commit sanitized fixtures only after manual secret scan.
- Never modify values to create a stronger story.
- Replace fixtures if older than seven days before submission, unless retention
  limits make the historical example itself the point.
