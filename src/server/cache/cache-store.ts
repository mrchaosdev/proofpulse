/**
 * Provider-neutral cache interface (06-technical-architecture "Caching").
 *
 * Only validated response data is cached, never a raw authenticated request,
 * and a credential is never part of a key.
 */

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

type Entry = { readonly value: unknown; readonly expiresAt: number };

/**
 * Memory cache for local development and tests. Production swaps in a
 * Redis-compatible store behind the same interface.
 */
export class MemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly now: () => number = Date.now) {}

  get<T>(key: string): Promise<T | null> {
    const entry = this.entries.get(key);
    if (entry === undefined) return Promise.resolve(null);
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return Promise.resolve(null);
    }
    return Promise.resolve(entry.value as T);
  }

  set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.entries.set(key, {
      value,
      expiresAt: this.now() + ttlSeconds * 1000,
    });
    return Promise.resolve();
  }

  clear(): void {
    this.entries.clear();
  }
}
