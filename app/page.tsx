'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import '../styles/dashboard.css'; // dashboard styles (kept)
import Balance from "../components/Balance";
import BottomNav from "../components/BottomNav";
import PrefetchOnHover from "../components/PrefetchOnHover";
import { useLoader } from "../components/LoaderProvider";
import * as pinClient from "../lib/pinClient";

type Tx = { type: 'in' | 'out' | string; amount: number; time: number };

const SESSION_FLAG_KEY = 'session_valid_v1';
const HISTORY_CACHE_KEY = 'history_cache_v1';
const BALANCE_CACHE_KEY = 'balance_cache_v1';

// Safe localStorage helpers
function safeGetJSON<T>(key: string): T | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
function safeSetJSON<T>(key: string, data: T) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}
function safeRemove(key: string) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  } catch {}
}

export default function MainPage() {
  const router = useRouter();
  const loader = useLoader();

  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fast local session check (instant UX)
  useEffect(() => {
    let mounted = true;
    (async function fastAuth() {
      try {
        // 1) session flag short-lived to avoid repeated server checks
        const raw = safeGetJSON<{ expires: number }>(SESSION_FLAG_KEY);
        if (raw && raw.expires && Date.now() < raw.expires) {
          if (!mounted) return;
          setAuthorized(true);
          setAuthChecked(true);
          return;
        }

        // 2) fallback to local pin presence (fast), then one server verify
        let localPin: string | null = null;
        try { localPin = window.localStorage.getItem('pin'); } catch { localPin = null; }

        if (!localPin) {
          // no local pin -> redirect to lock immediately
          router.replace('/lock');
          return;
        }

        // Verify once in background
        const check = await pinClient.checkPin(localPin);
        if (!check.ok || !check.data?.ok) {
          try { window.localStorage.removeItem('pin'); safeRemove(SESSION_FLAG_KEY); } catch {}
          router.replace('/lock');
          return;
        }

        // mark session short-lived to speed up subsequent navigations
        try {
          const SESSION_MS = 3 * 60 * 1000; // 3 minutes
          safeSetJSON(SESSION_FLAG_KEY, { expires: Date.now() + SESSION_MS });
        } catch {}

        if (!mounted) return;
        setAuthorized(true);
        setAuthChecked(true);
      } catch (e) {
        console.error('fastAuth error', e);
        try { safeRemove('pin'); safeRemove(SESSION_FLAG_KEY); } catch {}
        router.replace('/lock');
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Provide immediate UI from local caches for snappy UX
  const fallbackHistory = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return safeGetJSON<Tx[]>(HISTORY_CACHE_KEY);
  }, []);

  const fallbackBalance = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return safeGetJSON<number | { balance?: number }>(BALANCE_CACHE_KEY);
  }, []);

  const historyKey = '/api/history';
  const balanceKey = '/api/balance';

  // Use SWR (global fetcher is configured in layout -> lib/fetcher.fetchWithTimeout)
  const { data: historyData, error: historyError, isValidating: isHistoryValidating } = useSWR<Tx[]>(
    (authorized ? historyKey : null) as any,
    { fallbackData: (fallbackHistory ?? undefined) as any, revalidateOnMount: true }
  );

  const { data: rawBalanceData, error: balanceError, isValidating: isBalanceValidating } = useSWR<any>(
    (authorized ? balanceKey : null) as any,
    { fallbackData: (fallbackBalance ?? undefined) as any, revalidateOnMount: true }
  );

  // Show central loader while initial revalidation happens
  useEffect(() => {
    if (!authorized) return;
    const loading =
      Boolean(isHistoryValidating) ||
      Boolean(isBalanceValidating) ||
      (!historyData && typeof rawBalanceData === 'undefined');
    if (loading) {
      loader.show('กำลังโหลดข้อมูล...');
    } else {
      loader.hide();
    }
    return () => { loader.hide(true); };
  }, [authorized, isHistoryValidating, isBalanceValidating, historyData, rawBalanceData, loader]);

  // Normalize balance value
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

  // Cache SWR results locally for instant future loads
  useEffect(() => {
    if (historyData) safeSetJSON(HISTORY_CACHE_KEY, (historyData as Tx[]).slice(0, 200));
  }, [historyData]);

  useEffect(() => {
    if (typeof balance === 'number') safeSetJSON(BALANCE_CACHE_KEY, balance);
  }, [balance]);

  // Combined error handling (SWR)
  useEffect(() => {
    if (historyError || balanceError) {
      console.warn('SWR fetch error', { historyError, balanceError });
      setError('เกิดปัญหาในการดึงข้อมูล — ระบบจะพยายามโหลดใหม่เล็กน้อย');
    } else {
      setError(null);
    }
  }, [historyError, balanceError]);

  // If auth not yet checked, render nothing to keep redirect instant and avoid flicker
  if (!authChecked) return null;
  if (!authorized) return null;

  const history = historyData ?? [];
  const sorted = [...(history || [])].sort((a, b) => (b.time || 0) - (a.time || 0));
  const recent = sorted.slice(0, 3);
  const totals = (history || []).reduce((acc, tx) => {
    if (tx.type === 'in') acc.in += Number(tx.amount || 0);
    else acc.out += Number(tx.amount || 0);
    return acc;
  }, { in: 0, out: 0 });

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
          {/* Brand (centered like PIN pages) */}
          <div className="dashboard-brand" role="banner" aria-hidden>
            <div className="logo" aria-hidden>
              <div className="logo-line1">Money</div>
              <div className="logo-line2">quick</div>
            </div>
            <div className="dashboard-prompt">ภาพรวมบัญชี</div>
          </div>

          {/* Card: balance + summaries */}
          <section className="dashboard-card" style={{ marginTop: 6 }}>
            <div className="balance-row">
              <div className="balance-block">
                <div className="muted">ยอดคงเหลือ</div>
                <div className="balance-value">
                  {balance !== null ? <Balance value={balance} /> : <div className="skeleton skeleton-balance" />}
                </div>
                <div className="muted small">อัปเดตล่าสุด: {sorted.length ? formatDateThai(sorted[0].time) : '—'}</div>
              </div>

              <div className="summary-grid" aria-hidden>
                <div className="summary-card in">
                  <div className="small muted">รวมรายรับ</div>
                  <div className="summary-value">{formatCurrency(totals.in)}</div>
                </div>
                <div className="summary-card out">
                  <div className="small muted">รวมรายจ่าย</div>
                  <div className="summary-value">{formatCurrency(totals.out)}</div>
                </div>
              </div>
            </div>

            <div className="dashboard-actions">
              <div className="note muted small">ระบบศูนย์กลางจัดการการเก็บ/ลบข้อมูล (ประวัติจะถูกจัดการที่ฝั่ง server)</div>
            </div>
          </section>

          {/* Recent header: title left, history link right (same baseline) */}
          <div className="dashboard-recent-header" style={{ width: '100%', marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--muted)', fontWeight: 700 }}>กิจกรรมล่าสุด</h3>
            <PrefetchOnHover href="/history">
              <a className="history-link" style={{ textDecoration: 'none' }}>ดูประวัติทั้งหมด</a>
            </PrefetchOnHover>
          </div>

          {/* Recent list */}
          <section className="recent-section" style={{ width: '100%', marginTop: 8 }}>
            <div className="recent-list">
              {(!history || history.length === 0) ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div className="recent-item skeleton-row" key={i}>
                    <div className="skeleton avatar" />
                    <div className="skeleton-lines" style={{ flex: 1 }}>
                      <div className="skeleton skeleton-line short" />
                      <div className="skeleton skeleton-line tiny" />
                    </div>
                    <div className="skeleton skeleton-amount" />
                  </div>
                ))
              ) : recent.length ? (
                recent.map((tx, idx) => (
                  <div key={idx} className="recent-item">
                    <div className={`avatar ${tx.type === 'in' ? 'in' : 'out'}`}>{tx.type === 'in' ? '+' : '−'}</div>
                    <div className="recent-meta">
                      <div className="recent-title">{tx.type === 'in' ? 'เงินเข้า' : 'เงินออก'}</div>
                      <div className="muted small">{formatDateThai(tx.time)}</div>
                    </div>
                    <div className={`recent-amount ${tx.type === 'in' ? 'in' : 'out'}`}>
                      {tx.type === 'in' ? '+' : '-'} ฿ {tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty">ยังไม่มีรายการ</div>
              )}
            </div>
          </section>

          <section className="info-section" style={{ marginTop: 14 }}>
            <div className="info-card">
              <div className="info-title">คำแนะนำ</div>
              <ul>
                <li>ข้อมูลประวัติและการลบถูกจัดการจากฝั่งศูนย์กลาง (server)</li>
                <li>หากต้องการเก็บประวัติระยะยาว โปรดสำรองข้อมูลภายนอก</li>
              </ul>
            </div>
          </section>

          {error && <div className="error-text" style={{ marginTop: 12 }}>{error}</div>}
        </div>
      </main>

      <BottomNav />
    </>
  );
}