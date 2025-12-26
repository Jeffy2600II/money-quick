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
  [0, "back", "ok"]
];

export default function Numpad({
  value,
  onNum,
  onBack,
  onOk,
  showOk = true,
  disabled = false,
}: Props) {
  const keys = defaultKeys.map(row =>
    row.map(k => (k === "ok" && !showOk ? null : k))
  );
  
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-xs py-4">
      {keys.flat().map((k, i) => {
        if (k === null) return <div key={i} />;
        const content = k === "back" ? "⌫" : k === "ok" ? "✔" : String(k);
        const handleClick = () => {
          if (disabled) return;
          if (typeof k === "number") onNum(k);
          else if (k === "back") onBack();
          else if (k === "ok" && onOk) onOk();
        };
        return (
          <button
            key={i}
            type="button"
            aria-label={typeof k === "number" ? `Number ${k}` : String(k)}
            onClick={handleClick}
            className={`text-2xl rounded h-14 flex items-center justify-center focus:outline-none ${disabled ? "opacity-50 cursor-not-allowed" : "bg-[#232e43] text-white"}`}
            style={{ height: 54 }}
            disabled={disabled}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}