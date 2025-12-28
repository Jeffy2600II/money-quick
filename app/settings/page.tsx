'use client';
import PrefetchOnHover from "../../components/PrefetchOnHover";

/**
 * Settings page (updated)
 * - Provides "เปลี่ยนรหัสผ่าน" action (for users who know their existing PIN).
 * - Removed "รีเซ็ตรหัสผ่าน (ลืมรหัสผ่าน)" option from this page per request.
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
          <div style={{ fontWeight: 700, marginBottom: 8 }}>ตัวเลือกการตั้งค่า</div>
          <p style={{ color: "#6b7280", marginBottom: 12 }}>
            หน้านี้มีตัวเลือกสำหรับการจัดการค่าที่เกี่ยวข้องกับบัญชีของคุณ
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <PrefetchOnHover href="/change-pin">
              <a className="confirm-button" style={{ background: "#0ea5a0", color: "#fff", textDecoration: "none" }}>เปลี่ยนรหัสผ่าน (เปลี่ยน PIN)</a>
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