/**
 * Cache keys are constructed centrally (CODEBASE-RULES 11).
 *
 * A key includes the schema version, capability, chain, canonical address,
 * timeframe, and any normalized filter. It never includes a credential.
 */

import type { Chain, Timeframe } from "@/domain/investigation/scope";
import type { SourceCapability } from "@/domain/investigation/investigation";

/** Bumping this invalidates every cached payload after a schema change. */
export const CACHE_SCHEMA_VERSION = "nansen-2026-09-15";

/** Cache TTL per dataset, in seconds (05-data-and-scoring). */
const TTL_SECONDS: Readonly<Record<SourceCapability, number>> = {
  "token-context": 60,
  "cohort-flows": 120,
  buyers: 300,
  sellers: 300,
  "related-wallets": 1800,
};

export function cacheTtlSeconds(capability: SourceCapability): number {
  return TTL_SECONDS[capability];
}

export function buildCacheKey(parts: {
  readonly capability: SourceCapability;
  readonly chain: Chain;
  readonly address: string;
  readonly timeframe?: Timeframe;
  readonly variant?: string;
}): string {
  return [
    CACHE_SCHEMA_VERSION,
    parts.capability,
    parts.chain,
    parts.address.toLowerCase(),
    parts.timeframe ?? "none",
    parts.variant ?? "default",
  ].join(":");
}
