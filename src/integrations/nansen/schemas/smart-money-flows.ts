/**
 * Token God Mode Flows response schema.
 *
 * Verified against the live API on 2026-09-17: POST /api/v1/tgm/flows with
 * `date: { from, to }` and `label: "smart_money"`. A seven-day window returns
 * 168 hourly buckets in one call; ranges longer than seven days return daily
 * buckets instead.
 *
 * What this endpoint measures matters more than its shape. `value_usd` and
 * `token_amount` are the position a label *holds* at the end of a bucket, not
 * the flow during it. The API says so itself in a response warning, and the
 * warning is preserved and shown rather than discarded.
 *
 * The exchange-only inflow and outflow fields are deliberately absent from
 * this schema: they are null for every label the product asks for, so parsing
 * them would only invite a reader to treat null as zero.
 */

import { z } from "zod";
import { nullableNumber, paginationSchema, warningList } from "./numeric";

export const smartMoneyFlowRecordSchema = z.object({
  /** Bucket start, RFC 3339 UTC. */
  date: z.string().min(1),
  bucket_end: z.string().min(1).nullable().optional(),
  /** False while a bucket is still filling, which the current hour always is. */
  is_complete: z.boolean().nullable().optional(),
  price_usd: nullableNumber,
  token_amount: nullableNumber,
  value_usd: nullableNumber,
  holders_count: nullableNumber,
});

export const smartMoneyFlowsResponseSchema = z.object({
  data: z.array(smartMoneyFlowRecordSchema),
  pagination: paginationSchema.optional(),
  warnings: warningList.optional(),
});

export type SmartMoneyFlowRecord = z.infer<typeof smartMoneyFlowRecordSchema>;
export type SmartMoneyFlowsResponse = z.infer<
  typeof smartMoneyFlowsResponseSchema
>;
