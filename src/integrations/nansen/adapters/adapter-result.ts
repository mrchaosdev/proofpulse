import "server-only";

/**
 * Shared adapter outcome.
 *
 * One failing endpoint must not discard evidence from the others
 * (02-product-rules 5.2), so every adapter returns a status alongside whatever
 * data it managed to normalize.
 */

import type {
  SourceCapability,
  SourceMeta,
  SourceStatus,
} from "@/domain/investigation/investigation";
import type { NansenFailure } from "../nansen-client";

export type AdapterOutcome<T> = {
  readonly data: T | null;
  readonly status: SourceStatus;
};

export function sourceMeta(
  capability: SourceCapability,
  collectedAt: string,
  warnings: readonly string[],
  live: boolean,
): SourceMeta {
  return { provider: "nansen", capability, collectedAt, live, warnings };
}

export function failureStatus(
  capability: SourceCapability,
  failure: NansenFailure,
): SourceStatus {
  return {
    state: "error",
    capability,
    code: failure.code,
    retryable: failure.retryable,
    message: failure.message,
  };
}

/** A response that parsed but did not match the expected shape. */
export function schemaErrorStatus(capability: SourceCapability): SourceStatus {
  return {
    state: "error",
    capability,
    code: "NANSEN_SCHEMA",
    retryable: false,
    message: "The Nansen response did not match the expected schema.",
  };
}
