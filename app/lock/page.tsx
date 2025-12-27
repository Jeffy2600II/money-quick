'use client';
import { useRef, useState } from "react";
import PinInput, { PinInputHandle } from "../../components/PinInput";
import * as pinClient from "../../lib/pinClient";
import { useLoader } from "../../components/LoaderProvider";
import { usePopup } from "../../components/PopupProvider";

export default function LockPage() {
  const pinRef = useRef < PinInputHandle | null > (null);
  const loader = useLoader();
  const popup = usePopup();
  
  // New: local verifying state to disable input while checking (no global overlay)
  const [verifying, setVerifying] = useState(false);
  
  async function handleSubmit(pin: string) {
    // Do not show global overlay for quick check; only disable input locally
    setVerifying(true);
    try {
      const res = await pinClient.checkPin(pin);
      if (res.ok && res.data?.ok) {
        try { localStorage.setItem("pin", pin); } catch {}
        // Ensure input unlocked before transition (in case navigation is interrupted)
        setVerifying(false);
        // small global loader for transition only (keeps UX consistent)
        loader.show('กำลังเข้าสู่ระบบ...');
        setTimeout(() => {
          loader.hide();
          window.location.href = "/";
        }, 350);
      } else {
        // failed
        setVerifying(false);
        // show popup and flash red on pin-dots
        popup.show('PIN ไม่ถูกต้อง', { duration: 2200 });
        pinRef.current?.triggerError(900);
      }
    } catch (e) {
      setVerifying(false);
      popup.show('เกิดข้อผิดพลาด กรุณาลองใหม่', { duration: 2500 });
      pinRef.current?.triggerError(900);
    }
  }
  
  function handleForgot() {
    // Use central loader briefly so navigation feels consistent (and hides server fallback)
    loader.show('กำลังไปหน้าตั้งรหัสผ่านใหม่...');
    // give browser a moment to show loader, then navigate
    setTimeout(() => {
      loader.hide();
      window.location.href = "/setup-pin?force=1";
    }, 180);
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