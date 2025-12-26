import { getKV } from "../../../lib/kv";
export const dynamic = "force-dynamic";

export async function GET() {
  const balance = Number(await getKV < number > ("balance")) || 0;
  return Response.json({ balance });
}