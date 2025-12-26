import { hasPin } from "../../../lib/pin";

export const dynamic = 'force-dynamic';

export async function GET() {
  const exists = await hasPin();
  return Response.json({ exists });
}