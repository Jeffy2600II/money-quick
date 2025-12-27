'use client';
import { useState } from "react";
import PinInput from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";
import { useLoader } from "../../components/LoaderProvider";

export default function LockPage() {
  const [error, setError] = useState("");
  const { show, hide } = useLoader();
  
  async function handleSubmit(pin: string) {
    setError("");
    show('กำลังตรวจสอบ...'); // เรียก global loader พร้อมข้อความ
    try {
      const res = await pinClient.checkPin(pin);
      if (res.ok && res.data?.ok) {
        try { localStorage.setItem("pin", pin); } catch {}
        show('กำลังเข้าสู่ระบบ...'); // เปลี่ยนข้อความถ้าต้องการ
        // ให้เวลา UX เล็กน้อยก่อน redirect (ไม่จำเป็น)
        setTimeout(() => {
          hide();
          window.location.href = "/";
        }, 350);
      } else {
        hide();
        setError("PIN ไม่ถูกต้อง");
      }
    } catch (e) {
      hide();
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
  }
  
  function handleForgot() {
    window.location.href = "/setup-pin?force=1";
  }
  
  return (
    <main className="pin-page">
      <div className="pin-top" />
      <div className="pin-brand">
        <div className="logo"><div className="logo-line1">Money</div><div className="logo-line2">quick</div></div>
        <div className="pin-prompt">กรุณาใส่รหัสผ่าน</div>
      </div>

      <PinInput onSubmit={handleSubmit} requiredLength={6} />

      {error && <div className="mt-3 text-red-500">{error}</div>}

      <a className="forgot-link" onClick={handleForgot}>ลืมรหัสผ่าน</a>
    </main>
  );
}