'use client';
import React, { useRef, useState } from "react";

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
  
  // pressedIndex for styling feedback
  const [pressedIndex, setPressedIndex] = useState < number | null > (null);
  // store active pointer id & target to validate pointerup
  const activePointerRef = useRef < { pointerId: number;index: number;target: EventTarget | null } | null > (null);
  
  function triggerActionForCell(c: number | 'back' | 'ok') {
    if (disabled) return;
    if (typeof c === 'number') onNum(c);
    else if (c === 'back') onBack();
    else if (c === 'ok' && onOk) onOk();
  }
  
  function handlePointerDown(e: React.PointerEvent, idx: number, c: number | 'back' | 'ok') {
    if (disabled) return;
    // mark pressed for style
    setPressedIndex(idx);
    try {
      // capture pointer so we still get pointerup even if finger moves slightly
      (e.target as Element).setPointerCapture?.(e.pointerId);
      activePointerRef.current = { pointerId: e.pointerId, index: idx, target: e.target };
    } catch {}
  }
  
  function handlePointerUp(e: React.PointerEvent, idx: number, c: number | 'back' | 'ok') {
    if (disabled) {
      cleanupPointerCapture(e);
      return;
    }
    const active = activePointerRef.current;
    // if the pointerup belongs to the same pointer that pressed and the index matches, trigger
    if (active && active.pointerId === e.pointerId && active.index === idx) {
      triggerActionForCell(c);
    } else {
      // If not captured (different pointer) but the up happened on same button, still trigger
      if (idx === pressedIndex) {
        triggerActionForCell(c);
      }
    }
    cleanupPointerCapture(e);
    setPressedIndex(null);
  }
  
  function handlePointerCancel(e: React.PointerEvent) {
    cleanupPointerCapture(e);
    setPressedIndex(null);
  }
  
  function handlePointerLeave(e: React.PointerEvent, idx: number) {
    // If pointer leaves the button area, we can keep pressed visual but avoid firing on up unless pointer is returned.
    // We'll not change pressedIndex here; rely on pointerup/cancel to clean up.
    // However, if pointerId isn't captured we can clear visual feedback:
    const active = activePointerRef.current;
    if (!active || active.index !== idx) setPressedIndex(null);
  }
  
  function cleanupPointerCapture(e: React.PointerEvent) {
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
    activePointerRef.current = null;
  }
  
  function handleKeyDown(e: React.KeyboardEvent, c: number | 'back' | 'ok') {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      triggerActionForCell(c);
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

        const btnClass = `numpad-key ${isBack ? 'numpad-key-back' : ''} ${pressedIndex === idx ? 'pressed' : ''}`;

        return (
          <button
            key={idx}
            type="button"
            aria-label={isNum ? `Number ${c}` : isBack ? 'Backspace' : 'Confirm'}
            className={btnClass}
            onPointerDown={(e) => handlePointerDown(e, idx, c)}
            onPointerUp={(e) => handlePointerUp(e, idx, c)}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={(e) => handlePointerLeave(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, c)}
            disabled={disabled}
            // Improve a11y: allow focus for keyboard users
            tabIndex={disabled ? -1 : 0}
          >
            {isBack
              ? <span className="numpad-key-icon" aria-hidden><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}><path d="M20 6a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-11l-5 -5a1.5 1.5 0 0 1 0 -2l5 -5z" /><path d="M12 10l4 4m0 -4l-4 4" /></svg></span>
              : <span className="numpad-key-label">{isNum ? String(c) : '✔'}</span>}
          </button>
        );
      })}
    </div>
  );
}