'use client';
import React from "react";

type Props = {
  onNum: (n: number) => void;
  onBack: () => void;
  onOk ? : () => void;
  /**
   * ซ่อนปุ่ม OK (ใช้สำหรับ PIN ที่ auto-submit)
   */
  showOk ? : boolean;
  disabled ? : boolean;
  /**
   * ช่องซ้ายล่าง (เช่น fingerprint) และขวาล่าง (เช่น backspace) สามารถส่งเป็น React node ได้
   */
  leftSlot ? : React.ReactNode;
  rightSlot ? : React.ReactNode;
};

export default function Numpad({
  onNum,
  onBack,
  onOk,
  showOk = false,
  disabled = false,
  leftSlot,
  rightSlot,
}: Props) {
  // เรียงแบบ 3 คอลัมน์ โดยแถวล่างคือ [leftSlot, 0, rightSlot]
  const cells: Array < number | 'back' | 'ok' | React.ReactNode | null > = [
    1, 2, 3,
    4, 5, 6,
    7, 8, 9,
    leftSlot ?? null, 0, rightSlot ?? 'back'
  ];
  
  return (
    <div className="numpad-grid" role="group" aria-label="numpad">
      {cells.map((c, idx) => {
        // ช่องว่างเพื่อคงกริด
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
                // custom slot click ไม่ส่งค่าเลข — หน้าเรียกใช้งานจะส่งฟังก์ชันผ่าน leftSlotNode ถ้าต้องการ
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

        // ถ้า showOk === false และ c === 'ok' ให้แสดงเป็นช่องว่าง (ไม่ควรเกิดเพราะเราไม่ได้ใส่ 'ok' ใน cells)
        if (isOk && !showOk) {
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