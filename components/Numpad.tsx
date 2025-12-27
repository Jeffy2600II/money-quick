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
  const rightCell = 'back';
  
  const cells: Array < number | 'back' | 'ok' | null > = [
    1, 2, 3,
    4, 5, 6,
    7, 8, 9,
    leftCell, 0, rightCell
  ];
  
  // backspace SVG
  const BackSvg = () => (
    <svg width="28" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 7H8L4 12l4 5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 9l-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 9l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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

        return (
          <button
            key={idx}
            type="button"
            aria-label={isNum ? `Number ${c}` : isBack ? 'Backspace' : 'Confirm'}
            className="numpad-key"
            onClick={() => {
              if (disabled) return;
              if (isNum) onNum(c as number);
              else if (isBack) onBack();
              else if (isOk && onOk) onOk();
            }}
            disabled={disabled}
          >
            {isBack ? <span className="numpad-key-icon"><BackSvg/></span> : <span className="numpad-key-label">{isNum ? String(c) : '✔'}</span>}
          </button>
        );
      })}
    </div>
  );
}