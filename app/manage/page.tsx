'use client';

import React, { useEffect, useState } from 'react';
import ManagerForm from '../../components/ManagerForm';
import '../../styles/manager.css';
import BottomNav from '../../components/BottomNav';
import Balance from '../../components/Balance';

type Tx = { type: string;amount: number;time: number };

export default function ManagePage() {
  const [balance, setBalance] = useState < number | null > (null);
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/balance');
        if (!res.ok) {
          if (mounted) setBalance(0);
          return;
        }
        const j = await res.json();
        if (mounted) setBalance(typeof j.balance === 'number' ? j.balance : Number(j.balance) || 0);
      } catch {
        if (mounted) setBalance(0);
      }
    })();
    return () => { mounted = false; };
  }, []);
  
  return (
    <main className="dashboard-page">
      <div className="dashboard-vertical">
        {/* Brand (identical to dashboard) */}
        <div className="dashboard-brand" role="banner" aria-hidden>
          <div className="logo" aria-hidden>
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="dashboard-prompt">จัดการรายการ</div>
        </div>

        {/* Balance only (per your request) */}
        <div className="dashboard-balance" aria-hidden>
          <Balance value={balance ?? 0} />
          <div className="muted small">ยอดคงเหลือ</div>
        </div>

        {/* Main card area: manager form only (no history, no summary) */}
        <section className="dashboard-card-outer">
          <div className="dashboard-card-inner">
            <header className="dashboard-card-header">
              <div>
                <h2 className="dashboard-card-title">บันทึกรายการ</h2>
                <div className="muted small">กรอกข้อมูลแล้วกดยืนยันเพื่อบันทึก</div>
              </div>
              {/* intentionally left empty: no "ดูประวัติทั้งหมด" button */}
              <div />
            </header>

            <div className="dashboard-card-body single-column">
              <div className="manage-left" style={{ width: '100%' }}>
                <ManagerForm />
              </div>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}