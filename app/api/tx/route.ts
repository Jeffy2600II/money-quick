import { getKV, setKV } from "../../../lib/kv";
import { checkPin } from "../../../lib/pin";

export async function POST(req: Request) {
  const { type, amount, pin } = await req.json();
  if (!await checkPin(pin)) return new Response("Unauthorized", { status: 401 });
  if ((type !== "in" && type !== "out") || typeof amount !== "number" || amount <= 0)
    return new Response("Bad Request", { status: 400 });
  
  let balance = Number(await getKV < number > ("balance")) || 0;
  const time = Date.now();
  const newBalance = type === "in" ? balance + amount : balance - amount;
  await setKV("balance", newBalance);
  await setKV(`tx:${time}`, { type, amount, time });
  return Response.json({ newBalance });
}