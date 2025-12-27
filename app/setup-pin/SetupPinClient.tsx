'use client';

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import PinInput from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";

/**
 * Client component สำหรับหน้าตั้ง PIN (รวมโหมด force จากลิงก์ ?force=1)
 * - ใช้ useSearchParams ใน client-safe context
 * - รอผล API อย่างชัดเจนก่อนทำ localStorage / redirect
 */
export default function SetupPinClient() {
  const searchParams = useSearchParams();
  const forceMode = searchParams?.get('force') === '1' || searchParams?.get('force') === 'true';
  
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
      const res = await pinClient.setPin(pinValue, forceMode);
      if (res.ok && res.data?.ok) {
        // บันทึก localStorage เพื่อให้ล็อกอินอัตโนมัติ (ถ้า browser รองรับ)
        try { localStorage.setItem('pin', pinValue); } catch {}
        setStep('done');
        // redirect ทันทีเมื่อสำเร็จ
        window.location.href = '/';
      } else {
        setError(res.error || 'ไม่สามารถบันทึก PIN ได้');
      }
    } catch (e) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <main className="pin-page">
      <div className="pin-top" />
      <div className="pin-brand">
        <div className="logo"><span className="logo-mark">💰</span><span className="logo-text">Money quick</span></div>
        <div className="pin-prompt">ตั้ง PIN 6 หลัก</div>
      </div>

      {step === 'first' && (
        <>
          <PinInput onSubmit={handleFirst} requiredLength={6} />
          <div className="text-gray-500 mt-2">ตั้ง PIN ใหม่</div>
        </>
      )}
      {step === 'confirm' && (
        <>
          <PinInput onSubmit={handleConfirm} requiredLength={6} />
          <div className="text-gray-500 mt-2">ยืนยัน PIN อีกครั้ง</div>
        </>
      )}
      {step === 'done' && <div className="text-green-600 mt-4">PIN ถูกบันทึกแล้ว! กำลังไปหน้าหลัก...</div>}

      {loading && <div className="pin-loading">กำลังบันทึก...</div>}
      {error && <div className="mt-3 text-red-500">{error}</div>}
    </main>
  );
}