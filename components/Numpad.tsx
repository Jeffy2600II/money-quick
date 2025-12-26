import React from "react";

type Props = {
  value ? : number;
  onNum: (n: number) => void;
  onBack: () => void;
  onOk ? : () => void;
  /**
   * showOk: ถ้า false จะซ่อนปุ่ม ✔ (ใช้สำหรับ PIN input ที่ต้องการ auto-submit)
   * ค่าเริ่มต้น: true (เพื่อคงพฤติกรรมเดิมของหน้าหลัก)
   */
  showOk ? : boolean;
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
}: Props) {
  // สร้างแถวของปุ่ม โดยถ้า showOk === false จะเว้นช่องสุดท้ายเป็นช่องว่างแทนปุ่ม OK
  const keys = defaultKeys.map(row =>
    row.map(k => (k === "ok" && !showOk ? null : k))
  );
  
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-xs py-4">
      {keys.flat().map((k, i) => {
        if (k === null) {
          // ช่องว่าง (เพื่อจัดตำแหน่งคีย์ให้ยังคงเป็นกริด 3x4)
          return <div key={i} />;
        }

        const content =
          k === "back" ? "⌫" : k === "ok" ? "✔" : String(k);

        const handleClick = () => {
          if (typeof k === "number") onNum(k);
          else if (k === "back") onBack();
          else if (k === "ok" && onOk) onOk();
        };

        return (
          <button
            key={i}
            type="button"
            aria-label={typeof k === "number" ? `Number ${k}` : k}
            onClick={handleClick}
            className="text-2xl rounded bg-[#232e43] text-white h-14 flex items-center justify-center focus:outline-none"
            style={{ height: 54 }}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}