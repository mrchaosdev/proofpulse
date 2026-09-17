import "server-only";

/**
 * Flows adapter: seven days of what smart money held in one token.
 *
 * One call covers the whole window, so the history costs the same single
 * credit as any other dataset rather than one per day.
 */

import type { Chain } from "@/domain/investigation/scope";
import type { SmartMoneyHistory } from "@/domain/investigation/investigation";
import { callNansen } from "../nansen-client";
import {
  ENDPOINTS,
  HISTORY_WINDOW_DAYS,
  SMART_MONEY_LABEL,
} from "../nansen-endpoints";
import { smartMoneyFlowsResponseSchema } from "../schemas/smart-money-flows";
import { normalizeSmartMoneyHistory } from "../normalizers/normalize-smart-money-history";
import type { AdapterOutcome } from "./adapter-result";
import { failureStatus, schemaErrorStatus, sourceMeta } from "./adapter-result";

const CAPABILITY = ENDPOINTS.smartMoneyFlows.capability;

/** Hourly buckets over seven days, with room to spare for a partial hour. */
const MAX_BUCKETS = 200;

export async function fetchSmartMoneyHistory(input: {
  readonly chain: Chain;
  readonly tokenAddress: string;
  readonly now: Date;
  readonly collectedAt: string;
}): Promise<AdapterOutcome<SmartMoneyHistory>> {
  const from = new Date(
    input.now.getTime() - HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const result = await callNansen({
    path: ENDPOINTS.smartMoneyFlows.path,
    body: {
      chain: input.chain,
      token_address: input.tokenAddress,
      date: { from: from.toISOString(), to: input.now.toISOString() },
      label: SMART_MONEY_LABEL,
      pagination: { page: 1, per_page: MAX_BUCKETS },
    },
  });

  if (!result.ok) {
    return { data: null, status: failureStatus(CAPABILITY, result) };
  }

  const parsed = smartMoneyFlowsResponseSchema.safeParse(result.body);
  if (!parsed.success) {
    return { data: null, status: schemaErrorStatus(CAPABILITY) };
  }

  // The endpoint warns that its exchange-only fields are null for this label.
  // The warning is carried through and shown rather than swallowed.
  const warnings = parsed.data.warnings ?? [];
  const meta = sourceMeta(CAPABILITY, input.collectedAt, warnings, true);
  const history = normalizeSmartMoneyHistory(parsed.data.data, warnings, meta);

  if (history.points.length === 0) {
    return {
      data: null,
      status: { state: "empty", capability: CAPABILITY, source: meta },
    };
  }

  return {
    data: history,
    status: {
      state: "ready",
      capability: CAPABILITY,
      source: meta,
      recordCount: history.points.length,
    },
  };
}
