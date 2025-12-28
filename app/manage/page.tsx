'use client';
import PrefetchOnHover from "../../components/PrefetchOnHover";

/**
 * Placeholder page for "จัดการรายรับ/รายจ่าย"
 * - เริ่มด้วยหน้าว่างที่อธิบายฟังก์ชันการใช้งาน
 * - เราจะเพิ่มฟอร์มและการบันทึกจริงในลำดับถัดไป (ตามที่เราจะออกแบบหน้าหลักให้เสร็จ)
 */

export default function ManagePage() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-base px-4">
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div className="pin-top" />
        <div className="pin-brand" style={{ marginBottom: 8 }}>
          <div className="logo" aria-hidden>
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="pin-prompt" style={{ marginTop: 8 }}>จัดการรายรับ / รายจ่าย</div>
        </div>

        <section style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.06)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>หน้าเตรียมพร้อมสำหรับการบันทึก</div>
          <p style={{ color: "#6b7280", marginBottom: 12 }}>
            หน้านี้จะเป็นที่ใช้เพิ่มหรือแก้ไขรายการรายรับและรายจ่าย (รายรับ = เงินเข้า, รายจ่าย = เงินออก)
            — ตอนนี้ยังเป็น placeholder: ในขั้นถัดไปเราจะเพิ่มฟอร์มบันทึกแบบปลอดภัย (ต้องกรอกรหัส PIN) และการแสดงผลแบบเป็นรายการ
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <PrefetchOnHover href="/">
              <a className="confirm-button" style={{ background: "#e5e7eb", color: "#111827", textDecoration: "none" }}>กลับสู่หน้าแรก</a>
            </PrefetchOnHover>

            <PrefetchOnHover href="/history">
              <a className="confirm-button" style={{ background: "var(--accent)", color: "#fff", textDecoration: "none" }}>ไปดูประวัติ</a>
            </PrefetchOnHover>
          </div>
        </section>
      </div>
    </main>
  );
}