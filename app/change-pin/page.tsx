'use client';
import { useState } from "react";
import PinInput from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";

export default function ChangePinPage() {
  const [step, setStep] = useState < 'old' | 'new' | 'confirm' | 'done' > ('old');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  async function handleOldPin(pinValue: string) {
    setError('');
    setLoading(true);
    try {
      const res = await pinClient.checkPin(pinValue);
      if (res.ok && res.data?.ok) {
        setOldPin(pinValue);
        setStep('new');
      } else {
        setError('PIN เดิมไม่ถูกต้อง');
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleNewPin(pinValue: string) {
    setNewPin(pinValue);
    setStep('confirm');
  }
  
  async function handleConfirmPin(pinValue: string) {
    setError('');
    setLoading(true);
    if (newPin !== pinValue) {
      setError('PIN ใหม่ไม่ตรงกัน');
      setStep('new');
      setLoading(false);
      return;
    }
    try {
      const res = await pinClient.changePin(oldPin, newPin);
      if (res.ok && res.data?.ok) {
        try { localStorage.setItem('pin', newPin); } catch {}
        // เมื่อเปลี่ยนสำเร็จ ให้เข้าใช้งานทันที
        window.location.href = '/';
      } else {
        setError(res.error || 'PIN เดิมผิด หรือเกิดข้อผิดพลาด');
        setStep('old');
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setStep('old');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <main className="pin-page">
      <div className="pin-top" />
      <div className="pin-brand">
        <div className="logo"><span className="logo-mark">💰</span><span className="logo-text">Money quick</span></div>
        <div className="pin-prompt">เปลี่ยนรหัส PIN</div>
      </div>

      {step === 'old' && (
        <>
          <div className="text-gray-500 mb-2">กรุณาใส่ PIN เก่า</div>
          <PinInput onSubmit={handleOldPin} requiredLength={6} />
        </>
      )}
      {step === 'new' && (
        <>
          <div className="text-gray-500 mb-2">ตั้ง PIN ใหม่</div>
          <PinInput onSubmit={handleNewPin} requiredLength={6} />
        </>
      )}
      {step === 'confirm' && (
        <>
          <div className="text-gray-500 mb-2">ยืนยัน PIN ใหม่อีกครั้ง</div>
          <PinInput onSubmit={handleConfirmPin} requiredLength={6} />
        </>
      )}
      {step === 'done' && <div className="text-green-600 mt-4">เปลี่ยน PIN สำเร็จ! กำลังไปหน้าหลัก...</div>}

      {loading && <div className="pin-loading">กำลังประมวลผล...</div>}
      {error && <div className="mt-3 text-red-500">{error}</div>}
    </main>
  );
}