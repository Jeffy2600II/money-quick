'use client';

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import PinInput from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";
import { useLoader } from "../../components/LoaderProvider";

export default function SetupPinClient() {
  const searchParams = useSearchParams();
  const forceMode = searchParams?.get('force') === '1' || searchParams?.get('force') === 'true';
  const loader = useLoader();
  
  // Show a short central loader on mount so navigation uses central loader
  useEffect(() => {
    loader.show('กำลังโหลดหน้า...');
    const t = setTimeout(() => loader.hide(), 220);
    return () => {
      clearTimeout(t);
      loader.hide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const [step, setStep] = useState < 'first' | 'confirm' | 'done' > ('first');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false); // disable input while saving
  
  async function handleFirst(pinValue: string) {
    setPin(pinValue);
    setStep('confirm');
  }
  
  async function handleConfirm(pinValue: string) {
    setError('');
    loader.show('กำลังบันทึก...');
    setSaving(true);
    try {
      if (pin !== pinValue) {
        loader.hide();
        setSaving(false);
        setError('PIN ไม่ตรงกัน กรุณาตั้งใหม่');
        setPin('');
        setStep('first');
        return false;
      }
      
      const res = await pinClient.setPin(pinValue, forceMode);
      if (res.ok && res.data?.ok) {
        try { localStorage.setItem('pin', pinValue); } catch {}
        // ensure we re-enable input (in case navigation is interrupted)
        setSaving(false);
        loader.show('กำลังเข้าสู่ระบบ...');
        setTimeout(() => {
          loader.hide();
          window.location.href = '/';
        }, 300);
      } else {
        loader.hide();
        setSaving(false);
        setError(res.error || 'ไม่สามารถบันทึก PIN ได้');
      }
    } catch {
      loader.hide();
      setSaving(false);
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  }
  
  return (
    <main className="pin-page">
      <div className="pin-top" />
      <div className="pin-brand">
        <div className="logo"><div className="logo-line1">Money</div><div className="logo-line2">quick</div></div>
        <div className="pin-prompt">ตั้ง PIN 6 หลัก</div>
      </div>

      {step === 'first' && (
        <>
          <PinInput onSubmit={handleFirst} requiredLength={6} disabled={saving} />
          <div className="text-center mt-2" style={{ color: '#6b7280' }}>ตั้ง PIN ใหม่</div>
        </>
      )}
      {step === 'confirm' && (
        <>
          <PinInput onSubmit={handleConfirm} requiredLength={6} disabled={saving} />
          <div className="text-center mt-2" style={{ color: '#6b7280' }}>ยืนยัน PIN อีกครั้ง</div>
        </>
      )}
      {step === 'done' && <div className="text-green-600 mt-4">PIN ถูกบันทึกแล้ว! กำลังไปหน้าหลัก...</div>}

      {error && <div className="mt-3 text-red-500">{error}</div>}
    </main>
  );
}