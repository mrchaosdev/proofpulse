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
  Relationship,
  SourceStatus,
} from "@/domain/investigation/investigation";
import type { Chain, Timeframe } from "@/domain/investigation/scope";
import { flowIntelligenceResponseSchema } from "@/integrations/nansen/schemas/flow-intelligence";
import { tokenScreenerResponseSchema } from "@/integrations/nansen/schemas/token-screener";
import { whoBoughtSoldResponseSchema } from "@/integrations/nansen/schemas/who-bought-sold";
import { normalizeFlowIntelligence } from "@/integrations/nansen/normalizers/normalize-flow-intelligence";
import { normalizeTokenScreener } from "@/integrations/nansen/normalizers/normalize-token-screener";
import { normalizeWhoBoughtSold } from "@/integrations/nansen/normalizers/normalize-who-bought-sold";
import { normalizeRelatedWallets } from "@/integrations/nansen/normalizers/normalize-related-wallets";
import { relatedWalletsResponseSchema } from "@/integrations/nansen/schemas/related-wallets";
import { smartMoneyFlowsResponseSchema } from "@/integrations/nansen/schemas/smart-money-flows";
import { normalizeSmartMoneyHistory } from "@/integrations/nansen/normalizers/normalize-smart-money-history";
import { normalizeLiquidityPeers } from "@/integrations/nansen/normalizers/normalize-liquidity-peers";
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
 * Parsed once per process rather than per request.
 *
 * The capture never changes at runtime, but parsing it does real work: the
 * seven-day history alone is 168 hourly buckets through a Zod schema. Doing
 * that on every render made the demo route slow enough that four parallel
 * browser tests against one server started timing out.
 *
 * Only the clock is per-request, and it is not part of what is cached.
 */
type FixtureParts = Omit<NormalizedInvestigation, "evaluatedAt">;

let parsedFixture: FixtureParts | null = null;

function buildFixtureParts(): FixtureParts {
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

  const history = smartMoneyFlowsResponseSchema.parse(
    demoFixture.responses["smart-money-history"],
  );
  const peers = tokenScreenerResponseSchema.parse(
    demoFixture.responses["token-peers"],
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
  const historyWarnings = history.warnings ?? [];
  const historyMeta = sourceMeta(
    "smart-money-history",
    collectedAt,
    historyWarnings,
    false,
  );
  const peerMeta = sourceMeta("liquidity-peers", collectedAt, [], false);
  const smartMoneyHistory = normalizeSmartMoneyHistory(
    history.data,
    historyWarnings,
    historyMeta,
  );
  const liquidityPeers = normalizeLiquidityPeers(
    peers.data,
    fixture.tokenAddress,
    peerMeta,
  );

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
    {
      state: "ready",
      capability: "smart-money-history",
      source: historyMeta,
      // Days shown, not the hourly buckets they were collapsed from.
      recordCount: smartMoneyHistory.points.length,
    },
    {
      state: "ready",
      capability: "liquidity-peers",
      source: peerMeta,
      recordCount: liquidityPeers.peers.length,
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
    smartMoneyHistory,
    liquidityPeers,
    sourceStatuses: statuses,
  };
}

/**
 * Builds a normalized investigation from the captured responses. `live` is
 * false on every source, so the interface can never present this as live data.
 */
export function loadFixtureInvestigation(
  evaluatedAt: string,
): NormalizedInvestigation {
  parsedFixture ??= buildFixtureParts();
  return { ...parsedFixture, evaluatedAt };
}

/** The address whose relationships the demo fixture captured. */
export function fixtureActorAddress(): string {
  return demoFixture.relationships.actorAddress;
}

/**
 * Relationship expansion for the one actor the fixture covers. Returns null
 * for any other address, so the demo cannot imply it holds relationship
 * evidence it never captured.
 */
export function loadFixtureRelationships(
  actorAddress: string,
): readonly Relationship[] | null {
  const captured = demoFixture.relationships;
  if (captured.actorAddress.toLowerCase() !== actorAddress.toLowerCase()) {
    return null;
  }

  const parsed = relatedWalletsResponseSchema.parse(captured.response);
  const meta = sourceMeta("related-wallets", demoFixture.capturedAt, [], false);
  return normalizeRelatedWallets(parsed.data, captured.actorAddress, meta);
}
