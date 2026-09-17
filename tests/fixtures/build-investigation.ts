/**
 * Immutable test-input builders for normalized investigations.
 *
 * Tests describe only the fields they care about; everything else takes a
 * neutral default so a test never accidentally asserts on an unrelated value.
 */

import type {
  Actor,
  ActorSide,
  NormalizedInvestigation,
  Relationship,
  Segment,
  SegmentFlow,
  SourceCapability,
  SourceMeta,
  SourceStatus,
  TokenContext,
} from "@/domain/investigation/investigation";
import { REQUIRED_CAPABILITIES } from "@/domain/investigation/investigation";

export const EVALUATED_AT = "2026-09-15T12:00:00.000Z";
export const COLLECTED_AT = "2026-09-15T11:59:30.000Z";

export function sourceMeta(
  capability: SourceCapability,
  overrides: Partial<SourceMeta> = {},
): SourceMeta {
  return {
    provider: "nansen",
    capability,
    collectedAt: COLLECTED_AT,
    live: true,
    warnings: [],
    ...overrides,
  };
}

export function segmentFlow(
  segment: Segment,
  netFlowUsd: number | null,
  overrides: Partial<SegmentFlow> = {},
): SegmentFlow {
  return {
    segment,
    netFlowUsd,
    averageFlowUsd: null,
    walletCount: 20,
    source: sourceMeta("cohort-flows"),
    ...overrides,
  };
}

export function actor(
  side: ActorSide,
  address: string,
  netUsd: number | null,
  overrides: Partial<Actor> = {},
): Actor {
  return {
    address,
    displayLabel: null,
    boughtUsd: null,
    soldUsd: null,
    netUsd,
    side,
    source: sourceMeta(side === "buyer" ? "buyers" : "sellers"),
    ...overrides,
  };
}

export function relationship(
  sourceAddress: string,
  targetAddress: string,
  overrides: Partial<Relationship> = {},
): Relationship {
  return {
    sourceAddress,
    targetAddress,
    targetLabel: null,
    relation: "funded_by",
    transactionHash: null,
    observedAt: null,
    source: sourceMeta("related-wallets"),
    ...overrides,
  };
}

export function tokenContext(
  overrides: Partial<TokenContext> = {},
): TokenContext {
  return {
    name: "Example Token",
    symbol: "EXMPL",
    liquidityUsd: 20_000_000,
    marketCapUsd: null,
    volumeUsd: null,
    priceChangePercent: null,
    source: sourceMeta("token-context"),
    ...overrides,
  };
}

/** All required sources ready, unless a test overrides one. */
export function readyStatuses(
  overrides: readonly SourceStatus[] = [],
): readonly SourceStatus[] {
  const overridden = new Set(overrides.map((status) => status.capability));
  const defaults = REQUIRED_CAPABILITIES.filter(
    (capability) => !overridden.has(capability),
  ).map((capability): SourceStatus => ({
    state: "ready",
    capability,
    source: sourceMeta(capability),
    recordCount: 5,
  }));
  return [...defaults, ...overrides];
}

export function investigation(
  overrides: Partial<NormalizedInvestigation> = {},
): NormalizedInvestigation {
  return {
    input: {
      chain: "ethereum",
      tokenAddress: "0x1111111111111111111111111111111111111111",
      timeframe: "1d",
      mode: "live",
    },
    tokenContext: tokenContext(),
    segmentFlows: [],
    buyers: [],
    sellers: [],
    relationships: [],
    inspectedActorAddresses: [],
    smartMoneyHistory: null,
    liquidityPeers: null,
    sourceStatuses: readyStatuses(),
    evaluatedAt: EVALUATED_AT,
    ...overrides,
  };
}

/** ISO timestamp a given number of seconds before EVALUATED_AT. */
export function agedBy(seconds: number): string {
  return new Date(Date.parse(EVALUATED_AT) - seconds * 1000).toISOString();
}
