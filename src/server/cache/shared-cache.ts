import "server-only";

/**
 * One cache instance per server process.
 *
 * Relationship expansion verifies actor membership by reading the buyer and
 * seller entries written by the investigation, so both must share a store.
 * A deployment with more than one instance replaces this with a Redis-backed
 * implementation of the same interface.
 */

import { MemoryCacheStore } from "./cache-store";

export const sharedCache = new MemoryCacheStore();
