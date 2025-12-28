'use client';
import React, { useMemo, useRef, useState } from "react";
import PrefetchOnHover from "../../components/PrefetchOnHover";
import { useLoader } from "../../components/LoaderProvider";
import { usePopup } from "../../components/PopupProvider";
import Numpad from "../../components/Numpad";
import PinInput, { PinInputHandle } from "../../components/PinInput";
import '../../styles/manage.css'; // <-- corrected path (was ../styles/manage.css)
import * as pinClient from "../../lib/pinClient";

export default function ManagePage() {
  const loader = useLoader();
  const popup = usePopup();
  const pinRef = useRef<PinInputHandle | null>(null);

  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState<string>(''); // controlled value for Numpad
  const [note, setNote] = useState('');
  const [padOpen, setPadOpen] = useState(false);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const displayAmount = useMemo(() => {
    if (!amount) return '';
    const n = Number(amount);
    if (Number.isNaN(n)) return amount;
    return n.toLocaleString('th-TH', { minimumFractionDigits: (amount.includes('.') ? Math.min(2, amount.split('.')[1].length) : 0), maximumFractionDigits: 2 });
  }, [amount]);

  function openPad() { setPadOpen(true); }
  function closePad() { setPadOpen(false); }

  function handlePadConfirm(val: string) {
    // normalize decimals
    let v = val ?? '';
    if (v === '') v = '';
    if (v.includes('.')) {
      const [i, f] = v.split('.');
      v = `${String(Number(i || 0))}.${(f || '').slice(0, 2)}`;
      if (v.endsWith('.')) v = v.slice(0, -1);
    } else {
      v = String(Number(v || 0));
      if (v === '0') v = '0';
    }
    setAmount(v === '0' ? '0' : v);
    setPadOpen(false);
  }

  // request pin and submit
  function requestPinAndSubmit() {
    if (!amount || Number(amount) <= 0) {
      popup.show('กรุณาระบุจำนวนเงินที่ถูกต้อง', { duration: 2200 });
      return;
    }
    setPinPromptOpen(true);
  }

  async function submitWithPin(pinValue: string) {
    setPinPromptOpen(false);
    setSubmitting(true);
    loader.show('กำลังบันทึก...');
    try {
      const body = { type: mode, amount: Number(parseFloat(amount).toFixed(2)), pin: pinValue, note };
      const res = await fetch('/api/tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        loader.hide();
        setSubmitting(false);
        popup.show(`บันทึกไม่สำเร็จ: ${text}`, { duration: 3000 });
        return;
      }
      setAmount('');
      setNote('');
      loader.show('บันทึกสำเร็จ');
      setTimeout(() => loader.hide(), 600);
      popup.show('บันทึกเรียบร้อย', { duration: 1800 });
      // TODO: invalidate SWR caches: balance/history/summary
    } catch (e) {
      console.error('submit error', e);
      popup.show('เกิดข้อผิดพลาดในการบันทึก', { duration: 2500 });
    } finally {
      setSubmitting(false);
      loader.hide(true);
    }
  }

  return (
    <main className="manage-page">
      <div className="manage-card">
        <div className="manage-header">
          <div className="logo">
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="manage-title">เพิ่มรายการ</div>
        </div>

        <div className="manage-body">
          <div className="field">
            <label className="label">ประเภท</label>
            <div className="toggle-row">
              <button className={`seg ${mode === 'in' ? 'active' : ''}`} onClick={() => setMode('in')} aria-pressed={mode === 'in'}>+ เงินเข้า</button>
              <button className={`seg ${mode === 'out' ? 'active' : ''}`} onClick={() => setMode('out')} aria-pressed={mode === 'out'}>− เงินออก</button>
            </div>
          </div>

          <div className="field">
            <label className="label">จำนวนเงิน</label>
            <div className="amount-input" onClick={openPad} role="button" tabIndex={0} aria-label="เปิดแป้นตัวเลข">
              {displayAmount || <span className="muted">แตะเพื่อระบุจำนวน</span>}
            </div>
          </div>

          <div className="field">
            <label className="label">หมายเหตุ (ไม่บังคับ)</label>
            <input className="text-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ค่าของว่าง / ค่าบริการ" />
          </div>

          <div className="field actions">
            <button className="confirm-button" onClick={requestPinAndSubmit} disabled={submitting}>บันทึกรายการ</button>
            <PrefetchOnHover href="/">
              <a className="cancel-button" style={{ marginLeft: 10 }}>กลับสู่หน้าแรก</a>
            </PrefetchOnHover>
          </div>
        </div>
      </div>

      {/* Numpad overlay using existing Numpad component (variant tiled) */}
      {padOpen && (
        <div className="np-overlay" role="dialog" aria-modal="true">
          <div className="np-panel">
            <div className="np-display" aria-live="polite">
              {amount === '' ? <span className="muted">0</span> : amount}
            </div>

            <Numpad
              variant="tiled"
              value={amount}
              onChange={(v) => setAmount(v)}
              showClear={true}
              showDot={true}
              showOk={false} /* OK handled by bottom button */
              maxDecimals={2}
            />

            <div className="np-bottom">
              <button className="np-dot" onClick={() => {
                // inject dot via Numpad onChange update
                if (!amount.includes('.')) setAmount(prev => prev ? prev + '.' : '0.');
              }} aria-label="จุดทศนิยม">.</button>
              <div style={{ flex: 1 }} />
              <button className="np-ok" onClick={() => handlePadConfirm(amount)} aria-label="ตกลง">ตกลง</button>
            </div>
          </div>
          <div className="np-backdrop" onClick={closePad} />
        </div>
      )}

      {pinPromptOpen && (
        <div className="pin-overlay" role="dialog" aria-modal="true">
          <div className="pin-overlay-card">
            <div className="pin-overlay-title">ยืนยัน PIN เพื่อบันทึก</div>
            <PinInput ref={pinRef} onSubmit={async (pin) => {
              try {
                const ok = await pinClient.checkPin(pin);
                if (ok.ok && ok.data?.ok) {
                  await submitWithPin(pin);
                } else {
                  pinRef.current?.triggerError(900);
                  popup.show('PIN ไม่ถูกต้อง', { duration: 1800 });
                }
              } catch (e) {
                pinRef.current?.triggerError(900);
                popup.show('เกิดข้อผิดพลาด', { duration: 1800 });
              }
            }} requiredLength={6} />
            <a className="forgot-link" onClick={() => { window.location.href = '/setup-pin?force=1'; }}>ลืมรหัสผ่าน</a>
          </div>
        </div>
      )}
    </main>
  );
}