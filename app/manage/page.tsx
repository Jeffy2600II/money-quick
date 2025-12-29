'use client';

import React, { useEffect, useState } from 'react';
import ManagerForm from '../../components/ManagerForm';
import '../../styles/manager.css';
import BottomNav from '../../components/BottomNav';
import Balance from '../../components/Balance';

/**
 * New: single application-level container (app-container).
 * - No nested containers; everything lives inside app-container.
 * - ManagerForm is used unchanged; preview inside it is hidden via CSS so only one card remains.
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
    <main className="app-root">
      {/* Single top-level container only */}
      <div className="app-container">
        {/* Brand (kept visually consistent with Dashboard) */}
        <div className="logo" aria-hidden style={{ textAlign: 'center', marginBottom: 6 }}>
          <div className="logo-line1">Money</div>
          <div className="logo-line2">quick</div>
        </div>
        <div className="dashboard-prompt" style={{ textAlign: 'center', marginBottom: 12 }}>จัดการรายการ</div>

        {/* Balance (centered, prominent) */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Balance value={balance ?? 0} />
          <div className="muted small">ยอดคงเหลือ</div>
        </div>

        {/* Page header (title + small hint) */}
        <header className="manage-header">
          <h2 className="manage-title">บันทึกรายการ</h2>
          <div className="manage-sub muted small">กรอกข้อมูลแล้วกดยืนยันเพื่อบันทึก</div>
        </header>

        {/* Single visible card area: ManagerForm (component unchanged) */}
        <div className="manage-form-wrapper">
          <ManagerForm />
        </div>
      </div>

      <BottomNav />
    </main>
  );
}