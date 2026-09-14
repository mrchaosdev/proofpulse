import { describe, expect, it } from "vitest";
import {
  FIXTURE_CONFIDENCE_CAP,
  calculateConfidence,
} from "@/domain/scoring/calculate-confidence";
import {
  agedBy,
  investigation,
  readyStatuses,
  segmentFlow,
  sourceMeta,
} from "../fixtures/build-investigation";

function component(
  result: ReturnType<typeof calculateConfidence>,
  key: string,
): number {
  const found = result.components.find((item) => item.key === key);
  if (found === undefined) throw new Error(`missing component ${key}`);
  return found.value;
}

const AGREEING_FLOWS = [
  segmentFlow("smart_trader", 2_000_000),
  segmentFlow("top_pnl", 1_000_000),
  segmentFlow("whale", 500_000),
];

describe("calculateConfidence", () => {
  it("always returns a component breakdown", () => {
    const result = calculateConfidence(investigation());

    expect(result.components.map((item) => item.key)).toStrictEqual([
      "coverage",
      "freshness",
      "breadth",
      "consistency",
      "quality",
    ]);
  });

  it("scores full coverage when every required source is ready", () => {
    const result = calculateConfidence(investigation());

    expect(component(result, "coverage")).toBe(30);
  });

  it("reduces coverage when a required source failed", () => {
    const result = calculateConfidence(
      investigation({
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

    expect(component(result, "coverage")).toBe(22.5);
  });

  it("scores full freshness inside the fresh target", () => {
    const result = calculateConfidence(
      investigation({ segmentFlows: AGREEING_FLOWS }),
    );

    expect(component(result, "freshness")).toBe(20);
  });

  it("decays freshness toward zero as data ages past the fresh target", () => {
    const aging = calculateConfidence(
      investigation({
        sourceStatuses: readyStatuses([
          {
            state: "ready",
            capability: "cohort-flows",
            source: sourceMeta("cohort-flows", { collectedAt: agedBy(360) }),
            recordCount: 5,
          },
        ]),
      }),
    );
    const stale = calculateConfidence(
      investigation({
        sourceStatuses: readyStatuses([
          {
            state: "ready",
            capability: "cohort-flows",
            source: sourceMeta("cohort-flows", { collectedAt: agedBy(600) }),
            recordCount: 5,
          },
        ]),
      }),
    );

    expect(component(aging, "freshness")).toBeLessThan(20);
    expect(component(stale, "freshness")).toBeLessThan(
      component(aging, "freshness"),
    );
  });

  it("scores zero breadth when no cohort returned a wallet count", () => {
    const result = calculateConfidence(
      investigation({
        segmentFlows: [
          segmentFlow("smart_trader", 1_000, { walletCount: null }),
        ],
      }),
    );

    expect(component(result, "breadth")).toBe(0);
  });

  it("rewards agreement between higher-trust cohorts", () => {
    const agreeing = calculateConfidence(
      investigation({ segmentFlows: AGREEING_FLOWS }),
    );
    const contradicting = calculateConfidence(
      investigation({
        segmentFlows: [
          segmentFlow("smart_trader", 2_000_000),
          segmentFlow("top_pnl", -1_000_000),
        ],
      }),
    );

    expect(component(agreeing, "consistency")).toBe(20);
    expect(component(contradicting, "consistency")).toBe(0);
  });

  it("cannot assess consistency from a single higher-trust cohort", () => {
    const result = calculateConfidence(
      investigation({ segmentFlows: [segmentFlow("smart_trader", 2_000_000)] }),
    );

    expect(component(result, "consistency")).toBe(0);
  });

  it("removes quality points for upstream warnings", () => {
    const result = calculateConfidence(
      investigation({
        sourceStatuses: readyStatuses([
          {
            state: "ready",
            capability: "cohort-flows",
            source: sourceMeta("cohort-flows", {
              warnings: ["Partial cohort coverage.", "Delayed indexing."],
            }),
            recordCount: 5,
          },
        ]),
      }),
    );

    expect(component(result, "quality")).toBe(6);
  });

  it("caps fixture-mode confidence so a demo cannot look live", () => {
    const base = investigation({ segmentFlows: AGREEING_FLOWS });
    const live = calculateConfidence(base);
    const fixture = calculateConfidence({
      ...base,
      input: { ...base.input, mode: "fixture" },
    });

    expect(live.value).toBeGreaterThan(FIXTURE_CONFIDENCE_CAP);
    expect(fixture.value).toBe(FIXTURE_CONFIDENCE_CAP);
    expect(fixture.cappedByFixtureMode).toBe(true);
  });

  it("stays inside 0..100 when every source failed", () => {
    const result = calculateConfidence(
      investigation({
        sourceStatuses: [
          {
            state: "error",
            capability: "token-context",
            code: "NANSEN_TIMEOUT",
            retryable: true,
            message: "Request timed out.",
          },
          {
            state: "error",
            capability: "cohort-flows",
            code: "NANSEN_CREDITS",
            retryable: false,
            message: "Insufficient credits.",
          },
          {
            state: "error",
            capability: "buyers",
            code: "NANSEN_RATE_LIMIT",
            retryable: true,
            message: "Rate limited.",
          },
          {
            state: "error",
            capability: "sellers",
            code: "NANSEN_SCHEMA",
            retryable: false,
            message: "Response failed validation.",
          },
        ],
      }),
    );

    expect(result.value).toBe(0);
    expect(result.label).toBe("low-confidence");
  });
});
