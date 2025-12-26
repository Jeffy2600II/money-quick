import { checkPin } from "../../../lib/pin";
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { pin } = await req.json();
  if (!pin || typeof pin !== "string") {
    return Response.json({ ok: false });
  }
  const ok = await checkPin(pin);
  return Response.json({ ok });
}