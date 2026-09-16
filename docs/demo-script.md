# Demo script

Target length `100s`, hard ceiling `120s`. Captions are required, so the
narration below doubles as the caption track: read it verbatim and the captions
match.

Record in **fixture mode** on the deployed URL. It spends no credits, cannot
fail mid-recording, and is labelled as a fixture the whole way through, which
is itself part of the story. Say so out loud at `0:10` rather than hoping
nobody reads the banner.

## Before recording

- [ ] Production URL open, fixture route loaded once so it is warm
- [ ] Browser notifications and unrelated extensions disabled
- [ ] Window at `1440x900`, zoom at 100%, cursor movements rehearsed
- [ ] Light theme (the product default)
- [ ] No terminal, API dashboard, or personal tab visible
- [ ] Commit SHA recorded for the submission form

## Shot list

| Time | Screen | Narration |
| ---: | --- | --- |
| `0:00–0:10` | Landing hero, slow scroll to the lens | "A token moves. The explanation arrives late. ProofPulse turns Nansen data into one investigation — and it refuses to give you a single number." |
| `0:10–0:20` | Click through to the investigation | "This is LINK on Ethereum, captured live from the Nansen API. It is labelled as a fixture, because it is a recording — the same code scores it either way." |
| `0:20–0:35` | Signal lens, cursor on each ring | "Three separate answers. Direction is plus one: flows are mixed. Confidence is forty-three: the evidence is thin. Coordination risk is its own question. A product that merged these would have hidden the disagreement." |
| `0:35–0:52` | Cohort flows panel, then the table below it | "Here is why. Nansen's Flow Intelligence splits participants into cohorts. Fresh wallets bought three point four million. Exchanges moved one point four million the other way. Both are on screen; neither is rounded away." |
| `0:52–1:08` | Scroll to buyers, click `Inspect relationships` on the top buyer | "From aggregate signal to an accountable wallet. Nothing is requested until I choose an actor — that call costs one credit, and the interface says so before I spend it." |
| `1:08–1:20` | Relationship map, then scroll to its table | "First-degree relationships for that wallet. Twenty of them. Coordination risk just moved from preliminary fourteen to an assessed forty-four. Note the wording: an observed link, not shared ownership. The graph has an equal table beside it." |
| `1:20–1:32` | Brief panel, cursor over the evidence ID chips | "The brief cites evidence for every claim. If a model writes one that names an evidence ID that does not exist, or a number the evidence never stated, it is rejected and this deterministic brief renders instead." |
| `1:32–1:42` | Evidence ledger, expand one row | "And every claim resolves here. Source, collection time, effect on the score, and the normalized record itself." |
| `1:42–1:50` | Methodology page, scroll to the weights table | "Every weight and threshold is published, rendered from the same constants the scoring code uses. Built on Nansen. Thank you." |

## Presenter rules

- Name the Nansen capability while it is on screen, not in the credits.
- Say "observed flow", never "bullish" or "bearish".
- Show the contradicting cohort. The mixed result is the point, not a weakness.
- Open one evidence ID so traceability is demonstrated, not asserted.
- Never say "safe", "scam", "alpha", "100x", or any buy or sell instruction.
- If the fixture banner is visible, acknowledge it. Do not talk over it.

## Failure ladder while recording

1. Retry the one failed source using the retry control, and narrate that the
   other evidence survived. A partial result is a feature.
2. If the deployment is unreachable, record against `npm run start` locally in
   fixture mode. The URL bar will show localhost; say so rather than cropping.
3. Use the previous take only if nothing else works.
