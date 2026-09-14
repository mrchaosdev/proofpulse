import { describe, expect, it } from "vitest";
import {
  MINIMUM_SCALE_USD,
  calculateDirection,
} from "@/domain/scoring/calculate-direction";
import { segmentFlow } from "../fixtures/build-investigation";

const LIQUIDITY_USD = 20_000_000;

describe("calculateDirection", () => {
  it("is unavailable rather than zero when no weighted segment has a flow", () => {
    const result = calculateDirection({
      segmentFlows: [],
      tokenLiquidityUsd: LIQUIDITY_USD,
    });

    expect(result.state).toBe("unavailable");
    expect(result).not.toHaveProperty("value");
  });

  it("is unavailable when every returned segment flow is missing", () => {
    const result = calculateDirection({
      segmentFlows: [
        segmentFlow("smart_trader", null),
        segmentFlow("whale", null),
      ],
      tokenLiquidityUsd: LIQUIDITY_USD,
    });

    expect(result.state).toBe("unavailable");
  });

  it("leans positive when every higher-trust cohort accumulates", () => {
    const result = calculateDirection({
      segmentFlows: [
        segmentFlow("smart_trader", 5_000_000),
        segmentFlow("top_pnl", 3_000_000),
        segmentFlow("whale", 2_000_000),
      ],
      tokenLiquidityUsd: LIQUIDITY_USD,
    });

    if (result.state !== "available") throw new Error("expected a score");
    expect(result.value).toBeGreaterThan(35);
    expect(result.label).toBe("accumulation-leaning");
  });

  it("leans negative when every higher-trust cohort distributes", () => {
    const result = calculateDirection({
      segmentFlows: [
        segmentFlow("smart_trader", -5_000_000),
        segmentFlow("top_pnl", -3_000_000),
        segmentFlow("whale", -2_000_000),
      ],
      tokenLiquidityUsd: LIQUIDITY_USD,
    });

    if (result.state !== "available") throw new Error("expected a score");
    expect(result.value).toBeLessThan(-35);
    expect(result.label).toBe("distribution-leaning");
  });

  it("reports mixed when cohorts contradict each other", () => {
    const result = calculateDirection({
      segmentFlows: [
        segmentFlow("smart_trader", 1_000_000),
        segmentFlow("top_pnl", -1_400_000),
      ],
      tokenLiquidityUsd: LIQUIDITY_USD,
    });

    if (result.state !== "available") throw new Error("expected a score");
    expect(result.label).toBe("mixed");
  });

  it("renormalizes weights so one present cohort spans the full range", () => {
    const single = calculateDirection({
      segmentFlows: [segmentFlow("whale", 900_000_000)],
      tokenLiquidityUsd: LIQUIDITY_USD,
    });

    if (single.state !== "available") throw new Error("expected a score");
    // Whale weight is 0.15, but it is the only cohort present.
    expect(single.value).toBe(100);
  });

  it("saturates outliers through tanh instead of overflowing", () => {
    const large = calculateDirection({
      segmentFlows: [segmentFlow("smart_trader", 10 ** 15)],
      tokenLiquidityUsd: LIQUIDITY_USD,
    });
    const huge = calculateDirection({
      segmentFlows: [segmentFlow("smart_trader", 10 ** 20)],
      tokenLiquidityUsd: LIQUIDITY_USD,
    });

    if (large.state !== "available" || huge.state !== "available") {
      throw new Error("expected scores");
    }
    expect(large.value).toBe(100);
    expect(huge.value).toBe(100);
  });

  it("falls back to the median flow scale when liquidity is unavailable", () => {
    const result = calculateDirection({
      segmentFlows: [
        segmentFlow("smart_trader", 400_000),
        segmentFlow("top_pnl", 600_000),
      ],
      tokenLiquidityUsd: null,
    });

    if (result.state !== "available") throw new Error("expected a score");
    expect(result.scaleBasis).toBe("median-flow");
    expect(result.scaleUsd).toBe(500_000);
  });

  it("uses the minimum scale when liquidity is zero or negligible", () => {
    const result = calculateDirection({
      segmentFlows: [segmentFlow("smart_trader", 10_000)],
      tokenLiquidityUsd: 0,
    });

    if (result.state !== "available") throw new Error("expected a score");
    expect(result.scaleBasis).toBe("minimum");
    expect(result.scaleUsd).toBe(MINIMUM_SCALE_USD);
  });

  it("excludes exchange flow from the score while keeping it visible", () => {
    const withExchange = calculateDirection({
      segmentFlows: [
        segmentFlow("smart_trader", 2_000_000),
        segmentFlow("exchange", -9_000_000),
      ],
      tokenLiquidityUsd: LIQUIDITY_USD,
    });
    const withoutExchange = calculateDirection({
      segmentFlows: [segmentFlow("smart_trader", 2_000_000)],
      tokenLiquidityUsd: LIQUIDITY_USD,
    });

    if (
      withExchange.state !== "available" ||
      withoutExchange.state !== "available"
    ) {
      throw new Error("expected scores");
    }
    expect(withExchange.value).toBe(withoutExchange.value);
    expect(withExchange.excludedSegments).toContain("exchange");
  });

  it("produces the same score regardless of segment ordering", () => {
    const flows = [
      segmentFlow("smart_trader", 1_200_000),
      segmentFlow("whale", -400_000),
      segmentFlow("top_pnl", 800_000),
    ];
    const forward = calculateDirection({
      segmentFlows: flows,
      tokenLiquidityUsd: LIQUIDITY_USD,
    });
    const reversed = calculateDirection({
      segmentFlows: [...flows].reverse(),
      tokenLiquidityUsd: LIQUIDITY_USD,
    });

    expect(forward).toStrictEqual(reversed);
  });

  it("treats a returned zero flow as an observed zero, not as missing", () => {
    const result = calculateDirection({
      segmentFlows: [
        segmentFlow("smart_trader", 0),
        segmentFlow("top_pnl", 5_000_000),
      ],
      tokenLiquidityUsd: LIQUIDITY_USD,
    });

    if (result.state !== "available") throw new Error("expected a score");
    expect(result.components).toHaveLength(2);
    expect(result.excludedSegments).toHaveLength(0);
  });
});
