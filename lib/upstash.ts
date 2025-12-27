import { Redis } from '@upstash/redis';

type UpstashOptions = {
  timeoutMs ? : number;
  retries ? : number;
};

/**
 * Reuse Redis client across warm lambda instances (globalThis)
 */
function getClient(): Redis {
  // @ts-ignore
  if ((globalThis as any).__upstash_redis_client) {
    return (globalThis as any).__upstash_redis_client as Redis;
  }
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error('Missing Upstash env variables: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
  }
  
  const client = new Redis({ url, token });
  // @ts-ignore
  (globalThis as any).__upstash_redis_client = client;
  return client;
}

/**
 * Retry + timeout wrapper (JS-level). Upstash uses fetch internally.
 */
async function withTimeoutAndRetry < T > (fn: () => Promise < T > , timeoutMs = 5000, retries = 1): Promise < T > {
  let attempt = 0;
  let lastErr: any = null;
  while (attempt <= retries) {
    attempt++;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const p = fn();
      // We race with an abort promise to get a controlled timeout error
      const result = await Promise.race([
        p,
        new Promise < never > ((_, rej) => {
          controller.signal.addEventListener('abort', () => rej(new Error('timeout')));
        }),
      ]);
      clearTimeout(id);
      return result as T;
    } catch (err) {
      clearTimeout(id);
      lastErr = err;
      if (attempt <= retries) {
        const backoff = Math.min(200 * Math.pow(2, attempt), 1000);
        // small jitter
        // eslint-disable-next-line no-await-in-loop
        await new Promise(res => setTimeout(res, backoff + Math.random() * 80));
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
}

/* ---------- Helpers ---------- */

/**
 * Get key (parse JSON by default)
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
 * Set key (stringify objects)
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
 * Delete keys
 */
export async function upstashDel(...keys: string[]) {
  const client = getClient();
  return withTimeoutAndRetry(() => client.del(...keys) as Promise < any > , 3500, 1);
}

/**
 * Multi-get (reduce roundtrips)
 */
export async function upstashMGet(keys: string[], opts ? : UpstashOptions) {
  const client = getClient();
  const timeoutMs = opts?.timeoutMs ?? 4000;
  const retries = opts?.retries ?? 1;
  // prefer mget if available
  // @ts-ignore
  if (typeof client.mget === 'function') {
    // client.mget returns an array with values (strings or null)
    return withTimeoutAndRetry(() => (client.mget(keys) as Promise < any[] > ), timeoutMs, retries);
  }
  // fallback: parallel gets (Promise.all)
  return withTimeoutAndRetry(() => Promise.all(keys.map(k => client.get(k))), timeoutMs, retries);
}

/**
 * Pipeline / multi-exec (reduce roundtrips on many commands)
 * Accept commands like: [['set', key, value], ['expire', key, 60]]
 */
export async function upstashPipeline(commands: Array < [string, ...any[]] > , opts ? : UpstashOptions) {
  const client = getClient();
  const timeoutMs = opts?.timeoutMs ?? 4000;
  const retries = opts?.retries ?? 1;
  
  // try multi() if provided by client
  // @ts-ignore
  if (typeof client.multi === 'function') {
    // @ts-ignore
    const multi = client.multi();
    for (const cmd of commands) {
      // @ts-ignore
      multi[cmd[0]](...cmd.slice(1));
    }
    // @ts-ignore
    return withTimeoutAndRetry(() => multi.exec(), timeoutMs, retries);
  }
  
  // fallback sequentially (still better than many network calls in user code)
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