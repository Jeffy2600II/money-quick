'use client';

import React from 'react';
import ManagerForm from '../../components/ManagerForm';
import '../styles/manager.css';

export default function ManagePage() {
  return (
    <main className="mq-manager">
      <div className="mq-manager-container">
        <header className="mq-manager-header">
          <div className="logo" aria-hidden>
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <h1 className="mq-manager-title">จัดการรายรับ / รายจ่าย</h1>
        </header>

        <section className="mq-manager-main">
          <ManagerForm />
        </section>
      </div>
    </main>
  );
}