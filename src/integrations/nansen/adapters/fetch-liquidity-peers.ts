import "server-only";

/** Token Screener adapter, list form: the most liquid tokens on one chain. */

import type { Chain, Timeframe } from "@/domain/investigation/scope";
import type { LiquidityPeers } from "@/domain/investigation/investigation";
import { callNansen } from "../nansen-client";
import { ENDPOINTS, screenerTimeframe } from "../nansen-endpoints";
import { tokenScreenerResponseSchema } from "../schemas/token-screener";
import {
  MAX_PEER_ROWS,
  normalizeLiquidityPeers,
} from "../normalizers/normalize-liquidity-peers";
import type { AdapterOutcome } from "./adapter-result";
import { failureStatus, schemaErrorStatus, sourceMeta } from "./adapter-result";

const CAPABILITY = ENDPOINTS.liquidityPeers.capability;

/**
 * A couple of rows more than are shown, so dropping any row that arrives
 * without a liquidity figure still leaves a full list.
 */
const REQUEST_ROWS = MAX_PEER_ROWS + 2;

export async function fetchLiquidityPeers(input: {
  readonly chain: Chain;
  readonly tokenAddress: string;
  readonly timeframe: Timeframe;
  readonly collectedAt: string;
}): Promise<AdapterOutcome<LiquidityPeers>> {
  const result = await callNansen({
    path: ENDPOINTS.liquidityPeers.path,
    body: {
      chains: [input.chain],
      timeframe: screenerTimeframe(input.timeframe),
      /*
       * Without these, seven of the ten deepest pools on Ethereum are
       * stablecoins and the subject token does not appear at all. A pool that
       * exists to hold a peg is not a comparison for a token that floats, and
       * a list the subject is missing from answers nothing about it.
       */
      filters: { include_stablecoins: false, include_native_tokens: false },
      order_by: [{ field: "liquidity", direction: "DESC" }],
      pagination: { page: 1, per_page: REQUEST_ROWS },
    },
  });

  if (!result.ok) {
    return { data: null, status: failureStatus(CAPABILITY, result) };
  }

  const parsed = tokenScreenerResponseSchema.safeParse(result.body);
  if (!parsed.success) {
    return { data: null, status: schemaErrorStatus(CAPABILITY) };
  }

  const meta = sourceMeta(CAPABILITY, input.collectedAt, [], true);
  const peers = normalizeLiquidityPeers(
    parsed.data.data,
    input.tokenAddress,
    meta,
  );

  if (peers.peers.length === 0) {
    return {
      data: null,
      status: { state: "empty", capability: CAPABILITY, source: meta },
    };
  }

  return {
    data: peers,
    status: {
      state: "ready",
      capability: CAPABILITY,
      source: meta,
      recordCount: peers.peers.length,
    },
  };
}
