'use client'
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [items, setItems] = useState < { type: string, amount: number, time: number } [] > ([]);
  useEffect(() => {
    fetch('/api/history').then(res => res.json()).then(x => setItems(x));
  }, []);
  return (
    <main className="max-w-md mx-auto p-3">
      <h2 className="font-bold text-2xl mb-4">ประวัติ</h2>
      <ul>
        {items.map((tx, idx) => (
          <li key={idx} className="flex justify-between w-full py-2 border-b">
            <span className={tx.type === "in" ? "text-green-500" : "text-red-500"}>
              {tx.type === "in" ? "+" : "-"}
            </span>
            <span>฿ {tx.amount.toLocaleString()}</span>
            <span>{new Date(tx.time).toLocaleTimeString()}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}