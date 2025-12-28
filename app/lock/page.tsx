'use client';
import { useRef, useState } from "react";
import PinInput, { PinInputHandle } from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";
import { useLoader } from "../../components/LoaderProvider";
import { usePopup } from "../../components/PopupProvider";

/**
 * Lock page: verify PIN and perform a full navigation.replace('/') on success.
 * This avoids client-side routing race conditions by performing a full reload
 * so the inline auth script in layout runs deterministically.
 */
export default function LockPage() {
  const pinRef = useRef < PinInputHandle | null > (null);
  const loader = useLoader();
  const popup = usePopup();
  
  // local verifying state to disable input while checking
  const [verifying, setVerifying] = useState(false);
  
  async function handleSubmit(pin: string) {
    setVerifying(true);
    try {
      // Show a short loader/message while verifying
      loader.show('กำลังตรวจสอบ PIN...');
      const res = await pinClient.checkPin(pin);
      
      if (res.ok && res.data?.ok) {
        // Save session PIN locally (used by inline auth on next load)
        try { localStorage.setItem("pin", pin); } catch {}
        // Show transition loader and perform a full page navigation to root.
        loader.show('กำลังเข้าสู่ระบบ...');
        // Use replace to avoid leaving /lock in history
        window.location.replace('/');
        return;
      }
      
      // Invalid PIN
      loader.hide();
      setVerifying(false);
      popup.show('PIN ไม่ถูกต้อง', { duration: 2200 });
      pinRef.current?.triggerError(900);
    } catch (e) {
      loader.hide();
      setVerifying(false);
      popup.show('เกิดข้อผิดพลาด กรุณาลองใหม่', { duration: 2500 });
      pinRef.current?.triggerError(900);
    }
  }
  
  function handleForgot() {
    // Navigate to setup-pin (force) — user flow for forgetting PIN starts here.
    window.location.href = "/setup-pin?force=1";
  }
  
  return (
    <main className="pin-page">
      <div className="pin-top" />
      <div className="pin-brand">
        <div className="logo"><div className="logo-line1">Money</div><div className="logo-line2">quick</div></div>
        <div className="pin-prompt">กรุณาใส่รหัสผ่าน</div>
      </div>

      <PinInput ref={pinRef} onSubmit={handleSubmit} requiredLength={6} disabled={verifying} />

      <a className="forgot-link" onClick={handleForgot}>ลืมรหัสผ่าน</a>
    </main>
  );
}