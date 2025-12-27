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
  /**
   * ช่องซ้ายล่าง (เช่น fingerprint) และขวาล่าง (เช่น backspace) สามารถส่งเป็น React node ได้
   */
  leftSlot ? : React.ReactNode | null;
  rightSlot ? : React.ReactNode | null;
};

export default function Numpad({
  value,
  onNum,
  onBack,
  onOk,
  showOk = true,
  disabled = false,
  leftSlot = null,
  rightSlot = null,
}: Props) {
  // ตำแหน่งแถวล่าง: ถ้ามี leftSlot ใช้มันก่อน, ถ้าไม่มีแต่ showOk=true ให้ใส่ 'ok', มิฉะนั้นช่องว่าง
  const leftCell = leftSlot ?? (showOk ? 'ok' : null);
  const rightCell = rightSlot ?? 'back';
  
  const cells: Array < number | 'back' | 'ok' | React.ReactNode | null > = [
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

        // custom node (เช่น fingerprint icon) ให้ห่อด้วยปุ่มสไตล์เดียวกัน
        if (typeof c !== 'number' && c !== 'back' && c !== 'ok') {
          return (
            <button
              key={idx}
              type="button"
              className="numpad-key numpad-custom"
              onClick={() => {
                if (disabled) return;
                // custom slot click: หน้าเรียกใช้งานสามารถให้ leftSlot เป็นปุ่ม/element ที่จัดการเอง
              }}
              disabled={disabled}
            >
              <span className="numpad-key-label">{c}</span>
            </button>
          );
        }

        const isNum = typeof c === 'number';
        const isBack = c === 'back';
        const isOk = c === 'ok';

        // ถ้าเป็น OK แต่ onOk ไม่มี ให้แสดงเป็นช่องว่าง (ไม่ควรเกิดกับ showOk default true ถ้าไม่มี onOk หน้าเรียก)
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