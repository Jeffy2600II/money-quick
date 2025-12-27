'use client';
import React from "react";

type Props = {
  value ? : number | string;
  onNum: (n: number) => void;
  onBack: () => void;
  onOk ? : () => void;
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
  const leftCell = showOk ? 'ok' : null;
  const cells: Array < number | 'back' | 'ok' | null > = [
    1, 2, 3,
    4, 5, 6,
    7, 8, 9,
    leftCell, 0, 'back'
  ];
  
  // Back SVG (the exact SVG you provided) — rendered inline so CSS can size it
  const BackSvg = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="numpad-back-svg"
      focusable={false}
    >
      <path d="M20 6a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-11l-5 -5a1.5 1.5 0 0 1 0 -2l5 -5z" />
      <path d="M12 10l4 4m0 -4l-4 4" />
    </svg>
  );
  
  return (
    <div className="numpad-grid" role="group" aria-label="numpad">
      {cells.map((c, idx) => {
        if (c === null) return <div key={idx} className="numpad-cell" />;

        const isNum = typeof c === 'number';
        const isBack = c === 'back';
        const isOk = c === 'ok';

        if (isOk && !onOk) return <div key={idx} className="numpad-cell" />;

        const btnClass = isBack ? "numpad-key numpad-key-back" : "numpad-key";

        return (
          <button
            key={idx}
            type="button"
            aria-label={isNum ? `Number ${c}` : isBack ? 'Backspace' : 'Confirm'}
            className={btnClass}
            onClick={() => {
              if (disabled) return;
              if (isNum) onNum(c as number);
              else if (isBack) onBack();
              else if (isOk && onOk) onOk();
            }}
            disabled={disabled}
          >
            {isBack
              ? <span className="numpad-key-icon" aria-hidden><BackSvg/></span>
              : <span className="numpad-key-label">{isNum ? String(c) : '✔'}</span>}
          </button>
        );
      })}
    </div>
  );
}