'use client'
import { useEffect, useState } from "react";
import Balance from "../components/Balance";
import BottomNav from "../components/BottomNav";
import PrefetchOnHover from "../components/PrefetchOnHover";

type Tx = { type: 'in' | 'out' | string; amount: number; time: number };

function safeGetJSON<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

function safeSetJSON<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export default function MainPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [summary, setSummary] = useState<{ in: number; out: number }>({ in: 0, out: 0 });

  useEffect(() => {
    fetch('/api/balance').then(res => res.json()).then(x => setBalance(Number(x.balance) || 0));
    fetch('/api/history').then(res => res.json()).then((list: Tx[]) => {
      setTxs(Array.isArray(list) ? list : []);
      let sumIn = 0, sumOut = 0;
      for (const tx of list) {
        if (tx.type === 'in') sumIn += tx.amount;
        if (tx.type === 'out') sumOut += tx.amount;
      }
      setSummary({ in: sumIn, out: sumOut });
    });
  }, []);

  function formatCurrency(n: number | null) {
    if (n === null) return '—';
    return `฿ ${n.toLocaleString()}`;
  }
  function formatDateThai(ts?: number) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-vertical">
        {/* Brand/header section (เหมือนหน้า pin) */}
        <div className="dashboard-brand">
          <div className="logo">
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="dashboard-prompt">ภาพรวมบัญชีของคุณ</div>
        </div>

        {/* Balance */}
        <div className="dashboard-balance">
          <Balance value={balance ?? 0} />
        </div>

        {/* Summary row */}
        <div className="dashboard-summary-row">
          <div className="dashboard-summary in">
            + เงินเข้า<br />
            <span className="summary-value">{formatCurrency(summary.in)}</span>
          </div>
          <div className="dashboard-summary out">
            − เงินออก<br />
            <span className="summary-value">{formatCurrency(summary.out)}</span>
          </div>
        </div>

        {/* เพิ่ม transaction */}
        <PrefetchOnHover href="/manage">
          <button className="add-tx-btn" type="button">
            + เพิ่ม/จัดการรายการ
          </button>
        </PrefetchOnHover>

        {/* Recent/History */}
        <div className="dashboard-recent">
          <h3>รายการล่าสุด</h3>
          <div className="dashboard-recent-list">
            {txs.length === 0 && (
              <div className="dashboard-recent-item" style={{ justifyContent: 'center', opacity: 0.65 }}>
                ไม่มีข้อมูลในเดือนนี้
              </div>
            )}
            {txs.map((tx, idx) => (
              <div key={idx} className="dashboard-recent-item">
                <div className={`dashboard-recent-avatar ${tx.type}`}>
                  {tx.type === "in" ? "+" : tx.type === "out" ? "−" : ""}
                </div>
                <div className="dashboard-recent-meta">
                  <div className="recent-title">
                    {tx.type === 'in' ? 'รายรับ' : tx.type === 'out' ? 'รายจ่าย' : tx.type}
                  </div>
                  <div className="recent-time" style={{ color: '#6b7280', fontSize: '0.91em', fontWeight: 500 }}>
                    {formatDateThai(tx.time)}
                  </div>
                </div>
                <div className="dashboard-recent-amount" style={{ color: tx.type === "in" ? "#04996f" : tx.type === "out" ? "#dc2626" : undefined }}>
                  {tx.type === "in" ? "+" : tx.type === "out" ? "−" : ""}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}