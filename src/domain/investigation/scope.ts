/**
 * Supported investigation scope.
 *
 * Scope is an allowlist, not a suggestion: an unsupported chain, timeframe, or
 * chain/timeframe pair is refused before any paid request is made
 * (02-product-rules 6.1, 07-security-and-privacy "Input validation").
 */

export const CHAINS = ["ethereum", "solana", "base"] as const;
export type Chain = (typeof CHAINS)[number];

export const TIMEFRAMES = ["1h", "6h", "1d", "7d"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export type ChainProfile = {
  readonly chain: Chain;
  /** Full name shown in the interface; never abbreviated to a ticker. */
  readonly displayName: string;
  readonly addressFormat: "evm" | "solana";
  readonly timeframes: readonly Timeframe[];
};

const CHAIN_PROFILES: Readonly<Record<Chain, ChainProfile>> = {
  ethereum: {
    chain: "ethereum",
    displayName: "Ethereum",
    addressFormat: "evm",
    timeframes: TIMEFRAMES,
  },
  solana: {
    chain: "solana",
    displayName: "Solana",
    addressFormat: "solana",
    timeframes: TIMEFRAMES,
  },
  base: {
    chain: "base",
    displayName: "Base",
    addressFormat: "evm",
    timeframes: TIMEFRAMES,
  },
};

export function isChain(value: unknown): value is Chain {
  return typeof value === "string" && CHAINS.includes(value as Chain);
}

export function isTimeframe(value: unknown): value is Timeframe {
  return typeof value === "string" && TIMEFRAMES.includes(value as Timeframe);
}

export function getChainProfile(chain: Chain): ChainProfile {
  return CHAIN_PROFILES[chain];
}

export function listChainProfiles(): readonly ChainProfile[] {
  return CHAINS.map((chain) => CHAIN_PROFILES[chain]);
}

/**
 * Timeframe support is per chain so an unsupported combination can be disabled
 * with a reason before submission rather than silently approximated
 * (02-product-rules 9.4).
 */
export function isSupportedScope(chain: Chain, timeframe: Timeframe): boolean {
  return CHAIN_PROFILES[chain].timeframes.includes(timeframe);
}

/** Timeframe expressed in seconds, for freshness and window derivations. */
export function timeframeSeconds(timeframe: Timeframe): number {
  switch (timeframe) {
    case "1h":
      return 60 * 60;
    case "6h":
      return 6 * 60 * 60;
    case "1d":
      return 24 * 60 * 60;
    case "7d":
      return 7 * 24 * 60 * 60;
  }
}
