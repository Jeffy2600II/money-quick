'use client';
import React, { useState } from "react";

type Props = {
  value?: number | string;
  onNum: (n: number) => void;
  onBack: () => void;
  onOk?: () => void;
  showOk?: boolean;
  disabled?: boolean;
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
  const cells: Array<number | 'back' | 'ok' | null> = [
    1, 2, 3,
    4, 5, 6,
    7, 8, 9,
    leftCell, 0, 'back'
  ];

  // pressed index used for immediate active visual feedback
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);

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

  function handlePointerDown(c: number | 'back' | 'ok' | null, idx: number, e: React.PointerEvent) {
    if (disabled || c === null) return;
    // capture pointer to ensure we get pointerup/cancel even if finger moves
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setPressedIdx(idx);

    const isNum = typeof c === 'number';
    const isBack = c === 'back';
    const isOk = c === 'ok';

    // Fire action on pointerdown for fastest responsiveness
    if (isNum) onNum(c as number);
    else if (isBack) onBack();
    else if (isOk && onOk) onOk();
  }

  function handlePointerUp(e: React.PointerEvent) {
    try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {}
    setPressedIdx(null);
  }

  function handlePointerCancel() {
    setPressedIdx(null);
  }

  // keyboard support (Enter / Space)
  function handleKeyDown(c: number | 'back' | 'ok' | null, e: React.KeyboardEvent) {
    if (disabled || c === null) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const isNum = typeof c === 'number';
      const isBack = c === 'back';
      const isOk = c === 'ok';
      if (isNum) onNum(c as number);
      else if (isBack) onBack();
      else if (isOk && onOk) onOk();
    }
  }

  return (
    <div className="numpad-grid" role="group" aria-label="numpad">
      {cells.map((c, idx) => {
        if (c === null) return <div key={idx} className="numpad-cell" />;

        const isNum = typeof c === 'number';
        const isBack = c === 'back';
        const isOk = c === 'ok';

        if (isOk && !onOk) return <div key={idx} className="numpad-cell" />;

        const btnClass = [
          "numpad-key",
          isBack ? "numpad-key-back" : "",
          pressedIdx === idx ? "pressed" : "",
        ].join(" ").trim();

        return (
          <button
            key={idx}
            type="button"
            aria-label={isNum ? `Number ${c}` : isBack ? 'Backspace' : 'Confirm'}
            className={btnClass}
            // Pointer events for fast & reliable touch/mouse support
            onPointerDown={(e) => handlePointerDown(c, idx, e)}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerCancel}
            onKeyDown={(e) => handleKeyDown(c, e)}
            // keep onClick as fallback for environments without pointer events
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