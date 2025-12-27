'use client';
import { useEffect, useRef, useState } from "react";
import Numpad from "./Numpad";

/**
 * PinInput: requiredLength default 6
 * - auto-submit เมื่อครบ requiredLength
 * - ไม่มีข้อความ "กำลังประมวลผล" ใด ๆ ในตัว component นี้
 * - ถ้า onSubmit คืนค่า false / throw -> input คงไว้และ page-level จะแสดง error
 */
export default function PinInput({
  onSubmit,
  requiredLength = 6,
}: {
  onSubmit: (pin: string) => void | Promise<void | boolean>;
  requiredLength?: number;
}) {
  const [input, setInput] = useState("");
  const pendingRef = useRef(false);

  useEffect(() => {
    if (input.length === requiredLength && !pendingRef.current) {
      const t = setTimeout(() => {
        void submit(input);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [input, requiredLength]);

  async function submit(pin: string) {
    if (pendingRef.current) return;
    if (pin.length !== requiredLength) return;
    pendingRef.current = true;
    try {
      const res = await onSubmit(pin);
      if (res === false) {
        // failed -> keep input for user to edit
      } else {
        // success -> clear input silently
        setInput("");
      }
    } catch {
      // page-level will show error; keep input
    } finally {
      pendingRef.current = false;
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

      {/* no loading text here — pages handle errors and redirect */}
      <Numpad
        onNum={handleNum}
        onBack={handleBack}
        onOk={() => submit(input)}
        showOk={false}
        disabled={false}
      />
    </div>
  );
}