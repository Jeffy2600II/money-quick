'use client';

import React, { useEffect, useState } from "react";
import '../styles/dashboard.css'; // <-- added import for dashboard styles
import Balance from "../components/Balance";
import ToggleInOut from "../components/ToggleInOut";
import BottomNav from "../components/BottomNav";
import PrefetchOnHover from "../components/PrefetchOnHover";
import { useLoader } from "../components/LoaderProvider";
import { usePopup } from "../components/PopupProvider";
import * as pinClient from "../lib/pinClient";

type Tx = { type: 'in' | 'out' | string;amount: number;time: number };

export default function MainPage() {
  const loader = useLoader();
  const popup = usePopup();
  
  const [balance, setBalance] = useState < number | null > (null);
  const [items, setItems] = useState < Tx[] > ([]);
  const [mode, setMode] = useState < 'in' | 'out' > ('in');
  const [amount, setAmount] = useState < number | '' > ('');
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  
  // fastAuth: try local PIN in localStorage (keeps same PIN functions in app)
  useEffect(() => {
    (async function fastAuth() {
      try {
        const stored = typeof window !== "undefined" ? localStorage.getItem("pin") : null;
        if (stored) {
          const res = await pinClient.checkPin(stored);
          if (res.ok && res.data?.ok) {
            setUnlocked(true);
          } else {
            setUnlocked(false);
          }
        }
      } catch {
        setUnlocked(false);
      }
    })();
  }, []);
  
  // fetch balance and history
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const bRes = await fetch("/api/balance");
        if (bRes.ok) {
          const j = await bRes.json();
          if (mounted) setBalance(typeof j.balance === "number" ? j.balance : Number(j.balance) || 0);
        } else {
          if (mounted) setBalance(0);
        }
      } catch {
        if (mounted) setBalance(0);
      }
      
      try {
        const hRes = await fetch("/api/history");
        if (hRes.ok) {
          const txs = await hRes.json();
          if (mounted && Array.isArray(txs)) setItems(txs as Tx[]);
        }
      } catch {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, []);
  
  function formatCurrency(n: number | null) {
    if (n === null) return '—';
    return `฿ ${n.toLocaleString()}`;
  }
  
  function formatTime(ts: number) {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return '-';
    }
  }
  
  async function handleAddTransaction() {
    setSaving(true);
    try {
      const amt = typeof amount === 'number' ? amount : Number(amount);
      if (!amt || amt <= 0) {
        popup.show('กรุณากรอกจำนวนเงินที่ถูกต้อง', { duration: 2200 });
        setSaving(false);
        return;
      }
      
      // Ensure we have a PIN: prefer stored pin, otherwise prompt
      let pin = '';
      try {
        pin = localStorage.getItem('pin') || '';
      } catch { pin = ''; }
      
      if (!pin) {
        // Ask user (simple prompt — keeps behaviour lightweight and consistent)
        const p = window.prompt('กรุณากรอกรหัส PIN เพื่อยืนยันการทำรายการ');
        if (!p) {
          popup.show('ยกเลิกการทำรายการ', { duration: 1800 });
          setSaving(false);
          return;
        }
        pin = p;
      }
      
      // Verify pin before sending (reuse existing checkPin function)
      const check = await pinClient.checkPin(pin);
      if (!(check.ok && check.data?.ok)) {
        popup.show('PIN ไม่ถูกต้อง', { duration: 2000 });
        setSaving(false);
        return;
      }
      
      // Send tx to API
      loader.show('กำลังบันทึก...');
      const res = await fetch('/api/tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: mode, amount: amt, pin }),
      });
      loader.hide();
      
      if (res.ok) {
        const j = await res.json();
        // update UI
        setBalance(j.newBalance ?? (mode === 'in' ? (balance || 0) + amt : (balance || 0) - amt));
        const newTx: Tx = { type: mode, amount: amt, time: Date.now() };
        setItems(prev => [newTx, ...prev].slice(0, 50));
        setAmount('');
        popup.show('บันทึกเรียบร้อย', { duration: 1600 });
      } else {
        const text = await res.text().catch(() => 'เกิดข้อผิดพลาด');
        popup.show(text || 'ไม่สามารถบันทึกได้', { duration: 2200 });
      }
    } catch (e) {
      popup.show('เกิดข้อผิดพลาด กรุณาลองใหม่', { duration: 2200 });
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <main className="dashboard-page">
      <div className="dashboard-vertical">
        {/* Brand (like PIN pages) */}
        <div className="dashboard-brand" role="banner" aria-hidden>
          <div className="logo" aria-hidden>
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="dashboard-prompt">ภาพรวมบัญชีของคุณ</div>
        </div>

        {/* Balance */}
        <div className="dashboard-balance">
          <Balance value={balance ?? 0} />
          <div className="muted small">ยอดคงเหลือ</div>
        </div>

        {/* Summary row */}
        <div className="dashboard-summary-row" role="region" aria-label="สรุปรายรับรายจ่าย">
          <div className="dashboard-summary in" aria-hidden>
            + รายรับ
            <div className="summary-value">฿ {items.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0).toLocaleString()}</div>
          </div>

          <div className="dashboard-summary out" aria-hidden>
            − รายจ่าย
            <div className="summary-value">฿ {items.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Actions: mode + amount + confirm */}
        <div style={{ width: "100%", marginTop: 10 }}>
          <ToggleInOut mode={mode} setMode={setMode} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount as any}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, '');
                setAmount(v === '' ? '' : Number(v));
              }}
              placeholder="จำนวนเงิน (เช่น 1000)"
              className="add-amount-input"
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid rgba(15,23,42,0.06)',
                fontSize: 16,
                outline: 'none'
              }}
              disabled={saving}
            />
            <button
              className="add-tx-btn"
              onClick={handleAddTransaction}
              disabled={saving}
              aria-disabled={saving}
              aria-label="บันทึกรายการ"
              style={{ flex: '0 0 120px' }}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>

        {/* Recent list */}
        <div className="dashboard-recent" style={{ width: '100%' }}>
          <h3>รายการล่าสุด</h3>
          <div className="dashboard-recent-list" role="list">
            {items.length === 0 && <div className="empty">ยังไม่มีรายการ</div>}
            {items.map((tx, idx) => (
              <div key={idx} className="dashboard-recent-item" role="listitem">
                <div className={`dashboard-recent-avatar ${tx.type === 'in' ? 'in' : 'out'}`} aria-hidden>
                  {tx.type === 'in' ? '+' : '−'}
                </div>
                <div className="dashboard-recent-meta">
                  <div className="recent-title">{tx.type === 'in' ? 'รายรับ' : 'รายจ่าย'}</div>
                  <div className="muted small">{new Date(tx.time).toLocaleDateString()} • {formatTime(tx.time)}</div>
                </div>
                <div className="dashboard-recent-amount">{formatCurrency(tx.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Utility links */}
        <div style={{ width: '100%', marginTop: 18, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <PrefetchOnHover href="/manage"><a className="link-button" style={{ textDecoration: 'none' }}>ไปจัดการ</a></PrefetchOnHover>
          <PrefetchOnHover href="/history"><a className="link-button" style={{ textDecoration: 'none' }}>ดูประวัติทั้งหมด</a></PrefetchOnHover>
        </div>
      </div>

      {/* Bottom nav (page-level) */}
      <BottomNav />
    </main>
  );
}