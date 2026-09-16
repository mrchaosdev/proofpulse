/**
 * Nansen endpoint catalogue.
 *
 * Paths, the authentication header, and timeframe enums were verified against
 * the live API on 2026-09-15 (decision D-017). Base URLs are constants and user
 * input never becomes a hostname, protocol, or arbitrary path
 * (07-security-and-privacy "Upstream request controls").
 */

import type { Timeframe } from "@/domain/investigation/scope";
import type { SourceCapability } from "@/domain/investigation/investigation";

export const NANSEN_API_VERSION = "/api/v1";
export const NANSEN_AUTH_HEADER = "apikey";

export { CREDITS_PER_CALL } from "@/domain/investigation/credits";

/** Server constants, never client-controlled (07-security-and-privacy). */
export const MAX_ACTOR_ROWS = 10;
export const MAX_RELATED_WALLET_ROWS = 20;

export type NansenEndpoint = {
  readonly capability: SourceCapability;
  readonly path: string;
};

export const ENDPOINTS = {
  // Token Screener is not under the tgm/ prefix, unlike the other three.
  tokenScreener: { capability: "token-context", path: "/token-screener" },
  flowIntelligence: {
    capability: "cohort-flows",
    path: "/tgm/flow-intelligence",
  },
  whoBoughtSold: { capability: "buyers", path: "/tgm/who-bought-sold" },
  relatedWallets: {
    capability: "related-wallets",
    path: "/profiler/address/related-wallets",
  },
} as const satisfies Record<string, NansenEndpoint>;

/**
 * The two timeframe enums do not agree, so a domain timeframe is translated
 * per endpoint rather than passed through.
 *
 * Flow Intelligence accepts 5m, 1h, 6h, 12h, 1d, 7d.
 * Token Screener accepts 5m, 10m, 1h, 6h, 24h, 7d, 30d.
 *
 * Who Bought/Sold has no timeframe parameter at all and takes an explicit
 * from/to window instead.
 */
const FLOW_TIMEFRAME: Readonly<Record<Timeframe, string>> = {
  "1h": "1h",
  "6h": "6h",
  "1d": "1d",
  "7d": "7d",
};

const SCREENER_TIMEFRAME: Readonly<Record<Timeframe, string>> = {
  "1h": "1h",
  "6h": "6h",
  "1d": "24h",
  "7d": "7d",
};

export function flowTimeframe(timeframe: Timeframe): string {
  return FLOW_TIMEFRAME[timeframe];
}

export function screenerTimeframe(timeframe: Timeframe): string {
  return SCREENER_TIMEFRAME[timeframe];
}

export const TIMEFRAME_SECONDS: Readonly<Record<Timeframe, number>> = {
  "1h": 3_600,
  "6h": 21_600,
  "1d": 86_400,
  "7d": 604_800,
};

/**
 * Explicit window for endpoints that take from/to. The clock is injected so
 * the request stays reproducible in tests (06-technical-architecture).
 */
export function dateWindow(
  timeframe: Timeframe,
  now: Date,
): { readonly from: string; readonly to: string } {
  const from = new Date(now.getTime() - TIMEFRAME_SECONDS[timeframe] * 1000);
  return { from: from.toISOString(), to: now.toISOString() };
}
