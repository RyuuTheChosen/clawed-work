/**
 * Simple in-memory cache for RPC responses.
 * Prevents redundant on-chain fetches when navigating between pages.
 *
 * - TTL-based: entries expire after `ttl` ms (default 30s)
 * - Stale-while-revalidate: returns cached data immediately, refetches in background
 * - Shared across all hook instances via module-level Map
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

const DEFAULT_TTL = 30_000; // 30 seconds

export function getCached<T>(key: string): { data: T; stale: boolean } | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  return { data: entry.data as T, stale: age > DEFAULT_TTL };
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(key: string): void {
  cache.delete(key);
}

export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
