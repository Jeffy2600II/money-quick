'use client';
import { useEffect, useRef, useState } from "react";
import Numpad from "./Numpad";

/**
 * PinInput:
 * - แสดงวงกลมตำแหน่ง PIN จำนวน max (แต่แสดงอย่างน้อย min ช่อง)
 * - เมื่อกรอกแต่ละตำแหน่ง จะเติมวงกลมด้านใน (ไม่เปลี่ยนขนาดขอบ)
 * - auto-submit เมื่อถึง min หลัก (เรียก onSubmit)
 * - ป้องกัน double-submit และแสดงสถานะ loading เล็กน้อย
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
    if (input.length >= min && !pendingRef.current) {
      const t = setTimeout(() => {
        void submit(input);
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
      if (res === false) {
        // ถ้าฟังก์ชันเรียกคืน false แปลว่าล้มเหลว ให้เก็บ input ไว้เพื่อแก้ไข
      } else {
        setInput("");
      }
    } catch {
      // page-level จะแสดง error ถ้าต้องการ
    } finally {
      pendingRef.current = false;
      setLoading(false);
    }
  }

  function handleNum(n: number) {
    setInput((prev) => (prev.length >= max ? prev : prev + String(n)));
  }
  function handleBack() {
    if (pendingRef.current) return;
    setInput((prev) => prev.slice(0, -1));
  }
  function handleOk() {
    if (input.length >= min && input.length <= max) void submit(input);
  }

  const dotsCount = Math.max(min, max); // แสดงช่องเต็มตาม max แต่อย่างน้อย min ช่อง
  return (
    <div className="pin-input-root">
      <div className="pin-dots" aria-hidden>
        {Array.from({ length: dotsCount }, (_, i) => {
          const filled = Boolean(input[i]);
          return (
            <div key={i} className={`pin-dot ${filled ? "filled" : ""}`} />
          );
        })}
      </div>

      {loading && <div className="pin-loading">กำลังประมวลผล...</div>}

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