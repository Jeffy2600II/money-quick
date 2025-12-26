import { listTx } from "../../../lib/kv";

export const dynamic = 'force-dynamic';

export async function GET() {
  const txs = await listTx(50);
  return Response.json(txs);
}