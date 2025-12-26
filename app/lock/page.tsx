'use client'
import { useState } from "react";
import PinInput from "../../components/PinInput";

export default function LockPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(pin: string) {
    setLoading(true);
    const res = await fetch("/api/pin-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin })
    });
    if (res.ok) {
      localStorage.setItem("pin", pin);
      window.location.href = "/";
    } else {
      setError("PIN ไม่ถูกต้อง");
      setLoading(false);
    }
  }
  
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="mb-2 font-bold text-xl">ใส่ PIN เพื่อเข้าใช้งาน</h1>
      <PinInput onSubmit={handleSubmit} />
      {loading && <div className="mt-4">กำลังตรวจสอบ...</div>}
      {error && <div className="mt-2 text-red-500">{error}</div>}
    </main>
  );
}