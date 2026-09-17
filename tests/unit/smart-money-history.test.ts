/**
 * The history is a series of positions, and the one mistake that would ruin it
 * is treating them as flows. Adding two snapshots of the same holdings invents
 * a quantity nobody holds; reading the dollar column as trading turns a price
 * move into a sale. Both are tested here.
 */

import { describe, expect, it } from "vitest";
import {
  HISTORY_DAYS,
  normalizeSmartMoneyHistory,
} from "@/integrations/nansen/normalizers/normalize-smart-money-history";
import { positionChange } from "@/domain/investigation/position-change";
import { normalizeLiquidityPeers } from "@/integrations/nansen/normalizers/normalize-liquidity-peers";
import type { SourceMeta } from "@/domain/investigation/investigation";

const source: SourceMeta = {
  provider: "nansen",
  capability: "smart-money-history",
  collectedAt: "2026-09-17T00:00:00.000Z",
  live: false,
  warnings: [],
};

const peerSource: SourceMeta = { ...source, capability: "liquidity-peers" };

function bucket(
  hour: string,
  amount: number,
  value = amount * 10,
  complete = true,
) {
  return {
    date: hour,
    bucket_end: hour,
    is_complete: complete,
    price_usd: 10,
    token_amount: amount,
    value_usd: value,
    holders_count: 5,
  };
}

describe("smart money history", () => {
  it("keeps the last bucket of a day rather than summing the day", () => {
    const history = normalizeSmartMoneyHistory(
      [
        bucket("2026-09-10T01:00:00Z", 100),
        bucket("2026-09-10T12:00:00Z", 140),
        bucket("2026-09-10T23:00:00Z", 120),
      ],
      [],
      source,
    );

    expect(history.points).toHaveLength(1);
    // 120, the position at the end of the day. Not 360, which is what summing
    // three snapshots of the same holdings would produce.
    expect(history.points[0]?.tokenAmount).toBe(120);
  });

  it("orders days oldest first and keeps only the newest week", () => {
    const records = Array.from({ length: 10 }, (_, index) =>
      bucket(`2026-09-${String(index + 1).padStart(2, "0")}T23:00:00Z`, index),
    );

    const history = normalizeSmartMoneyHistory(records, [], source);

    expect(history.points).toHaveLength(HISTORY_DAYS);
    const dates = history.points.map((point) => point.date);
    expect([...dates].sort()).toEqual(dates);
    expect(dates[0]).toContain("2026-09-04");
  });

  it("marks a day that is still filling", () => {
    const history = normalizeSmartMoneyHistory(
      [bucket("2026-09-17T05:00:00Z", 10, 100, false)],
      [],
      source,
    );
    expect(history.points[0]?.complete).toBe(false);
  });

  it("treats absent completeness as incomplete", () => {
    const history = normalizeSmartMoneyHistory(
      [{ ...bucket("2026-09-17T05:00:00Z", 10), is_complete: null }],
      [],
      source,
    );
    expect(history.points[0]?.complete).toBe(false);
  });

  it("drops a bucket whose timestamp cannot be read", () => {
    const history = normalizeSmartMoneyHistory(
      [bucket("not-a-date", 10), bucket("2026-09-16T23:00:00Z", 20)],
      [],
      source,
    );
    expect(history.points).toHaveLength(1);
    expect(history.points[0]?.tokenAmount).toBe(20);
  });

  it("carries upstream warnings through untouched", () => {
    const warning = "fields are null for this label";
    const history = normalizeSmartMoneyHistory(
      [bucket("2026-09-16T23:00:00Z", 1)],
      [warning],
      source,
    );
    expect(history.warnings).toEqual([warning]);
  });
});

describe("position change", () => {
  it("measures units, so a price move alone is no change at all", () => {
    // Same 1000 tokens all week; the dollar value nearly halves.
    const history = normalizeSmartMoneyHistory(
      [
        bucket("2026-09-15T23:00:00Z", 1000, 20_000),
        bucket("2026-09-16T23:00:00Z", 1000, 11_000),
      ],
      [],
      source,
    );

    expect(positionChange(history)?.deltaAmount).toBe(0);
    expect(positionChange(history)?.percent).toBe(0);
  });

  it("reports a real sale as a fall in units", () => {
    const history = normalizeSmartMoneyHistory(
      [
        bucket("2026-09-15T23:00:00Z", 1000, 10_000),
        bucket("2026-09-16T23:00:00Z", 750, 7_500),
      ],
      [],
      source,
    );

    const change = positionChange(history);
    expect(change?.deltaAmount).toBe(-250);
    expect(change?.percent).toBeCloseTo(-25);
  });

  it("ignores the day still filling", () => {
    const history = normalizeSmartMoneyHistory(
      [
        bucket("2026-09-15T23:00:00Z", 1000),
        bucket("2026-09-16T23:00:00Z", 900),
        bucket("2026-09-17T05:00:00Z", 100, 1000, false),
      ],
      [],
      source,
    );
    // Ends at 900, the last complete day, not at the part-day reading of 100.
    expect(positionChange(history)?.toAmount).toBe(900);
  });

  it("returns null rather than zero when a week has one complete day", () => {
    const history = normalizeSmartMoneyHistory(
      [bucket("2026-09-16T23:00:00Z", 900)],
      [],
      source,
    );
    expect(positionChange(history)).toBeNull();
  });

  it("returns no percentage when the starting position was nothing", () => {
    const history = normalizeSmartMoneyHistory(
      [
        bucket("2026-09-15T23:00:00Z", 0, 0),
        bucket("2026-09-16T23:00:00Z", 500),
      ],
      [],
      source,
    );
    const change = positionChange(history);
    expect(change?.deltaAmount).toBe(500);
    // A percentage of nothing is undefined, not infinite and not zero.
    expect(change?.percent).toBeNull();
  });
});

describe("liquidity peers", () => {
  const rows = [
    { token_address: "0xAAA", token_symbol: "AAA", liquidity: 100 },
    { token_address: "0xBBB", token_symbol: "BBB", liquidity: 300 },
    { token_address: "0xCCC", token_symbol: "CCC", liquidity: null },
  ].map((row) => ({
    chain: "ethereum",
    market_cap_usd: null,
    price_usd: null,
    price_change: null,
    volume: null,
    buy_volume: null,
    sell_volume: null,
    netflow: null,
    token_age_days: null,
    ...row,
  }));

  it("orders by depth and marks the token under investigation", () => {
    const peers = normalizeLiquidityPeers(rows, "0xaaa", peerSource);

    expect(peers.peers.map((peer) => peer.symbol)).toEqual(["BBB", "AAA"]);
    expect(peers.peers.find((peer) => peer.symbol === "AAA")?.isSubject).toBe(
      true,
    );
  });

  it("matches the subject whatever case the address arrived in", () => {
    const peers = normalizeLiquidityPeers(rows, "0xAAA", peerSource);
    expect(peers.peers.some((peer) => peer.isSubject)).toBe(true);
  });

  it("drops a token with no liquidity figure instead of plotting it at zero", () => {
    const peers = normalizeLiquidityPeers(rows, "0xaaa", peerSource);
    expect(peers.peers.map((peer) => peer.symbol)).not.toContain("CCC");
  });

  it("marks nothing when the subject is not in the returned list", () => {
    const peers = normalizeLiquidityPeers(rows, "0xdddd", peerSource);
    expect(peers.peers.some((peer) => peer.isSubject)).toBe(false);
  });
});
