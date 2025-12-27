'use client';
import React from "react";

type Props = {
  value ? : number | string;
  onNum: (n: number) => void;
  onBack: () => void;
  onOk ? : () => void;
  /**
   * ถ้า false จะซ่อนปุ่ม OK (ใช้สำหรับ PIN input ที่ต้องการ auto-submit)
   * ค่าเริ่มต้น: true
   */
  showOk ? : boolean;
  disabled ? : boolean;
};

const defaultKeys: (number | "back" | "ok" | null)[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [null, 0, "back"]
];

export default function Numpad({
  onNum,
  onBack,
  onOk,
  showOk = true,
  disabled = false,
}: Props) {
  // ถ้า showOk ให้แสดงปุ่ม ok ทางซ้ายของแถวล่าง
  const keys = defaultKeys.map((row, ri) =>
    row.map((k, ci) => {
      if (ri === 3 && ci === 0 && showOk) return "ok";
      return k;
    })
  );
  
  return (
    <div className="numpad-grid" role="group" aria-label="numpad">
      {keys.flat().map((k, i) => {
        if (k === null) {
          return <div key={i} className="numpad-cell" />;
        }

        const isNum = typeof k === "number";
        const label = isNum ? String(k) : k === "back" ? "⌫" : "✔";

        const handleClick = () => {
          if (disabled) return;
          if (isNum) onNum(k as number);
          else if (k === "back") onBack();
          else if (k === "ok" && onOk) onOk();
        };

        const aria = isNum ? `Number ${label}` : k === "back" ? "Backspace" : "Confirm";

        return (
          <button
            key={i}
            type="button"
            aria-label={aria}
            className="numpad-key"
            onClick={handleClick}
            disabled={disabled}
          >
            <span className="numpad-key-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}