'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Balance from '../components/Balance';
import BottomNav from '../components/BottomNav';
import PrefetchOnHover from '../components/PrefetchOnHover';
import { useLoader } from '../components/LoaderProvider';
import '../styles/dashboard.css';
import * as pinClient from '../lib/pinClient';

type Tx = { type: 'in' | 'out' | string; amount: number; time: number };

const SESSION_FLAG_KEY = 'session_valid';
const HISTORY_CACHE_KEY = 'history_cache_v1';
const BALANCE_CACHE_KEY = 'balance_cache_v1';

// safe localStorage helpers
function safeGetJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
function safeSetJSON<T>(key: string, data: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}
function safeRemove(key: string) {
  try { window.localStorage.removeItem(key); } catch {}
}

export default function MainPage() {
  const router = useRouter();
  const loader = useLoader();

  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fast local session check (instant) + background verify
  useEffect(() => {
    let mounted = true;
    (async function fastAuth() {
      try {
        const raw = safeGetJSON<{ expires: number }>(SESSION_FLAG_KEY);
        if (raw && raw.expires && Date.now() < raw.expires) {
          setAuthorized(true);
          setAuthChecked(true);
          return;
        }

        // fallback to localPin check
        let localPin: string | null = null;
        try { localPin = window.localStorage.getItem('pin'); } catch { localPin = null; }

        if (!localPin) {
          router.replace('/lock');
          return;
        }

        const check = await pinClient.checkPin(localPin);
        if (!check.ok || !check.data?.ok) {
          try { safeRemove('pin'); } catch {}
          router.replace('/lock');
          return;
        }

        // Set short-lived session flag to speed up re-visits
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

  // prepare fallback data from local cache (so UI shows instantly)
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

  // SWR calls — rely on SWRConfig.fetcher (set in layout)
  // NOTE: do NOT pass `undefined` as the second argument — pass options as the 2nd param when you want to use global fetcher.
  const { data: historyData, error: historyError, isValidating: isHistoryValidating } = useSWR<Tx[]>(
    (authorized ? historyKey : null) as any,
    { fallbackData: (fallbackHistory ?? undefined) as any, revalidateOnMount: true }
  );

  const { data: rawBalanceData, error: balanceError, isValidating: isBalanceValidating } = useSWR<any>(
    (authorized ? balanceKey : null) as any,
    { fallbackData: (fallbackBalance ?? undefined) as any, revalidateOnMount: true }
  );

  // Show central loader while SWR is fetching data (or when no data yet)
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

  // cache SWR results locally to speed future loads (small local cache)
  useEffect(() => {
    if (historyData) safeSetJSON(HISTORY_CACHE_KEY, historyData.slice(0, 200));
  }, [historyData]);

  useEffect(() => {
    if (typeof balance === 'number') safeSetJSON(BALANCE_CACHE_KEY, balance);
  }, [balance]);

  // Combined error handling
  useEffect(() => {
    if (historyError || balanceError) {
      console.warn('SWR fetch error', { historyError, balanceError });
      setError('เกิดปัญหาในการดึงข้อมูล — ระบบจะพยายามโหลดใหม่เล็กน้อย');
    } else {
      setError(null);
    }
  }, [historyError, balanceError]);

  // If auth not yet checked, render nothing so redirect is instant (no flicker)
  if (!authChecked) return null;
  if (!authorized) return null;

  // Use data from SWR (or fallback caches)
  const history = historyData ?? [];
  const sorted = [...(history || [])].sort((a, b) => (b.time || 0) - (a.time || 0));
  const recent = sorted.slice(0, 3);

  // Compute totals for current month and overall as needed
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const itemsThisMonth = (history || []).filter(tx => {
    const d = new Date(tx.time);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const inTotalThisMonth = itemsThisMonth.filter(t => t.type === 'in').reduce((s, t) => s + (t.amount || 0), 0);
  const outTotalThisMonth = itemsThisMonth.filter(t => t.type === 'out').reduce((s, t) => s + (t.amount || 0), 0);

  // Small overall totals (used in legacy layout)
  const totals = (history || []).reduce((acc, tx) => {
    if (tx.type === 'in') acc.in += Number(tx.amount || 0);
    else acc.out += Number(tx.amount || 0);
    return acc;
  }, { in: 0, out: 0 });

  function formatCurrency(n: number | null) {
    if (n === null) return '—';
    return `฿ ${n.toLocaleString()}`;
  }

  // Format date day + short month (th) and time HH:MM น.
  function formatDateThai(ts?: number) {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const datePart = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(d);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${datePart} ${hh}:${mm} น.`;
    } catch {
      const d = new Date(ts);
      return d.toLocaleString();
    }
  }

  // month short name (e.g., "ธ.ค.")
  function thaiMonthNameShort(date = new Date()) {
    try {
      return new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(date);
    } catch {
      const m = date.getMonth();
      const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
      return months[m] ?? '';
    }
  }
  const monthNameThai = thaiMonthNameShort(now);

  return (
    <>
      <main className="dashboard-page" aria-busy={(!historyData || balance === null)}>
        <div className="dashboard-vertical">
          {/* Brand */}
          <div className="dashboard-brand" role="banner" aria-hidden>
            <div className="logo" aria-hidden>
              <div className="logo-line1">Money</div>
              <div className="logo-line2">quick</div>
            </div>
            <div className="dashboard-prompt">ภาพรวมบัญชีของคุณ</div>
          </div>

          {/* Balance + summary */}
          <div className="dashboard-balance">
            {balance !== null ? <Balance value={balance} /> : <div className="muted small">—</div>}
            <div className="muted small">ยอดคงเหลือ</div>
          </div>

          <div className="dashboard-summary-row" role="region" aria-label="สรุปรายรับรายจ่าย">
            <div className="dashboard-summary in" aria-hidden>
              รายรับ {monthNameThai}
              <div className="summary-value">฿ {inTotalThisMonth.toLocaleString()}</div>
            </div>

            <div className="dashboard-summary out" aria-hidden>
              รายจ่าย {monthNameThai}
              <div className="summary-value">฿ {outTotalThisMonth.toLocaleString()}</div>
            </div>
          </div>

          {/* Recent header */}
          <div className="dashboard-recent-header" style={{ width: '100%', marginTop: 18, marginBottom: 6 }}>
            <h3 style={{ margin: 0 }}>รายการล่าสุด</h3>
            <PrefetchOnHover href="/history">
              <a className="link-button" style={{ textDecoration: 'none' }}>ดูประวัติทั้งหมด</a>
            </PrefetchOnHover>
          </div>

          {/* Recent list (skeleton when empty / loading) */}
          <div className="dashboard-recent" style={{ width: '100%' }}>
            <div className="dashboard-recent-list" role="list">
              {(!history || history.length === 0) ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div className="dashboard-recent-item" key={i}>
                    <div className="dashboard-recent-avatar" aria-hidden><div className="skeleton avatar" /></div>
                    <div className="dashboard-recent-meta" style={{ flex: 1 }}>
                      <div className="skeleton skeleton-line short" />
                      <div style={{ height: 8 }} />
                      <div className="skeleton skeleton-line tiny" />
                    </div>
                    <div className="dashboard-recent-amount"><div className="skeleton skeleton-amount" /></div>
                  </div>
                ))
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

          {/* Info */}
          <div style={{ marginTop: 12 }}>
            <div className="muted small">อัปเดตล่าสุด: {sorted.length ? formatDateThai(sorted[0].time) : '—'}</div>
            {error && <div className="error-text" style={{ marginTop: 8 }}>{error}</div>}
            <div style={{ marginTop: 8 }} className="muted small">ระบบดึงข้อมูลเร็วขึ้นด้วยการใช้ local cache + short session flag และ SWR</div>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}