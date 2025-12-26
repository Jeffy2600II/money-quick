import { kv } from "@vercel/kv";

export async function getKV < T > (key: string): Promise < T | undefined > {
  return await kv.get < T > (key);
}
export async function setKV < T > (key: string, value: T) {
  return await kv.set(key, value);
}
export async function listTx(limit: number = 50) {
  const keys = await kv.keys("tx:*");
  const sorted = keys.sort().reverse().slice(0, limit);
  const txList = await Promise.all(sorted.map(k => kv.get(k)));
  return txList.filter(Boolean);
}