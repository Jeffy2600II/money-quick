'use client'
import { useEffect, useState } from "react";
import Balance from "../components/Balance";
import PrefetchOnHover from "../components/PrefetchOnHover";

type Tx = { type: string;amount: number;time: number };

export default function MainPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState < number | null > (null);
  const [recent, setRecent] = useState < Tx | null > (null);
  const [error, setError] = useState < string | null > (null);
  
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // Load balance
        const bRes = await fetch("/api/balance");
        const bJson = await bRes.json();
        if (!mounted) return;
        setBalance(Number(bJson.balance ?? 0));
        
        // Load history (limited client-side; endpoint returns many — we take first)
        const hRes = await fetch("/api/history");
        const hJson = await hRes.json();
        if (!mounted) return;
        // history items are expected sorted by time desc in server (listTx sorts by key)
        const first: Tx | undefined = Array.isArray(hJson) && hJson.length ? hJson[0] : undefined;
        setRecent(first ?? null);
      } catch (e) {
        if (!mounted) return;
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);
  
  function formatCurrency(n: number | null) {
    if (n === null) return "—";
    return `฿ ${n.toLocaleString()}`;
  }
  
  function formatTime(ts ? : number) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  
  return (
    <main className="min-h-screen flex flex-col items-center bg-base px-3">
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Header / Brand — reuse logo styles for consistent design */}
        <div className="pin-top" />
        <div className="pin-brand" style={{ marginBottom: 6 }}>
          <div className="logo" aria-hidden>
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="pin-prompt" style={{ marginTop: 8, marginBottom: 6 }}>
            ภาพรวมบัญชี
          </div>
        </div>

        {/* Card: Balance + actions */}
        <section className="bg-white rounded-lg p-4" style={{ border: "1px solid rgba(15,23,42,0.06)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ color: "#6b7280", fontWeight: 600 }}>ยอดคงเหลือ</div>
              <div style={{ marginTop: 8 }}>
                {loading ? <div style={{ height: 44, width: 220, background: "rgba(0,0,0,0.04)", borderRadius: 6 }} /> : <Balance value={balance ?? 0} />}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#6b7280", fontWeight: 600 }}>สถานะ</div>
              <div style={{ marginTop: 8, fontWeight: 700, color: balance !== null && balance >= 0 ? "#04996f" : "#ef4444" }}>
                {loading ? "กำลังโหลด..." : balance !== null ? (balance >= 0 ? "ปกติ" : "ติดลบ") : "—"}
              </div>
            </div>
          </div>

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
            <h2 style={{ fontWeight: 700, fontSize: "1.05rem" }}>ประวัติล่าสุด</h2>
            <a href="/history" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>ดูทั้งหมด</a>
          </div>

          <div style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)", borderRadius: 10, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 14 }}>
                <div style={{ height: 42, background: "rgba(0,0,0,0.04)", borderRadius: 8, width: "100%" }} />
              </div>
            ) : recent ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: recent.type === "in" ? "rgba(4,153,111,0.08)" : "rgba(239,68,68,0.08)",
                    color: recent.type === "in" ? "var(--accent-strong)" : "var(--error)",
                    fontWeight: 700
                  }}>
                    {recent.type === "in" ? "+" : "−"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{recent.type === "in" ? "เงินเข้า" : "เงินออก"}</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>{formatTime(recent.time)}</div>
                  </div>
                </div>

                <div style={{ fontWeight: 800, fontSize: "1rem", color: recent.type === "in" ? "#059669" : "#dc2626" }}>
                  {recent.type === "in" ? "+" : "-"} ฿ {recent.amount.toLocaleString()}
                </div>
              </div>
            ) : (
              <div style={{ padding: 14, color: "#6b7280" }}>ยังไม่มีรายการ</div>
            )}
          </div>
        </section>

        {/* Quick info / notes */}
        <section style={{ marginTop: 18 }}>
          <div style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)", borderRadius: 10, padding: 12, color: "#6b7280" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>ข้อมูลเพิ่มเติม</div>
            <ul style={{ paddingLeft: 18 }}>
              <li>หน้านี้เป็นแดชบอร์ดแสดงข้อมูลเท่านั้น หากต้องการแก้ไขยอดหรือรายการโปรดไปที่หน้าที่เกี่ยวข้อง</li>
              <li>การตั้งค่า PIN และการรีเซ็ตต้องทำจากหน้าตั้งค่าหรือเปลี่ยน PIN</li>
              <li>หากต้องการดูประวัติทั้งหมดกด "ดูทั้งหมด"</li>
            </ul>
          </div>
        </section>

        {error && <div style={{ color: "var(--error)", marginTop: 12 }}>{error}</div>}

      </div>
    </main>
  );
}