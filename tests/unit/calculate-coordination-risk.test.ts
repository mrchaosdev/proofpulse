import { describe, expect, it } from "vitest";
import {
  PRELIMINARY_SCORE_CAP,
  calculateCoordinationRisk,
} from "@/domain/scoring/calculate-coordination-risk";
import { actor, relationship } from "../fixtures/build-investigation";

const SPREAD_BUYERS = [
  actor("buyer", "0xaaa1", 1_000_000),
  actor("buyer", "0xaaa2", 950_000),
  actor("buyer", "0xaaa3", 900_000),
  actor("buyer", "0xaaa4", 880_000),
  actor("buyer", "0xaaa5", 850_000),
  actor("buyer", "0xaaa6", 820_000),
];

const DOMINATED_BUYERS = [
  actor("buyer", "0xbbb1", 40_000_000),
  actor("buyer", "0xbbb2", 200_000),
  actor("buyer", "0xbbb3", 150_000),
];

describe("calculateCoordinationRisk", () => {
  it("is not assessed rather than zero when no actor evidence exists", () => {
    const result = calculateCoordinationRisk({
      buyers: [],
      sellers: [],
      relationships: [],
      inspectedActorAddresses: [],
    });

    expect(result.state).toBe("not-assessed");
    expect(result).not.toHaveProperty("value");
  });

  it("is preliminary before any relationship request has run", () => {
    const result = calculateCoordinationRisk({
      buyers: SPREAD_BUYERS,
      sellers: [],
      relationships: [],
      inspectedActorAddresses: [],
    });

    expect(result.state).toBe("preliminary");
  });

  it("never lets a preliminary score reach the elevated band", () => {
    // Without relationship evidence only concentration (40) and diversity (10)
    // can contribute, so score-v0.1 cannot reach the 59-point ceiling. The cap
    // is a safety ceiling, not a normally binding limit.
    const result = calculateCoordinationRisk({
      buyers: DOMINATED_BUYERS,
      sellers: [],
      relationships: [],
      inspectedActorAddresses: [],
    });

    if (result.state !== "preliminary") throw new Error("expected preliminary");
    expect(result.value).toBeLessThanOrEqual(PRELIMINARY_SCORE_CAP);
    expect(result.label).not.toBe("elevated");
  });

  it("scores higher concentration for a dominant actor", () => {
    const spread = calculateCoordinationRisk({
      buyers: SPREAD_BUYERS,
      sellers: [],
      relationships: [],
      inspectedActorAddresses: [],
    });
    const dominated = calculateCoordinationRisk({
      buyers: DOMINATED_BUYERS,
      sellers: [],
      relationships: [],
      inspectedActorAddresses: [],
    });

    if (spread.state === "not-assessed" || dominated.state === "not-assessed") {
      throw new Error("expected scores");
    }
    expect(dominated.value).toBeGreaterThan(spread.value);
  });

  it("reaches the assessed state once an actor has been inspected", () => {
    const result = calculateCoordinationRisk({
      buyers: SPREAD_BUYERS,
      sellers: [],
      relationships: [relationship("0xaaa1", "0xccc1")],
      inspectedActorAddresses: ["0xaaa1"],
    });

    expect(result.state).toBe("assessed");
  });

  it("raises the score as observed relationship density increases", () => {
    const sparse = calculateCoordinationRisk({
      buyers: SPREAD_BUYERS,
      sellers: [],
      relationships: [relationship("0xaaa1", "0xccc1")],
      inspectedActorAddresses: ["0xaaa1"],
    });
    const dense = calculateCoordinationRisk({
      buyers: SPREAD_BUYERS,
      sellers: [],
      relationships: Array.from({ length: 12 }, (_, index) =>
        relationship("0xaaa1", `0xccc${index}`),
      ),
      inspectedActorAddresses: ["0xaaa1"],
    });

    if (sparse.state === "not-assessed" || dense.state === "not-assessed") {
      throw new Error("expected scores");
    }
    expect(dense.value).toBeGreaterThan(sparse.value);
  });

  it("ignores duplicate and self edges when measuring density", () => {
    const duplicated = calculateCoordinationRisk({
      buyers: SPREAD_BUYERS,
      sellers: [],
      relationships: [
        relationship("0xaaa1", "0xccc1"),
        relationship("0xaaa1", "0xccc1"),
        relationship("0xAAA1", "0xCCC1"),
        relationship("0xaaa1", "0xaaa1"),
      ],
      inspectedActorAddresses: ["0xaaa1"],
    });
    const single = calculateCoordinationRisk({
      buyers: SPREAD_BUYERS,
      sellers: [],
      relationships: [relationship("0xaaa1", "0xccc1")],
      inspectedActorAddresses: ["0xaaa1"],
    });

    if (
      duplicated.state === "not-assessed" ||
      single.state === "not-assessed"
    ) {
      throw new Error("expected scores");
    }
    expect(duplicated.value).toBe(single.value);
  });

  it("keeps timing out of the total while source-time coverage is unverified", () => {
    const result = calculateCoordinationRisk({
      buyers: SPREAD_BUYERS,
      sellers: [],
      relationships: [
        relationship("0xaaa1", "0xccc1", {
          observedAt: "2026-09-15T11:00:00.000Z",
        }),
      ],
      inspectedActorAddresses: ["0xaaa1"],
    });

    if (result.state !== "assessed") throw new Error("expected assessed");
    const timing = result.components.find((item) => item.key === "timing");
    expect(timing?.value).toBe(0);
  });

  it("derives actor net value from bought and sold when net is missing", () => {
    const result = calculateCoordinationRisk({
      buyers: [
        actor("buyer", "0xddd1", null, {
          boughtUsd: 3_000_000,
          soldUsd: 1_000_000,
        }),
        actor("buyer", "0xddd2", null, {
          boughtUsd: 500_000,
          soldUsd: 100_000,
        }),
      ],
      sellers: [],
      relationships: [],
      inspectedActorAddresses: [],
    });

    expect(result.state).toBe("preliminary");
  });

  it("drops actors with no usable signed value instead of scoring them as zero", () => {
    const result = calculateCoordinationRisk({
      buyers: [actor("buyer", "0xeee1", null)],
      sellers: [actor("seller", "0xeee2", null)],
      relationships: [],
      inspectedActorAddresses: [],
    });

    expect(result.state).toBe("not-assessed");
  });

  it("stays inside 0..100 for an extremely concentrated inspected actor", () => {
    const result = calculateCoordinationRisk({
      buyers: [actor("buyer", "0xfff1", 900_000_000)],
      sellers: [],
      relationships: Array.from({ length: 40 }, (_, index) =>
        relationship("0xfff1", `0x${index}`),
      ),
      inspectedActorAddresses: ["0xfff1"],
    });

    if (result.state !== "assessed") throw new Error("expected assessed");
    expect(result.value).toBeLessThanOrEqual(100);
    expect(result.value).toBeGreaterThanOrEqual(0);
  });
});
