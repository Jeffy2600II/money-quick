// Simple client wrapper for creating transactions (server assigns time)
export async function createTx(body: {
  type: 'in' | 'out';
  amount: number;
  category ? : string;
  note ? : string;
  pin ? : string | null;
}) {
  try {
    const res = await fetch('/api/tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: text || `${res.status} ${res.statusText}` };
    }
    const j = await res.json();
    return { ok: true, newBalance: j.newBalance, tx: j.tx, data: j };
  } catch (e: any) {
    return { ok: false, error: String(e) };
  }
}