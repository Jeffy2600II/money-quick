import { useState } from "react";
import Numpad from "./Numpad";

export default function PinInput({
  onSubmit,
  min = 4,
  max = 6,
}: {
  onSubmit: (pin: string) => void;
  min ? : number;
  max ? : number;
}) {
  const [input, setInput] = useState("");
  
  function submitPin(pin: string) {
    onSubmit(pin);
    setInput("");
  }
  
  function handleNum(n: number) {
    setInput((prev) => {
      if (prev.length >= max) return prev;
      const next = prev + String(n);
      // ถ้ากรอกครบขั้นต่ำ ให้ส่งอัตโนมัติทันที
      if (next.length >= min) {
        // เล็กน้อยหน่วงเวลาเพื่อให้ UI แสดงตัว • ก่อนเรียก callback
        setTimeout(() => submitPin(next), 50);
      }
      return next;
    });
  }
  
  function handleBack() {
    setInput((prev) => prev.slice(0, -1));
  }
  
  function handleOk() {
    if (input.length >= min && input.length <= max) {
      submitPin(input);
    }
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

      {/* ใช้ Numpad ระดับแอป แต่ซ่อนปุ่ม OK เพราะเราทำ auto-submit */}
      <Numpad
        onNum={handleNum}
        onBack={handleBack}
        onOk={handleOk}
        showOk={false}
      />
    </div>
  );
}