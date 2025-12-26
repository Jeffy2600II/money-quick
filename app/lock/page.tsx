'use client';
import { useState } from "react";
import PinInput from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";

export default function LockPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(pin: string) {
    setError("");
    setLoading(true);
    try {
      const res = await pinClient.checkPin(pin);
      if (res.ok && res.data?.ok) {
        localStorage.setItem("pin", pin);
        // direct navigation (simple, consistent)
        window.location.href = "/";
      } else {
        setError("PIN ไม่ถูกต้อง");
      }
    } catch (e) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
    // returning undefined/boolean not required; PinInput handles loading via Promise
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