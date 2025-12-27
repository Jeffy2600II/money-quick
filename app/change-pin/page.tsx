'use client';
import { useState } from "react";
import PinInput from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";
import { useLoader } from "../../components/LoaderProvider";

export default function ChangePinPage() {
  const loader = useLoader();
  const [step, setStep] = useState < 'old' | 'new' | 'confirm' | 'done' > ('old');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  
  async function handleOldPin(pinValue: string) {
    setError('');
    loader.show('กำลังตรวจสอบ PIN เดิม...');
    try {
      const res = await pinClient.checkPin(pinValue);
      if (res.ok && res.data?.ok) {
        setOldPin(pinValue);
        setStep('new');
        loader.hide();
      } else {
        loader.hide();
        setError('PIN เดิมไม่ถูกต้อง');
      }
    } catch {
      loader.hide();
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  }
  
  async function handleNewPin(pinValue: string) {
    setNewPin(pinValue);
    setStep('confirm');
  }
  
  async function handleConfirmPin(pinValue: string) {
    setError('');
    loader.show('กำลังเปลี่ยน PIN...');
    try {
      if (newPin !== pinValue) {
        loader.hide();
        setError('PIN ใหม่ไม่ตรงกัน');
        setStep('new');
        return;
      }
      const res = await pinClient.changePin(oldPin, newPin);
      if (res.ok && res.data?.ok) {
        try { localStorage.setItem('pin', newPin); } catch {}
        loader.show('กำลังไปหน้าหลัก...');
        setTimeout(() => {
          loader.hide();
          window.location.href = '/';
        }, 300);
      } else {
        loader.hide();
        setError(res.error || 'PIN เดิมผิด หรือเกิดข้อผิดพลาด');
        setStep('old');
      }
    } catch {
      loader.hide();
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setStep('old');
    }
  }
  
  return (
    <main className="pin-page">
      <div className="pin-top" />
      <div className="pin-brand">
        <div className="logo"><div className="logo-line1">Money</div><div className="logo-line2">quick</div></div>
        <div className="pin-prompt">เปลี่ยนรหัส PIN</div>
      </div>

      {step === 'old' && (
        <>
          <div className="text-center" style={{ color: '#6b7280', marginBottom: 8 }}>กรุณาใส่ PIN เก่า</div>
          <PinInput onSubmit={handleOldPin} requiredLength={6} />
        </>
      )}
      {step === 'new' && (
        <>
          <div className="text-center" style={{ color: '#6b7280', marginBottom: 8 }}>ตั้ง PIN ใหม่</div>
          <PinInput onSubmit={handleNewPin} requiredLength={6} />
        </>
      )}
      {step === 'confirm' && (
        <>
          <div className="text-center" style={{ color: '#6b7280', marginBottom: 8 }}>ยืนยัน PIN ใหม่อีกครั้ง</div>
          <PinInput onSubmit={handleConfirmPin} requiredLength={6} />
        </>
      )}
      {step === 'done' && <div className="text-green-600 mt-4">เปลี่ยน PIN สำเร็จ! กำลังไปหน้าหลัก...</div>}

      {error && <div className="mt-3 text-red-500">{error}</div>}
    </main>
  );
}