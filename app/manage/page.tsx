'use client';

import React from 'react';
import ManagerForm from '../../components/ManagerForm';
import '../../styles/manager.css';
import BottomNav from '../../components/BottomNav';
import PrefetchOnHover from '../../components/PrefetchOnHover';

export default function ManagePage() {
  return (
    <main className="dashboard-page">
      <div className="dashboard-vertical">
        {/* Brand (same as dashboard) */}
        <div className="dashboard-brand" role="banner" aria-hidden>
          <div className="logo" aria-hidden>
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="dashboard-prompt">จัดการรายรับ / รายจ่าย</div>
        </div>

        {/* Main card area */}
        <section className="mq-manager-card-wrapper">
          <div className="mq-manager-card-inner">
            <header className="mq-manager-header-inline" aria-hidden>
              <h1 className="mq-manager-title">เพิ่ม / แก้ไขรายการ</h1>
              <div className="mq-manager-actions-inline">
                <PrefetchOnHover href="/">
                  <a className="link-button" style={{ textDecoration: 'none' }}>กลับสู่หน้าแรก</a>
                </PrefetchOnHover>
              </div>
            </header>

            <div className="mq-manager-main-area">
              <ManagerForm />
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}