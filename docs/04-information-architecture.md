# 04 — Information architecture

## Route map

| Route | Phase | Purpose |
| --- | --- | --- |
| `/` | P0 | Explain the problem, show one real example, expose limitations, enter workspace |
| `/investigate` | P0 | Empty workspace and token input |
| `/investigate/[chain]/[address]` | P0 | Canonical investigation URL; timeframe remains a query parameter |
| `/methodology` | P0 | Explain evidence, formulas, thresholds, freshness, and limitations |
| `/about` | P1 | Buildathon context, team, source, and acknowledgements |
| `/compare` | P1 | Compare two timeframes or two tokens after core investigation works |

No authentication, wallet, trading, settings, or billing route exists in the
MVP.

## Global navigation

Desktop navigation contains:

- ProofPulse brand → `/`;
- `Investigate` → `/investigate`;
- `Methodology` → `/methodology`;
- theme control;
- GitHub source link; and
- live API status/fixture indicator.

Mobile uses the same destinations in a compact top navigation. A bottom bar is
allowed only if it does not cover evidence controls or browser safe areas.

## Landing page

The landing page has five sections in this order:

1. **Hero:** product statement, address input, chain selector, and `Investigate`.
2. **Example investigation:** static but timestamped example that demonstrates
   Direction, Confidence, and Coordination Risk.
3. **How evidence becomes an answer:** three steps—collect, separate, explain.
4. **Boundaries:** no predictions, trading, ownership claims, or hidden sources.
5. **Build context:** Nansen API dependency, Buildathon, methodology, and source.

The hero must not wait for a visual effect or API request. A visitor must
understand the product before scrolling.

## Investigation screen

### Desktop wireframe

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Top bar · brand · API state · theme · methodology · source              │
├───────────────┬──────────────────────────────────────────────────────────┤
│ Investigation │ Token identity · chain · address · timeframe · refresh  │
│ navigation    ├──────────────┬──────────────┬────────────────────────────┤
│               │ Direction    │ Confidence   │ Coordination risk          │
│ Recent local  ├──────────────┴──────────────┴────────────────────────────┤
│ investigations│ Evidence status strip                                   │
│               ├─────────────────────────────┬────────────────────────────┤
│ Methodology   │ Cohort flow comparison      │ Model-assisted brief       │
│ Source        │                             │ + invalidation conditions  │
│               ├─────────────────────────────┼────────────────────────────┤
│               │ Top buyers and sellers      │ Supporting / contradicting │
│               ├─────────────────────────────┴────────────────────────────┤
│               │ Selected-wallet relationship graph + table alternative  │
│               ├──────────────────────────────────────────────────────────┤
│               │ Evidence ledger                                          │
└───────────────┴──────────────────────────────────────────────────────────┘
```

The sidebar is optional at medium widths and may remain hidden until local
history exists. The analytical hierarchy must not depend on it.

## Screen-region contracts

### 1. Investigation header

Required fields:

- token name and symbol if resolved;
- full chain name;
- visually shortened address plus copy control and full accessible label;
- selected timeframe;
- last collection time and timezone;
- live/fixture indicator; and
- refresh action with expected credit-impact category.

If token identity is ambiguous, no investigation runs until the user confirms
the chain/address pair.

### 2. Score rail

The scores render in this order:

1. Direction: `-100..+100` and category.
2. Confidence: `0..100` and category.
3. Coordination Risk: `0..100` and category.

Each card includes a one-sentence definition and opens the contribution panel.
When inputs are missing, a score may be unavailable. It must never render a
neutral-looking zero as a substitute.

### 3. Evidence status strip

One compact item per requested dataset:

- token context;
- cohort flows;
- buyers/sellers;
- wallet relationships if requested; and
- model brief.

Each item displays `loading`, `ready`, `empty`, `stale`, `error`, or `not
requested`. The strip is the authoritative explanation for partial results.

### 4. Cohort flow panel

Question: **Which participant groups accumulated or distributed this token?**

Required:

- zero-centered horizontal bars or table;
- Smart Traders, Top PnL, Whales, Fresh Wallets, Public Figures, and Exchanges
  when returned;
- net flow USD, wallet count, timeframe, and sign label;
- written strongest supporting and contradicting observations; and
- accessible table containing all plotted values.

Exchange flow interpretation must state the convention used; it is not silently
treated like wallet accumulation.

### 5. Buyer/seller panel

Question: **Who dominated recent net buying and selling?**

Required:

- separate buyer and seller tabs or adjacent lists;
- address/label, bought USD, sold USD, and net USD where derivable;
- sort state and limited result count;
- `Inspect relationships` control per actor; and
- no ownership inference from labels or related-wallet data.

### 6. Model-assisted brief

Required sections:

- observed state in no more than 80 words;
- strongest supporting evidence;
- strongest contradicting evidence;
- invalidation conditions; and
- limitations.

Every bullet includes clickable evidence IDs. The deterministic summary replaces
this panel if model validation fails.

### 7. Relationship panel

Initially shows an explanation and no paid request. After the user selects an
actor:

- show selected address, source list, request status, and credit-impact label;
- render first-degree related wallets only for P0;
- preserve Nansen relationship types;
- offer graph and table views; and
- calculate concentration/graph contributions only from fetched evidence.

### 8. Evidence ledger

The ledger is the audit surface. It lists every normalized evidence item used by
scores or prose, including items that contradict the dominant direction.

Columns:

- Evidence ID
- Observation
- Source endpoint
- Timeframe/source time
- Collected time
- Score effect
- Status/warning

Raw normalized JSON may be copied from an expanded row. Credentials and raw HTTP
headers are never included.

## Interaction state machine

```text
idle
  → validating
  → resolving-token
  → fetching-core
      ├─→ partial-ready ─→ retry-failed-source
      └─→ evidence-ready
              → scoring
              → brief-generating
              → complete

complete → refresh-confirmed → fetching-core
complete → wallet-selected → fetching-relationships → complete
```

Rules:

- Invalid input returns to `idle` with a field-level error.
- `partial-ready` is a useful state, not a blocking error page.
- Scoring does not wait for the model brief.
- Relationship fetching never restarts core investigation calls.
- Navigating to another token cancels or ignores stale in-flight responses.

## Empty, failure, and recovery flows

### Invalid address

Explain the expected format for the chosen chain. Make no Nansen request.

### Unsupported chain

Disable the chain or timeframe before submission and link to methodology.

### Token not found

Preserve the input, suggest checking chain/address, and make no interpretive
claim.

### Insufficient credits

Keep cached evidence, mark unfetched panels, and link to the Nansen API page.
Never auto-purchase or retry continuously.

### Rate limit

Show a bounded retry time if available. Do not switch silently to fixture mode.

### Model unavailable

Show the deterministic summary; scores and evidence remain available.

### Nansen unavailable during demo

Offer `Open timestamped demo` as a deliberate user choice. Keep the fixture
banner visible for the entire session.

## URL rules

- Chain and canonical token address are path data.
- Timeframe is a query parameter such as `?timeframe=1d`.
- No API key, model prompt, internal evidence payload, or personally identifying
  session value may appear in a URL.
- Unknown query values fall back visibly and are never forwarded unvalidated.
