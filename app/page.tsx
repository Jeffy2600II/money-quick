'use client'
import { useEffect, useState } from "react";
import Balance from "../components/Balance";
import PrefetchOnHover from "../components/PrefetchOnHover";

type Tx = { type: 'in' | 'out' | string; amount: number; time: number };

export default function MainPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<Tx[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [bRes, hRes] = await Promise.all([
          fetch("/api/balance"),
          fetch("/api/history"),
        ]);

        if (!mounted) return;

        if (!bRes.ok) throw new Error('Failed to load balance');
        if (!hRes.ok) throw new Error('Failed to load history');

        const bJson = await bRes.json();
        const hJson = await hRes.json();

        setBalance(Number(bJson.balance ?? 0));
        setHistory(Array.isArray(hJson) ? (hJson as Tx[]) : []);
      } catch (e) {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // compute summary (from fetched history)
  const recent = history.slice(0, 3);
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

  function formatTime(ts?: number) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-base px-4">
      <div style={{ width: "100%", maxWidth: 640 }}>
        {/* Brand / header (position:relative so settings icon can sit at top-right) */}
        <div className="pin-top" />
        <div className="pin-brand" style={{ marginBottom: 6, position: "relative" }}>
          <div className="logo" aria-hidden>
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="pin-prompt" style={{ marginTop: 8, marginBottom: 6 }}>
            ภาพรวมบัญชี
          </div>

          {/* Settings icon (top-right of header area) */}
          <a href="/settings" aria-label="ตั้งค่า" className="header-settings">
            {/* Gear icon (SVG embedded) */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" fill="currentColor" />
              <path d="M19.4 13.5a7.95 7.95 0 0 0 .06-1 7.95 7.95 0 0 0-.06-1l2.11-1.65a.5.5 0 0 0 .12-.65l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a8.12 8.12 0 0 0-1.73-1L14.5 2.5a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5.5L9.21 5.02c-.62.2-1.21.47-1.73.8l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.65L4.6 11.5c-.05.33-.08.66-.08 1s.03.67.08 1L2.49 15.15a.5.5 0 0 0-.12.65l2 3.46c.14.24.44.34.7.22l2.49-1c.52.33 1.11.6 1.73.8L9 21.5a.5.5 0 0 0 .5.5h4c.26 0 .48-.16.5-.41l.29-2.3c.62-.2 1.21-.47 1.73-.8l2.49 1c.26.12.56.02.7-.22l2-3.46a.5.5 0 0 0-.12-.65L19.4 13.5z" fill="currentColor" opacity="0.9" />
            </svg>
          </a>
        </div>

        {/* Balance card */}
        <section
          aria-labelledby="balance-heading"
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            boxSizing: "border-box",
            border: "1px solid rgba(15,23,42,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div id="balance-heading" style={{ color: "#6b7280", fontWeight: 600 }}>ยอดคงเหลือ</div>
              <div style={{ marginTop: 8 }}>
                {loading ? (
                  <div style={{ height: 60, width: 260, background: "rgba(0,0,0,0.04)", borderRadius: 8 }} />
                ) : (
                  <Balance value={balance ?? 0} />
                )}
              </div>
              <div style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
                อัปเดตล่าสุด: {history.length ? formatTime(history[0].time) : "—"}
              </div>
            </div>

            {/* Summary compact */}
            <div style={{ minWidth: 160, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: "rgba(4,153,111,0.06)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>รวมรายรับ</div>
                <div style={{ fontWeight: 700, color: "#059669", marginTop: 6 }}>{formatCurrency(totals.in)}</div>
              </div>
              <div style={{ background: "rgba(239,68,68,0.06)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>รวมรายจ่าย</div>
                <div style={{ fontWeight: 700, color: "#dc2626", marginTop: 6 }}>{formatCurrency(totals.out)}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <PrefetchOnHover href="/history">
              <a className="confirm-button" style={{ background: "var(--accent)", color: "#fff", textDecoration: "none" }}>ดูประวัติทั้งหมด</a>
            </PrefetchOnHover>

            <PrefetchOnHover href="/change-pin">
              <a className="confirm-button" style={{ background: "#0ea5a0", color: "#fff", textDecoration: "none", maxWidth: 180 }}>เปลี่ยน PIN</a>
            </PrefetchOnHover>

            <PrefetchOnHover href="/setup-pin">
              <a className="confirm-button" style={{ background: "#60a5fa", color: "#fff", textDecoration: "none", maxWidth: 180 }}>ตั้งค่า PIN</a>
            </PrefetchOnHover>
          </div>
        </section>

        {/* Recent activity preview */}
        <section style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <h2 style={{ fontWeight: 700, fontSize: "1.05rem" }}>กิจกรรมล่าสุด</h2>
            <a href="/history" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>ดูทั้งหมด</a>
          </div>

          <div style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)", borderRadius: 12, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 12 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: i < 2 ? "1px solid rgba(15,23,42,0.03)" : "none" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(0,0,0,0.04)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 12, background: "rgba(0,0,0,0.04)", width: "60%", borderRadius: 6 }} />
                      <div style={{ height: 10, background: "rgba(0,0,0,0.03)", width: "30%", borderRadius: 6, marginTop: 8 }} />
                    </div>
                    <div style={{ width: 90, height: 14, background: "rgba(0,0,0,0.04)", borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            ) : recent.length ? (
              <div>
                {recent.map((tx, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottom: idx < recent.length - 1 ? "1px solid rgba(15,23,42,0.03)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: tx.type === "in" ? "rgba(4,153,111,0.08)" : "rgba(239,68,68,0.08)",
                        color: tx.type === "in" ? "var(--accent-strong)" : "var(--error)",
                        fontWeight: 700
                      }}>
                        {tx.type === "in" ? "+" : "−"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{tx.type === "in" ? "เงินเข้า" : "เงินออก"}</div>
                        <div style={{ color: "#6b7280", fontSize: 13 }}>{formatTime(tx.time)}</div>
                      </div>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: "1rem", color: tx.type === "in" ? "#059669" : "#dc2626" }}>
                      {tx.type === "in" ? "+" : "-"} ฿ {tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 14, color: "#6b7280" }}>ยังไม่มีรายการ</div>
            )}
          </div>
        </section>

        {/* Info / notes */}
        <section style={{ marginTop: 18 }}>
          <div style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)", borderRadius: 10, padding: 12, color: "#6b7280" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>คำแนะนำ</div>
            <ul style={{ paddingLeft: 18 }}>
              <li>หน้านี้เป็นแดชบอร์ดสำหรับดูข้อมูลหลัก — หากต้องการแก้ไขหรือบันทึกรายการ ให้ไปที่หน้าจัดการ (ปุ่มล่างกลาง)</li>
              <li>ปุ่มตั้งค่า/เปลี่ยน PIN นำไปยังหน้าที่เกี่ยวข้องสำหรับการจัดการรหัส</li>
              <li>ออกแบบสอดคล้องกับ UI ของหน้าล็อก (สี ตัวหนา ขนาด จุด PIN) เพื่อความต่อเนื่องของแบรนด์</li>
            </ul>
          </div>
        </section>

        {error && <div style={{ color: "var(--error)", marginTop: 12 }}>{error}</div>}
      </div>
    </main>
  );
}