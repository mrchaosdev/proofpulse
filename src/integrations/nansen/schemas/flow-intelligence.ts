/**
 * Flow Intelligence response schema.
 *
 * Verified against the live API on 2026-09-15: POST /api/v1/tgm/flow-intelligence.
 *
 * The endpoint documents that two wallet counts are never populated, and it
 * returns that statement in `warnings`. Those counts arrive as 0 but mean "not
 * tracked", so the normalizer maps them to null rather than letting a
 * not-tracked field look like an observed zero (02-product-rules 1.4).
 */

import { z } from "zod";
import { nullableNumber, warningList } from "./numeric";

export const flowIntelligenceRecordSchema = z.object({
  smart_trader_net_flow_usd: nullableNumber,
  smart_trader_avg_flow_usd: nullableNumber,
  smart_trader_wallet_count: nullableNumber,

  top_pnl_net_flow_usd: nullableNumber,
  top_pnl_avg_flow_usd: nullableNumber,
  top_pnl_wallet_count: nullableNumber,

  whale_net_flow_usd: nullableNumber,
  whale_avg_flow_usd: nullableNumber,
  whale_wallet_count: nullableNumber,

  fresh_wallets_net_flow_usd: nullableNumber,
  fresh_wallets_avg_flow_usd: nullableNumber,
  fresh_wallets_wallet_count: nullableNumber,

  public_figure_net_flow_usd: nullableNumber,
  public_figure_avg_flow_usd: nullableNumber,
  public_figure_wallet_count: nullableNumber,

  exchange_net_flow_usd: nullableNumber,
  exchange_avg_flow_usd: nullableNumber,
  exchange_wallet_count: nullableNumber,
});

export const flowIntelligenceResponseSchema = z.object({
  data: z.array(flowIntelligenceRecordSchema),
  warnings: warningList,
});

export type FlowIntelligenceRecord = z.infer<
  typeof flowIntelligenceRecordSchema
>;
export type FlowIntelligenceResponse = z.infer<
  typeof flowIntelligenceResponseSchema
>;
