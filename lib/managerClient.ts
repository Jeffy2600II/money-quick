// Simple client wrapper for creating transactions
export async function createTx(body: {
  type: 'in' | 'out';
  amount: number;
  time: number;
  category ? : string;
  note ? : string;
  pin ? : string | null;
}) {
  try {
    const res = await fetch('/api/tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: body.type, amount: body.amount, pin: body.pin, time: body.time, category: body.category, note: body.note }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: text || `${res.status} ${res.statusText}` };
    }
    const j = await res.json();
    // tx route returns { newBalance } on success (per updated API)
    return { ok: true, newBalance: j.newBalance, data: j };
  } catch (e: any) {
    return { ok: false, error: String(e) };
  }
}