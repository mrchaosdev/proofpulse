/**
 * Shared runtime parsing for untrusted upstream values.
 *
 * External data enters through runtime schemas (CODEBASE-RULES 8) and a
 * malformed record creates a warning rather than becoming score input
 * (07-security-and-privacy "Upstream request controls").
 */

import { z } from "zod";

/**
 * A number that may arrive as a JSON number, a numeric string, null, or be
 * absent. Anything unparseable becomes null so it stays missing rather than
 * becoming zero (02-product-rules 1.4).
 */
export const nullableNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value): number | null => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return null;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  });

/**
 * A label that may arrive as an empty string. An empty label is an absent
 * label, not a label whose text is blank.
 */
export const nullableLabel = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value): string | null => {
    const trimmed = value?.trim();
    return trimmed === undefined || trimmed === "" ? null : trimmed;
  });

export const nullableText = nullableLabel;

/** Upstream warnings, preserved verbatim and surfaced in the interface. */
export const warningList = z
  .union([z.array(z.string()), z.null(), z.undefined()])
  .transform((value): string[] => value ?? []);

export const paginationSchema = z.object({
  page: z.number().optional(),
  per_page: z.number().optional(),
  is_last_page: z.boolean().optional(),
});
