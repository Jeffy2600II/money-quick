'use client';

import React from 'react';
import ManagerForm from '../../components/ManagerForm';
import '../../styles/manager.css';
import BottomNav from '../../components/BottomNav';
import PrefetchOnHover from '../../components/PrefetchOnHover';

/**
 * Manage page: reworked to match Dashboard structure and spacing exactly.
 * - Uses same "dashboard-vertical" container so layout aligns with Dashboard.
 * - Brand/header uses same DOM/classes as dashboard so visual identity is identical.
 * - Main content placed in a centered card with balanced padding and gap.
 */

export default function ManagePage() {
  return (
    <main className="dashboard-page">
      <div className="dashboard-vertical">
        {/* Brand (identical to dashboard) */}
        <div className="dashboard-brand" role="banner" aria-hidden>
          <div className="logo" aria-hidden>
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="dashboard-prompt">จัดการรายรับ / รายจ่าย</div>
        </div>

        {/* Card container: visual parity with dashboard.recent-list / cards */}
        <section className="dashboard-card-outer">
          <div className="dashboard-card-inner">
            <header className="dashboard-card-header">
              <div>
                <h1 className="dashboard-card-title">เพิ่ม / แก้ไขรายการ</h1>
                <div className="muted small">เพิ่มรายการใหม่เพื่อบันทึกลงบัญชี</div>
              </div>

              <div className="dashboard-card-actions">
                <PrefetchOnHover href="/">
                  <a className="link-button" style={{ textDecoration: 'none' }}>กลับสู่หน้าแรก</a>
                </PrefetchOnHover>
              </div>
            </header>

            <div className="dashboard-card-body">
              {/* Left: the ManagerForm (flex: 1) */}
              <div className="manage-left">
                <ManagerForm />
              </div>

              {/* Right: contextual preview/info (same visual system as dashboard preview) */}
              <aside className="manage-right" aria-hidden>
                <div className="manage-preview-card">
                  <h3 style={{ margin: 0 }}>ตัวอย่างรายการล่าสุด</h3>
                  <p className="muted small">รายการจะแสดงที่หน้าประวัติหลังบันทึก</p>
                </div>

                <div style={{ height: 12 }} />

                <div className="manage-help-card">
                  <div className="muted small" style={{ fontWeight: 700, marginBottom: 8 }}>คำแนะนำ</div>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    <li className="muted small">ระบบบันทึกข้อมูลบนเซิร์ฟเวอร์</li>
                    <li className="muted small">หากต้องการสำรองข้อมูล โปรดดาวน์โหลดไฟล์บันทึก</li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}