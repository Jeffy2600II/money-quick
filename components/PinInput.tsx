'use client';
import { useEffect, useRef, useState } from "react";
import Numpad from "./Numpad";

export default function PinInput({
  onSubmit,
  min = 4,
  max = 6,
  showForgot,
  onForgot,
}: {
  onSubmit: (pin: string) => void | Promise<void | boolean>;
  min?: number;
  max?: number;
  showForgot?: boolean;
  onForgot?: () => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef(false);

  // auto-submit เมื่อครบ min (มี debounce เล็กน้อยให้ UI แสดง)
  useEffect(() => {
    if (input.length >= min && !pendingRef.current) {
      const t = setTimeout(() => {
        void submit(input);
      }, 100);
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
      if (res === false) {
        // ถ้าคืนค่า false ให้เก็บ input เพื่อให้ผู้ใช้แก้ไข
      } else {
        // on success clear input
        setInput("");
      }
    } catch {
      // page-level จะจัดการ error
    } finally {
      pendingRef.current = false;
      setLoading(false);
    }
  }

  function handleNum(n: number) {
    setInput(prev => (prev.length >= max ? prev : prev + String(n)));
  }
  function handleBack() {
    if (pendingRef.current) return;
    setInput(prev => prev.slice(0, -1));
  }

  // สร้าง leftSlot เป็นไอคอนลายนิ้วมือ (optional) และ rightSlot เป็นปุ่ม backspace (Numpad จะวางไว้เอง)
  const leftSlot = showForgot ? (
    <button type="button" className="fingerprint-btn" onClick={() => onForgot?.()}>
      {/* simple fingerprint SVG */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 1v2" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.5 3.3l-.9 1.6" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 9c0 4.5 3 7 3 7" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  ) : null;

  return (
    <div className="pin-input-root">
      <div className="pin-dots" aria-hidden>
        {Array.from({ length: max }, (_, i) => {
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
        leftSlot={leftSlot}
        rightSlot={null /* Backspace อยู่ที่ตำแหน่งขวาล่าง (Numpad ให้ค่า 'back') */}
      />
    </div>
  );
}