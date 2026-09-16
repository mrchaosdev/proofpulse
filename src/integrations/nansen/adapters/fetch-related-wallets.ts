import "server-only";

/**
 * Related Wallets adapter.
 *
 * This call is on demand only. ProofPulse never spends high-cost credits
 * across an unbounded actor list (02-product-rules 4.3), and P0 returns
 * first-degree relationships only.
 */

import type { Chain } from "@/domain/investigation/scope";
import type { Relationship } from "@/domain/investigation/investigation";
import { callNansen } from "../nansen-client";
import { ENDPOINTS, MAX_RELATED_WALLET_ROWS } from "../nansen-endpoints";
import { relatedWalletsResponseSchema } from "../schemas/related-wallets";
import { normalizeRelatedWallets } from "../normalizers/normalize-related-wallets";
import type { AdapterOutcome } from "./adapter-result";
import { failureStatus, schemaErrorStatus, sourceMeta } from "./adapter-result";

const CAPABILITY = ENDPOINTS.relatedWallets.capability;

export async function fetchRelatedWallets(input: {
  readonly chain: Chain;
  readonly actorAddress: string;
  readonly collectedAt: string;
}): Promise<AdapterOutcome<readonly Relationship[]>> {
  const result = await callNansen({
    path: ENDPOINTS.relatedWallets.path,
    body: {
      chain: input.chain,
      address: input.actorAddress,
      pagination: { page: 1, per_page: MAX_RELATED_WALLET_ROWS },
    },
  });

  if (!result.ok) {
    return { data: null, status: failureStatus(CAPABILITY, result) };
  }

  const parsed = relatedWalletsResponseSchema.safeParse(result.body);
  if (!parsed.success) {
    return { data: null, status: schemaErrorStatus(CAPABILITY) };
  }

  const meta = sourceMeta(CAPABILITY, input.collectedAt, [], true);
  if (parsed.data.data.length === 0) {
    return {
      data: [],
      status: { state: "empty", capability: CAPABILITY, source: meta },
    };
  }

  const relationships = normalizeRelatedWallets(
    parsed.data.data,
    input.actorAddress,
    meta,
  );
  return {
    data: relationships,
    status: {
      state: "ready",
      capability: CAPABILITY,
      source: meta,
      recordCount: relationships.length,
    },
  };
}
