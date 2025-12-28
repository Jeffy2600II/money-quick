'use client';

import React, { useMemo, useState } from 'react';
import ToggleInOut from './ToggleInOut';
import ConfirmButton from './ConfirmButton';
import PrefetchOnHover from './PrefetchOnHover';
import { useLoader } from './LoaderProvider';
import { usePopup } from './PopupProvider';
import { createTx } from '../lib/managerClient';
import { mutate } from 'swr';

type TxForm = {
  type: 'in' | 'out';
  amount: string; // editing as string
};

const DEFAULT: TxForm = {
  type: 'in',
  amount: '',
};

export default function ManagerForm() {
  const loader = useLoader();
  const popup = usePopup();
  
  const [form, setForm] = useState < TxForm > (DEFAULT);
  const [submitting, setSubmitting] = useState(false);
  
  const monthYm = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  
  function update < K extends keyof TxForm > (k: K, v: TxForm[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }
  
  function parseAmount(s: string) {
    const normalized = s.replace(',', '.').trim();
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  }
  
  async function handleSubmit() {
    const amt = parseAmount(form.amount);
    if (!form.amount || Number.isNaN(amt) || amt <= 0) {
      popup.show('กรุณาใส่จำนวนเงินที่ถูกต้อง', { duration: 2500 });
      return;
    }
    
    // pin from localStorage (fast path)
    let pin: string | null = null;
    try { pin = typeof window !== 'undefined' ? window.localStorage.getItem('pin') : null; } catch { pin = null; }
    if (!pin) {
      popup.show('คุณยังไม่ได้ตั้ง PIN — ไปที่หน้าเข้าสู่ระบบหรือตั้ง PIN', { duration: 2800 });
      setTimeout(() => { window.location.href = '/lock'; }, 600);
      return;
    }
    
    const body = {
      type: form.type,
      amount: amt,
      pin,
    };
    
    setSubmitting(true);
    loader.show('กำลังบันทึกรายการ...');
    try {
      const res = await createTx(body);
      if (res.ok && typeof res.newBalance !== 'undefined') {
        loader.hide();
        popup.show('บันทึกรายการเรียบร้อย', { duration: 1800 });
        
        // revalidate relevant keys
        try {
          mutate('/api/history');
          mutate('/api/balance');
          mutate(`/api/summary?ym=${monthYm}`);
        } catch {}
        
        // reset form (keep type so user can enter multiple of same kind)
        setForm({ ...DEFAULT, type: form.type });
      } else {
        loader.hide();
        popup.show(res.error || 'ไม่สามารถบันทึกรายการได้', { duration: 2400 });
      }
    } catch (e: any) {
      loader.hide();
      popup.show('เกิดข้อผิดพลาดในการเชื่อมต่อ', { duration: 2400 });
      console.error('createTx error', e);
    } finally {
      setSubmitting(false);
      loader.hide(true);
    }
  }
  
  return (
    <div className="mq-manager-form">
      <div className="mq-manager-card">
        <div className="mq-manager-row">
          <label className="label">ประเภท</label>
          <ToggleInOut mode={form.type} setMode={(m) => update('type', m)} />
        </div>

        <div className="mq-manager-row">
          <label className="label">จำนวนเงิน</label>
          <div className="mq-manager-amount">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9.,]*"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              className="mq-manager-amount-input"
              aria-label="จำนวนเงิน"
              disabled={submitting}
            />
            <div className="mq-manager-currency">฿</div>
          </div>
        </div>

        <div className="mq-manager-actions">
          <ConfirmButton onConfirm={handleSubmit} disabled={submitting || !form.amount} />
          <PrefetchOnHover href="/history">
            <a className="mq-manager-secondary" style={{ display: 'inline-block', marginTop: 10, textDecoration: 'none' }}>
              ดูประวัติทั้งหมด
            </a>
          </PrefetchOnHover>
        </div>
      </div>

      <div className="mq-manager-preview">
        <h3>ตัวอย่างรายการล่าสุด</h3>
        <p className="muted small">รายการจะปรากฏที่หน้าประวัติหลังบันทึก</p>
      </div>
    </div>
  );
}