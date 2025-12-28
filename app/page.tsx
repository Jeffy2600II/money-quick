'use client'
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Balance from "../components/Balance";
import BottomNav from "../components/BottomNav";
import { useLoader } from "../components/LoaderProvider";
import '../styles/dashboard.css';
import * as pinClient from "../lib/pinClient";

type Tx = { type: 'in' | 'out' | string; amount: number; time: number };

const SESSION_FLAG_KEY = 'session_valid';
const HISTORY_CACHE_KEY = 'history_cache_v1';
const BALANCE_CACHE_KEY = 'balance_cache_v1';

// small helper to read localStorage safely
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

export default function MainPage() {
  const router = useRouter();
  const loader = useLoader();

  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fast local session check (instant)
  useEffect(() => {
    let mounted = true;
    (async function fastAuth() {
      try {
        // check session flag in localStorage
        const raw = safeGetJSON<{ expires: number }>(SESSION_FLAG_KEY);
        if (raw && raw.expires && Date.now() < raw.expires) {
          setAuthorized(true);
          setAuthChecked(true);
          return;
        }
        // no valid session flag: try to see if local 'pin' exists (fast)
        let localPin: string | null = null;
        try { localPin = window.localStorage.getItem('pin'); } catch { localPin = null; }

        if (!localPin) {
          // Not logged in locally -> immediate redirect to /lock
          router.replace('/lock');
          return;
        }

        // If localPin exists, do ONE background server verify
        const check = await pinClient.checkPin(localPin);
        if (!check.ok || !check.data?.ok) {
          try { window.localStorage.removeItem('pin'); } catch {}
          router.replace('/lock');
          return;
        }

        // set session flag short-lived (fast future visits)
        try {
          const SESSION_MS = 3 * 60 * 1000; // 3 minutes
          safeSetJSON(SESSION_FLAG_KEY, { expires: Date.now() + SESSION_MS });
        } catch {}

        if (!mounted) return;
        setAuthorized(true);
        setAuthChecked(true);
      } catch (e) {
        console.error('fastAuth error', e);
        try { window.localStorage.removeItem('pin'); window.localStorage.removeItem(SESSION_FLAG_KEY); } catch {}
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

  // SWR keys
  const historyKey = '/api/history';
  const balanceKey = '/api/balance';

  // useSWR calls (cast key to any to allow null when disabled)
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
    // ensure loader hidden on cleanup
    return () => { loader.hide(true); };
  }, [authorized, isHistoryValidating, isBalanceValidating, historyData, rawBalanceData, loader]);

  // Normalize balance value:
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

  // cache SWR results locally
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
        <div className="dashboard-container">
          <header className="dashboard-header">
            <div className="brand">
              <div className="logo">
                <div className="logo-line1">Money</div>
                <div className="logo-line2">quick</div>
              </div>
              <div className="pin-prompt">ภาพรวมบัญชี</div>
            </div>

            <div className="header-actions">
              <a href="/settings" className="icon-btn" aria-label="ตั้งค่า">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" fill="currentColor" />
                  <path d="M19.4 13.5a7.95 7.95 0 0 0 .06-1 7.95 7.95 0 0 0-.06-1l2.11-1.65a.5.5 0 0 0 .12-.65l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a8.12 8.12 0 0 0-1.73-1L14.5 2.5a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5.5L9.21 5.02c-.62.2-1.21.47-1.73.8l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.65L4.6 11.5c-.05.33-.08.66-.08 1s.03.67.08 1L2.49 15.15a.5.5 0 0 0-.12.65l2 3.46c.14.24.44.34.7.22l2.49-1c.52.33 1.11.6 1.73.8L9 21.5a.5.5 0 0 0 .5.5h4c.26 0 .48-.16.5-.41l.29-2.3c.62-.2 1.21-.47 1.73-.8l2.49 1c.26.12.56.02.7-.22l2-3.46a.5.5 0 0 0-.12-.65L19.4 13.5z" fill="currentColor" opacity="0.9" />
                </svg>
              </a>
            </div>
          </header>

          <section className="dashboard-card">
            <div className="balance-row">
              <div className="balance-block">
                <div className="muted">ยอดคงเหลือ</div>
                <div className="balance-value">
                  {balance !== null ? <Balance value={balance} /> : <div className="skeleton skeleton-balance" />}
                </div>
                <div className="muted small">อัปเดตล่าสุด: {sorted.length ? formatDateThai(sorted[0].time) : '—'}</div>
              </div>

              <div className="summary-grid">
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

          <section className="recent-section">
            <div className="recent-header">
              <h2>กิจกรรมล่าสุด</h2>
              <div>
                <a href="/history" className="link-button">ดูประวัติทั้งหมด</a>
              </div>
            </div>

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

          <section className="info-section">
            <div className="info-card">
              <div className="info-title">คำแนะนำ</div>
              <ul>
                <li>ข้อมูลประวัติและการลบถูกจัดการจากฝั่งศูนย์กลาง (server)</li>
                <li>หากต้องการเก็บประวัติระยะยาว โปรดสำรองข้อมูลภายนอก</li>
              </ul>
            </div>
          </section>

          {error && <div className="error-text">{error}</div>}
        </div>
      </main>

      <BottomNav />
    </>
  );
}