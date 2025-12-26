'use client'
import { useEffect, useState } from "react";
import Balance from "../components/Balance";
import ToggleInOut from "../components/ToggleInOut";
import Numpad from "../components/Numpad";
import { useSession } from "../lib/session";

export default function MainPage() {
  const { pinOk, unlock } = useSession();
  const [mode, setMode] = useState<'in'|'out'>('in');
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetch('/api/balance').then(res=>res.json()).then(x=>setBalance(Number(x.balance)));
  }, []);

  function handleNum(n:number) {
    setAmount(prev => Number((prev * 10 + n).toString().slice(0, 9)));
  }
  function handleBack() {
    setAmount(a => Math.floor(a / 10));
  }
  function handleOk() {
    if (amount<=0) return;
    fetch('/api/tx', {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: mode, amount, pin: window.localStorage.getItem('pin') || ""})
    }).then(async res => {
      if(res.ok) { setAmount(0); setBalance((await res.json()).newBalance); }
    });
  }

  if (!pinOk) return <div>Loading...</div>;
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-2">
      <Balance value={balance} />
      <ToggleInOut mode={mode} setMode={setMode} />
      <Numpad value={amount} onNum={handleNum} onBack={handleBack} onOk={handleOk} />
      <div className="mt-4 text-lg">ยอดใหม่: ฿ {(mode === 'in' ? balance + amount : balance - amount).toLocaleString()}</div>
    </main>
  );
}