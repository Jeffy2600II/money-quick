/* lib/upstash.ts
   Small Upstash helper with timeout/retry and pipeline support.
*/

import { Redis } from '@upstash/redis';

type UpstashOptions = {
  timeoutMs ? : number;
  retries ? : number;
};

/**
 * Ensure a single Redis client is reused across lambda invocations.
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
 */
async function withTimeoutAndRetry < T > (fn: () => Promise < T > , timeoutMs = 5000, retries = 1): Promise < T > {
  let attempt = 0;
  let lastErr: any = null;
  while (attempt <= retries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
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
      if (attempt <= retries) {
        const backoff = Math.min(200 * Math.pow(2, attempt), 1000);
        // small jitter
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
 */
export async function upstashMGet(keys: string[], opts ? : UpstashOptions) {
  const client = getClient();
  return withTimeoutAndRetry(
    () => (typeof(client as any).mget === 'function' ? (client as any).mget(keys) : Promise.all(keys.map(k => client.get(k)))) as Promise < any > ,
    opts?.timeoutMs ?? 4000,
    opts?.retries ?? 1
  );
}

/**
 * Pipeline / multiple commands execution (when supported)
 * Example usage: pipeline([['set', key, val], ['expire', key, 60]])
 */
export async function upstashPipeline(commands: Array < [string, ...any[]] > , opts ? : UpstashOptions) {
  const client = getClient();
  const timeoutMs = opts?.timeoutMs ?? 4000;
  const retries = opts?.retries ?? 1;
  
  // Try using `multi` if available (preferred)
  // @ts-ignore
  if (typeof(client as any).multi === 'function') {
    // client.multi().exec() style
    // @ts-ignore
    const multi = (client as any).multi();
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
      try {
        // Special-case: allow "SET key value EX ttl" style commands by converting to set(key, value, { ex: ttl })
        if (name.toLowerCase() === 'set' && args.length >= 3) {
          // detect pattern [..., 'EX'|'ex', ttl] at the end (commonly used)
          const lastButOne = args[args.length - 2];
          const last = args[args.length - 1];
          if ((lastButOne === 'EX' || lastButOne === 'ex') && (typeof last === 'number' || !Number.isNaN(Number(last)))) {
            const key = args[0];
            const val = args[1];
            const ttl = Number(last);
            // call client.set(key, val, { ex: ttl })
            // eslint-disable-next-line no-await-in-loop
            const r = await withTimeoutAndRetry(() => fn.apply(client, [key, val, { ex: ttl }]), timeoutMs, retries);
            results.push(r);
            continue;
          }
        }
        
        // fallback: call function with provided args
        // eslint-disable-next-line no-await-in-loop
        const r = await withTimeoutAndRetry(() => fn.apply(client, args), timeoutMs, retries);
        results.push(r);
      } catch (e) {
        // push error object so caller can inspect; keep going for remaining commands
        results.push({ error: String(e) });
      }
    } else {
      results.push(null);
    }
  }
  return results;
}