'use client'
import { useState } from "react";
import PinInput from "../../components/PinInput";

export default function SetupPinPage() {
  const [step, setStep] = useState<'first'|'confirm'|'done'>('first');
  const [pin, setPin] = useState('');

  async function handleFirst(p:string){ setPin(p); setStep('confirm'); }
  async function handleConfirm(p:string){
    if (p !== pin) { alert('PIN ไม่ตรงกัน'); setStep('first'); return; }
    // set on server
    const res = await fetch('/api/set-pin', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ pin })});
    if (res.ok) {
      setStep('done');
      window.location.href = '/lock';
    } else {
      alert('ไม่สามารถบันทึกรหัสได้');
      setStep('first');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xs bg-surface p-6 rounded-lg shadow text-center">
        <h3 className="text-lg font-semibold mb-2">ตั้ง PIN สำหรับใช้งาน</h3>
        <p className="text-sm text-neutral mb-4">PIN 4-6 หลัก (จะใช้กับทุกอุปกรณ์)</p>
        {step === 'first' && <PinInput onSubmit={handleFirst} />}
        {step === 'confirm' && <PinInput onSubmit={handleConfirm} />}
        {step === 'done' && <div className="text-green-500">บันทึกสำเร็จ</div>}
      </div>
    </main>
  );
}