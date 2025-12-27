'use client';
import React from "react";

type Props = {
  value ? : number | string;
  onNum: (n: number) => void;
  onBack: () => void;
  onOk ? : () => void;
  /**
   * ถ้า false จะซ่อนปุ่ม OK (ใช้สำหรับ PIN ที่ auto-submit)
   * ค่าเริ่มต้น: true เพื่อความเข้ากันได้ย้อนหลังกับโค้ดเดิม
   */
  showOk ? : boolean;
  disabled ? : boolean;
};

export default function Numpad({
  value,
  onNum,
  onBack,
  onOk,
  showOk = true,
  disabled = false,
}: Props) {
  // ตำแหน่งแถวล่าง: ถ้า showOk=true ให้ใส่ 'ok' ทางซ้ายสุด แถวล่างเป็น [left, 0, right]
  const leftCell = showOk ? 'ok' : null;
  const rightCell = 'back';
  
  const cells: Array < number | 'back' | 'ok' | null > = [
    1, 2, 3,
    4, 5, 6,
    7, 8, 9,
    leftCell, 0, rightCell
  ];
  
  return (
    <div className="numpad-grid" role="group" aria-label="numpad">
      {cells.map((c, idx) => {
        if (c === null) {
          return <div key={idx} className="numpad-cell" />;
        }

        const isNum = typeof c === 'number';
        const isBack = c === 'back';
        const isOk = c === 'ok';

        // ถ้าเป็น OK แต่ไม่มี onOk -> แสดงเป็นช่องว่างเพื่อหลีกเลี่ยงการส่ง undefined
        if (isOk && !onOk) {
          return <div key={idx} className="numpad-cell" />;
        }

        const label = isNum ? String(c) : isBack ? '⌫' : '✔';

        return (
          <button
            key={idx}
            type="button"
            aria-label={isNum ? `Number ${label}` : isBack ? 'Backspace' : 'Confirm'}
            className="numpad-key"
            onClick={() => {
              if (disabled) return;
              if (isNum) onNum(c as number);
              else if (isBack) onBack();
              else if (isOk && onOk) onOk();
            }}
            disabled={disabled}
          >
            <span className="numpad-key-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}