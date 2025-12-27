import { NextResponse } from 'next/server';
import { upstashGet } from '../../../../lib/upstash';
import { cacheGet, cacheSet } from '../../../../lib/upstashCache';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin, userId } = body as { pin?: string; userId?: string };

    if (!pin) {
      return NextResponse.json({ ok: false, error: 'Missing pin' }, { status: 400 });
    }

    // Determine Redis key: adapt to your storage shape
    const key = userId ? `user:${userId}:pin_hash` : `app:pin_hash`;

    // Try in-memory cache first
    const cacheKey = `pinhash:${key}`;
    let hashed = cacheGet<string>(cacheKey);
    if (!hashed) {
      // fetch from Upstash
      const res = await upstashGet(key, { timeoutMs: 2500, retries: 1, parseJSON: false });
      if (!res) {
        // no pin stored
        return NextResponse.json({ ok: false, data: { ok: false } }, { status: 200 });
      }
      hashed = typeof res === 'string' ? res : JSON.stringify(res);
      // cache hashed briefly to reduce round trips (short TTL for security)
      cacheSet(cacheKey, hashed, 5_000); // 5s TTL (tweak if needed)
    }

    // Compare (bcrypt)
    const match = await bcrypt.compare(pin, hashed);
    if (match) {
      return NextResponse.json({ ok: true, data: { ok: true } }, { status: 200 });
    }
    return NextResponse.json({ ok: true, data: { ok: false } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}