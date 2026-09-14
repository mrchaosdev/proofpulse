import "server-only";

/**
 * Request validation for the investigation route.
 *
 * Input is allowlisted, size-bounded, and canonicalized before any paid call
 * (02-product-rules 6.1). Unknown fields are rejected rather than ignored.
 */

import { z } from "zod";
import { CHAINS, TIMEFRAMES } from "@/domain/investigation/scope";
import { validateTokenAddress } from "@/domain/investigation/address";
import type { InvestigationRequest } from "./investigation-service";

/** Small enough that a malformed body cannot become a memory cost. */
export const MAX_BODY_BYTES = 2_048;

const bodySchema = z
  .object({
    chain: z.enum(CHAINS),
    tokenAddress: z.string().min(1).max(128),
    timeframe: z.enum(TIMEFRAMES),
    // Fixture mode is an explicit request, never a silent fallback.
    mode: z.enum(["live", "fixture"]).default("live"),
  })
  .strict();

export type RequestValidation =
  | { readonly ok: true; readonly request: InvestigationRequest }
  | { readonly ok: false; readonly message: string };

export function validateInvestigationRequest(raw: unknown): RequestValidation {
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    // Field names only; a rejected value is never echoed back.
    const fields = parsed.error.issues.flatMap((issue) =>
      issue.code === "unrecognized_keys"
        ? issue.keys
        : [issue.path.join(".")].filter((path) => path !== ""),
    );
    return {
      ok: false,
      message:
        fields.length > 0
          ? `Invalid or unexpected request fields: ${fields.join(", ")}.`
          : "The request body does not match the expected shape.",
    };
  }

  const address = validateTokenAddress(
    parsed.data.chain,
    parsed.data.tokenAddress,
  );
  if (!address.ok) {
    return {
      ok: false,
      message: `The token address is not valid for this chain (${address.reason}).`,
    };
  }

  return {
    ok: true,
    request: {
      chain: parsed.data.chain,
      tokenAddress: address.canonicalAddress,
      timeframe: parsed.data.timeframe,
      mode: parsed.data.mode,
    },
  };
}
