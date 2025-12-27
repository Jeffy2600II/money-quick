'use client';
import { useEffect, useRef, useState } from "react";
import Numpad from "./Numpad";

/**
 * PinInput
 * - requiredLength: จำนวนหลักคงที่ (ค่าเริ่มต้น 6)
 * - auto-submit เมื่อครบ requiredLength
 * - ป้องกัน double-submit / แสดง loading
 * - ไม่มีฟีเจอร์ลายนิ้วมือ (removed)
 */
export default function PinInput({
  onSubmit,
  requiredLength = 6,
  showForgot,
  onForgot,
}: {
  onSubmit: (pin: string) => void | Promise<void | boolean>;
  requiredLength?: number; // default 6
  showForgot?: boolean;
  onForgot?: () => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef(false);

  // auto-submit เมื่อครบ length
  useEffect(() => {
    if (input.length === requiredLength && !pendingRef.current) {
      const t = setTimeout(() => {
        void submit(input);
      }, 90);
      return () => clearTimeout(t);
    }
  }, [input, requiredLength]);

  async function submit(pin: string) {
    if (pendingRef.current) return;
    if (pin.length !== requiredLength) return;
    pendingRef.current = true;
    setLoading(true);
    try {
      const res = await onSubmit(pin);
      if (res === false) {
        // failed -> keep input for user to edit
      } else {
        // success -> clear input
        setInput("");
      }
    } catch {
      // page-level handler will show errors
    } finally {
      pendingRef.current = false;
      setLoading(false);
    }
  }

  function handleNum(n: number) {
    setInput(prev => (prev.length >= requiredLength ? prev : prev + String(n)));
  }
  function handleBack() {
    if (pendingRef.current) return;
    setInput(prev => prev.slice(0, -1));
  }

  return (
    <div className="pin-input-root">
      <div className="pin-dots" aria-hidden>
        {Array.from({ length: requiredLength }, (_, i) => {
          const filled = i < input.length;
          return (
            <div key={i} className={`pin-dot ${filled ? "filled" : ""}`} />
          );
        })}
      </div>

      {loading && <div className="pin-loading">กำลังประมวลผล...</div>}

      <Numpad
        onNum={handleNum}
        onBack={handleBack}
        onOk={() => submit(input)}
        showOk={false}
        disabled={loading}
      />
    </div>
  );
}