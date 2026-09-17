/**
 * Freshness windows per dataset (05-data-and-scoring "Freshness and caching").
 *
 * Stale data stays visible with its age and lowers Confidence; it is never
 * hidden and never silently refreshed (02-product-rules 1.5).
 */

import type { SourceCapability } from "../investigation/investigation";

export type FreshnessWindow = {
  readonly freshSeconds: number;
  readonly staleAfterSeconds: number;
};

const WINDOWS: Readonly<Record<SourceCapability, FreshnessWindow>> = {
  "token-context": { freshSeconds: 60, staleAfterSeconds: 300 },
  "cohort-flows": { freshSeconds: 120, staleAfterSeconds: 600 },
  buyers: { freshSeconds: 300, staleAfterSeconds: 900 },
  sellers: { freshSeconds: 300, staleAfterSeconds: 900 },
  "related-wallets": { freshSeconds: 1800, staleAfterSeconds: 86_400 },
  // A seven-day history barely moves in an hour, and its newest bucket is
  // marked incomplete anyway, so it is allowed to age far longer than a
  // live flow reading before it counts as stale.
  "smart-money-history": { freshSeconds: 3600, staleAfterSeconds: 21_600 },
  "liquidity-peers": { freshSeconds: 300, staleAfterSeconds: 3600 },
};

export function freshnessWindow(capability: SourceCapability): FreshnessWindow {
  return WINDOWS[capability];
}

export type FreshnessState = "fresh" | "aging" | "stale";

export function ageSeconds(collectedAt: string, evaluatedAt: string): number {
  const collected = Date.parse(collectedAt);
  const evaluated = Date.parse(evaluatedAt);
  if (Number.isNaN(collected) || Number.isNaN(evaluated)) return 0;
  return Math.max(0, (evaluated - collected) / 1000);
}

export function freshnessState(
  capability: SourceCapability,
  age: number,
): FreshnessState {
  const window = WINDOWS[capability];
  if (age <= window.freshSeconds) return "fresh";
  if (age >= window.staleAfterSeconds) return "stale";
  return "aging";
}

/**
 * 1 while within the fresh target, decaying linearly to 0 at the stale
 * threshold. Used as the Confidence freshness multiplier.
 */
export function freshnessFactor(
  capability: SourceCapability,
  age: number,
): number {
  const { freshSeconds, staleAfterSeconds } = WINDOWS[capability];
  if (age <= freshSeconds) return 1;
  if (age >= staleAfterSeconds) return 0;
  const span = staleAfterSeconds - freshSeconds;
  return span <= 0 ? 0 : 1 - (age - freshSeconds) / span;
}
