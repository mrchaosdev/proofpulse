import "server-only";

/**
 * On-demand relationship expansion.
 *
 * The server verifies that the actor belongs to the investigation before
 * calling Nansen (06-technical-architecture). Verification reads the cached
 * buyer and seller sets, so it costs nothing: if that cache has expired the
 * request is refused rather than re-running a paid investigation to prove
 * membership.
 */

import type { Chain, Timeframe } from "@/domain/investigation/scope";
import type {
  Actor,
  InvestigationMode,
  Relationship,
  SourceStatus,
} from "@/domain/investigation/investigation";
import { fetchRelatedWallets } from "@/integrations/nansen/adapters/fetch-related-wallets";
import type { AdapterOutcome } from "@/integrations/nansen/adapters/adapter-result";
import { loadFixtureRelationships } from "../fixtures/fixture-loader";
import type { CacheStore } from "../cache/cache-store";
import { buildCacheKey, cacheTtlSeconds } from "../cache/cache-key";

export type RelationshipRequest = {
  readonly chain: Chain;
  readonly tokenAddress: string;
  readonly timeframe: Timeframe;
  readonly actorAddress: string;
  readonly mode: InvestigationMode;
};

export type RelationshipOutcome =
  | {
      readonly ok: true;
      readonly relationships: readonly Relationship[];
      readonly status: SourceStatus;
    }
  | {
      readonly ok: false;
      readonly code: "ACTOR_NOT_IN_INVESTIGATION" | "INVESTIGATION_EXPIRED";
      readonly message: string;
    };

export async function expandRelationships(
  request: RelationshipRequest,
  dependencies: { readonly cache: CacheStore; readonly now: () => Date },
): Promise<RelationshipOutcome> {
  const collectedAt = dependencies.now().toISOString();

  if (request.mode === "fixture") {
    const relationships = loadFixtureRelationships(request.actorAddress);
    if (relationships === null) {
      return {
        ok: false,
        code: "ACTOR_NOT_IN_INVESTIGATION",
        message:
          "The demo fixture captured relationships for one actor only. Pick that actor to see the expansion.",
      };
    }
    return {
      ok: true,
      relationships,
      status: {
        state: "ready",
        capability: "related-wallets",
        source: relationships[0]?.source ?? {
          provider: "nansen",
          capability: "related-wallets",
          collectedAt,
          live: false,
          warnings: [],
        },
        recordCount: relationships.length,
      },
    };
  }

  const membership = await verifyActor(request, dependencies.cache);
  if (membership !== "member") {
    return membership === "expired"
      ? {
          ok: false,
          code: "INVESTIGATION_EXPIRED",
          message:
            "This investigation is no longer cached. Run it again before expanding an actor.",
        }
      : {
          ok: false,
          code: "ACTOR_NOT_IN_INVESTIGATION",
          message:
            "That address is not one of the actors in this investigation.",
        };
  }

  const key = buildCacheKey({
    capability: "related-wallets",
    chain: request.chain,
    address: request.actorAddress,
  });
  const hit =
    await dependencies.cache.get<AdapterOutcome<readonly Relationship[]>>(key);
  const outcome =
    hit ??
    (await fetchRelatedWallets({
      chain: request.chain,
      actorAddress: request.actorAddress,
      collectedAt,
    }));

  if (
    hit === null &&
    (outcome.status.state === "ready" || outcome.status.state === "empty")
  ) {
    await dependencies.cache.set(
      key,
      outcome,
      cacheTtlSeconds("related-wallets"),
    );
  }

  return {
    ok: true,
    relationships: outcome.data ?? [],
    status: outcome.status,
  };
}

type Membership = "member" | "stranger" | "expired";

async function verifyActor(
  request: RelationshipRequest,
  cache: CacheStore,
): Promise<Membership> {
  const sides = ["buyers", "sellers"] as const;
  let sawAnySide = false;

  for (const side of sides) {
    const cached = await cache.get<AdapterOutcome<readonly Actor[]>>(
      buildCacheKey({
        capability: side,
        chain: request.chain,
        address: request.tokenAddress,
        timeframe: request.timeframe,
      }),
    );
    if (cached === null) continue;
    sawAnySide = true;
    const found = (cached.data ?? []).some(
      (actor) =>
        actor.address.toLowerCase() === request.actorAddress.toLowerCase(),
    );
    if (found) return "member";
  }

  return sawAnySide ? "stranger" : "expired";
}
