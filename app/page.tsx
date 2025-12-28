'use client';

import React, { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import '../styles/dashboard.css';
import Balance from "../components/Balance";
import BottomNav from "../components/BottomNav";
import PrefetchOnHover from "../components/PrefetchOnHover";
import { useLoader } from "../components/LoaderProvider";
import * as pinClient from "../lib/pinClient";

type Tx = { type: 'in' | 'out' | string; amount: number; time: number };

const HISTORY_CACHE_KEY = 'history_cache_v1';
const BALANCE_CACHE_KEY = 'balance_cache_v1';

function safeGetJSON<T>(key: string): T | null {
  try { const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null; if (!raw) return null; return JSON.parse(raw) as T; } catch { return null; }
}
function safeSetJSON<T>(key: string, data: T) { try { window.localStorage.setItem(key, JSON.stringify(data)); } catch {} }

export default function MainPage() {
  const loader = useLoader();

  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fast auth (keeps previous approach)
  useEffect(() => {
    let mounted = true;
    (async function fastAuth() {
      try {
        const localPin = typeof window !== "undefined" ? window.localStorage.getItem('pin') : null;
        if (!localPin) {
          window.location.href = '/lock';
          return;
        }
        const check = await pinClient.checkPin(localPin);
        if (!check.ok || !check.data?.ok) {
          try { localStorage.removeItem('pin'); } catch {}
          window.location.href = '/lock';
          return;
        }
        if (!mounted) return;
        setAuthorized(true); setAuthChecked(true);
      } catch (e) {
        console.error('fastAuth error', e);
        try { localStorage.removeItem('pin'); } catch {}
        window.location.href = '/lock';
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fallbackHistory = useMemo(() => safeGetJSON<Tx[]>(HISTORY_CACHE_KEY), []);
  const fallbackBalance = useMemo(() => safeGetJSON<number | { balance?: number }>(BALANCE_CACHE_KEY), []);

  const historyKey = authorized ? '/api/history' : null;
  const balanceKey = authorized ? '/api/balance' : null;

  const { data: historyData, error: historyError, isValidating: isHistoryValidating } = useSWR<Tx[]>(
    historyKey as any,
    { fallbackData: fallbackHistory ?? undefined, revalidateOnMount: true }
  );

  const { data: rawBalanceData, error: balanceError, isValidating: isBalanceValidating } = useSWR<any>(
    balanceKey as any,
    { fallbackData: fallbackBalance ?? undefined, revalidateOnMount: true }
  );

  // prepare current ym
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const ym = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthShort = new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(now);

  // fetch monthly summary via SWR
  const summaryKey = authorized ? `/api/summary?ym=${ym}` : null;
  const { data: summaryData } = useSWR<any>(summaryKey as any, { revalidateOnMount: true });

  // Normalize balance
  const balance: number | null = (() => {
    if (typeof rawBalanceData === 'number') return rawBalanceData;
    if (rawBalanceData && typeof rawBalanceData === 'object') {
      if ('balance' in rawBalanceData && typeof rawBalanceData.balance === 'number') return rawBalanceData.balance;
      if ('data' in rawBalanceData && rawBalanceData.data && typeof rawBalanceData.data.balance === 'number') return rawBalanceData.data.balance;
    }
    if (typeof fallbackBalance === 'number') return fallbackBalance;
    if (fallbackBalance && typeof fallbackBalance === 'object' && 'balance' in fallbackBalance && typeof (fallbackBalance as any).balance === 'number') {
      return (fallbackBalance as any).balance;
    }
    return null;
  })();

  // loader while fetching
  useEffect(() => {
    if (!authorized) return;
    const loading = Boolean(isHistoryValidating) || Boolean(isBalanceValidating) || (summaryKey && !summaryData);
    if (loading) loader.show('กำลังโหลดข้อมูล...');
    else loader.hide();
    return () => { loader.hide(true); };
  }, [authorized, isHistoryValidating, isBalanceValidating, summaryData, loader, summaryKey]);

  // persist caches
  useEffect(() => { if (historyData) safeSetJSON(HISTORY_CACHE_KEY, historyData.slice(0, 200)); }, [historyData]);
  useEffect(() => { if (typeof balance === 'number') safeSetJSON(BALANCE_CACHE_KEY, balance); }, [balance]);

  useEffect(() => {
    if (historyError || balanceError) { console.warn('SWR fetch error', { historyError, balanceError }); setError('เกิดปัญหาในการดึงข้อมูล — ระบบจะพยายามโหลดใหม่เล็กน้อย'); }
    else setError(null);
  }, [historyError, balanceError]);

  if (!authChecked) return null;
  if (!authorized) return null;

  const history = historyData ?? [];
  const sorted = [...(history || [])].sort((a, b) => (b.time || 0) - (a.time || 0));
  const recent = sorted.slice(0, 3);

  // monthly totals: prefer summary (fast); fallback to compute from history if summary not available
  const monthlyTotals = {
    in: summaryData?.data?.in ?? (() => {
      return (history || []).reduce((acc, tx) => {
        if (!tx?.time) return acc;
        const d = new Date(tx.time);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          if (tx.type === 'in') acc += Number(tx.amount || 0);
        }
        return acc;
      }, 0);
    })(),
    out: summaryData?.data?.out ?? (() => {
      return (history || []).reduce((acc, tx) => {
        if (!tx?.time) return acc;
        const d = new Date(tx.time);
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          if (tx.type === 'out') acc += Number(tx.amount || 0);
        }
        return acc;
      }, 0);
    })(),
  };

  function formatCurrency(n: number | null) {
    if (n === null) return '—';
    return `฿ ${n.toLocaleString()}`;
  }
  function formatDateThai(ts?: number) {
    if (!ts) return '';
    const d = new Date(ts);
    const datePart = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(d);
    const timePart = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  }

  return (
    <>
      <main className="dashboard-page" aria-busy={(!historyData || balance === null)}>
        <div className="dashboard-vertical">
          <div className="dashboard-brand" role="banner" aria-hidden>
            <div className="logo" aria-hidden>
              <div className="logo-line1">Money</div>
              <div className="logo-line2">quick</div>
            </div>
            <div className="dashboard-prompt">ภาพรวมบัญชีของคุณ</div>
          </div>

          <div className="dashboard-balance">
            {balance !== null ? <Balance value={balance} /> : <div className="skeleton skeleton-balance" />}
            <div className="muted small">ยอดคงเหลือ</div>
            <div className="muted small" style={{ marginTop: 6 }}>
              อัปเดตล่าสุด: {sorted.length ? formatDateThai(sorted[0].time) : '—'}
            </div>
          </div>

          <div className="dashboard-summary-row" role="region" aria-label="สรุปรายรับรายจ่าย" style={{ marginTop: 12 }}>
            <div className="dashboard-summary in" aria-hidden>
              + รายรับ {monthShort}
              <div className="summary-value">{formatCurrency(monthlyTotals.in)}</div>
            </div>

            <div className="dashboard-summary out" aria-hidden>
              − รายจ่าย {monthShort}
              <div className="summary-value">{formatCurrency(monthlyTotals.out)}</div>
            </div>
          </div>

          <div style={{ width: '100%', marginTop: 18, marginBottom: 6 }} className="dashboard-recent-header">
            <h3 style={{ margin: 0 }}>รายการล่าสุด</h3>
            <PrefetchOnHover href="/history">
              <a className="link-button" style={{ textDecoration: 'none' }}>ดูประวัติทั้งหมด</a>
            </PrefetchOnHover>
          </div>

          <div className="dashboard-recent" style={{ width: '100%', marginTop: 6 }}>
            <div className="dashboard-recent-list" role="list">
              {(!history || history.length === 0) ? (
                <div className="empty">ยังไม่มีรายการ</div>
              ) : recent.length ? (
                recent.map((tx, idx) => (
                  <div key={idx} className="dashboard-recent-item" role="listitem">
                    <div className={`dashboard-recent-avatar ${tx.type === 'in' ? 'in' : 'out'}`} aria-hidden>
                      {tx.type === 'in' ? '+' : '−'}
                    </div>
                    <div className="dashboard-recent-meta">
                      <div className="recent-title">{tx.type === 'in' ? 'รายรับ' : 'รายจ่าย'}</div>
                      <div className="muted small">{formatDateThai(tx.time)}</div>
                    </div>
                    <div className="dashboard-recent-amount">{formatCurrency(tx.amount)}</div>
                  </div>
                ))
              ) : (
                <div className="empty">ยังไม่มีรายการ</div>
              )}
            </div>
          </div>

          {error && <div className="error-text" style={{ marginTop: 12 }}>{error}</div>}
        </div>
      </main>

      <BottomNav />
    </>
  );
}