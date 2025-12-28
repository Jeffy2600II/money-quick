// Optional migration script (run once) to build summary:YYYY-MM from existing tx:* keys
// Usage: NODE_ENV=production node ./scripts/migrate-summary.ts
import { Redis } from "@upstash/redis";

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error("Missing UPSTASH env vars");
    process.exit(1);
  }
  const client = new Redis({ url, token });

  // fetch all tx keys (be careful if huge number)
  const keys: string[] = await client.keys("tx:*");
  console.log("Found tx keys:", keys.length);

  // aggregate per month
  const monthly: Record<string, { in: number; out: number }> = {};

  for (const k of keys) {
    try {
      const v = await client.get(k);
      if (!v) continue;
      const obj = typeof v === "string" ? JSON.parse(v) : v;
      const time = Number(obj?.time);
      const amount = Number(obj?.amount || 0);
      const type = obj?.type;
      if (!time || !amount) continue;
      const d = new Date(time);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[ym]) monthly[ym] = { in: 0, out: 0 };
      if (type === "in") monthly[ym].in += amount;
      else monthly[ym].out += amount;
    } catch (e) {
      console.warn("skip key", k, e);
    }
  }

  console.log("Aggregating to summary keys...");
  for (const ym of Object.keys(monthly)) {
    const key = `summary:${ym}`;
    const { in: inAmt, out: outAmt } = monthly[ym];
    // set hash fields (as strings)
    await client.hset(key, { in: String(inAmt), out: String(outAmt) });
    console.log(`wrote summary:${ym} -> in=${inAmt} out=${outAmt}`);
  }

  console.log("Done");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });