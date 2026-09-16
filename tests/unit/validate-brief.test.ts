/**
 * Brief validation: acceptance cases M-01 through M-05.
 *
 * These run without any provider, because the point of the validator is that
 * it does not trust the provider.
 */

import { describe, expect, it } from "vitest";
import type { InvestigationBrief } from "@/domain/brief/brief";
import { validateBrief } from "@/domain/brief/validate-brief";
import { buildDeterministicBrief } from "@/domain/brief/deterministic-brief";
import { findProhibitedLanguage } from "@/domain/brief/prohibited-language";
import { scoreInvestigation } from "@/domain/investigation/investigation-result";
import type { Evidence } from "@/domain/evidence/evidence";
import {
  actor,
  investigation,
  segmentFlow,
  sourceMeta,
} from "../fixtures/build-investigation";

const EVIDENCE: readonly Evidence[] = [
  {
    id: "FLOW-SM-01",
    kind: "observation",
    statement: "Smart Traders net flow was +$2.4M over the selected timeframe.",
    numericValue: 2_400_000,
    unit: "usd",
    polarity: "supports_accumulation",
    sourceEvidenceIds: [],
    source: sourceMeta("cohort-flows"),
  },
  {
    id: "FLOW-WHALE-01",
    kind: "observation",
    statement: "Whales net flow was -$600.0K over the selected timeframe.",
    numericValue: -600_000,
    unit: "usd",
    polarity: "supports_distribution",
    sourceEvidenceIds: [],
    source: sourceMeta("cohort-flows"),
  },
];

function brief(
  overrides: Partial<InvestigationBrief> = {},
): InvestigationBrief {
  return {
    observation: "Cohorts disagree and the evidence is thin.",
    support: [
      {
        text: "Smart Traders net flow was +$2.4M.",
        evidenceIds: ["FLOW-SM-01"],
      },
    ],
    contradiction: [
      { text: "Whales net flow was -$600.0K.", evidenceIds: ["FLOW-WHALE-01"] },
    ],
    invalidationConditions: [
      {
        text: "A reversal in Smart Traders would move the reading.",
        evidenceIds: ["FLOW-SM-01"],
      },
    ],
    limitations: ["This is research software, not financial advice."],
    provenance: "model",
    ...overrides,
  };
}

describe("validateBrief", () => {
  it("accepts a brief whose claims cite real evidence and real numbers", () => {
    const result = validateBrief(brief(), EVIDENCE);

    expect(result.ok).toBe(true);
  });

  it("rejects an unknown evidence ID (M-01)", () => {
    const result = validateBrief(
      brief({
        support: [
          { text: "A cohort accumulated.", evidenceIds: ["FLOW-GHOST-99"] },
        ],
      }),
      EVIDENCE,
    );

    if (result.ok) throw new Error("expected a rejection");
    expect(result.rejections.map((item) => item.code)).toContain(
      "UNKNOWN_EVIDENCE_ID",
    );
  });

  it("rejects a fabricated number (M-02)", () => {
    const result = validateBrief(
      brief({
        support: [
          {
            text: "Smart Traders net flow was +$9.9M.",
            evidenceIds: ["FLOW-SM-01"],
          },
        ],
      }),
      EVIDENCE,
    );

    if (result.ok) throw new Error("expected a rejection");
    expect(result.rejections.map((item) => item.code)).toContain(
      "UNSUPPORTED_NUMBER",
    );
  });

  it("rejects a number borrowed from evidence the claim does not cite", () => {
    const result = validateBrief(
      brief({
        support: [
          {
            // This value belongs to FLOW-WHALE-01, which is not cited here.
            text: "Smart Traders net flow was -$600.0K.",
            evidenceIds: ["FLOW-SM-01"],
          },
        ],
      }),
      EVIDENCE,
    );

    expect(result.ok).toBe(false);
  });

  it("rejects a fabricated number in the observation", () => {
    const result = validateBrief(
      brief({ observation: "Net flow across cohorts was +$50.0M." }),
      EVIDENCE,
    );

    expect(result.ok).toBe(false);
  });

  it("rejects trade recommendation language (M-03)", () => {
    const result = validateBrief(
      brief({ observation: "Traders should buy while flows stay positive." }),
      EVIDENCE,
    );

    if (result.ok) throw new Error("expected a rejection");
    expect(result.rejections.map((item) => item.code)).toContain(
      "PROHIBITED_LANGUAGE",
    );
  });

  it("rejects certainty language", () => {
    const result = validateBrief(
      brief({ observation: "This token is safe and guaranteed to recover." }),
      EVIDENCE,
    );

    expect(result.ok).toBe(false);
  });

  it("rejects a claim that cites nothing", () => {
    const result = validateBrief(
      brief({ support: [{ text: "Flows look positive.", evidenceIds: [] }] }),
      EVIDENCE,
    );

    if (result.ok) throw new Error("expected a rejection");
    expect(result.rejections.map((item) => item.code)).toContain(
      "MISSING_CITATION",
    );
  });

  it("rejects an observation beyond the word limit", () => {
    const result = validateBrief(
      brief({ observation: "word ".repeat(90).trim() }),
      EVIDENCE,
    );

    if (result.ok) throw new Error("expected a rejection");
    expect(result.rejections.map((item) => item.code)).toContain(
      "OBSERVATION_TOO_LONG",
    );
  });

  it("does not read digits inside a wallet address as a claimed number", () => {
    // Regression: the extractor matched "0" and "1" inside "0xaaa1", so any
    // brief naming an actor was rejected for citing values it never stated.
    const result = validateBrief(
      brief({
        support: [
          {
            text: "Actor 0xaaa1 recorded +$2.4M net buying activity.",
            evidenceIds: ["FLOW-SM-01"],
          },
        ],
      }),
      EVIDENCE,
    );

    expect(result.ok).toBe(true);
  });

  it("does not read an evidence identifier as a claimed number", () => {
    const result = validateBrief(
      brief({
        support: [
          {
            text: "See FLOW-SM-01 for the cohort flow.",
            evidenceIds: ["FLOW-SM-01"],
          },
        ],
      }),
      EVIDENCE,
    );

    expect(result.ok).toBe(true);
  });

  it("accepts an alternative rendering of the same value", () => {
    const result = validateBrief(
      brief({
        support: [
          {
            text: "Smart Traders net flow was 2400000.",
            evidenceIds: ["FLOW-SM-01"],
          },
        ],
      }),
      EVIDENCE,
    );

    expect(result.ok).toBe(true);
  });
});

describe("findProhibitedLanguage", () => {
  it("leaves ordinary analytical vocabulary alone", () => {
    const matches = findProhibitedLanguage(
      "Top net sellers distributed while fresh wallets recorded net buying activity.",
    );

    expect(matches).toHaveLength(0);
  });

  it("catches a bare instruction", () => {
    expect(findProhibitedLanguage("Sell into strength.")).not.toHaveLength(0);
  });
});

describe("buildDeterministicBrief", () => {
  const scored = scoreInvestigation(
    investigation({
      segmentFlows: [
        segmentFlow("smart_trader", 2_400_000),
        segmentFlow("whale", -600_000),
      ],
      buyers: [actor("buyer", "0xaaa1", 1_800_000)],
      sellers: [actor("seller", "0xbbb1", -900_000)],
    }),
  );

  it("passes its own validator", () => {
    const deterministic = buildDeterministicBrief(
      scored.investigation,
      scored.scores,
      scored.evidence,
    );

    const result = validateBrief(deterministic, scored.evidence);
    if (!result.ok) {
      throw new Error(
        `deterministic brief rejected: ${result.rejections
          .map((item) => item.detail)
          .join(" ")}`,
      );
    }
    expect(result.ok).toBe(true);
  });

  it("marks itself as deterministic", () => {
    const deterministic = buildDeterministicBrief(
      scored.investigation,
      scored.scores,
      scored.evidence,
    );

    expect(deterministic.provenance).toBe("deterministic");
  });

  it("shows both sides rather than only the stronger one", () => {
    const deterministic = buildDeterministicBrief(
      scored.investigation,
      scored.scores,
      scored.evidence,
    );

    expect(deterministic.support.length).toBeGreaterThan(0);
    expect(deterministic.contradiction.length).toBeGreaterThan(0);
  });

  it("always states the non-advice limitation", () => {
    const deterministic = buildDeterministicBrief(
      scored.investigation,
      scored.scores,
      scored.evidence,
    );

    expect(deterministic.limitations.join(" ")).toContain(
      "not financial advice",
    );
  });

  it("is identical for identical input", () => {
    const first = buildDeterministicBrief(
      scored.investigation,
      scored.scores,
      scored.evidence,
    );
    const second = buildDeterministicBrief(
      scored.investigation,
      scored.scores,
      scored.evidence,
    );

    expect(first).toStrictEqual(second);
  });
});
