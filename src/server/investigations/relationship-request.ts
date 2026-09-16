import "server-only";

/**
 * Request validation for relationship expansion.
 *
 * Both the token address and the actor address are validated and canonicalized
 * before any paid call (02-product-rules 6.1).
 */

import { z } from "zod";
import { CHAINS, TIMEFRAMES } from "@/domain/investigation/scope";
import { validateTokenAddress } from "@/domain/investigation/address";
import type { RelationshipRequest } from "./relationship-service";

const bodySchema = z
  .object({
    chain: z.enum(CHAINS),
    tokenAddress: z.string().min(1).max(128),
    timeframe: z.enum(TIMEFRAMES),
    actorAddress: z.string().min(1).max(128),
    mode: z.enum(["live", "fixture"]).default("live"),
  })
  .strict();

export type RelationshipValidation =
  | { readonly ok: true; readonly request: RelationshipRequest }
  | { readonly ok: false; readonly message: string };

export function validateRelationshipRequest(
  raw: unknown,
): RelationshipValidation {
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
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

  const token = validateTokenAddress(
    parsed.data.chain,
    parsed.data.tokenAddress,
  );
  if (!token.ok) {
    return {
      ok: false,
      message: "The token address is not valid for this chain.",
    };
  }
  const actor = validateTokenAddress(
    parsed.data.chain,
    parsed.data.actorAddress,
  );
  if (!actor.ok) {
    return {
      ok: false,
      message: "The actor address is not valid for this chain.",
    };
  }

  return {
    ok: true,
    request: {
      chain: parsed.data.chain,
      tokenAddress: token.canonicalAddress,
      timeframe: parsed.data.timeframe,
      actorAddress: actor.canonicalAddress,
      mode: parsed.data.mode,
    },
  };
}
