/**
 * Address Related Wallets response schema.
 *
 * Path and field names read from the documentation on 2026-09-15:
 * POST /api/v1/profiler/address/related-wallets. Not yet exercised against the
 * live API, because relationship expansion is on demand and each call costs a
 * credit.
 *
 * `relation` is preserved verbatim. It describes an observed link and never
 * implies shared ownership (02-product-rules 9.6).
 */

import { z } from "zod";
import { nullableLabel, paginationSchema } from "./numeric";

export const relatedWalletRecordSchema = z.object({
  address: z.string().min(1),
  address_label: nullableLabel,
  relation: nullableLabel,
  transaction_hash: nullableLabel,
  block_timestamp: nullableLabel,
  chain: nullableLabel,
});

export const relatedWalletsResponseSchema = z.object({
  data: z.array(relatedWalletRecordSchema),
  pagination: paginationSchema.optional(),
});

export type RelatedWalletRecord = z.infer<typeof relatedWalletRecordSchema>;
export type RelatedWalletsResponse = z.infer<
  typeof relatedWalletsResponseSchema
>;
