type CacheEntry = {
  value: any;
  expiresAt: number; // epoch ms
};

const DEFAULT_TTL_MS = 5_000; // small TTL so not stale; tune as needed

function now() { return Date.now(); }

/**
 * Global cache across invocations when lambda is warm.
 * Keep small and TTL short to avoid stale secrets.
 */
const globalKey = '__mq_upstash_cache_v1';
// @ts-ignore
const root = (globalThis as any);
if (!root[globalKey]) root[globalKey] = new Map < string, CacheEntry > ();
const cache: Map < string, CacheEntry > = root[globalKey];

export function cacheGet < T = any > (key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (e.expiresAt < now()) {
    cache.delete(key);
    return null;
  }
  return e.value as T;
}

export function cacheSet(key: string, value: any, ttlMs = DEFAULT_TTL_MS) {
  const expiresAt = now() + ttlMs;
  cache.set(key, { value, expiresAt });
}

export function cacheDel(key: string) {
  cache.delete(key);
}