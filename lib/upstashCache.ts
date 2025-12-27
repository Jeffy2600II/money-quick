type CacheEntry = {
  value: any;
  expiresAt: number; // epoch ms
};

const DEFAULT_TTL_MS = 5_000; // short TTL

function now() { return Date.now(); }

/* store on globalThis so warm lambdas reuse the cache */
const GLOBAL_KEY = '__mq_upstash_cache_v1';
// @ts-ignore
const root = (globalThis as any);
if (!root[GLOBAL_KEY]) root[GLOBAL_KEY] = new Map < string, CacheEntry > ();
const cache: Map < string, CacheEntry > = root[GLOBAL_KEY];

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