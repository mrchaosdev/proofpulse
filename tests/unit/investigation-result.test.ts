import { describe, expect, it } from "vitest";
import { scoreInvestigation } from "@/domain/investigation/investigation-result";
import { SCORE_FORMULA_VERSION } from "@/domain/scoring/score";
import {
  actor,
  investigation,
  readyStatuses,
  relationship,
  segmentFlow,
  sourceMeta,
  tokenContext,
} from "../fixtures/build-investigation";

const MIXED_FLOWS = [
  segmentFlow("smart_trader", 2_400_000),
  segmentFlow("top_pnl", 1_100_000),
  segmentFlow("whale", -600_000),
  segmentFlow("exchange", 4_000_000),
];

const ACTORS = [
  actor("buyer", "0xaaa1", 1_800_000),
  actor("buyer", "0xaaa2", 900_000),
];

function fullInvestigation() {
  return investigation({
    segmentFlows: MIXED_FLOWS,
    buyers: ACTORS,
    sellers: [actor("seller", "0xbbb1", -1_200_000)],
  });
}

describe("scoreInvestigation", () => {
  it("records the formula version with every result", () => {
    const result = scoreInvestigation(fullInvestigation());

    expect(result.scores.formulaVersion).toBe(SCORE_FORMULA_VERSION);
  });

  it("keeps direction, confidence, and coordination risk separate", () => {
    const result = scoreInvestigation(fullInvestigation());

    if (result.scores.direction.state !== "available") {
      throw new Error("expected a direction score");
    }
    expect(result.scores.direction.value).not.toBe(
      result.scores.confidence.value,
    );
    expect(result.scores.coordinationRisk.state).toBe("preliminary");
  });

  it("emits a derivation evidence item for every produced score", () => {
    const result = scoreInvestigation(fullInvestigation());
    const derivationIds = result.evidence
      .filter((item) => item.kind === "derivation")
      .map((item) => item.id);

    expect(derivationIds).toStrictEqual([
      "DER-DIR-01",
      "DER-CONF-01",
      "DER-COORD-01",
    ]);
  });

  it("gives every derivation a formula note", () => {
    const result = scoreInvestigation(fullInvestigation());

    for (const item of result.evidence.filter(
      (evidence) => evidence.kind === "derivation",
    )) {
      expect(item.derivation).toContain(SCORE_FORMULA_VERSION);
    }
  });

  it("keeps contradicting cohort evidence in the ledger", () => {
    const result = scoreInvestigation(fullInvestigation());
    const polarities = result.evidence
      .filter((item) => item.id.startsWith("FLOW-"))
      .map((item) => item.polarity);

    expect(polarities).toContain("supports_accumulation");
    expect(polarities).toContain("supports_distribution");
  });

  it("emits no flow evidence for a missing cohort value", () => {
    const result = scoreInvestigation(
      investigation({
        segmentFlows: [
          segmentFlow("smart_trader", null, { walletCount: null }),
        ],
      }),
    );

    expect(result.evidence.some((item) => item.id.startsWith("FLOW-"))).toBe(
      false,
    );
  });

  it("emits no coordination derivation before actor evidence exists", () => {
    const result = scoreInvestigation(
      investigation({ segmentFlows: MIXED_FLOWS }),
    );

    expect(result.scores.coordinationRisk.state).toBe("not-assessed");
    expect(result.evidence.some((item) => item.id === "DER-COORD-01")).toBe(
      false,
    );
  });

  it("distinguishes an empty dataset from an absence of activity", () => {
    const result = scoreInvestigation(
      investigation({
        sourceStatuses: readyStatuses([
          {
            state: "empty",
            capability: "buyers",
            source: sourceMeta("buyers"),
          },
        ]),
      }),
    );
    const warning = result.evidence.find((item) => item.kind === "warning");

    expect(warning?.statement).toContain("not evidence of no activity");
  });

  it("preserves evidence from successful sources when one source fails", () => {
    const result = scoreInvestigation(
      investigation({
        segmentFlows: MIXED_FLOWS,
        sourceStatuses: readyStatuses([
          {
            state: "error",
            capability: "buyers",
            code: "NANSEN_TIMEOUT",
            retryable: true,
            message: "Request timed out.",
          },
        ]),
      }),
    );

    expect(result.scores.direction.state).toBe("available");
    expect(result.evidence.some((item) => item.id.startsWith("FLOW-"))).toBe(
      true,
    );
    expect(
      result.evidence.some((item) => item.statement.includes("NANSEN_TIMEOUT")),
    ).toBe(true);
  });

  it("lowers confidence when a source fails compared with a full result", () => {
    const complete = scoreInvestigation(fullInvestigation());
    const degraded = scoreInvestigation(
      investigation({
        segmentFlows: MIXED_FLOWS,
        buyers: ACTORS,
        sourceStatuses: readyStatuses([
          {
            state: "error",
            capability: "sellers",
            code: "NANSEN_RATE_LIMIT",
            retryable: true,
            message: "Rate limited.",
          },
        ]),
      }),
    );

    expect(degraded.scores.confidence.value).toBeLessThan(
      complete.scores.confidence.value,
    );
  });

  it("states that a relationship is observed, never owned", () => {
    const result = scoreInvestigation(
      investigation({
        buyers: ACTORS,
        relationships: [relationship("0xaaa1", "0xccc1")],
        inspectedActorAddresses: ["0xaaa1"],
      }),
    );
    const relationshipEvidence = result.evidence.find((item) =>
      item.id.startsWith("REL-"),
    );

    expect(relationshipEvidence?.statement).toContain("Ownership is unknown.");
    expect(relationshipEvidence?.polarity).toBe("neutral");
  });

  it("uses reported liquidity as the direction scale when available", () => {
    const result = scoreInvestigation(
      investigation({
        segmentFlows: MIXED_FLOWS,
        tokenContext: tokenContext({ liquidityUsd: 40_000_000 }),
      }),
    );

    if (result.scores.direction.state !== "available") {
      throw new Error("expected a direction score");
    }
    expect(result.scores.direction.scaleBasis).toBe("liquidity");
    expect(result.scores.direction.scaleUsd).toBe(400_000);
  });

  it("produces an identical result for identical input", () => {
    const first = scoreInvestigation(fullInvestigation());
    const second = scoreInvestigation(fullInvestigation());

    expect(first).toStrictEqual(second);
  });
});
