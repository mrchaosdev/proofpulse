import "server-only";

/**
 * Bounded request limiting (07-security-and-privacy "Abuse and credit
 * controls").
 *
 * Buckets are privacy-preserving: the caller passes an already-hashed
 * identifier, never a raw IP address or any user identity.
 */

export type RateLimitDecision = {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
};

export type RateLimitRule = {
  readonly limit: number;
  readonly windowSeconds: number;
};

/** Ten core investigations per ten minutes per bucket. */
export const CORE_INVESTIGATION_RULE: RateLimitRule = {
  limit: 10,
  windowSeconds: 600,
};

/** Twenty relationship expansions per hour per bucket. */
export const RELATIONSHIP_RULE: RateLimitRule = {
  limit: 20,
  windowSeconds: 3600,
};

export class MemoryRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly now: () => number = Date.now) {}

  check(bucket: string, rule: RateLimitRule): RateLimitDecision {
    const currentTime = this.now();
    const windowStart = currentTime - rule.windowSeconds * 1000;
    const recent = (this.hits.get(bucket) ?? []).filter(
      (at) => at > windowStart,
    );

    if (recent.length >= rule.limit) {
      const oldest = recent[0] ?? currentTime;
      const retryAfterMs = oldest + rule.windowSeconds * 1000 - currentTime;
      this.hits.set(bucket, recent);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      };
    }

    recent.push(currentTime);
    this.hits.set(bucket, recent);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  clear(): void {
    this.hits.clear();
  }
}
