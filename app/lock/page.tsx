'use client';
import { useRef } from "react";
import PinInput, { PinInputHandle } from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";
import { useLoader } from "../../components/LoaderProvider";
import { usePopup } from "../../components/PopupProvider";

export default function LockPage() {
  const pinRef = useRef < PinInputHandle | null > (null);
  const loader = useLoader();
  const popup = usePopup();
  
  async function handleSubmit(pin: string) {
    loader.show('กำลังตรวจสอบ...');
    try {
      const res = await pinClient.checkPin(pin);
      if (res.ok && res.data?.ok) {
        try { localStorage.setItem("pin", pin); } catch {}
        loader.show('กำลังเข้าสู่ระบบ...');
        setTimeout(() => {
          loader.hide();
          window.location.href = "/";
        }, 350);
      } else {
        loader.hide();
        // show popup and flash red on pin-dots
        popup.show('PIN ไม่ถูกต้อง', { duration: 2200 });
        pinRef.current?.triggerError(900);
        // do not set page inline error
      }
    } catch (e) {
      loader.hide();
      popup.show('เกิดข้อผิดพลาด กรุณาลองใหม่', { duration: 2500 });
      pinRef.current?.triggerError(900);
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

      <PinInput ref={pinRef} onSubmit={handleSubmit} requiredLength={6} />

      <a className="forgot-link" onClick={handleForgot}>ลืมรหัสผ่าน</a>
    </main>
  );
}