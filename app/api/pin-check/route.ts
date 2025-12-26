import { checkPin } from "../../../lib/pin";

export async function POST(req: Request) {
  const { pin } = await req.json();
  return Response.json({ ok: await checkPin(pin) });
}