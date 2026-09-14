import "server-only";

/** Token Screener adapter: market and liquidity context for one exact token. */

import type { Chain, Timeframe } from "@/domain/investigation/scope";
import type { TokenContext } from "@/domain/investigation/investigation";
import { callNansen } from "../nansen-client";
import {
  ENDPOINTS,
  MAX_ACTOR_ROWS,
  screenerTimeframe,
} from "../nansen-endpoints";
import { tokenScreenerResponseSchema } from "../schemas/token-screener";
import { normalizeTokenScreener } from "../normalizers/normalize-token-screener";
import type { AdapterOutcome } from "./adapter-result";
import { failureStatus, schemaErrorStatus, sourceMeta } from "./adapter-result";

const CAPABILITY = ENDPOINTS.tokenScreener.capability;

export async function fetchTokenContext(input: {
  readonly chain: Chain;
  readonly tokenAddress: string;
  readonly timeframe: Timeframe;
  readonly collectedAt: string;
}): Promise<AdapterOutcome<TokenContext>> {
  const result = await callNansen({
    path: ENDPOINTS.tokenScreener.path,
    body: {
      chains: [input.chain],
      // The screener uses its own timeframe vocabulary (decision D-018).
      timeframe: screenerTimeframe(input.timeframe),
      filters: { token_address: input.tokenAddress },
      pagination: { page: 1, per_page: MAX_ACTOR_ROWS },
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
  const context = normalizeTokenScreener(
    parsed.data.data,
    input.tokenAddress,
    meta,
  );

  if (context === null) {
    return {
      data: null,
      status: { state: "empty", capability: CAPABILITY, source: meta },
    };
  }

  return {
    data: context,
    status: {
      state: "ready",
      capability: CAPABILITY,
      source: meta,
      recordCount: 1,
    },
  };
}
