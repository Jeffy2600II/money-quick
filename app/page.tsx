'use client';

import React, { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import Balance from '../components/Balance';
import { createTx } from '../lib/managerClient';
import '../styles/dashboard.css';

/**
 * Dashboard (updated)
 * - Shows balance, monthly summary (basic), recent transactions
 * - Adds a small inline "quick manager" form so you can create in/out transactions
 *   directly from the dashboard to help reproduce the write-to-DB issue.
 *
 * Notes:
 * - Uses SWR (configured in RootLayout) so mutate('/api/balance') etc. will revalidate.
 * - The quick manager uses the same createTx client helper as the Manager page.
 */

type Tx = { type: 'in' | 'out' | string;amount: number;time: number };

function QuickManager({ onDone }: { onDone ? : () => void }) {
  const [type, setType] = useState < 'in' | 'out' > ('in');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState < string | null > (null);
  
  function parseAmount(s: string) {
    const normalized = s.replace(',', '.').trim();
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  }
  
  async function handleSubmit() {
    setMessage(null);
    const n = parseAmount(amount);
    if (!amount || Number.isNaN(n) || n <= 0) {
      setMessage('กรุณาใส่จำนวนเงินที่ถูกต้อง');
      return;
    }
    
    // fast-path pin from localStorage
    let pin: string | null = null;
    try { pin = typeof window !== 'undefined' ? window.localStorage.getItem('pin') : null; } catch { pin = null; }
    if (!pin) {
      setMessage('ยังไม่ได้ตั้ง PIN — กรุณาเข้าสู่ระบบหรือไปตั้ง PIN');
      setTimeout(() => { window.location.href = '/lock'; }, 700);
      return;
    }
    
    setSubmitting(true);
    setMessage('กำลังบันทึกรายการ...');
    try {
      const res = await createTx({ type, amount: n, pin });
      if (res.ok) {
        setMessage('บันทึกรายการเรียบร้อย');
        setAmount('');
        // revalidate keys used by UI
        try {
          const d = new Date();
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          mutate('/api/history');
          mutate('/api/balance');
          mutate(`/api/summary?ym=${ym}`);
        } catch {}
        if (onDone) onDone();
      } else {
        setMessage(res.error || 'ไม่สามารถบันทึกรายการได้');
      }
    } catch (e: any) {
      setMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      console.error('QuickManager createTx error', e);
    } finally {
      setSubmitting(false);
      // auto-clear message after short time
      setTimeout(() => setMessage(null), 2600);
    }
  }
  
  return (
    <div className="dashboard-summary" style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>จัดการด่วน</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>{type === 'in' ? 'เงินเข้า' : 'เงินออก'}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          onClick={() => setType('in')}
          className={type === 'in' ? 'dashboard-summary in' : 'dashboard-summary'}
          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, fontWeight: 700 }}
          aria-pressed={type === 'in'}
        >
          + เงินเข้า
        </button>
        <button
          onClick={() => setType('out')}
          className={type === 'out' ? 'dashboard-summary out' : 'dashboard-summary'}
          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, fontWeight: 700 }}
          aria-pressed={type === 'out'}
        >
          − เงินออก
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={submitting}
          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.06)' }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: submitting ? '#9CA3AF' : '#04996f',
            color: '#fff',
            fontWeight: 700,
            border: 'none',
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          บันทึก
        </button>
      </div>

      {message && <div style={{ color: '#6b7280', fontSize: 13 }}>{message}</div>}
    </div>
  );
}

export default function MainPage() {
  // balance from API
  const { data: balData } = useSWR < { balance: number } > ('/api/balance', { refreshInterval: 0 });
  const balance = balData?.balance ?? 0;
  
  // recent tx
  const { data: txs } = useSWR < Tx[] > ('/api/history', { refreshInterval: 0 });
  
  // monthly summary (basic)
  const monthYm = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  
  const { data: summaryData } = useSWR < { ok: boolean;data: { in: number;out: number } } > (`/api/summary?ym=${monthYm}`);
  
  return (
    <main className="dashboard-page">
      <div className="dashboard-vertical">
        <div className="dashboard-brand">
          <div className="logo">
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="dashboard-prompt">สรุปการเงิน</div>
        </div>

        <div className="dashboard-balance">
          <Balance value={balance} />
        </div>

        <div className="dashboard-summary-row" style={{ marginBottom: 12 }}>
          <div className="dashboard-summary in" style={{ flex: 1 }}>
            <div>รับทั้งหมด (เดือนนี้)</div>
            <div className="summary-value">฿ {Number(summaryData?.data?.in ?? 0).toLocaleString()}</div>
          </div>

          <div className="dashboard-summary out" style={{ flex: 1 }}>
            <div>จ่ายทั้งหมด (เดือนนี้)</div>
            <div className="summary-value">฿ {Number(summaryData?.data?.out ?? 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Quick manager inserted on dashboard */}
        <QuickManager onDone={() => { /* optional callback */ }} />

        <div style={{ height: 12 }} />

        <div className="dashboard-recent">
          <div className="dashboard-recent-header">
            <h3 style={{ margin: 0 }}>รายการล่าสุด</h3>
            <a className="link-button" href="/history">ดูประวัติทั้งหมด</a>
          </div>

          <div className="dashboard-recent-list" style={{ marginTop: 8 }}>
            {(!txs || txs.length === 0) && <div className="empty">ยังไม่มีรายการ</div>}
            {txs && txs.length > 0 && txs.map((tx, idx) => {
              const isIn = tx.type === 'in';
              return (
                <div key={idx} className="dashboard-recent-item">
                  <div className={`dashboard-recent-avatar ${isIn ? 'in' : 'out'}`}>{isIn ? '+' : '−'}</div>
                  <div className="dashboard-recent-meta">
                    <div className="recent-title">{isIn ? 'เงินเข้า' : 'เงินออก'}</div>
                    <div className="muted small">{new Date(tx.time).toLocaleString()}</div>
                  </div>
                  <div className="dashboard-recent-amount" style={{ color: isIn ? '#04996f' : '#dc2626' }}>
                    ฿ {Number(tx.amount).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom spacing so bottom-nav doesn't overlap */}
      <div style={{ height: '84px' }} />
    </main>
  );
}