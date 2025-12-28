'use client';

import React, { useEffect, useState } from "react";
import '../styles/dashboard.css'; // dashboard styles
import Balance from "../components/Balance";
import ToggleInOut from "../components/ToggleInOut";
import BottomNav from "../components/BottomNav";
import PrefetchOnHover from "../components/PrefetchOnHover";
import { useLoader } from "../components/LoaderProvider";
import { usePopup } from "../components/PopupProvider";
import * as pinClient from "../lib/pinClient";
import useSWR, { mutate } from "swr";

type Tx = { type: 'in' | 'out' | string;amount: number;time: number };

export default function MainPage() {
  const loader = useLoader();
  const popup = usePopup();
  
  // SWR will use the global fetcher (fetchWithTimeout) configured in layout
  const { data: balanceData, error: balanceError } = useSWR < { balance: number } > ("/api/balance");
  const { data: historyData, error: historyError } = useSWR < Tx[] > ("/api/history");
  
  const [mode, setMode] = useState < 'in' | 'out' > ('in');
  const [amount, setAmount] = useState < number | '' > ('');
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  
  // fastAuth: try local PIN in localStorage to unlock quickly (keeps pin functions)
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
  
  const balance = balanceData?.balance ?? null;
  const items = Array.isArray(historyData) ? historyData : [];
  
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
  
  // Add transaction: keep quick UX + loader + optimistic update then revalidate SWR
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
        // lightweight prompt (keeps flow fast)
        const p = window.prompt('กรุณากรอกรหัส PIN เพื่อยืนยันการทำรายการ');
        if (!p) {
          popup.show('ยกเลิกการทำรายการ', { duration: 1800 });
          setSaving(false);
          return;
        }
        pin = p;
      }
      
      // Verify pin before sending (reuse existing checkPin)
      const check = await pinClient.checkPin(pin);
      if (!(check.ok && check.data?.ok)) {
        popup.show('PIN ไม่ถูกต้อง', { duration: 2000 });
        setSaving(false);
        return;
      }
      
      // Optimistic UI: compute new balance and prepend tx locally
      const optimisticNewBalance = (typeof balance === 'number' ? balance : 0) + (mode === 'in' ? amt : -amt);
      const optimisticTx: Tx = { type: mode, amount: amt, time: Date.now() };
      
      // Update UI immediately
      mutate("/api/balance", { balance: optimisticNewBalance }, false);
      mutate("/api/history", (current: Tx[] | undefined) => [optimisticTx, ...(current ?? [])].slice(0, 50), false);
      
      loader.show('กำลังบันทึก...');
      const res = await fetch('/api/tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: mode, amount: amt, pin }),
      });
      loader.hide();
      
      if (res.ok) {
        // let server be source of truth — revalidate in background
        mutate("/api/balance").catch(() => {});
        mutate("/api/history").catch(() => {});
        setAmount('');
        popup.show('บันทึกเรียบร้อย', { duration: 1400 });
      } else {
        // rollback optimistic update by revalidating
        mutate("/api/balance").catch(() => {});
        mutate("/api/history").catch(() => {});
        const text = await res.text().catch(() => 'เกิดข้อผิดพลาด');
        popup.show(text || 'ไม่สามารถบันทึกได้', { duration: 2200 });
      }
    } catch (e) {
      // roll back on error
      mutate("/api/balance").catch(() => {});
      mutate("/api/history").catch(() => {});
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
          {balance === null && !balanceError ? (
            <div className="skeleton skeleton-balance" aria-hidden />
          ) : (
            <>
              <Balance value={balance ?? 0} />
              <div className="muted small">ยอดคงเหลือ</div>
            </>
          )}
        </div>

        {/* Summary row: labels only (numbers moved to manage page) */}
        <div className="dashboard-summary-row" role="region" aria-label="สรุปรายรับรายจ่าย">
          <div className="dashboard-summary in" aria-hidden>
            + รายรับ
          </div>

          <div className="dashboard-summary out" aria-hidden>
            − รายจ่าย
          </div>
        </div>

        {/* Controls: minimal input + action (keep quick interactions) */}
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

        {/* Recent list header with "ดูประวัติทั้งหมด" aligned to the right */}
        <div className="recent-header" style={{ width: '100%', marginTop: 18, alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>รายการล่าสุด</h3>
          <div style={{ marginLeft: 'auto' }}>
            <PrefetchOnHover href="/history">
              <a className="view-all-btn" href="/history">ดูประวัติทั้งหมด</a>
            </PrefetchOnHover>
          </div>
        </div>

        {/* Recent list */}
        <div className="dashboard-recent" style={{ width: '100%' }}>
          <div className="dashboard-recent-list" role="list">
            {(!items || items.length === 0) && !historyError ? (
              // show a few skeleton rows so page feels responsive while loading
              <>
                <div className="dashboard-recent-item"><div className="skeleton skeleton-avatar" /> <div style={{ flex: 1 }}><div className="skeleton skeleton-line" /></div> <div className="skeleton skeleton-amount" /></div>
                <div className="dashboard-recent-item"><div className="skeleton skeleton-avatar" /> <div style={{ flex: 1 }}><div className="skeleton skeleton-line short" /></div> <div className="skeleton skeleton-amount" /></div>
                <div className="dashboard-recent-item"><div className="skeleton skeleton-avatar" /> <div style={{ flex: 1 }}><div className="skeleton skeleton-line" /></div> <div className="skeleton skeleton-amount" /></div>
              </>
            ) : items.length === 0 ? (
              <div className="empty">ยังไม่มีรายการ</div>
            ) : (
              items.map((tx, idx) => (
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
              ))
            )}
          </div>
        </div>

        {/* Removed "ไปจัดการ" link — center FAB in BottomNav provides add/manage action */}
      </div>

      {/* Bottom nav (page-level) */}
      <BottomNav />
    </main>
  );
}