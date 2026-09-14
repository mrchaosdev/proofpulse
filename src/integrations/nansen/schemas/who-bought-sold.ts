/**
 * Who Bought/Sold response schema.
 *
 * Verified against the live API on 2026-09-15: POST /api/v1/tgm/who-bought-sold.
 *
 * The endpoint takes no timeframe; it takes an explicit date window. Records
 * carry bought and sold USD volume but no net field, so an actor's net value is
 * derived (decision D-018).
 */

import { z } from "zod";
import { nullableLabel, nullableNumber, paginationSchema } from "./numeric";

export const whoBoughtSoldRecordSchema = z.object({
  address: z.string().min(1),
  // Arrives as "" when the address carries no label.
  address_label: nullableLabel,
  bought_volume_usd: nullableNumber,
  sold_volume_usd: nullableNumber,
  trade_volume_usd: nullableNumber,
  bought_token_volume: nullableNumber,
  sold_token_volume: nullableNumber,
});

export const whoBoughtSoldResponseSchema = z.object({
  data: z.array(whoBoughtSoldRecordSchema),
  pagination: paginationSchema.optional(),
});

export type WhoBoughtSoldRecord = z.infer<typeof whoBoughtSoldRecordSchema>;
export type WhoBoughtSoldResponse = z.infer<typeof whoBoughtSoldResponseSchema>;
