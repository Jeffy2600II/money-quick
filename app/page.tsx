'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import '../styles/dashboard.css';
import Balance from "../components/Balance";
import BottomNav from "../components/BottomNav";
import PrefetchOnHover from "../components/PrefetchOnHover";
import { useLoader } from "../components/LoaderProvider";
import * as pinClient from "../lib/pinClient";

type Tx = { type: 'in' | 'out' | string; amount: number; time: number };

const SESSION_FLAG_KEY = 'session_valid_v1';
const HISTORY_CACHE_KEY = 'history_cache_v1';
const BALANCE_CACHE_KEY = 'balance_cache_v1';

// safe localStorage helpers
function safeGetJSON<T>(key: string): T | null {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
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

  // Fast local session check (instant) then background verify
  useEffect(() => {
    let mounted = true;
    (async function fastAuth() {
      try {
        // 1) check short-lived session flag
        const raw = safeGetJSON<{ expires: number }>(SESSION_FLAG_KEY);
        if (raw && raw.expires && Date.now() < raw.expires) {
          setAuthorized(true);
          setAuthChecked(true);
          return;
        }

        // 2) if no session flag, check local pin presence
        let localPin: string | null = null;
        try { localPin = window.localStorage.getItem('pin'); } catch { localPin = null; }

        if (!localPin) {
          // no local auth -> redirect to lock page
          router.replace('/lock');
          return;
        }

        // 3) verify pin once in background
        const check = await pinClient.checkPin(localPin);
        if (!check.ok || !check.data?.ok) {
          try { window.localStorage.removeItem('pin'); safeRemove(SESSION_FLAG_KEY); } catch {}
          router.replace('/lock');
          return;
        }

        // 4) short lived session flag to speed up re-entries
        try {
          const SESSION_MS = 3 * 60 * 1000; // 3 minutes
          safeSetJSON(SESSION_FLAG_KEY, { expires: Date.now() + SESSION_MS });
        } catch {}

        if (!mounted) return;
        setAuthorized(true);
        setAuthChecked(true);
      } catch (e) {
        console.error('fastAuth error', e);
        try { safeRemove(SESSION_FLAG_KEY); safeRemove('pin'); } catch {}
        router.replace('/lock');
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // prepare fallback data from local cache so UI shows instantly
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

  // Use SWR (SWRConfig is provided in root layout with sensible fetcher)
  const { data: historyData, error: historyError, isValidating: isHistoryValidating } = useSWR<Tx[]>(
    authorized ? historyKey : null,
    { fallbackData: fallbackHistory ?? undefined, revalidateOnMount: true }
  );

  const { data: rawBalanceData, error: balanceError, isValidating: isBalanceValidating } = useSWR<any>(
    authorized ? balanceKey : null,
    { fallbackData: fallbackBalance ?? undefined, revalidateOnMount: true }
  );

  // Normalize balance value (API may return { balance } or a number)
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

  // Show central loader while SWR fetching initial data (or when no data yet)
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

  // Persist SWR results locally for faster subsequent loads
  useEffect(() => {
    if (historyData) {
      try { safeSetJSON(HISTORY_CACHE_KEY, historyData.slice(0, 200)); } catch {}
    }
  }, [historyData]);

  useEffect(() => {
    if (typeof balance === 'number') {
      try { safeSetJSON(BALANCE_CACHE_KEY, balance); } catch {}
    }
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

  // If auth not yet checked render nothing (avoids flicker)
  if (!authChecked) return null;
  if (!authorized) return null;

  const history = historyData ?? [];
  // sort descending by time
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

  // Format date in Thai: day month (short) and time HH:MM — omit year
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
              + รายรับ
              <div className="summary-value">{formatCurrency(totals.in)}</div>
            </div>

            <div className="dashboard-summary out" aria-hidden>
              − รายจ่าย
              <div className="summary-value">{formatCurrency(totals.out)}</div>
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