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
  LiquidityPeers,
  NormalizedInvestigation,
  SegmentFlow,
  SmartMoneyHistory,
  SourceStatus,
  TokenContext,
} from "@/domain/investigation/investigation";
import type { InvestigationResult } from "@/domain/investigation/investigation-result";
import { scoreInvestigation } from "@/domain/investigation/investigation-result";
import { fetchTokenContext } from "@/integrations/nansen/adapters/fetch-token-context";
import { fetchSmartMoneyHistory } from "@/integrations/nansen/adapters/fetch-smart-money-history";
import { fetchLiquidityPeers } from "@/integrations/nansen/adapters/fetch-liquidity-peers";
import { fetchCohortFlows } from "@/integrations/nansen/adapters/fetch-cohort-flows";
import { fetchActors } from "@/integrations/nansen/adapters/fetch-actors";
import type { AdapterOutcome } from "@/integrations/nansen/adapters/adapter-result";
import { loadFixtureInvestigation } from "../fixtures/fixture-loader";
import { expandRelationships } from "./relationship-service";
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
  /**
   * Whether to fetch the seven-day history and the liquidity comparison. Each
   * costs a credit, so both stay unrequested until a reader asks.
   */
  readonly includeContextPanels?: boolean;
  /**
   * Actor the user chose to expand, if any. Relationship evidence is fetched
   * only for an actor that appears in this investigation, and only when asked
   * (02-product-rules 4.3).
   */
  readonly inspectActorAddress?: string;
  /**
   * Capabilities whose cache entry the user asked to bypass. A refresh spends
   * credits, so it is an explicit request and is bounded: one bypass per
   * capability per cache window (07-security-and-privacy "Abuse and credit
   * controls").
   */
  readonly refreshCapabilities?: readonly CachedCapability[];
};

/** Credit impact shown before a refresh is confirmed (rule 4.4). */
export type CreditImpact = "low" | "medium" | "high";

export function refreshCreditImpact(count: number): CreditImpact {
  if (count === 0) return "low";
  return count >= 4 ? "medium" : "low";
}

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
    const fixture = loadFixtureInvestigation(collectedAt);
    return scoreInvestigation(
      await withRelationships(fixture, request, dependencies),
    );
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

  const panels = await fetchContextPanels(request, scope, dependencies);

  const investigation: NormalizedInvestigation = {
    input: { ...request, mode: "live" },
    tokenContext: context.data,
    segmentFlows: flows.data ?? [],
    buyers: buyers.data ?? [],
    sellers: sellers.data ?? [],
    relationships: [],
    inspectedActorAddresses: [],
    smartMoneyHistory: panels.history,
    liquidityPeers: panels.peers,
    sourceStatuses: [
      context.status,
      flows.status,
      buyers.status,
      sellers.status,
      // Empty unless the panels were asked for, so an unrequested dataset
      // reports "not requested" rather than appearing as a silent absence.
      ...panels.statuses,
    ],
    evaluatedAt: collectedAt,
  };

  return scoreInvestigation(
    await withRelationships(investigation, request, dependencies),
  );
}

/**
 * Adds relationship evidence for the inspected actor. The actor must already
 * be one of this investigation's actors, which is checked in memory here, so
 * no unrelated address can trigger a paid expansion.
 */
async function withRelationships(
  investigation: NormalizedInvestigation,
  request: InvestigationRequest,
  dependencies: InvestigationDependencies,
): Promise<NormalizedInvestigation> {
  const actorAddress = request.inspectActorAddress;
  if (actorAddress === undefined) return investigation;

  const isActor = [...investigation.buyers, ...investigation.sellers].some(
    (actor) => actor.address.toLowerCase() === actorAddress.toLowerCase(),
  );
  if (!isActor) return investigation;

  const outcome = await expandRelationships(
    {
      chain: request.chain,
      tokenAddress: request.tokenAddress,
      timeframe: request.timeframe,
      actorAddress,
      mode: request.mode,
    },
    dependencies,
  );

  if (!outcome.ok) {
    return {
      ...investigation,
      sourceStatuses: [
        ...investigation.sourceStatuses,
        {
          state: "error",
          capability: "related-wallets",
          code: "INTERNAL",
          retryable: false,
          message: outcome.message,
        },
      ],
    };
  }

  return {
    ...investigation,
    relationships: outcome.relationships,
    inspectedActorAddresses: [actorAddress],
    sourceStatuses: [...investigation.sourceStatuses, outcome.status],
  };
}

/**
 * The history and the peer comparison, fetched only when asked for.
 *
 * Each costs a credit, so neither rides along with the core four. This is the
 * same bargain wallet relationships make: context that is worth paying for
 * when a reader wants it, and worth nothing when they do not.
 */
async function fetchContextPanels(
  request: InvestigationRequest,
  scope: {
    readonly chain: Chain;
    readonly tokenAddress: string;
    readonly timeframe: Timeframe;
    readonly now: Date;
    readonly collectedAt: string;
  },
  dependencies: InvestigationDependencies,
): Promise<{
  readonly history: SmartMoneyHistory | null;
  readonly peers: LiquidityPeers | null;
  readonly statuses: readonly SourceStatus[];
}> {
  if (request.includeContextPanels !== true) {
    return { history: null, peers: null, statuses: [] };
  }

  const [history, peers] = await Promise.all([
    cached(dependencies.cache, "smart-money-history", request, () =>
      fetchSmartMoneyHistory(scope),
    ),
    cached(dependencies.cache, "liquidity-peers", request, () =>
      fetchLiquidityPeers(scope),
    ),
  ]);

  return {
    history: history.data,
    peers: peers.data,
    statuses: [history.status, peers.status],
  };
}

type CachedCapability =
  | "token-context"
  | "cohort-flows"
  | "buyers"
  | "sellers"
  | "smart-money-history"
  | "liquidity-peers";

type CachedData =
  | TokenContext
  | readonly SegmentFlow[]
  | readonly Actor[]
  | SmartMoneyHistory
  | LiquidityPeers;

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

  const wantsBypass =
    request.refreshCapabilities?.includes(capability) === true;
  // The bypass marker expires with the data it refreshed, so a reload of the
  // same URL cannot spend credits again and again.
  const bypassKey = `${key}:bypassed`;
  const alreadyBypassed = await cache.get<boolean>(bypassKey);
  const bypass = wantsBypass && alreadyBypassed === null;
  if (bypass) {
    await cache.set(bypassKey, true, cacheTtlSeconds(capability));
  }

  const hit = bypass ? null : await cache.get<AdapterOutcome<T>>(key);
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
    smartMoneyHistory: null,
    liquidityPeers: null,
    sourceStatuses: statuses,
    evaluatedAt: collectedAt,
  };
}
