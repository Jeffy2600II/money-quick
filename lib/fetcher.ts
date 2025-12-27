/* fetcher.ts
   - fetchWithTimeout: timeout + retry + exponential backoff
   - simple in-memory cache for GET with TTL and stale-while-revalidate
   - options: { cacheEnabled: boolean, ttl: number, swr: boolean, retries: number, timeout: number }
*/

type FetchOptions = Omit<RequestInit, 'cache'> & {
  cacheEnabled?: boolean;    // whether to cache GET responses (default false)
  ttl?: number;              // cache ttl in ms (default 30s)
  swr?: boolean;             // return cached immediately and revalidate in background
  retries?: number;          // retry attempts on network failure (default 1)
  timeout?: number;          // per-request timeout ms (default 5000)
};

type CacheEntry = {
  data: any;
  ts: number;
  ttl: number;
};

const inMemoryCache = new Map<string, CacheEntry>();

function cacheKey(url: string /*, init?: RequestInit */) {
  // only use URL as key for GET caching.
  return url;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(input: RequestInfo, init?: FetchOptions) {
  const options: FetchOptions = {
    cacheEnabled: false,
    ttl: 30_000,
    swr: false,
    retries: 1,
    timeout: 5000,
    ...init,
  };

  const method = ((options.method as string) || 'GET').toUpperCase();
  const isGet = method === 'GET';

  const key = isGet ? cacheKey(String(input)) : null;

  // If caching and swr and cached entry exists -> return cached immediately then revalidate
  if (isGet && options.cacheEnabled && options.swr && key) {
    const entry = inMemoryCache.get(key);
    if (entry && (Date.now() - entry.ts) < (entry.ttl + 5_000)) {
      // return cached data, and revalidate in background
      revalidate(input, options, key).catch(() => {});
      return entry.data;
    }
  }

  // If caching and not expired, return cached
  if (isGet && options.cacheEnabled && key) {
    const entry = inMemoryCache.get(key);
    if (entry && (Date.now() - entry.ts) < entry.ttl) {
      return entry.data;
    }
  }

  // If not cached or cache invalid, perform network fetch (with retries)
  const final = await networkFetchWithRetries(input, options);

  // If GET and caching enabled and response is cacheable, store it
  if (isGet && options.cacheEnabled && key) {
    try {
      // We assume final is already parsed (JSON or text)
      inMemoryCache.set(key, { data: final, ts: Date.now(), ttl: options.ttl! });
    } catch (e) {
      // ignore cache errors
    }
  }

  return final;
}

async function revalidate(input: RequestInfo, options: FetchOptions, key: string) {
  try {
    const fresh = await networkFetchWithRetries(input, options);
    inMemoryCache.set(key, { data: fresh, ts: Date.now(), ttl: options.ttl! });
  } catch {
    // ignore network errors during background revalidate
  }
}

async function networkFetchWithRetries(input: RequestInfo, options: FetchOptions) {
  let attempt = 0;
  let lastError: any = null;
  const max = Math.max(0, (options.retries ?? 1));

  while (attempt <= max) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), options.timeout);
      const res = await fetch(input, { ...(options as RequestInit), signal: controller.signal });
      clearTimeout(id);

      // Prefer JSON responses; fallback to text
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        // Try to parse body to show better error
        let body: any;
        try {
          body = contentType.includes('application/json') ? await res.json() : await res.text();
        } catch { body = null; }
        throw Object.assign(new Error('Network response was not ok'), { status: res.status, body });
      }

      if (contentType.includes('application/json')) {
        return await res.json();
      }
      return await res.text();
    } catch (err) {
      lastError = err;
      // If aborted due to timeout, consider retrying
      attempt++;
      if (attempt <= max) {
        // exponential backoff (with jitter)
        const backoff = Math.min(1000 * Math.pow(2, attempt), 3000);
        const jitter = Math.random() * 200;
        await sleep(backoff + jitter);
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

/* Utility: invalidate cache key manually (useful when mutation occurs) */
export function invalidateCache(url: string) {
  const key = cacheKey(url);
  inMemoryCache.delete(key);
}

/* For debugging / testing */
export function _debug_getCache() {
  return inMemoryCache;
}