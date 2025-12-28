import { NextResponse } from 'next/server';
import { upstashGet } from '../../../lib/upstash';

export const dynamic = 'force-dynamic';

/**
 * GET /api/summary?ym=YYYY-MM
 * - returns { ok: true, data: { in: number, out: number } }
 * - if ym omitted, returns current month
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    let ym = url.searchParams.get('ym') || null;
    if (!ym) {
      const d = new Date();
      ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    
    const key = `summary:${ym}`;
    // get hash
    const raw = await upstashGet(key, { timeoutMs: 2500, retries: 1, parseJSON: false });
    if (raw === null || raw === undefined) {
      return NextResponse.json({ ok: true, data: { in: 0, out: 0, ym } }, { status: 200 });
    }
    
    // raw may be an object (if client lib parsed) or string; attempt to normalize
    let inVal = 0;
    let outVal = 0;
    
    if (typeof raw === 'object') {
      inVal = Number(raw.in || 0);
      outVal = Number(raw.out || 0);
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        inVal = Number(parsed.in || 0);
        outVal = Number(parsed.out || 0);
      } catch {
        // not JSON: treat as empty
      }
    }
    
    return NextResponse.json({ ok: true, data: { in: inVal, out: outVal, ym } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}