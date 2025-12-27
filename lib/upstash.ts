
import { Redis } from '@upstash/redis';

type UpstashOptions = {
  timeoutMs ? : number;
  retries ? : number;
};

/**
 * Ensure a single Redis client is reused across lambda invocations.
 * This avoids overhead of recreating client on each invocation.
 */
function getClient(): Redis {
  // @ts-ignore global augmentation
  if ((globalThis as any).__upstash_redis_client) {
    return (globalThis as any).__upstash_redis_client as Redis;
  }
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('Missing Upstash env variables: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
  }
  
  const client = new Redis({ url, token });
  (globalThis as any).__upstash_redis_client = client;
  return client;
}

/**
 * Small helper: perform an Upstash operation with timeout and optional retries.
 * We wrap client methods that return Promises.
 */
async function withTimeoutAndRetry < T > (fn: () => Promise < T > , timeoutMs = 5000, retries = 1): Promise < T > {
  let attempt = 0;
  let lastErr: any = null;
  while (attempt <= retries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // Note: Upstash uses fetch internally; AbortController won't necessarily cancel it,
      // but we still provide a timeout guard at JS level.
      const p = fn();
      const res = await Promise.race([
        p,
        new Promise < never > ((_, rej) => {
          controller.signal.addEventListener('abort', () => rej(new Error('timeout')));
        }),
      ]);
      clearTimeout(timer);
      return res as T;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      // small backoff before retry
      if (attempt <= retries) {
        const backoff = Math.min(200 * Math.pow(2, attempt), 1000);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, backoff + Math.random() * 80));
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
}

/* Exposed helpers */

/**
 * Get a value (parsed as JSON if possible) for a key.
 * If parseJSON=false returns raw string.
 */
export async function upstashGet(key: string, opts ? : UpstashOptions & { parseJSON ? : boolean }) {
  const client = getClient();
  const timeoutMs = opts?.timeoutMs ?? 3500;
  const retries = opts?.retries ?? 1;
  const parseJSON = opts?.parseJSON ?? true;
  
  const raw = await withTimeoutAndRetry(() => client.get(key) as Promise < any > , timeoutMs, retries);
  if (raw === null || raw === undefined) return null;
  if (!parseJSON) return raw;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return raw;
  }
}

/**
 * Set a value. If ttlSeconds provided, set EX.
 * Stringify value if object.
 */
export async function upstashSet(key: string, value: unknown, ttlSeconds ? : number, opts ? : UpstashOptions) {
  const client = getClient();
  const timeoutMs = opts?.timeoutMs ?? 3500;
  const retries = opts?.retries ?? 1;
  const val = typeof value === 'string' ? value : JSON.stringify(value);
  if (typeof ttlSeconds === 'number') {
    // setex style
    return withTimeoutAndRetry(() => client.set(key, val, { ex: ttlSeconds }) as Promise < any > , timeoutMs, retries);
  }
  return withTimeoutAndRetry(() => client.set(key, val) as Promise < any > , timeoutMs, retries);
}

/**
 * Delete key(s)
 */
export async function upstashDel(...keys: string[]) {
  const client = getClient();
  return withTimeoutAndRetry(() => client.del(...keys) as Promise < any > , 3500, 1);
}

/**
 * Multi-get (if client supports mget)
 * Use this to reduce round-trips when fetching many keys.
 */
export async function upstashMGet(keys: string[], opts ? : UpstashOptions) {
  const client = getClient();
  // Upstash redis has mget command
  return withTimeoutAndRetry(() => (client.mget ? (client.mget(keys) as Promise < any[] > ) : Promise.all(keys.map(k => client.get(k)))) as Promise < any > , opts?.timeoutMs ?? 4000, opts?.retries ?? 1);
}

/**
 * Pipeline / multiple commands execution (when supported)
 * Example usage: pipeline([['set', key, val], ['expire', key, 60]])
 * Note: Upstash library may not expose raw pipeline; if not, fallback to sequential or multi()
 */
export async function upstashPipeline(commands: Array < [string, ...any[]] > , opts ? : UpstashOptions) {
  const client = getClient();
  const timeoutMs = opts?.timeoutMs ?? 4000;
  const retries = opts?.retries ?? 1;
  
  // Try using `multi` if available
  // @ts-ignore
  if (typeof client.multi === 'function') {
    // client.multi().exec() style
    // Build commands
    // @ts-ignore
    const multi = client.multi();
    for (const cmd of commands) {
      // @ts-ignore
      multi[cmd[0]](...cmd.slice(1));
    }
    // @ts-ignore
    return withTimeoutAndRetry(() => multi.exec(), timeoutMs, retries);
  }
  
  // Fallback: sequential exec but still with timeout/retry
  const results: any[] = [];
  for (const cmd of commands) {
    const [name, ...args] = cmd;
    // @ts-ignore
    const fn = (client as any)[name];
    if (typeof fn === 'function') {
      // eslint-disable-next-line no-await-in-loop
      const r = await withTimeoutAndRetry(() => fn.apply(client, args), timeoutMs, retries);
      results.push(r);
    } else {
      results.push(null);
    }
  }
  return results;
}