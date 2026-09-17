/**
 * Contract tests for Nansen schema version `nansen-2026-09-15`.
 *
 * These fixtures are verbatim response bodies captured from the live API on
 * 2026-09-15 for LINK on Ethereum over a 1d timeframe. They prove that the
 * runtime schemas and normalizers still match what the provider returns, and
 * they pin the two upstream quirks the product must not paper over.
 */

import { describe, expect, it } from "vitest";
import { flowIntelligenceResponseSchema } from "@/integrations/nansen/schemas/flow-intelligence";
import { tokenScreenerResponseSchema } from "@/integrations/nansen/schemas/token-screener";
import { whoBoughtSoldResponseSchema } from "@/integrations/nansen/schemas/who-bought-sold";
import { relatedWalletsResponseSchema } from "@/integrations/nansen/schemas/related-wallets";
import { normalizeFlowIntelligence } from "@/integrations/nansen/normalizers/normalize-flow-intelligence";
import { normalizeTokenScreener } from "@/integrations/nansen/normalizers/normalize-token-screener";
import { normalizeWhoBoughtSold } from "@/integrations/nansen/normalizers/normalize-who-bought-sold";
import { normalizeRelatedWallets } from "@/integrations/nansen/normalizers/normalize-related-wallets";
import { scoreInvestigation } from "@/domain/investigation/investigation-result";
import type { SourceMeta } from "@/domain/investigation/investigation";

import flowFixture from "../fixtures/nansen/flow-intelligence.json";
import screenerFixture from "../fixtures/nansen/token-screener.json";
import buyFixture from "../fixtures/nansen/who-bought-sold-buy.json";
import sellFixture from "../fixtures/nansen/who-bought-sold-sell.json";
import relatedFixture from "../fixtures/nansen/related-wallets.json";
import solanaScreener from "../fixtures/nansen/solana-token-screener.json";
import solanaFlow from "../fixtures/nansen/solana-flow-intelligence.json";
import baseScreener from "../fixtures/nansen/base-token-screener.json";
import baseFlow from "../fixtures/nansen/base-flow-intelligence.json";

const COLLECTED_AT = "2026-09-15T00:40:00.000Z";
const EVALUATED_AT = "2026-09-15T00:40:30.000Z";
const TOKEN_ADDRESS = "0x514910771af9ca656af840dff83e8264ecf986ca";

function meta(capability: SourceMeta["capability"]): SourceMeta {
  return {
    provider: "nansen",
    capability,
    collectedAt: COLLECTED_AT,
    live: false,
    warnings: [],
  };
}

describe("Flow Intelligence contract", () => {
  it("parses the captured response", () => {
    const parsed = flowIntelligenceResponseSchema.safeParse(flowFixture.body);

    expect(parsed.success).toBe(true);
  });

  it("returns the two documented wallet-count warnings", () => {
    const parsed = flowIntelligenceResponseSchema.parse(flowFixture.body);

    expect(parsed.warnings).toHaveLength(2);
    expect(parsed.warnings.join(" ")).toContain("not tracked");
  });

  it("normalizes untracked wallet counts to null, never to zero", () => {
    const parsed = flowIntelligenceResponseSchema.parse(flowFixture.body);
    const record = parsed.data[0];
    if (record === undefined) throw new Error("expected a record");

    // The upstream value is literally 0 for these two cohorts.
    expect(record.exchange_wallet_count).toBe(0);
    expect(record.fresh_wallets_wallet_count).toBe(0);

    const flows = normalizeFlowIntelligence(record, meta("cohort-flows"));
    const bySegment = new Map(flows.map((flow) => [flow.segment, flow]));

    expect(bySegment.get("exchange")?.walletCount).toBeNull();
    expect(bySegment.get("fresh_wallet")?.walletCount).toBeNull();
  });

  it("keeps a genuinely observed zero wallet count as zero", () => {
    const parsed = flowIntelligenceResponseSchema.parse(flowFixture.body);
    const record = parsed.data[0];
    if (record === undefined) throw new Error("expected a record");

    const flows = normalizeFlowIntelligence(record, meta("cohort-flows"));
    const whale = flows.find((flow) => flow.segment === "whale");

    // Whales are tracked, so 0 here means no observed whale wallets.
    expect(whale?.walletCount).toBe(0);
  });

  it("preserves a null average flow alongside a present net flow", () => {
    const parsed = flowIntelligenceResponseSchema.parse(flowFixture.body);
    const record = parsed.data[0];
    if (record === undefined) throw new Error("expected a record");

    const flows = normalizeFlowIntelligence(record, meta("cohort-flows"));
    const whale = flows.find((flow) => flow.segment === "whale");

    expect(whale?.averageFlowUsd).toBeNull();
    expect(whale?.netFlowUsd).not.toBeNull();
  });

  it("maps every domain segment exactly once", () => {
    const parsed = flowIntelligenceResponseSchema.parse(flowFixture.body);
    const record = parsed.data[0];
    if (record === undefined) throw new Error("expected a record");

    const segments = normalizeFlowIntelligence(
      record,
      meta("cohort-flows"),
    ).map((flow) => flow.segment);

    expect(segments).toStrictEqual([
      "smart_trader",
      "top_pnl",
      "whale",
      "fresh_wallet",
      "public_figure",
      "exchange",
    ]);
  });
});

describe("Token Screener contract", () => {
  it("parses the captured response", () => {
    const parsed = tokenScreenerResponseSchema.safeParse(screenerFixture.body);

    expect(parsed.success).toBe(true);
  });

  it("selects the record matching the requested address", () => {
    const parsed = tokenScreenerResponseSchema.parse(screenerFixture.body);
    const context = normalizeTokenScreener(
      parsed.data,
      TOKEN_ADDRESS,
      meta("token-context"),
    );

    expect(context?.symbol).toBe("LINK");
    expect(context?.liquidityUsd).toBeGreaterThan(0);
  });

  it("leaves the token name missing, because the endpoint has no name field", () => {
    const parsed = tokenScreenerResponseSchema.parse(screenerFixture.body);
    const context = normalizeTokenScreener(
      parsed.data,
      TOKEN_ADDRESS,
      meta("token-context"),
    );

    expect(context?.name).toBeNull();
    expect(context?.symbol).not.toBeNull();
  });

  it("returns null when no record matches the requested address", () => {
    const parsed = tokenScreenerResponseSchema.parse(screenerFixture.body);
    const context = normalizeTokenScreener(
      parsed.data,
      "0x0000000000000000000000000000000000000000",
      meta("token-context"),
    );

    expect(context).toBeNull();
  });
});

describe("Who Bought/Sold contract", () => {
  it("parses both captured responses", () => {
    expect(whoBoughtSoldResponseSchema.safeParse(buyFixture.body).success).toBe(
      true,
    );
    expect(
      whoBoughtSoldResponseSchema.safeParse(sellFixture.body).success,
    ).toBe(true);
  });

  it("derives net USD, because the endpoint returns no net field", () => {
    const parsed = whoBoughtSoldResponseSchema.parse(buyFixture.body);
    const actors = normalizeWhoBoughtSold(parsed.data, "buyer", meta("buyers"));
    const first = actors[0];
    if (first === undefined) throw new Error("expected an actor");

    expect(first.netUsd).toBeCloseTo(
      (first.boughtUsd ?? 0) - (first.soldUsd ?? 0),
      6,
    );
  });

  it("treats an empty address label as no label", () => {
    const parsed = whoBoughtSoldResponseSchema.parse(buyFixture.body);
    const actors = normalizeWhoBoughtSold(parsed.data, "buyer", meta("buyers"));

    // The capture contains at least one record whose label is "".
    expect(parsed.data.some((record) => record.address_label === null)).toBe(
      true,
    );
    expect(actors.every((actor) => actor.displayLabel !== "")).toBe(true);
  });

  it("caps results at the requested page size", () => {
    const parsed = whoBoughtSoldResponseSchema.parse(buyFixture.body);

    expect(parsed.data.length).toBeLessThanOrEqual(10);
  });
});

describe("live capture through the full domain pipeline", () => {
  it("produces scores and evidence from real Nansen responses", () => {
    const flow = flowIntelligenceResponseSchema.parse(flowFixture.body);
    const screener = tokenScreenerResponseSchema.parse(screenerFixture.body);
    const buyers = whoBoughtSoldResponseSchema.parse(buyFixture.body);
    const sellers = whoBoughtSoldResponseSchema.parse(sellFixture.body);
    const flowRecord = flow.data[0];
    if (flowRecord === undefined) throw new Error("expected a flow record");

    const flowMeta: SourceMeta = {
      ...meta("cohort-flows"),
      warnings: flow.warnings,
    };

    const result = scoreInvestigation({
      input: {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "fixture",
      },
      tokenContext: normalizeTokenScreener(
        screener.data,
        TOKEN_ADDRESS,
        meta("token-context"),
      ),
      segmentFlows: normalizeFlowIntelligence(flowRecord, flowMeta),
      buyers: normalizeWhoBoughtSold(buyers.data, "buyer", meta("buyers")),
      sellers: normalizeWhoBoughtSold(sellers.data, "seller", meta("sellers")),
      relationships: [],
      inspectedActorAddresses: [],
      smartMoneyHistory: null,
      liquidityPeers: null,
      sourceStatuses: [
        {
          state: "ready",
          capability: "token-context",
          source: meta("token-context"),
          recordCount: screener.data.length,
        },
        {
          state: "ready",
          capability: "cohort-flows",
          source: flowMeta,
          recordCount: flow.data.length,
        },
        {
          state: "ready",
          capability: "buyers",
          source: meta("buyers"),
          recordCount: buyers.data.length,
        },
        {
          state: "ready",
          capability: "sellers",
          source: meta("sellers"),
          recordCount: sellers.data.length,
        },
      ],
      evaluatedAt: EVALUATED_AT,
    });

    expect(result.scores.direction.state).toBe("available");
    expect(result.scores.coordinationRisk.state).toBe("preliminary");
    expect(result.evidence.length).toBeGreaterThan(10);
  });

  it("uses reported liquidity as the direction scale", () => {
    const flow = flowIntelligenceResponseSchema.parse(flowFixture.body);
    const screener = tokenScreenerResponseSchema.parse(screenerFixture.body);
    const flowRecord = flow.data[0];
    if (flowRecord === undefined) throw new Error("expected a flow record");

    const result = scoreInvestigation({
      input: {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "fixture",
      },
      tokenContext: normalizeTokenScreener(
        screener.data,
        TOKEN_ADDRESS,
        meta("token-context"),
      ),
      segmentFlows: normalizeFlowIntelligence(flowRecord, meta("cohort-flows")),
      buyers: [],
      sellers: [],
      relationships: [],
      inspectedActorAddresses: [],
      smartMoneyHistory: null,
      liquidityPeers: null,
      sourceStatuses: [],
      evaluatedAt: EVALUATED_AT,
    });

    if (result.scores.direction.state !== "available") {
      throw new Error("expected a direction score");
    }
    expect(result.scores.direction.scaleBasis).toBe("liquidity");
  });

  it("caps confidence because the capture is a fixture, not live data", () => {
    const flow = flowIntelligenceResponseSchema.parse(flowFixture.body);
    const flowRecord = flow.data[0];
    if (flowRecord === undefined) throw new Error("expected a flow record");

    const result = scoreInvestigation({
      input: {
        chain: "ethereum",
        tokenAddress: TOKEN_ADDRESS,
        timeframe: "1d",
        mode: "fixture",
      },
      tokenContext: null,
      segmentFlows: normalizeFlowIntelligence(flowRecord, meta("cohort-flows")),
      buyers: [],
      sellers: [],
      relationships: [],
      inspectedActorAddresses: [],
      smartMoneyHistory: null,
      liquidityPeers: null,
      sourceStatuses: [],
      evaluatedAt: EVALUATED_AT,
    });

    expect(result.scores.confidence.value).toBeLessThanOrEqual(69);
  });
});

describe("Related Wallets contract", () => {
  const ACTOR = "0x19a99f5b363f2dbb7a35cb0b16f96b3f3ae2c280";

  it("parses the captured response", () => {
    const parsed = relatedWalletsResponseSchema.safeParse(relatedFixture.body);

    expect(parsed.success).toBe(true);
  });

  it("preserves the Nansen relation type verbatim", () => {
    const parsed = relatedWalletsResponseSchema.parse(relatedFixture.body);
    const relationships = normalizeRelatedWallets(
      parsed.data,
      ACTOR,
      meta("related-wallets"),
    );
    const relations = new Set(
      relationships.map((relationship) => relationship.relation),
    );

    // The live API returns human-readable relation names; they are not
    // rewritten into an internal vocabulary.
    expect(relations.has("First Funder")).toBe(true);
    expect(relations.has("Deployed Contract")).toBe(true);
  });

  it("carries the transaction and timestamp that evidence the link", () => {
    const parsed = relatedWalletsResponseSchema.parse(relatedFixture.body);
    const relationships = normalizeRelatedWallets(
      parsed.data,
      ACTOR,
      meta("related-wallets"),
    );
    const first = relationships[0];
    if (first === undefined) throw new Error("expected a relationship");

    expect(first.transactionHash).not.toBeNull();
    expect(first.observedAt).not.toBeNull();
    expect(first.sourceAddress).toBe(ACTOR);
  });

  it("treats an empty related-wallet label as no label", () => {
    const parsed = relatedWalletsResponseSchema.parse(relatedFixture.body);

    expect(parsed.data.every((record) => record.address_label !== "")).toBe(
      true,
    );
  });

  it("drops a self edge, which carries no relational information", () => {
    const parsed = relatedWalletsResponseSchema.parse(relatedFixture.body);
    const template = parsed.data[0];
    if (template === undefined) throw new Error("expected a record");
    const withSelfEdge = [...parsed.data, { ...template, address: ACTOR }];
    const relationships = normalizeRelatedWallets(
      withSelfEdge,
      ACTOR,
      meta("related-wallets"),
    );

    expect(relationships).toHaveLength(parsed.data.length);
  });
});

describe("chain coverage", () => {
  // Solana and Base were exercised against the live API on 2026-09-16. Each
  // returns the same schema as Ethereum, which is what lets one set of
  // normalizers serve all three supported chains.
  const captures = [
    { chain: "solana", screener: solanaScreener, flow: solanaFlow },
    { chain: "base", screener: baseScreener, flow: baseFlow },
  ] as const;

  for (const capture of captures) {
    it(`parses a ${capture.chain} token context`, () => {
      const parsed = tokenScreenerResponseSchema.parse(capture.screener.body);
      const context = normalizeTokenScreener(
        parsed.data,
        capture.screener.scope.tokenAddress,
        meta("token-context"),
      );

      expect(context?.symbol).toBe("USDC");
      expect(context?.liquidityUsd).toBeGreaterThan(0);
    });

    it(`parses ${capture.chain} cohort flows and reports the same warnings`, () => {
      const parsed = flowIntelligenceResponseSchema.parse(capture.flow.body);

      expect(parsed.warnings).toHaveLength(2);
      expect(parsed.warnings.join(" ")).toContain("not tracked");
    });

    it(`treats the untracked wallet counts as missing on ${capture.chain}`, () => {
      const parsed = flowIntelligenceResponseSchema.parse(capture.flow.body);
      const record = parsed.data[0];
      if (record === undefined) throw new Error("expected a record");
      const flows = normalizeFlowIntelligence(record, meta("cohort-flows"));
      const bySegment = new Map(flows.map((flow) => [flow.segment, flow]));

      expect(bySegment.get("exchange")?.walletCount).toBeNull();
      expect(bySegment.get("fresh_wallet")?.walletCount).toBeNull();
      // A tracked cohort still reports its real count.
      expect(bySegment.get("smart_trader")?.walletCount).toBeGreaterThan(0);
    });
  }
});
