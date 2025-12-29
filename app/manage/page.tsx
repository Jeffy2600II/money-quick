'use client';

import React, { useEffect, useState } from 'react';
import ManagerForm from '../../components/ManagerForm';
import '../../styles/manager.css';
import BottomNav from '../../components/BottomNav';
import Balance from '../../components/Balance';

/**
 * Manage page adjusted to exactly match Dashboard spacing.
 * Added <div className="pin-top" /> spacer before the brand to align top spacing.
 */

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
        {/* Small top spacer used across PIN/dashboard pages to guarantee identical top offset */}
        <div className="pin-top" />

        {/* Brand - identical structure to Dashboard for visual parity */}
        <div className="dashboard-brand" role="banner" aria-hidden>
          <div className="logo" aria-hidden>
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="dashboard-prompt">จัดการรายการ</div>
        </div>

        {/* Balance - same look as Dashboard */}
        <div className="dashboard-balance" aria-hidden>
          <Balance value={balance ?? 0} />
          <div className="muted small">ยอดคงเหลือ</div>
        </div>

        {/* Page header and single form card only (no nested outer card) */}
        <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '0 12px', boxSizing: 'border-box' }}>
          <header className="manage-header" style={{ marginBottom: 12 }}>
            <h2 className="manage-title" style={{ margin: 0 }}>บันทึกรายการ</h2>
            <div className="manage-sub muted small" style={{ marginTop: 6 }}>กรอกข้อมูลแล้วกดยืนยันเพื่อบันทึก</div>
          </header>

          {/* Only ManagerForm card remains (component unchanged) */}
          <div className="manage-form-wrapper">
            <ManagerForm />
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}