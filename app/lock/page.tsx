'use client'
import PinInput from "../../components/PinInput";
import { useSession } from "../../lib/session";

export default function LockPage() {
  const { unlock } = useSession();
  function onSubmit(pin: string) {
    window.localStorage.setItem('pin', pin);
    unlock(pin).then(ok => {
      if (ok) window.location.href = "/";
      else alert("PIN ผิด ลองใหม่");
    });
  }
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="font-bold text-2xl mb-2">ล็อกด้วย PIN</h1>
      <PinInput onSubmit={onSubmit} />
      <p className="mt-2">โปรดใส่ PIN 4-6 หลัก</p>
    </main>
  );
}