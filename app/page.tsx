'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Balance from "../components/Balance";
import BottomNav from "../components/BottomNav";
import '../styles/dashboard.css';
import * as pinClient from "../lib/pinClient";

type Tx = { type: 'in' | 'out' | string;amount: number;time: number };

/**
 * Fast-auth dashboard using a short-lived client session flag.
 *
 * Strategy:
 * - Synchronous, local check first: read `session_valid` from localStorage and verify expiry.
 *   If valid -> mark authorized immediately (no network) so UI appears fast.
 * - If no valid session flag but local `pin` exists, verify it once with server (as now),
 *   then set session flag for next visits to be instant.
 * - If neither session nor pin -> redirect to /lock immediately.
 *
 * Notes:
 * - We keep existing server-side checks for sensitive writes (server must re-verify PIN there).
 * - Session duration short by default (5 minutes) — controlled at login (Lock page).
 */
const SESSION_FLAG_KEY = 'session_valid';

export default function MainPage() {
  const router = useRouter();
  
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [balance, setBalance] = useState < number | null > (null);
  const [history, setHistory] = useState < Tx[] > ([]);
  const [error, setError] = useState < string | null > (null);
  
  useEffect(() => {
    let mounted = true;
    
    async function init() {
      try {
        // 0) synchronous local session check (fast path)
        try {
          const raw = window.localStorage.getItem(SESSION_FLAG_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { expires: number } | null;
            if (parsed && parsed.expires && Date.now() < parsed.expires) {
              // immediate authorized
              setAuthorized(true);
            } else {
              // expired flag -> clean up
              try { window.localStorage.removeItem(SESSION_FLAG_KEY); } catch {}
            }
          }
        } catch (e) {
          // ignore localStorage parse errors and continue to fallback
        }
        
        // If authorized by session flag -> load data immediately (no PIN recheck)
        if (authorized) {
          // load data
          setLoadingData(true);
          try {
            const [bRes, hRes] = await Promise.all([fetch("/api/balance"), fetch("/api/history")]);
            if (!mounted) return;
            if (!bRes.ok || !hRes.ok) throw new Error('Failed to load data');
            const bJson = await bRes.json();
            const hJson = await hRes.json();
            setBalance(Number(bJson.balance ?? 0));
            setHistory(Array.isArray(hJson) ? (hJson as Tx[]) : []);
          } catch (e) {
            console.error('Data load error', e);
            setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
          } finally {
            if (mounted) setLoadingData(false);
            if (mounted) setAuthChecked(true);
          }
          return;
        }
        
        // 1) no valid session flag -> try fast fallback: if localPin exists, verify once and set session flag
        let localPin: string | null = null;
        try { localPin = window.localStorage.getItem('pin'); } catch { localPin = null; }
        
        if (!localPin) {
          // no local credentials -> go to lock immediately
          router.replace('/lock');
          return;
        }
        
        // verify local pin with server (single request)
        const check = await pinClient.checkPin(localPin);
        if (!check.ok || !check.data?.ok) {
          // invalid -> remove local pin and redirect to lock
          try { window.localStorage.removeItem('pin'); } catch {}
          router.replace('/lock');
          return;
        }
        
        // successful verification -> set session flag (so future visits are instant)
        try {
          const SESSION_MS = 5 * 60 * 1000; // 5 minutes (tunable)
          window.localStorage.setItem(SESSION_FLAG_KEY, JSON.stringify({ expires: Date.now() + SESSION_MS }));
        } catch {}
        
        // authorized now, load data
        setAuthorized(true);
        setLoadingData(true);
        try {
          const [bRes, hRes] = await Promise.all([fetch("/api/balance"), fetch("/api/history")]);
          if (!mounted) return;
          if (!bRes.ok || !hRes.ok) throw new Error('Failed to load data');
          const bJson = await bRes.json();
          const hJson = await hRes.json();
          setBalance(Number(bJson.balance ?? 0));
          setHistory(Array.isArray(hJson) ? (hJson as Tx[]) : []);
        } catch (e) {
          console.error('Data load error', e);
          setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
          if (mounted) setLoadingData(false);
          if (mounted) setAuthChecked(true);
        }
      } catch (e) {
        console.error('Auth flow error', e);
        try { window.localStorage.removeItem('pin');
          window.localStorage.removeItem(SESSION_FLAG_KEY); } catch {}
        router.replace('/lock');
      }
    }
    
    // run immediately
    void init();
    
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, router]);
  
  // If auth hasn't been checked -> render nothing to allow immediate redirect (no flicker)
  if (!authChecked) return null;
  
  // If not authorized we already redirected -> nothing to render
  if (!authorized) return null;
  
  // Authorized: render dashboard
  const sorted = [...history].sort((a, b) => (b.time || 0) - (a.time || 0));
  const recent = sorted.slice(0, 3);
  const totals = history.reduce(
    (acc, tx) => {
      if (tx.type === "in") acc.in += Number(tx.amount || 0);
      else acc.out += Number(tx.amount || 0);
      return acc;
    }, { in: 0, out: 0 }
  );
  
  function formatCurrency(n: number | null) {
    if (n === null) return "—";
    return `฿ ${n.toLocaleString()}`;
  }
  
  function formatDateThai(ts ? : number) {
    if (!ts) return "";
    const d = new Date(ts);
    const datePart = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(d);
    const timePart = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  }
  
  return (
    <>
      <main className="dashboard-page" aria-busy={loadingData}>
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
                  {loadingData ? <div className="skeleton skeleton-balance" /> : <Balance value={balance ?? 0} />}
                </div>
                <div className="muted small">อัปเดตล่าสุด: {sorted.length ? formatDateThai(sorted[0].time) : "—"}</div>
              </div>

              <div className="summary-grid">
                <div className="summary-card in">
                  <div className="small muted">รวมรายรับ</div>
                  <div className="summary-value">{loadingData ? <div className="skeleton skeleton-line" /> : formatCurrency(totals.in)}</div>
                </div>
                <div className="summary-card out">
                  <div className="small muted">รวมรายจ่าย</div>
                  <div className="summary-value">{loadingData ? <div className="skeleton skeleton-line" /> : formatCurrency(totals.out)}</div>
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
              {loadingData ? (
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