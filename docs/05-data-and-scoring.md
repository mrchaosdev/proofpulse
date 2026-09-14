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

Paths and credit costs were verified against the live API on `2026-09-15`
(decision D-017). All requests are `POST` and authenticate with an `apikey`
header against `https://api.nansen.ai`.

| Dataset | Verified path | P0 use | Credits per call |
| --- | --- | --- | ---: |
| Token universe/context | `/api/v1/token-screener` | identify market/liquidity context | `1` |
| Cohort flows | `/api/v1/tgm/flow-intelligence` | primary directional evidence | `1` |
| Buyers | `/api/v1/tgm/who-bought-sold` with `BUY` | actor concentration | `1` |
| Sellers | `/api/v1/tgm/who-bought-sold` with `SELL` | actor concentration | `1` |
| Related wallets | `/api/v1/profiler/address/related-wallets` | on-demand relationship evidence | `1` |
| Smart Money market scan | `smart-money/netflow` | P1 discovery, not core investigation | unverified |
| Address labels | `profiler/address/labels` | excluded from automatic MVP flow | unverified |

Token Screener is the one core endpoint **not** under the `tgm/` prefix.

Cost is `1` credit per call on both the Free and Pro plans; the earlier
`1 / 10` planning figure was wrong. The binding constraint is the balance, not
the per-call price:

- Free: `100` one-time credits, then a daily top-up back to `10` if the balance
  falls below `10`.
- Pro: `2,000` on subscription, topped back up to `2,000` monthly.

A core investigation therefore costs `4` credits, which is roughly `2` complete
investigations per day on a depleted Free balance. Caching and on-demand wallet
expansion are not optimizations; without them the product cannot be demonstrated.

Normal P0 investigation target: four calls before optional expansion.

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

The endpoints do not share one timeframe vocabulary, so the adapter translates a
domain timeframe per endpoint rather than passing it through:

| Domain | Flow Intelligence | Token Screener | Who Bought/Sold |
| --- | --- | --- | --- |
| `1h` | `1h` | `1h` | `from`/`to` window |
| `6h` | `6h` | `6h` | `from`/`to` window |
| `1d` | `1d` | `24h` | `from`/`to` window |
| `7d` | `7d` | `7d` | `from`/`to` window |

Flow Intelligence accepts `5m, 1h, 6h, 12h, 1d, 7d`. Token Screener accepts
`5m, 10m, 1h, 6h, 24h, 7d, 30d`. Who Bought/Sold has no timeframe parameter at
all and takes an explicit ISO 8601 `date.from`/`date.to` window, which the
adapter derives from the selected timeframe and a single injected clock read.

Sending `1d` to Token Screener returns `422 invalid_field_value`. The adapter
must refuse or translate an invalid combination rather than approximating it
silently.

## Verified upstream quirks

Observed on `2026-09-15` against LINK on Ethereum. Each is pinned by a contract
test in `tests/contract/nansen-schemas.test.ts`.

### Wallet counts that are never populated

Flow Intelligence returns this in `warnings`:

> `exchange_wallet_count` is always 0 (not tracked), even when exchange net flow
> is non-zero.
>
> `fresh_wallets_wallet_count` is always 0 (not tracked), even when fresh-wallet
> net flow is non-zero.

These two fields arrive as `0` but mean *not tracked*. The normalizer maps them
to `null`. Carrying them through as `0` would convert missing data to zero,
which rule 1.4 forbids, and would silently deflate the Confidence participant
breadth component. A `0` from any other cohort is a genuine observation and is
preserved.

### No token name

Token Screener returns `token_symbol` and no token name field. A resolved token
therefore has a symbol and no display name. The name stays `null`; it is not
back-filled from the symbol.

### No net field for actors

Who Bought/Sold returns `bought_volume_usd` and `sold_volume_usd` but no net
value. Net is derived as `bought - sold` and recorded as a derivation. A record
with neither side present yields `null`, not `0`.

### Empty labels

`address_label` arrives as `""` for an unlabelled address. An empty label is an
absent label and normalizes to `null`.

### Observed latency

`461-806ms` per call, four calls in parallel. This is comfortably inside the
five-second partial-result budget; latency is not the constraint, credits are.

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
