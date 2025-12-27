'use client';
import { useEffect, useRef, useState } from "react";
import Numpad from "./Numpad";

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
        // keep input for user to edit (page shows error)
      } else {
        // success: clear silently (redirect handled by page)
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