'use client';
import PrefetchOnHover from "../../components/PrefetchOnHover";

/**
 * Settings page (current minimal):
 * - Per your note: do NOT place "change PIN" here as the regular change flow is for users who know their PIN.
 * - This page exposes a single action for now: "รีเซ็ตรหัสผ่าน (ลืมรหัสผ่าน)" which routes to the setup/reset flow.
 */

export default function SettingsPage() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-base px-4">
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div className="pin-top" />
        <div className="pin-brand" style={{ marginBottom: 8 }}>
          <div className="logo" aria-hidden>
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="pin-prompt" style={{ marginTop: 8 }}>ตั้งค่า</div>
        </div>

        <section style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>ตัวเลือกปัจจุบัน</div>
          <p style={{ color: "#6b7280", marginBottom: 12 }}>
            ปัจจุบันหน้านี้มีตัวเลือกเดียว คือการรีเซ็ตรหัสผ่าน (ลืมรหัสผ่าน) — หากคุณลืม PIN ให้ใช้ตัวเลือกนี้เพื่อตั้ง PIN ใหม่
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <PrefetchOnHover href="/setup-pin?force=1">
              <a className="confirm-button" style={{ background: "#f97316", color: "#fff", textDecoration: "none" }}>รีเซ็ตรหัสผ่าน (ลืมรหัสผ่าน)</a>
            </PrefetchOnHover>

            <PrefetchOnHover href="/">
              <a className="confirm-button" style={{ background: "#e5e7eb", color: "#111827", textDecoration: "none" }}>กลับสู่หน้าแรก</a>
            </PrefetchOnHover>
          </div>
        </section>
      </div>
    </main>
  );
}