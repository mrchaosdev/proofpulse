# 08 — Testing and acceptance

## Test strategy

The product is finished only when behavior is proven at four layers:

1. **Unit:** normalization, scores, evidence, validation, copy helpers.
2. **Contract:** representative Nansen and model payloads against runtime schemas.
3. **Integration:** server routes with mocked upstream success and failure.
4. **Browser:** user journeys, responsive layout, keyboard use, and fixture demo.

Live API tests are a separate manual smoke suite because they spend credits and
depend on mutable external data.

## Required fixtures

- Valid EVM token with broad, mixed cohort flows.
- Valid Solana token.
- Strong accumulation-leaning sample.
- Strong distribution-leaning sample.
- Missing cohort fields.
- Nansen warning present.
- Empty buyers or sellers list.
- Partial endpoint timeout.
- `402` insufficient credits.
- `429` rate limit.
- Malformed numeric field.
- Related wallets with duplicate/self edges.
- Token metadata containing HTML and prompt-injection-like text.
- Model output with unknown evidence ID.
- Model output with a fabricated number.
- Model unavailable.

Committed fixtures must satisfy the fixture policy in
[05-data-and-scoring.md](05-data-and-scoring.md).

## Acceptance matrix

### Product behavior

| ID | Requirement | Evidence of acceptance |
| --- | --- | --- |
| P-01 | Valid Ethereum, Solana, and Base addresses can start supported investigations | browser tests plus live smoke |
| P-02 | Invalid address makes zero paid calls | integration call-count assertion |
| P-03 | Core sources fetch independently | one-source failure tests |
| P-04 | Partial result preserves successful evidence | browser partial-state test |
| P-05 | Direction, Confidence, and Coordination Risk remain semantically separate | unit and content assertions |
| P-06 | No score treats missing data as zero | score unit matrix |
| P-07 | Related-wallet lookup is user initiated | browser and integration call-count test |
| P-08 | Live and fixture modes use the same normalization/scoring path | module test and fixture browser test |
| P-09 | Copy/export includes scope, time, mode, and limitation | browser clipboard assertion |
| P-10 | Model failure leaves core investigation usable | browser fallback test |

### Evidence and scoring

| ID | Requirement | Evidence of acceptance |
| --- | --- | --- |
| D-01 | Every claim contains valid evidence IDs | validator property tests |
| D-02 | Every score component is inspectable | browser contribution-panel test |
| D-03 | Exchange semantics are verified or excluded from Direction | documented live-spike result and unit test |
| D-04 | Confidence decreases for missing, stale, and warned sources | score unit tests |
| D-05 | Coordination Risk is `Not assessed` before relationship analysis | unit and browser tests |
| D-06 | Preliminary coordination score is capped as specified | unit tests |
| D-07 | Display rounding does not change calculation | precision tests |
| D-08 | Formula version is returned and shown in methodology | contract and browser tests |

### Model grounding

| ID | Requirement | Evidence of acceptance |
| --- | --- | --- |
| M-01 | Unknown evidence ID rejects model output | validator unit test |
| M-02 | Unsupported numeric claim rejects output | validator unit test |
| M-03 | Trade recommendation language rejects output | prohibited-language tests |
| M-04 | Malicious token metadata is treated as data | prompt snapshot plus integration test |
| M-05 | Deterministic brief renders after rejection/timeout | browser tests |

### Interface

| ID | Requirement | Evidence of acceptance |
| --- | --- | --- |
| U-01 | No horizontal scroll at 320, 375, 768, 1024, and 1440 widths | Playwright viewport suite |
| U-02 | All primary tasks work by keyboard | Playwright keyboard journey |
| U-03 | Focus is visible and ordered logically | automated plus manual review |
| U-04 | Charts have table alternatives | accessibility assertions |
| U-05 | Sign/status never relies only on color | snapshot and manual review |
| U-06 | Reduced motion removes nonessential animation | media emulation test |
| U-07 | Loading geometry avoids major layout shift | visual comparison |
| U-08 | Fixture mode remains persistently labeled | browser navigation test |
| U-09 | Full addresses can be copied | clipboard test |
| U-10 | All icon-only controls have accessible names | automated accessibility scan |
| U-11 | Every authored class matches the class-name law | source validation script |
| U-12 | No Tailwind, CSS Module, or dynamic class construction exists | dependency and source scan |
| U-13 | Final interface is visually distinct from `arc-payment` | documented screenshot review |

### Security and reliability

| ID | Requirement | Evidence of acceptance |
| --- | --- | --- |
| S-01 | Browser bundle and responses contain no provider key | build scan and network test |
| S-02 | Inputs are allowlisted and size-bounded | integration fuzz cases |
| S-03 | Upstream errors are redacted | response snapshot tests |
| S-04 | Rate limit and refresh bounds prevent call loops | integration call-count tests |
| S-05 | Raw untrusted HTML never renders | malicious metadata browser test |
| S-06 | Production security headers are present | deployed smoke check |
| S-07 | Dependency audit has no unresolved critical finding | CI or release record |

### Performance

| ID | Requirement | Target |
| --- | --- | ---: |
| F-01 | Landing LCP on mid-tier mobile profile | `< 2.5s` |
| F-02 | Useful partial investigation p75 | `< 5s` |
| F-03 | Complete core investigation p75 | `< 15s` |
| F-04 | Local UI interaction latency | `< 200ms` |
| F-05 | Relationship graph visible node cap | `<= 21` |

## Unit-test focus

Scoring tests include:

- all-positive, all-negative, mixed, and zero observed flows;
- one through all missing segments;
- outliers that require `tanh` saturation;
- missing liquidity fallback scale;
- zero and extremely low liquidity;
- renormalized weights;
- unverified exchange semantics;
- confidence freshness boundaries;
- fixture confidence cap;
- coordination not assessed/preliminary/full states; and
- deterministic results independent of evidence ordering.

Normalization tests include numeric strings, nulls, missing arrays, duplicate
actors, address casing/canonicalization, Solana formats, warnings, and unexpected
additional fields.

## Browser journeys

### Journey A — successful live investigation

1. Open `/investigate`.
2. Choose supported chain and paste address.
3. Run investigation.
4. Observe progressive source states.
5. Open Direction contribution.
6. Inspect supporting and contradicting evidence.
7. Select a buyer and request related wallets.
8. Switch graph to table.
9. Copy summary.

### Journey B — partial failure

1. Run fixture where buyers endpoint times out.
2. Confirm flow evidence and score remain visible.
3. Confirm Confidence is reduced.
4. Confirm brief states the missing source.
5. Retry only the failed source.

### Journey C — deterministic demo

1. Enter fixture mode deliberately.
2. Confirm persistent capture-time banner.
3. Complete the full pitch path without network.
4. Refresh and navigate without losing the fixture label.

### Journey D — keyboard and mobile

1. Complete token selection and investigation using keyboard.
2. Navigate score details and evidence rows.
3. Use chart table alternative.
4. Repeat the core task at 375px with touch-sized controls.

## Manual live smoke test

Run only at defined milestones to control credits:

- after the first adapter vertical slice;
- after all core adapters are integrated;
- after deployment; and
- on submission day before recording.

For each smoke run, record date/time, token, chain, endpoints called, result
count, total duration, credits observed, warnings, and whether fixture schemas
need updating. Never record the API key.

## Definition of done

A P0 item is done when:

- implementation matches the documented rule;
- unit/contract/integration coverage exists at the appropriate layer;
- browser behavior includes loading, empty, error, and partial states;
- responsive and keyboard behavior is reviewed;
- no new unresolved security or product-honesty issue is introduced;
- user-facing wording is final; and
- relevant documentation is updated in the same change.

The MVP is accepted when every P0 row passes, production deployment matches the
recorded commit, and the demo fallback succeeds offline.

Code organization must additionally pass the clean-source gate in
[CODEBASE-RULES.md](CODEBASE-RULES.md#16-clean-source-acceptance-gate).
