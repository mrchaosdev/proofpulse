import "server-only";

/**
 * Investigation orchestration.
 *
 * Settled parallel work so one failing source does not erase evidence from the
 * others (06-technical-architecture), a single clock read per investigation,
 * and a cache layer in front of every paid call.
 */

import type { Chain, Timeframe } from "@/domain/investigation/scope";
import { isSupportedScope } from "@/domain/investigation/scope";
import type {
  Actor,
  InvestigationMode,
  NormalizedInvestigation,
  SegmentFlow,
  SourceStatus,
  TokenContext,
} from "@/domain/investigation/investigation";
import type { InvestigationResult } from "@/domain/investigation/investigation-result";
import { scoreInvestigation } from "@/domain/investigation/investigation-result";
import { fetchTokenContext } from "@/integrations/nansen/adapters/fetch-token-context";
import { fetchCohortFlows } from "@/integrations/nansen/adapters/fetch-cohort-flows";
import { fetchActors } from "@/integrations/nansen/adapters/fetch-actors";
import type { AdapterOutcome } from "@/integrations/nansen/adapters/adapter-result";
import { loadFixtureInvestigation } from "../fixtures/fixture-loader";
import type { CacheStore } from "../cache/cache-store";
import { buildCacheKey, cacheTtlSeconds } from "../cache/cache-key";

export type InvestigationRequest = {
  readonly chain: Chain;
  /** Canonical address; validation happens before this function is called. */
  readonly tokenAddress: string;
  readonly timeframe: Timeframe;
  /**
   * Fixture mode replays captured responses through the same pipeline. It is a
   * deliberate choice, never a silent fallback when live data fails
   * (02-product-rules 5.7).
   */
  readonly mode: InvestigationMode;
};

export type InvestigationDependencies = {
  readonly cache: CacheStore;
  readonly now: () => Date;
};

/**
 * Runs one core investigation: four Nansen calls, four credits, before any
 * optional wallet expansion (05-data-and-scoring).
 */
export async function runInvestigation(
  request: InvestigationRequest,
  dependencies: InvestigationDependencies,
): Promise<InvestigationResult> {
  const now = dependencies.now();
  const collectedAt = now.toISOString();
  const scope = { ...request, now, collectedAt };

  if (request.mode === "fixture") {
    return scoreInvestigation(loadFixtureInvestigation(collectedAt));
  }

  if (!isSupportedScope(request.chain, request.timeframe)) {
    return scoreInvestigation(
      emptyInvestigation(request, collectedAt, [
        {
          state: "error",
          capability: "cohort-flows",
          code: "UNSUPPORTED_SCOPE",
          retryable: false,
          message: "This chain and timeframe combination is not supported.",
        },
      ]),
    );
  }

  const [context, flows, buyers, sellers] = await Promise.all([
    cached(dependencies.cache, "token-context", request, () =>
      fetchTokenContext(scope),
    ),
    cached(dependencies.cache, "cohort-flows", request, () =>
      fetchCohortFlows(scope),
    ),
    cached(dependencies.cache, "buyers", request, () =>
      fetchActors({ ...scope, side: "buyer" }),
    ),
    cached(dependencies.cache, "sellers", request, () =>
      fetchActors({ ...scope, side: "seller" }),
    ),
  ]);

  const investigation: NormalizedInvestigation = {
    input: { ...request, mode: "live" },
    tokenContext: context.data,
    segmentFlows: flows.data ?? [],
    buyers: buyers.data ?? [],
    sellers: sellers.data ?? [],
    relationships: [],
    inspectedActorAddresses: [],
    sourceStatuses: [
      context.status,
      flows.status,
      buyers.status,
      sellers.status,
    ],
    evaluatedAt: collectedAt,
  };

  return scoreInvestigation(investigation);
}

type CachedCapability = "token-context" | "cohort-flows" | "buyers" | "sellers";

type CachedData = TokenContext | readonly SegmentFlow[] | readonly Actor[];

/**
 * Serves a normalized outcome from cache when one is fresh, so a repeated
 * investigation of the same scope spends no credits (02-product-rules 6.2).
 * Only successful outcomes are cached; an error is retried on the next request.
 */
async function cached<T extends CachedData>(
  cache: CacheStore,
  capability: CachedCapability,
  request: InvestigationRequest,
  load: () => Promise<AdapterOutcome<T>>,
): Promise<AdapterOutcome<T>> {
  const key = buildCacheKey({
    capability,
    chain: request.chain,
    address: request.tokenAddress,
    timeframe: request.timeframe,
  });

  const hit = await cache.get<AdapterOutcome<T>>(key);
  if (hit !== null) return hit;

  const outcome = await load();
  if (outcome.status.state === "ready" || outcome.status.state === "empty") {
    await cache.set(key, outcome, cacheTtlSeconds(capability));
  }
  return outcome;
}

function emptyInvestigation(
  request: InvestigationRequest,
  collectedAt: string,
  statuses: readonly SourceStatus[],
): NormalizedInvestigation {
  return {
    input: { ...request, mode: "live" },
    tokenContext: null,
    segmentFlows: [],
    buyers: [],
    sellers: [],
    relationships: [],
    inspectedActorAddresses: [],
    sourceStatuses: statuses,
    evaluatedAt: collectedAt,
  };
}
