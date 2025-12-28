import { checkPin } from "../../../lib/pin";
import { upstashGet, upstashPipeline } from "../../../lib/upstash";

export const dynamic = 'force-dynamic';

function secondsUntilMonthEnd(ts = Date.now()) {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = d.getMonth();
  const next = new Date(year, month + 1, 1, 0, 0, 0, 0);
  return Math.ceil((next.getTime() - d.getTime()) / 1000);
}

export async function POST(req: Request) {
  try {
    // accept category/note but ignore any client-sent time — server uses Date.now()
    const { type, amount, pin, category, note } = await req.json();

    // validation & auth
    if (!await checkPin(pin)) return new Response("Unauthorized", { status: 401 });
    if ((type !== "in" && type !== "out") || typeof amount !== "number" || amount <= 0) {
      return new Response("Bad Request", { status: 400 });
    }

    const time = Date.now();

    // read current balance (best-effort)
    let currentBalance = 0;
    try {
      const raw = await upstashGet("balance", { timeoutMs: 2500, retries: 1, parseJSON: false });
      if (raw !== null && raw !== undefined) {
        if (typeof raw === "number") currentBalance = raw;
        else if (typeof raw === "string") {
          const p = Number(raw);
          if (!Number.isNaN(p)) currentBalance = p;
        }
      }
    } catch (e) {
      console.warn("upstashGet balance failed, fallback to 0", e);
    }

    const newBalance = type === "in" ? currentBalance + amount : currentBalance - amount;
    const ttl = Math.max(1, Math.floor(secondsUntilMonthEnd(time)));

    // include category & note in stored tx
    const tx = { type, amount, time, category: category ?? null, note: note ?? null };

    // monthly summary key
    const d = new Date(time);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // e.g. 2025-12
    const summaryKey = `summary:${ym}`;
    const summaryField = type === "in" ? "in" : "out";

    try {
      await upstashPipeline(
        [
          ["set", "balance", String(newBalance)],
          ["set", `tx:${time}`, JSON.stringify(tx), "EX", ttl],
          ["hincrbyfloat", summaryKey, summaryField, String(amount)]
        ],
        { timeoutMs: 4000, retries: 2 }
      );
    } catch (e) {
      console.error("upstashPipeline error:", e);
      return new Response("Internal server error", { status: 500 });
    }

    // return newBalance and saved tx for client convenience
    return Response.json({ newBalance, tx });
  } catch (err: any) {
    console.error("tx handler error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}