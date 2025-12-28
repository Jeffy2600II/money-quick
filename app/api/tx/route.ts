import { checkPin } from "../../../lib/pin";
import { upstashGet, upstashPipeline } from "../../../lib/upstash";

export const dynamic = 'force-dynamic';

function secondsUntilMonthEnd(ts = Date.now()) {
  const d = new Date(ts);
  // move to first day of next month at 00:00:00
  const year = d.getFullYear();
  const month = d.getMonth();
  const next = new Date(year, month + 1, 1, 0, 0, 0, 0);
  return Math.ceil((next.getTime() - d.getTime()) / 1000);
}

export async function POST(req: Request) {
  try {
    const { type, amount, pin } = await req.json();
    
    // basic validation
    if (!await checkPin(pin)) return new Response("Unauthorized", { status: 401 });
    if ((type !== "in" && type !== "out") || typeof amount !== "number" || amount <= 0) {
      return new Response("Bad Request", { status: 400 });
    }
    
    const time = Date.now();
    
    // Read current balance using upstashGet (no JSON parse to keep raw)
    let currentBalance: number = 0;
    try {
      const raw = await upstashGet("balance", { timeoutMs: 2500, retries: 1, parseJSON: false });
      if (raw !== null && raw !== undefined) {
        if (typeof raw === "number") currentBalance = raw;
        else if (typeof raw === "string") {
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) currentBalance = parsed;
        }
      }
    } catch (e) {
      // If read fails, log and proceed with 0 as fallback (we still attempt pipeline)
      console.warn("upstashGet balance failed, falling back to 0", e);
    }
    
    const newBalance = type === "in" ? currentBalance + amount : currentBalance - amount;
    
    // TTL until month end
    const ttl = Math.max(1, Math.floor(secondsUntilMonthEnd(time)));
    
    // Prepare tx payload
    const tx = { type, amount, time };
    
    // Prepare monthly summary key (year-month) for durable aggregates (helps auditing even after tx keys expire)
    const d = new Date(time);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // e.g. "2025-12"
    const summaryKey = `summary:${ym}`;
    const summaryField = type === "in" ? "in" : "out";
    
    // Use pipeline/multi so balance update + tx write + summary increment happen together (reduces inconsistency)
    try {
      await upstashPipeline(
        [
          // set balance (overwrite)
          ["set", "balance", String(newBalance)],
          // set tx with expiry (month-end)
          ["set", `tx:${time}`, JSON.stringify(tx), "EX", ttl],
          // increment monthly aggregate (uses HINCRBYFLOAT to support decimals)
          ["hincrbyfloat", summaryKey, summaryField, String(amount)]
        ],
        // optional timeout/retries handled inside upstashPipeline
      );
    } catch (e) {
      console.error("upstashPipeline error", e);
      return new Response("Internal server error", { status: 500 });
    }
    
    return Response.json({ newBalance });
  } catch (err: any) {
    console.error("tx handler error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}