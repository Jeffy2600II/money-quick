import { setPin, hasPin } from "../../../lib/pin";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pin = body?.pin;
    const force = Boolean(body?.force);
    
    if (!pin || typeof pin !== "string" || pin.length !== 6) {
      return new Response("Bad request", { status: 400 });
    }
    
    // ถ้าไม่ระบุ force และมี PIN อยู่แล้ว จะไม่อนุญาตเขียนทับ (ป้องกันการตั้งทับโดยไม่ตั้งใจ)
    if (!force && (await hasPin())) {
      return new Response("PIN ถูกตั้งแล้ว", { status: 400 });
    }
    
    await setPin(pin);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("set-pin error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}