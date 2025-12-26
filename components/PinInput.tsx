'use client';
import { useEffect, useRef, useState } from "react";
import Numpad from "./Numpad";

/**
 * PinInput เป็น controlled local component ที่:
 * - auto-submit เมื่อกรอกครบ min หลัก
 * - ป้องกัน double-submit และแสดง loading ระหว่างรอผล
 * - รับ callback onSubmit ที่อาจ return Promise<void|boolean> เพื่อให้หน้ารอผลได้
 */
export default function PinInput({
  onSubmit,
  min = 4,
  max = 6,
}: {
  onSubmit: (pin: string) => void | Promise<void | boolean>;
  min?: number;
  max?: number;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    // auto-submit when reach min length
    if (input.length >= min && !pendingRef.current) {
      // small debounce to allow UI update (show bullets)
      const t = setTimeout(() => {
        submit(input);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [input, min]);

  async function submit(pin: string) {
    if (pendingRef.current) return;
    if (pin.length < min || pin.length > max) return;
    pendingRef.current = true;
    setLoading(true);
    try {
      const res = await onSubmit(pin);
      // if onSubmit returns false explicitly, we keep the input for retry
      if (res === false) {
        // keep input (or clear? we keep for UX so user can backspace quickly)
      } else {
        // Clear input on success/undefined
        setInput("");
      }
    } catch (e) {
      // swallow here; page-level will show error
    } finally {
      pendingRef.current = false;
      setLoading(false);
    }
  }

  function handleNum(n: number) {
    setInput(prev => (prev.length >= max ? prev : prev + String(n)));
  }
  function handleBack() {
    // don't allow back while submitting
    if (pendingRef.current) return;
    setInput(prev => prev.slice(0, -1));
  }
  function handleOk() {
    if (input.length >= min && input.length <= max) submit(input);
  }

  return (
    <div>
      <div className="flex gap-2 justify-center mb-4">
        {Array.from({ length: Math.max(input.length, min) }, (_, i) => (
          <span key={i} className="text-3xl">
            {input[i] ? "•" : "○"}
          </span>
        ))}
      </div>

      {loading && <div className="text-center mb-2">กำลังประมวลผล...</div>}

      <Numpad
        onNum={handleNum}
        onBack={handleBack}
        onOk={handleOk}
        showOk={false}
        disabled={loading}
      />
    </div>
  );
}