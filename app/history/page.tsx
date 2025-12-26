'use client'
import { useEffect, useState } from "react";

type Tx = { type: string;amount: number;time: number };

function formatTime(timestamp: number) {
  const d = new Date(timestamp);
  return d.toLocaleString();
}

export default function HistoryPage() {
  const [items, setItems] = useState < Tx[] > ([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch("/api/history")
      .then(res => res.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);
  
  return (
    <main className="max-w-md mx-auto py-8 px-4 min-h-screen bg-base">
      <h1 className="text-xl font-bold mb-4">ประวัติล่าสุด</h1>
      {loading && <div>Loading...</div>}
      {!loading && items.length === 0 && <div>ไม่มีข้อมูล</div>}
      <ul className="divide-y">
        {items.map((tx, i) => (
          <li key={i} className="py-3 flex justify-between items-center">
            <span className={tx.type === "in" ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
              {tx.type === "in" ? "+" : "-"} ฿{tx.amount.toLocaleString()}
            </span>
            <span className="text-gray-600 text-sm">{formatTime(tx.time)}</span>
          </li>
        ))}
      </ul>
      <a href="/" className="block text-blue-500 underline mt-6">กลับหน้าหลัก</a>
    </main>
  );
}