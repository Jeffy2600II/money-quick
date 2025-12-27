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
    // ไปหน้า setup (หรือจะเปลี่ยน flow เป็น recovery)
    window.location.href = "/setup-pin";
  }
  
  return (
    <main className="pin-page">
      <div className="pin-top">
        <button className="pin-close" aria-label="close" onClick={() => window.history.back()}>✕</button>
      </div>

      <div className="pin-brand">
        <div className="logo"><span className="logo-mark">💰</span><span className="logo-text">Money quick</span></div>
        <div className="pin-prompt">กรุณาใส่รหัสผ่าน</div>
      </div>

      <PinInput onSubmit={handleSubmit} requiredLength={6} showForgot onForgot={handleForgot} />

      {loading && <div className="pin-loading">กำลังตรวจสอบ...</div>}
      {error && <div className="mt-3 text-red-500">{error}</div>}

      <a className="forgot-link" onClick={handleForgot}>ลืมรหัสผ่าน</a>
    </main>
  );
}