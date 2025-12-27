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
        try { localStorage.setItem("pin", pin); } catch {}
        window.location.href = "/";
      } else {
        setError("PIN ไม่ถูกต้อง");
      }
    } catch (e) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }
  
  function handleForgot() {
    window.location.href = "/setup-pin?force=1";
  }
  
  return (
    <main className="pin-page">
      <div className="pin-top" />

      <div className="pin-brand">
        <div className="logo">
          <div className="logo-line1">Money</div>
          <div className="logo-line2">quick</div>
        </div>
        <div className="pin-prompt">กรุณาใส่รหัสผ่าน</div>
      </div>

      <PinInput onSubmit={handleSubmit} requiredLength={6} />

      {error && <div className="mt-3 text-red-500">{error}</div>}

      <a className="forgot-link" onClick={handleForgot}>ลืมรหัสผ่าน</a>
    </main>
  );
}