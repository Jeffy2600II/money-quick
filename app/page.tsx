'use client'
import { useEffect, useState } from "react";
import Balance from "../components/Balance";
import ToggleInOut from "../components/ToggleInOut";
import Numpad from "../components/Numpad";
import ConfirmButton from "../components/ConfirmButton";
import Toast from "../components/Toast";

export default function MainPage() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'in'|'out'>('in');
  const [amount, setAmount] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // ensure PIN / session
    const localPin = window.localStorage.getItem("pin");
    fetch("/api/has-pin").then(r => r.json()).then(async data => {
      if (!data.exists) {
        window.location.href = "/setup-pin";
        return;
      }
      if (!localPin) {
        window.location.href = "/lock";
        return;
      }
      // verify pin quickly
      const res = await fetch("/api/pin-check", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: localPin })
      });
      const j = await res.json();
      if (!j.ok) {
        window.localStorage.removeItem("pin");
        window.location.href = "/lock";
        return;
      }
      // load balance
      fetch("/api/balance").then(r => r.json()).then(d => { setBalance(Number(d.balance||0)); setLoading(false); });
    }).catch(()=> { setToast('ไม่สามารถติดต่อเซิร์ฟเวอร์'); setLoading(false); });
  }, []);

  function formatPreview() {
    const preview = mode === 'in' ? balance + amount : balance - amount;
    return preview.toLocaleString();
  }

  function handleNum(n:number){ setAmount(prev => Math.min(999999999, Number(String(prev===0? '' : prev) + String(n)))); }
  function handleBack(){ setAmount(a => Math.floor(a/10)); }

  async function handleConfirm(){
    if (amount <= 0) { setToast('ระบุจำนวนก่อน'); return; }
    const pin = window.localStorage.getItem('pin');
    if (!pin) { window.location.href = '/lock'; return; }

    // optimistic UI
    const optimistic = mode === 'in' ? balance + amount : balance - amount;
    setBalance(optimistic);
    setAmount(0);
    setToast('กำลังบันทึก...');

    const res = await fetch('/api/tx', {
      method: 'POST', headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: mode, amount, pin })
    });
    if (res.ok) {
      const j = await res.json();
      setBalance(Number(j.newBalance));
      setToast('บันทึกสำเร็จ');
    } else {
      // revert optimistic
      const reload = await fetch('/api/balance');
      const rj = await reload.json();
      setBalance(Number(rj.balance || 0));
      setToast('บันทึกไม่สำเร็จ - โปรดล็อกอินใหม่');
      window.localStorage.removeItem('pin');
      setTimeout(()=> window.location.href='/lock', 800);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <main className="px-4 py-6">
      <div className="flex justify-between items-start">
        <Balance value={balance} />
        <div className="text-right">
          <a href="/history" className="text-sm text-neutral hover:underline">ประวัติ</a>
          <div className="mt-2 text-xs text-neutral"><a href="/change-pin" className="hover:underline">เปลี่ยน PIN</a></div>
        </div>
      </div>

      <div className="mt-5">
        <ToggleInOut mode={mode} setMode={setMode} />
      </div>

      <div className="mt-4">
        <div className="text-sm text-neutral mb-2">จำนวน</div>
        <div className="text-3xl font-semibold">{amount.toLocaleString()}</div>
        <div className="text-sm text-neutral mt-1">ยอดใหม่: <span className="font-medium">฿{formatPreview()}</span></div>
      </div>

      <div className="mt-4">
        <Numpad value={amount} onNum={handleNum} onBack={handleBack} onOk={handleConfirm} />
      </div>

      <div className="mt-3">
        <ConfirmButton onConfirm={handleConfirm} disabled={amount <= 0} />
      </div>

      {toast && <Toast text={toast} onClose={() => setToast(null)} />}
    </main>
  );
}