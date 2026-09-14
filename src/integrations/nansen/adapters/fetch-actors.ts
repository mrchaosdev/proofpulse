import "server-only";

/**
 * Who Bought/Sold adapter.
 *
 * One module covers both sides because they are one endpoint distinguished by
 * `buy_or_sell`. The endpoint takes no timeframe, so an explicit window is
 * derived from a single injected clock read (decision D-018).
 */

import type { Chain, Timeframe } from "@/domain/investigation/scope";
import type { Actor, ActorSide } from "@/domain/investigation/investigation";
import { callNansen } from "../nansen-client";
import { ENDPOINTS, MAX_ACTOR_ROWS, dateWindow } from "../nansen-endpoints";
import { whoBoughtSoldResponseSchema } from "../schemas/who-bought-sold";
import { normalizeWhoBoughtSold } from "../normalizers/normalize-who-bought-sold";
import type { AdapterOutcome } from "./adapter-result";
import { failureStatus, schemaErrorStatus, sourceMeta } from "./adapter-result";

export async function fetchActors(input: {
  readonly chain: Chain;
  readonly tokenAddress: string;
  readonly timeframe: Timeframe;
  readonly side: ActorSide;
  readonly now: Date;
  readonly collectedAt: string;
}): Promise<AdapterOutcome<readonly Actor[]>> {
  const capability = input.side === "buyer" ? "buyers" : "sellers";

  const result = await callNansen({
    path: ENDPOINTS.whoBoughtSold.path,
    body: {
      chain: input.chain,
      token_address: input.tokenAddress,
      buy_or_sell: input.side === "buyer" ? "BUY" : "SELL",
      date: dateWindow(input.timeframe, input.now),
      pagination: { page: 1, per_page: MAX_ACTOR_ROWS },
    },
  });

  if (!result.ok) {
    return { data: null, status: failureStatus(capability, result) };
  }

  const parsed = whoBoughtSoldResponseSchema.safeParse(result.body);
  if (!parsed.success) {
    return { data: null, status: schemaErrorStatus(capability) };
  }

  const meta = sourceMeta(capability, input.collectedAt, [], true);
  if (parsed.data.data.length === 0) {
    return {
      data: [],
      status: { state: "empty", capability, source: meta },
    };
  }

  const actors = normalizeWhoBoughtSold(parsed.data.data, input.side, meta);
  return {
    data: actors,
    status: {
      state: "ready",
      capability,
      source: meta,
      recordCount: actors.length,
    },
  };
}
