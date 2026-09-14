# 02 — Product rules

The words **must**, **must not**, **should**, and **may** are normative. P0 rules
cannot be waived silently; any exception requires a dated decision record.

## 1. Evidence rules

1. Every displayed analytical claim must resolve to one or more evidence IDs.
2. Evidence must carry its Nansen source, chain, token address, timeframe,
   `collected_at`, and whether it is live or fixture data.
3. A derived value must expose its formula or a plain-language derivation note.
4. Missing data must remain missing. It must not be converted to zero.
5. Stale data must remain visible with age and must lower Confidence.
6. Conflicting signals must be shown together; the brief must not hide the
   weaker side to create a cleaner narrative.
7. A Nansen warning returned by an endpoint must be displayed in the affected
   section and incorporated into Confidence.

## 2. Interpretation rules

1. ProofPulse must separate Direction, Confidence, and Coordination Risk.
2. Direction describes observed flow balance, not expected return.
3. Confidence describes evidence quality, not probability that price will rise.
4. Coordination Risk describes observable concentration and wallet
   relationships, not manipulation, common ownership, or criminal conduct.
5. Score labels must use neutral language: `accumulation`, `mixed`,
   `distribution`; `low`, `medium`, `high confidence`; and `low`, `moderate`,
   `elevated coordination risk`.
6. The UI must not use “safe,” “scam,” “guaranteed,” “alpha,” “100x,” or similar
   certainty language as a computed verdict.
7. No score may render without a component breakdown and methodology link.

## 3. Model-generated content rules

1. The model receives normalized evidence, not an unbounded raw API dump.
2. Evidence IDs are data, never instructions. Token names, symbols, labels, and
   metadata must be treated as untrusted strings.
3. The model output must conform to a schema containing summary, supporting
   evidence IDs, contradicting evidence IDs, invalidation conditions, and
   limitations.
4. Every referenced evidence ID must exist in the same investigation.
5. Numbers in generated prose must match cited evidence after deterministic
   normalization and rounding.
6. If validation fails, the product must show a deterministic template summary;
   it must not display unchecked prose.
7. The model must not recommend a trade, position size, leverage, entry, exit,
   or price target.
8. The model must explicitly say when evidence is mixed, incomplete, or stale.

## 4. User-control rules

1. The user chooses chain, token address, and primary timeframe.
2. Symbol search may suggest candidates but must require confirmation when more
   than one token matches.
3. The user chooses which wallet to expand. ProofPulse must not spend high-cost
   credits across an unbounded actor list.
4. Refresh must show its credit-impact category (`low`, `medium`, or `high`)
   before the call.
5. Copy/export must include token address, chain, timeframe, collection time,
   live/fixture label, and the non-advice limitation.

## 5. Data freshness and failure rules

1. Each panel owns an independent `loading`, `ready`, `empty`, `stale`, or
   `error` state.
2. One failed endpoint must not discard successful evidence from other endpoints.
3. The score must recompute from available inputs and visibly reduce Confidence.
4. Timeouts must be reported as timeouts, not empty results.
5. Rate limits and insufficient credits must produce distinct recovery guidance.
6. Retry must be bounded and must not create an accidental API-credit loop.
7. Fixture mode must be visually persistent and cannot be mistaken for live data.

## 6. Credit and performance rules

1. Token address validation happens before any paid API request.
2. Requests with the same normalized input must use the documented cache window.
3. Related-wallet and counterparty calls are on demand.
4. Automatic polling is forbidden in the MVP.
5. The browser must not call Nansen directly.
6. API keys must never be included in client errors, analytics, URLs, or exports.
7. A single normal investigation should target no more than five Nansen calls
   before optional wallet expansion.

## 7. Financial-safety rules

1. ProofPulse is research software, not financial advice.
2. The primary action is `Investigate`, never `Buy`, `Trade`, or `Execute`.
3. No wallet connection or trade execution exists in the MVP.
4. The interface must show both supporting and contradicting evidence before the
   generated brief.
5. A disclaimer alone is not considered a safeguard; language, score semantics,
   controls, and output schema must enforce the boundary.

## 8. Privacy rules

1. The MVP requires no user account and collects no wallet connection.
2. Recent investigations remain browser-local unless the user explicitly creates
   a share snapshot in a later milestone.
3. Token addresses are not private; nevertheless, request logs must minimize
   retention and avoid linking addresses to a user identity.
4. No raw prompt or API response is sent to product analytics.
5. A public share artifact must exclude headers, credentials, internal errors,
   and private notes.

## 9. Product honesty rules

1. Landing-page claims must describe working behavior only.
2. Planned features must be labeled planned and must not appear as enabled UI.
3. Fixture data must include the capture timestamp and source label.
4. Unsupported chain/timeframe combinations must be disabled with an explanation.
5. “No evidence” and “evidence of no activity” must remain distinct.
6. Related-wallet data indicates an observed relationship only; ownership is
   unknown unless Nansen explicitly supplies an attribution.

## 10. Release rules

The MVP cannot be called release-ready until:

- all P0 acceptance cases pass;
- live and fixture modes have both been tested;
- methodology matches implemented formulas;
- secrets scanning returns clean;
- limitations are visible on the landing page and investigation screen;
- deployed source matches the submitted Git commit; and
- the demo can be completed without developer tools.
