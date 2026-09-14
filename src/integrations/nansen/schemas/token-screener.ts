/**
 * Token Screener response schema.
 *
 * Verified against the live API on 2026-09-15: POST /api/v1/token-screener.
 * Note the path has no tgm/ prefix, unlike the other Token God Mode endpoints,
 * and its timeframe enum differs from Flow Intelligence.
 *
 * The response carries `token_symbol` but no token name field, so a resolved
 * token has a symbol and no display name (decision D-019).
 */

import { z } from "zod";
import { nullableLabel, nullableNumber, paginationSchema } from "./numeric";

export const tokenScreenerRecordSchema = z.object({
  chain: nullableLabel,
  token_address: nullableLabel,
  token_symbol: nullableLabel,
  market_cap_usd: nullableNumber,
  liquidity: nullableNumber,
  price_usd: nullableNumber,
  price_change: nullableNumber,
  volume: nullableNumber,
  buy_volume: nullableNumber,
  sell_volume: nullableNumber,
  netflow: nullableNumber,
  token_age_days: nullableNumber,
});

export const tokenScreenerResponseSchema = z.object({
  data: z.array(tokenScreenerRecordSchema),
  pagination: paginationSchema.optional(),
});

export type TokenScreenerRecord = z.infer<typeof tokenScreenerRecordSchema>;
export type TokenScreenerResponse = z.infer<typeof tokenScreenerResponseSchema>;
