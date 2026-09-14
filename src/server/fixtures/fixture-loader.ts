import "server-only";

/**
 * Deterministic demo fixture.
 *
 * Fixture mode uses the same schemas, normalizers, evidence builder, and
 * scoring as live mode; only the data source changes
 * (06-technical-architecture "Fixture mode"). This prevents a polished demo
 * path from drifting away from the real product.
 */

import type {
  NormalizedInvestigation,
  SourceStatus,
} from "@/domain/investigation/investigation";
import type { Chain, Timeframe } from "@/domain/investigation/scope";
import { flowIntelligenceResponseSchema } from "@/integrations/nansen/schemas/flow-intelligence";
import { tokenScreenerResponseSchema } from "@/integrations/nansen/schemas/token-screener";
import { whoBoughtSoldResponseSchema } from "@/integrations/nansen/schemas/who-bought-sold";
import { normalizeFlowIntelligence } from "@/integrations/nansen/normalizers/normalize-flow-intelligence";
import { normalizeTokenScreener } from "@/integrations/nansen/normalizers/normalize-token-screener";
import { normalizeWhoBoughtSold } from "@/integrations/nansen/normalizers/normalize-who-bought-sold";
import { sourceMeta } from "@/integrations/nansen/adapters/adapter-result";
import demoFixture from "./data/demo-investigation.json";

export type FixtureDescriptor = {
  readonly id: string;
  /** When the upstream responses were captured, shown persistently in the UI. */
  readonly capturedAt: string;
  readonly chain: Chain;
  readonly tokenAddress: string;
  readonly tokenSymbol: string;
  readonly timeframe: Timeframe;
};

export function describeFixture(): FixtureDescriptor {
  return {
    id: demoFixture.id,
    capturedAt: demoFixture.capturedAt,
    chain: demoFixture.scope.chain as Chain,
    tokenAddress: demoFixture.scope.tokenAddress,
    tokenSymbol: demoFixture.scope.tokenSymbol,
    timeframe: demoFixture.scope.timeframe as Timeframe,
  };
}

/** True when the requested scope is the one the fixture actually covers. */
export function fixtureCovers(
  chain: Chain,
  tokenAddress: string,
  timeframe: Timeframe,
): boolean {
  const fixture = describeFixture();
  return (
    fixture.chain === chain &&
    fixture.tokenAddress.toLowerCase() === tokenAddress.toLowerCase() &&
    fixture.timeframe === timeframe
  );
}

/**
 * Builds a normalized investigation from the captured responses. `live` is
 * false on every source, so the interface can never present this as live data.
 */
export function loadFixtureInvestigation(
  evaluatedAt: string,
): NormalizedInvestigation {
  const fixture = describeFixture();
  const collectedAt = fixture.capturedAt;

  const screener = tokenScreenerResponseSchema.parse(
    demoFixture.responses["token-context"],
  );
  const flow = flowIntelligenceResponseSchema.parse(
    demoFixture.responses["cohort-flows"],
  );
  const buyers = whoBoughtSoldResponseSchema.parse(
    demoFixture.responses.buyers,
  );
  const sellers = whoBoughtSoldResponseSchema.parse(
    demoFixture.responses.sellers,
  );

  const contextMeta = sourceMeta("token-context", collectedAt, [], false);
  const flowMeta = sourceMeta(
    "cohort-flows",
    collectedAt,
    flow.warnings,
    false,
  );
  const buyerMeta = sourceMeta("buyers", collectedAt, [], false);
  const sellerMeta = sourceMeta("sellers", collectedAt, [], false);

  const flowRecord = flow.data[0];
  const segmentFlows =
    flowRecord === undefined
      ? []
      : normalizeFlowIntelligence(flowRecord, flowMeta);

  const statuses: SourceStatus[] = [
    {
      state: "ready",
      capability: "token-context",
      source: contextMeta,
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
      source: buyerMeta,
      recordCount: buyers.data.length,
    },
    {
      state: "ready",
      capability: "sellers",
      source: sellerMeta,
      recordCount: sellers.data.length,
    },
  ];

  return {
    input: {
      chain: fixture.chain,
      tokenAddress: fixture.tokenAddress,
      timeframe: fixture.timeframe,
      mode: "fixture",
    },
    tokenContext: normalizeTokenScreener(
      screener.data,
      fixture.tokenAddress,
      contextMeta,
    ),
    segmentFlows,
    buyers: normalizeWhoBoughtSold(buyers.data, "buyer", buyerMeta),
    sellers: normalizeWhoBoughtSold(sellers.data, "seller", sellerMeta),
    relationships: [],
    inspectedActorAddresses: [],
    sourceStatuses: statuses,
    evaluatedAt,
  };
}
