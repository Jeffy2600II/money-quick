'use client'
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Balance from "../components/Balance";
import BottomNav from "../components/BottomNav";
import '../styles/dashboard.css';
import * as pinClient from "../lib/pinClient";
import { fetchWithTimeout } from "../lib/fetcher";

type Tx = { type: 'in' | 'out' | string;amount: number;time: number };

const SESSION_FLAG_KEY = 'session_valid';
const HISTORY_KEY = '/api/history';
const BALANCE_KEY = '/api/balance';

/**
 * Dashboard — robust balance fetching
 *
 * - Balance is fetched directly from the server every time the page mounts (no persistent caching).
 * - The fetch uses a small retry/backoff strategy to reduce transient network failures.
 * - History is fetched via SWR (revalidation) but can be changed to direct fetch if you prefer.
 * - Auth still uses fast local-session check; sensitive writes on server must revalidate PIN.
 */

export default function MainPage() {
  const router = useRouter();
  
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  
  const [balance, setBalance] = useState < number | null > (null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState < string | null > (null);
  
  const [error, setError] = useState < string | null > (null);
  
  // --- fast local auth (no DB blocking) ---
  useEffect(() => {
    let mounted = true;
    (async function fastAuth() {
      try {
        // check short-lived session flag
        let sessionOk = false;
        try {
          const raw = window.localStorage.getItem(SESSION_FLAG_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { expires ? : number } | null;
            if (parsed?.expires && Date.now() < parsed.expires) sessionOk = true;
          }
        } catch {}
        
        if (sessionOk) {
          setAuthorized(true);
          setAuthChecked(true);
          return;
        }
        
        // fallback: check local pin existence (fast)
        let localPin: string | null = null;
        try { localPin = window.localStorage.getItem('pin'); } catch { localPin = null; }
        
        if (!localPin) {
          router.replace('/lock');
          return;
        }
        
        // verify once (background) — if fails redirect to /lock
        const check = await pinClient.checkPin(localPin);
        if (!check.ok || !check.data?.ok) {
          try { window.localStorage.removeItem('pin'); } catch {}
          router.replace('/lock');
          return;
        }
        
        // set short session flag to speed subsequent loads (does not affect balance fetch)
        try {
          const SESSION_MS = 3 * 60 * 1000; // 3 minutes
          window.localStorage.setItem(SESSION_FLAG_KEY, JSON.stringify({ expires: Date.now() + SESSION_MS }));
        } catch {}
        
        if (!mounted) return;
        setAuthorized(true);
        setAuthChecked(true);
      } catch (e) {
        console.error('fastAuth error', e);
        try { window.localStorage.removeItem('pin'); } catch {}
        router.replace('/lock');
      }
    })();
    
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // --- history via SWR (keeps UI responsive) ---
  const fetcher = (url: string) =>
    fetchWithTimeout(url, { timeout: 5000 }).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
  
  const { data: historyData, error: historyError } = useSWR < Tx[] > (
    (authorized ? HISTORY_KEY : null) as any,
    fetcher, { revalidateOnMount: true, revalidateOnFocus: false }
  );
  
  useEffect(() => {
    if (historyError) {
      console.warn('history fetch error', historyError);
      setError('เกิดปัญหาในการดึงประวัติข้อมูล — ระบบจะพยายามใหม่');
    } else {
      setError(null);
    }
  }, [historyError]);
  
  // --- balance: direct fetch every time, robust retry ---
  async function fetchBalanceWithRetry(attempts = 3) {
    setBalanceLoading(true);
    setBalanceError(null);
    let lastErr: any = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetchWithTimeout(BALANCE_KEY, { timeout: 4000 });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // Expect server JSON: { balance: number } (adjust if API differs)
        const b = Number(json?.balance ?? json);
        if (!Number.isFinite(b)) throw new Error('Invalid balance value');
        setBalance(b);
        setBalanceLoading(false);
        setBalanceError(null);
        return;
      } catch (e) {
        lastErr = e;
        // small exponential backoff (avoid blocking too long)
        const delay = 150 * Math.pow(2, i); // 150ms, 300ms, 600ms
        await new Promise(r => setTimeout(r, delay));
      }
    }
    console.error('fetchBalanceWithRetry failed', lastErr);
    setBalance(null);
    setBalanceLoading(false);
    setBalanceError('ไม่สามารถดึงยอดคงเหลือได้ขณะนี้');
  }
  
  // trigger balance fetch as soon as authorized (no caching, always fetch)
  useEffect(() => {
    if (!authorized) return;
    let cancelled = false;
    (async () => {
      await fetchBalanceWithRetry(3);
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);
  
  // render gating: don't render dashboard until authChecked is complete (fast redirect otherwise)
  if (!authChecked) return null;
  if (!authorized) return null;
  
  const history = historyData ?? [];
  const sorted = [...history].sort((a, b) => (b.time || 0) - (a.time || 0));
  const recent = sorted.slice(0, 3);
  const totals = history.reduce((acc, tx) => {
    if (tx.type === 'in') acc.in += Number(tx.amount || 0);
    else acc.out += Number(tx.amount || 0);
    return acc;
  }, { in: 0, out: 0 });
  
  function formatCurrency(n: number | null) {
    if (n === null) return '—';
    return `฿ ${n.toLocaleString()}`;
  }
  
  function formatDateThai(ts ? : number) {
    if (!ts) return '';
    const d = new Date(ts);
    const datePart = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(d);
    const timePart = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  }
  
  return (
    <>
      <main className="dashboard-page" aria-busy={balanceLoading || !historyData}>
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
                {/* gear icon */}
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
                  {balanceLoading ? <div className="skeleton skeleton-balance" /> : <Balance value={balance ?? 0} />}
                </div>
                <div className="muted small">
                  {balanceError ? balanceError : (sorted.length ? formatDateThai(sorted[0].time) : '—')}
                </div>
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
                <li>ข้อมูลยอดคงเหลือจะถูกดึงจากฐานข้อมูลทุกครั้งที่เข้าเว็บไซต์ (ไม่มีการเก็บถาวรในเครื่อง)</li>
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