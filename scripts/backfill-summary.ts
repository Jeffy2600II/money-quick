// Optional migration script (run once) to build summary:YYYY-MM from existing tx:* keys
// Usage:
//   export UPSTASH_REDIS_REST_URL="..."
//   export UPSTASH_REDIS_REST_TOKEN="..."
//   node ./scripts/backfill-summary.ts
//
// NOTE:
// - For small datasets this script uses KEYS("tx:*"). For larger datasets adapt to SCAN to avoid blocking.
import { Redis } from "@upstash/redis";

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.error("Missing UPSTASH env vars");
    process.exit(1);
  }
  const client = new Redis({ url, token });

  console.log("Fetching tx keys (this may take a while if many keys)...");
  // WARNING: KEYS can block if many keys. Replace with SCAN for large datasets.
  let keys: string[] = [];
  try {
    keys = await client.keys("tx:*");
  } catch (e) {
    console.error("Failed to list keys:", e);
    process.exit(1);
  }

  console.log("Found tx keys:", keys.length);
  if (keys.length === 0) {
    console.log("No tx keys found, nothing to do.");
    process.exit(0);
  }

  // Aggregate per month
  const monthly: Record<string, { in: number; out: number }> = {};

  // Process keys in batches to avoid too many round-trips
  const BATCH = 200;
  for (let i = 0; i < keys.length; i += BATCH) {
    const batch = keys.slice(i, i + BATCH);
    // mget if available
    let vals: any[] = [];
    try {
      if (typeof (client as any).mget === "function") {
        vals = await (client as any).mget(batch);
      } else {
        // fallback to sequential get
        vals = await Promise.all(batch.map(k => client.get(k)));
      }
    } catch (e) {
      console.warn("Batch get failed, falling back to single gets", e);
      vals = [];
      for (const k of batch) {
        try { vals.push(await client.get(k)); } catch { vals.push(null); }
      }
    }

    for (let j = 0; j < batch.length; j++) {
      const v = vals[j];
      if (!v) continue;
      let obj: any = v;
      if (typeof v === "string") {
        try { obj = JSON.parse(v); } catch { obj = null; }
      }
      if (!obj || !obj.time || !obj.amount) continue;
      const time = Number(obj.time);
      const amount = Number(obj.amount || 0);
      const type = obj.type;
      if (!time || Number.isNaN(amount)) continue;
      const d = new Date(time);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthly[ym]) monthly[ym] = { in: 0, out: 0 };
      if (type === "in") monthly[ym].in += amount;
      else monthly[ym].out += amount;
    }
    console.log(`Processed ${Math.min(i + BATCH, keys.length)} / ${keys.length}`);
  }

  console.log("Writing monthly summaries...");
  for (const ym of Object.keys(monthly)) {
    const key = `summary:${ym}`;
    const { in: inAmt, out: outAmt } = monthly[ym];
    try {
      // write as hash fields (strings)
      await (client as any).hset(key, { in: String(inAmt), out: String(outAmt) });
      console.log(`wrote ${key} in=${inAmt} out=${outAmt}`);
    } catch (e) {
      console.warn(`failed to write summary ${key}`, e);
    }
  }

  console.log("Migration done.");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });