import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// get unchanged
export async function getKV < T > (key: string): Promise < T | undefined > {
  const result = await redis.get < T > (key as string);
  return result ?? undefined;
}

// setKV now accepts optional ttlSeconds (expire)
export async function setKV < T > (key: string, value: T, ttlSeconds ? : number) {
  if (typeof ttlSeconds === "number") {
    // Upstash redis.set supports options { ex: seconds }
    return await redis.set(key as string, value, { ex: Math.max(1, Math.floor(ttlSeconds)) });
  }
  return await redis.set(key as string, value);
}

export async function listTx(limit: number = 50) {
  const keys: string[] = await redis.keys("tx:*");
  const sorted = keys.sort().reverse().slice(0, limit);
  const txList = await Promise.all(sorted.map(k => redis.get(k)));
  return txList.filter(Boolean);
}