'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Balance from "../components/Balance";
import { useLoader } from "../components/LoaderProvider";
import * as pinClient from "../lib/pinClient";
import BottomNav from "../components/BottomNav";
import '../styles/dashboard.css';

type Tx = { type: 'in' | 'out' | string; amount: number; time: number };

/**
 * Dashboard page
 *
 * Security-first behavior (fastest possible):
 * - On mount perform immediate synchronous check of local session PIN.
 *   - If no session PIN: quickly query server whether a PIN exists.
 *     - If server reports no PIN -> redirect to /setup-pin
 *     - If server reports PIN exists -> redirect to /lock
 *   - If session PIN exists: verify it with server immediately.
 *     - If invalid -> clear session and redirect to /lock
 *     - If valid -> mark authorized and start loading dashboard data in background
 *
 * Implementation notes:
 * - We deliberately avoid rendering the dashboard UI until authorization completes.
 *   This keeps the UX fast: user is redirected immediately if not authorized,
 *   or sees the dashboard only after successful auth.
 * - All PIN checks are done via pinClient (which sends POST in body).
 * - Data loading (balance/history) starts only after successful PIN verification,
 *   but we don't add artificial delays.
 */

export default function MainPage() {
  const router = useRouter();
  const loader = useLoader();

  const [authorized, setAuthorized] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<Tx[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fastAuthAndLoad() {
      try {
        // 1) Check local session PIN synchronously
        let localPin: string | null = null;
        try {
          localPin = window.localStorage.getItem('pin');
        } catch {
          localPin = null;
        }

        if (!localPin) {
          // No session PIN -> ask server whether a PIN is set at all.
          // If server fails, treat conservatively and send to /lock (or /setup-pin)
          const has = await pinClient.hasPin();
          if (!has.ok) {
            // If server error, route to lock so user can re-authenticate
            router.replace('/lock');
            return;
          }
          if (!has.data?.exists) {
            router.replace('/setup-pin');
            return;
          }
          // PIN exists but no local session -> go to lock
          router.replace('/lock');
          return;
        }

        // 2) We have a localPin -> verify it immediately with server
        const check = await pinClient.checkPin(localPin);
        if (!check.ok || !check.data?.ok) {
          // invalid session pin -> clear and force lock
          try { window.localStorage.removeItem('pin'); } catch {}
          router.replace('/lock');
          return;
        }

        // authorized: show dashboard and load data
        if (!mounted) return;
        setAuthorized(true);

        // Load data as soon as authorized (do not block UI longer than necessary)
        setLoadingData(true);
        loader.show('กำลังโหลดข้อมูล...');
        try {
          const [bRes, hRes] = await Promise.all([fetch("/api/balance"), fetch("/api/history")]);
          if (!mounted) return;

          if (!bRes.ok) throw new Error('Failed to load balance');
          if (!hRes.ok) throw new Error('Failed to load history');

          const bJson = await bRes.json();
          const hJson = await hRes.json();

          setBalance(Number(bJson.balance ?? 0));
          setHistory(Array.isArray(hJson) ? (hJson as Tx[]) : []);
        } finally {
          if (mounted) {
            loader.hide();
            setLoadingData(false);
          }
        }
      } catch (e) {
        console.error('Auth/load error:', e);
        // On unexpected error, clear session and go to lock to avoid stuck state
        try { window.localStorage.removeItem('pin'); } catch {}
        // Minimal feedback then redirect
        setError("เกิดข้อผิดพลาด ตรวจสอบสิทธิ์ล้มเหลว");
        router.replace('/lock');
      }
    }

    // Run immediately (no artificial delay)
    void fastAuthAndLoad();

    return () => {
      mounted = false;
      // ensure loader hidden when unmount
      loader.hide(true);
    };
    // We intentionally leave router and loader out of deps to run this only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If not authorized yet, render nothing (fast redirect will happen).
  // This avoids flashing the dashboard to an unauthenticated user.
  if (!authorized) return null;

  // Authorized: render dashboard. loadingData indicates background fetch state.
  const sorted = [...history].sort((a, b) => (b.time || 0) - (a.time || 0));
  const recent = sorted.slice(0, 3);
  const totals = history.reduce(
    (acc, tx) => {
      if (tx.type === "in") acc.in += Number(tx.amount || 0);
      else acc.out += Number(tx.amount || 0);
      return acc;
    },
    { in: 0, out: 0 }
  );

  function formatCurrency(n: number | null) {
    if (n === null) return "—";
    return `฿ ${n.toLocaleString()}`;
  }

  function formatDateThai(ts?: number) {
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

      {/* Bottom navigation only present on dashboard page */}
      <BottomNav />
    </>
  );
}