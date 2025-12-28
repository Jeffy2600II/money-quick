'use client';

import React, { useEffect, useState } from "react";
import '../styles/dashboard.css'; // dashboard styles
import Balance from "../components/Balance";
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

        {/* Recent header: label + history link (right-aligned on same row) */}
        <div className="dashboard-recent-header" style={{ width: '100%', marginTop: 18, marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>รายการล่าสุด</h3>
          <PrefetchOnHover href="/history">
            <a className="link-button" style={{ textDecoration: 'none' }}>ดูประวัติทั้งหมด</a>
          </PrefetchOnHover>
        </div>

        {/* Recent list */}
        <div className="dashboard-recent" style={{ width: '100%' }}>
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

        {/* Removed inline add-input and manage button per request */}
      </div>

      {/* Bottom nav (page-level) */}
      <BottomNav />
    </main>
  );
}