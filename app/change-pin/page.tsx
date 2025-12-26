'use client'
import { useState } from "react";
import PinInput from "../../components/PinInput";

export default function ChangePinPage(){
  const [step, setStep] = useState<'old'|'new'|'confirm'|'done'>('old');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState<string|null>(null);

  async function handleOld(p:string){ setOldPin(p); setStep('new'); }
  async function handleNew(p:string){ setNewPin(p); setStep('confirm'); }
  async function handleConfirm(p:string){
    if (p !== newPin) { setError('PIN ใหม่ไม่ตรงกัน'); setStep('new'); return; }
    const res = await fetch('/api/change-pin', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ oldPin, newPin })});
    if (res.ok) {
      localStorage.setItem('pin', newPin);
      setStep('done');
    } else {
      setError('PIN เก่าไม่ถูกต้องหรือเกิดข้อผิดพลาด'); setStep('old');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xs bg-surface p-6 rounded-lg shadow text-center">
        <h3 className="text-lg font-semibold mb-2">เปลี่ยน PIN</h3>
        {step === 'old' && <>
          <p className="text-sm text-neutral">กรอก PIN เดิม</p>
          <PinInput onSubmit={handleOld} />
        </>}
        {step === 'new' && <>
          <p className="text-sm text-neutral">ตั้ง PIN ใหม่</p>
          <PinInput onSubmit={handleNew} />
        </>}
        {step === 'confirm' && <>
          <p className="text-sm text-neutral">ยืนยัน PIN ใหม่</p>
          <PinInput onSubmit={handleConfirm} />
        </>}
        {step === 'done' && <div className="text-green-500">เปลี่ยน PIN สำเร็จ</div>}
        {error && <div className="text-red-500 mt-3">{error}</div>}
      </div>
    </main>
  );
}