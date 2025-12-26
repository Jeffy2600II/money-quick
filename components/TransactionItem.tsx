'use client'
export default function TransactionItem({ tx }: { tx: { type: string, amount: number, time: number } }) {
  const date = new Date(tx.time);
  const t = date.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  const isIn = tx.type === 'in';
  return (
    <li className="flex items-center justify-between bg-surface p-3 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIn ? 'bg-green-600' : 'bg-red-600'}`}>{isIn ? '+' : '-'}</div>
        <div>
          <div className="font-medium">฿{tx.amount.toLocaleString()}</div>
          <div className="text-xs text-neutral">{t}</div>
        </div>
      </div>
    </li>
  );
}