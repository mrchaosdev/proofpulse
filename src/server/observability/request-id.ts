import "server-only";

/**
 * Request correlation and privacy-preserving bucketing.
 *
 * Analytics and logs never carry a full wallet or token address
 * (06-technical-architecture "Observability").
 */

import { createHash, randomUUID } from "node:crypto";

export function newRequestId(): string {
  return randomUUID();
}

/** Short, stable, non-reversible digest for logs and rate-limit buckets. */
export function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}
