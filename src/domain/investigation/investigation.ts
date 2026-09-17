/**
 * Normalized investigation contracts.
 *
 * These are domain types, not copies of Nansen response objects. Provider
 * response types never reach this layer (CODEBASE-RULES 11).
 *
 * Missing values are `null` and stay missing. They are never converted to zero
 * (02-product-rules 1.4).
 */

import type { Chain, Timeframe } from "./scope";

export type InvestigationMode = "live" | "fixture";

export type InvestigationInput = {
  readonly chain: Chain;
  /** Canonical address produced by validateTokenAddress. */
  readonly tokenAddress: string;
  readonly timeframe: Timeframe;
  readonly mode: InvestigationMode;
};

/** Every Nansen capability the MVP can request. */
export const SOURCE_CAPABILITIES = [
  "token-context",
  "cohort-flows",
  "buyers",
  "sellers",
  "related-wallets",
  "smart-money-history",
  "liquidity-peers",
] as const;
export type SourceCapability = (typeof SOURCE_CAPABILITIES)[number];

/** Datasets a core investigation always requests. */
export const REQUIRED_CAPABILITIES: readonly SourceCapability[] = [
  "token-context",
  "cohort-flows",
  "buyers",
  "sellers",
];

export type SourceMeta = {
  readonly provider: "nansen";
  readonly capability: SourceCapability;
  /** ISO 8601 UTC string. Becomes a Date only near use (CODEBASE-RULES 8). */
  readonly collectedAt: string;
  readonly sourceFrom?: string;
  readonly sourceTo?: string;
  readonly live: boolean;
  readonly warnings: readonly string[];
};

export const SEGMENTS = [
  "smart_trader",
  "top_pnl",
  "whale",
  "fresh_wallet",
  "public_figure",
  "exchange",
] as const;
export type Segment = (typeof SEGMENTS)[number];

export type SegmentFlow = {
  readonly segment: Segment;
  readonly netFlowUsd: number | null;
  readonly averageFlowUsd: number | null;
  readonly walletCount: number | null;
  readonly source: SourceMeta;
};

export type ActorSide = "buyer" | "seller";

export type Actor = {
  readonly address: string;
  /** Upstream label. Untrusted string; always attributed to its source. */
  readonly displayLabel: string | null;
  readonly boughtUsd: number | null;
  readonly soldUsd: number | null;
  readonly netUsd: number | null;
  readonly side: ActorSide;
  readonly source: SourceMeta;
};

export type Relationship = {
  readonly sourceAddress: string;
  readonly targetAddress: string;
  readonly targetLabel: string | null;
  /** Nansen relation type, preserved verbatim. Never read as ownership. */
  readonly relation: string;
  readonly transactionHash: string | null;
  readonly observedAt: string | null;
  readonly source: SourceMeta;
};

/**
 * One day of what smart money held, not what it moved.
 *
 * `tokenAmount` is the position in token units and `valueUsd` the same
 * position priced. They move apart whenever the price moves, so a fall in
 * value with a flat amount is a cheaper token, not a sale. Reading one for the
 * other is the mistake this product exists to prevent, so both are carried and
 * the change is derived from the amount.
 */
export type HoldingPoint = {
  /** End of the daily bucket, ISO 8601 UTC. */
  readonly date: string;
  readonly tokenAmount: number | null;
  readonly valueUsd: number | null;
  readonly holderCount: number | null;
  readonly priceUsd: number | null;
  /** False while the day is still filling. Today is never complete. */
  readonly complete: boolean;
};

export type SmartMoneyHistory = {
  readonly points: readonly HoldingPoint[];
  /** Upstream warnings, preserved verbatim and shown beside the chart. */
  readonly warnings: readonly string[];
  readonly source: SourceMeta;
};

/**
 * A token on the same chain, for placing the investigated one in context.
 * These are observations about other tokens, never a recommendation between
 * them (02-product-rules: no trading advice).
 */
export type LiquidityPeer = {
  readonly tokenAddress: string;
  readonly symbol: string | null;
  readonly liquidityUsd: number | null;
  readonly volumeUsd: number | null;
  readonly netFlowUsd: number | null;
  /** True for the token under investigation, wherever it lands in the list. */
  readonly isSubject: boolean;
};

export type LiquidityPeers = {
  readonly peers: readonly LiquidityPeer[];
  readonly source: SourceMeta;
};

export type TokenContext = {
  readonly name: string | null;
  readonly symbol: string | null;
  readonly liquidityUsd: number | null;
  readonly marketCapUsd: number | null;
  readonly volumeUsd: number | null;
  readonly priceChangePercent: number | null;
  readonly source: SourceMeta;
};

/** Stable, provider-independent failure categories at the app boundary. */
export type SourceErrorCode =
  | "TOKEN_NOT_FOUND"
  | "UNSUPPORTED_SCOPE"
  | "NANSEN_AUTH"
  | "NANSEN_CREDITS"
  | "NANSEN_RATE_LIMIT"
  | "NANSEN_TIMEOUT"
  | "NANSEN_SCHEMA"
  | "INTERNAL";

/**
 * Per-source outcome. A discriminated union rather than optional-field soup
 * (CODEBASE-RULES 8), so "no records returned" can never be confused with
 * "source failed" or "not requested" (02-product-rules 9.5).
 */
export type SourceStatus =
  | { readonly state: "not-requested"; readonly capability: SourceCapability }
  | { readonly state: "loading"; readonly capability: SourceCapability }
  | {
      readonly state: "ready";
      readonly capability: SourceCapability;
      readonly source: SourceMeta;
      readonly recordCount: number;
    }
  | {
      readonly state: "empty";
      readonly capability: SourceCapability;
      readonly source: SourceMeta;
    }
  | {
      readonly state: "error";
      readonly capability: SourceCapability;
      readonly code: SourceErrorCode;
      readonly retryable: boolean;
      readonly message: string;
    };

export type NormalizedInvestigation = {
  readonly input: InvestigationInput;
  readonly tokenContext: TokenContext | null;
  readonly segmentFlows: readonly SegmentFlow[];
  readonly buyers: readonly Actor[];
  readonly sellers: readonly Actor[];
  readonly relationships: readonly Relationship[];
  readonly inspectedActorAddresses: readonly string[];
  /** Both cost a credit each, so both are null until asked for. */
  readonly smartMoneyHistory: SmartMoneyHistory | null;
  readonly liquidityPeers: LiquidityPeers | null;
  readonly sourceStatuses: readonly SourceStatus[];
  /** Single clock read for the whole investigation, ISO 8601 UTC. */
  readonly evaluatedAt: string;
};

export function findSourceStatus(
  investigation: NormalizedInvestigation,
  capability: SourceCapability,
): SourceStatus {
  return (
    investigation.sourceStatuses.find(
      (status) => status.capability === capability,
    ) ?? { state: "not-requested", capability }
  );
}
