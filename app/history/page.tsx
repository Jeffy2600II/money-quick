'use client'
import { useEffect, useState } from "react";
import TransactionItem from "../../components/TransactionItem";

type Tx = { type: 'in' | 'out', amount: number, time: number };

export default function HistoryPage() {
  const [list, setList] = useState < Tx[] > ([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState < string | null > (null);
  
  useEffect(() => {
    fetch('/api/history').then(r => {
      if (!r.ok) throw new Error('fetch failed');
      return r.json();
    }).then((data: Tx[]) => {
      setList(data || []);
    }).catch(() => setError('ไม่สามารถโหลดประวัติได้')).finally(() => setLoading(false));
  }, []);
  
  return (
    <main className="px-4 py-6">
      <h2 className="text-lg font-bold mb-3">ประวัติรายการ</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && list.length === 0 && <div className="text-neutral">ยังไม่มีรายการ</div>}
      <ul className="mt-2 space-y-2">
        {list.map((tx:any) => <TransactionItem key={tx.time} tx={tx} />)}
      </ul>
    </main>
  );
}