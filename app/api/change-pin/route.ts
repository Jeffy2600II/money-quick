import { setPin, checkPin } from "../../../lib/pin";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { oldPin, newPin } = await req.json();
  if (
    !oldPin ||
    !newPin ||
    typeof newPin !== "string" ||
    typeof oldPin !== "string" ||
    newPin.length < 4 ||
    newPin.length > 6
  ) {
    return new Response("Bad request", { status: 400 });
  }
  const ok = await checkPin(oldPin);
  if (!ok) {
    return new Response("รหัสเดิมไม่ถูกต้อง", { status: 401 });
  }
  await setPin(newPin);
  return Response.json({ ok: true });
}