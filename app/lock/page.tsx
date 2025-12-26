'use client'
import { useState, useRef } from "react";
import PinInput from "../../components/PinInput";

export default function LockPage() {
  const [error, setError] = useState < string | null > (null);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef < HTMLDivElement | null > (null);
  
  async function handleSubmit(pin: string) {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/pin-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
    const j = await res.json();
    if (j.ok) {
      localStorage.setItem('pin', pin);
      window.location.href = '/';
    } else {
      setError('PIN ไม่ถูกต้อง');
      // shake
      if (boxRef.current) {
        boxRef.current.classList.remove('shake');
        void boxRef.current.offsetWidth;
        boxRef.current.classList.add('shake');
      }
      setLoading(false);
    }
  }
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div ref={boxRef} className="w-full max-w-xs bg-surface p-6 rounded-lg shadow-md text-center">
        <h3 className="font-semibold text-lg mb-2">ล็อกอินด้วย PIN</h3>
        <p className="text-sm text-neutral mb-3">กรุณาใส่ PIN เพื่อเข้าใช้งาน</p>
        <PinInput onSubmit={handleSubmit} />
        {loading && <div className="mt-3 text-neutral">กำลังตรวจสอบ...</div>}
        {error && <div className="mt-3 text-red-500">{error}</div>}
      </div>
    </main>
  );
}