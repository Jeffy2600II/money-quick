'use client'
import { useEffect, useState } from "react";
import Balance from "../components/Balance";
import ToggleInOut from "../components/ToggleInOut";
import Numpad from "../components/Numpad";
import ConfirmButton from "../components/ConfirmButton";

export default function MainPage() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'in'|'out'>('in');
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    // เช็คว่า setup pin แล้วหรือยัง
    fetch("/api/has-pin")
      .then(res => res.json())
      .then(data => {
        if (!data.exists) {
          window.location.href = "/setup-pin";
          return;
        }
        const pin = window.localStorage.getItem("pin");
        if (!pin) {
          window.location.href = "/lock";
          return;
        }
        // ตรวจสอบว่า PIN ถูกต้องไหมด้วยก็ได้
        fetch("/api/pin-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin }),
        })
          .then(res => res.json())
          .then(data => {
            if (!data.ok) {
              window.localStorage.removeItem("pin");
              window.location.href = "/lock";
            } else {
              setLoading(false);
              // ดึง balance
              fetch("/api/balance")
                .then(res => res.json())
                .then(x => setBalance(Number(x.balance)));
            }
          })
          .catch(() => {
            setError("เกิดข้อผิดพลาดในการตรวจสอบ PIN");
            setLoading(false);
          });
      })
      .catch(() => {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        setLoading(false);
      });
  }, []);

  function handleNum(n: number) {
    setAmount(prev => Number((prev * 10 + n).toString().slice(0, 9)));
  }
  function handleBack() {
    setAmount(a => Math.floor(a / 10));
  }
  async function handleConfirm() {
    setError("");
    if (amount <= 0) return;
    const pin = window.localStorage.getItem("pin");
    const res = await fetch("/api/tx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: mode, amount, pin })
    });
    if (res.ok) {
      setAmount(0);
      // reload balance
      const data = await res.json();
      setBalance(data.newBalance);
    } else {
      setError("บันทึกไม่สำเร็จ หรือ PIN ผิดพลาด");
      // option: redirect to lock if pin fail
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return (
    <main className="min-h-screen flex flex-col items-center bg-base px-2">
      <Balance value={balance} />
      <ToggleInOut mode={mode} setMode={setMode} />
      <Numpad value={amount} onNum={handleNum} onBack={handleBack} onOk={handleConfirm} />
      <ConfirmButton onConfirm={handleConfirm} disabled={amount <= 0} />
      <div className="mt-4 text-lg">
        ยอดใหม่: ฿{(mode === 'in' ? balance + amount : balance - amount).toLocaleString()}
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </main>
  );
}