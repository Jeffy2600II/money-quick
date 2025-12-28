import { getKV, setKV } from "../../../lib/kv";
import { checkPin } from "../../../lib/pin";

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
  const { type, amount, pin } = await req.json();
  if (!await checkPin(pin)) return new Response("Unauthorized", { status: 401 });
  if ((type !== "in" && type !== "out") || typeof amount !== "number" || amount <= 0)
    return new Response("Bad Request", { status: 400 });
  
  let balance = Number(await getKV < number > ("balance")) || 0;
  const time = Date.now();
  const newBalance = type === "in" ? balance + amount : balance - amount;
  // update balance (no ttl)
  await setKV("balance", newBalance);
  // store transaction with expiry at month end
  const ttl = secondsUntilMonthEnd(time);
  await setKV(`tx:${time}`, { type, amount, time }, ttl);
  return Response.json({ newBalance });
}