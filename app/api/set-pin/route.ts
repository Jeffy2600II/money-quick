import { setPin, hasPin } from "../../../lib/pin";
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { pin } = await req.json();
  if (!pin || typeof pin !== "string" || pin.length < 4 || pin.length > 6) {
    return new Response("Bad request", { status: 400 });
  }
  if (await hasPin()) {
    return new Response("PIN ถูกตั้งแล้ว", { status: 400 });
  }
  await setPin(pin);
  return Response.json({ ok: true });
}