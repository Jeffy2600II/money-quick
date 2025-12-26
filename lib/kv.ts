import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getKV < T > (key: string): Promise < T | undefined > {
  const result = await redis.get < T > (key as string);
  return result ?? undefined;
}

export async function setKV < T > (key: string, value: T) {
  return await redis.set(key as string, value);
}

export async function listTx(limit: number = 50) {
  const keys: string[] = await redis.keys("tx:*");
  const sorted = keys.sort().reverse().slice(0, limit);
  const txList = await Promise.all(sorted.map(k => redis.get(k)));
  return txList.filter(Boolean);
}