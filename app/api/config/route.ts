import { NextResponse } from 'next/server';
import { upstashGet } from '../../../lib/upstash';

/**
 * Public config endpoint example (read-heavy)
 * - sets Cache-Control and X-Cacheable to enable SW + CDN caching
 */
export async function GET() {
  try {
    // Example: read some public config from redis
    const raw = await upstashGet('public:config', { timeoutMs: 3000, retries: 1, parseJSON: true });
    const data = raw ?? { theme: 'light' };
    
    const res = NextResponse.json({ ok: true, data }, {
      status: 200,
      headers: {
        // s-maxage allows CDN caching, stale-while-revalidate keeps stale while revalidating at edge/CDN
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cacheable': '1'
      }
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}