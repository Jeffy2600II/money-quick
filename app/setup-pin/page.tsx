'use client';
import { useState } from "react";
import PinInput from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";

export default function SetupPinPage() {
  const [step, setStep] = useState < 'first' | 'confirm' | 'done' > ('first');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  async function handleFirst(pinValue: string) {
    setPin(pinValue);
    setStep('confirm');
  }
  
  async function handleConfirm(pinValue: string) {
    setError('');
    setLoading(true);
    if (pin !== pinValue) {
      setError('PIN ไม่ตรงกัน กรุณาตั้งใหม่');
      setPin('');
      setStep('first');
      setLoading(false);
      return false;
    }
    try {
      const res = await pinClient.setPin(pinValue);
      if (res.ok && res.data?.ok) {
        setStep('done');
        window.location.href = '/lock';
      } else {
        setError(res.error || 'ไม่สามารถบันทึก PIN ได้');
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <main className="pin-page">
      <div className="pin-top" />
      <div className="pin-brand">
        <div className="logo"><span>K</span><span className="plus">+</span></div>
        <div className="pin-prompt">ตั้ง PIN 4-6 หลัก</div>
      </div>

      {step === 'first' && (
        <>
          <PinInput onSubmit={handleFirst} min={4} max={6} />
          <div className="text-gray-500 mt-2">ตั้ง PIN ใหม่</div>
        </>
      )}
      {step === 'confirm' && (
        <>
          <PinInput onSubmit={handleConfirm} min={4} max={6} />
          <div className="text-gray-500 mt-2">ยืนยัน PIN อีกครั้ง</div>
        </>
      )}
      {step === 'done' && <div className="text-green-600 mt-4">PIN ถูกบันทึกแล้ว!</div>}

      {loading && <div className="pin-loading">กำลังบันทึก...</div>}
      {error && <div className="mt-3 text-red-500">{error}</div>}
    </main>
  );
}