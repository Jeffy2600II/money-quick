'use client';
import React, { useRef, useState } from "react";

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

  // pressedIndex for styling feedback
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  /**
   * activePointerRef stores per-active-pointer info:
   * { pointerId, index, target, startX, startY, cancelled }
   * - cancelled becomes true when we detect a vertical drag (possible pull-to-refresh)
   *   or when movement indicates the user intends to scroll/drag away.
   */
  const activePointerRef = useRef<{
    pointerId: number;
    index: number;
    target: EventTarget | null;
    startX: number;
    startY: number;
    cancelled: boolean;
  } | null>(null);

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
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}
    activePointerRef.current = {
      pointerId: e.pointerId,
      index: idx,
      target: e.target,
      startX: e.clientX,
      startY: e.clientY,
      cancelled: false,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const active = activePointerRef.current;
    if (!active) return;
    if (e.pointerId !== active.pointerId) return;

    const dx = e.clientX - active.startX;
    const dy = e.clientY - active.startY;

    // Increased thresholds to make cancellation less sensitive:
    // - Vertical movement must exceed VERTICAL_CANCEL_THRESHOLD (px) AND be clearly more vertical than horizontal.
    // - Horizontal movement must exceed HORIZONTAL_CANCEL_THRESHOLD (px).
    const VERTICAL_CANCEL_THRESHOLD = 28; // increased from 12 -> harder to cancel by slight vertical drag
    const HORIZONTAL_CANCEL_THRESHOLD = 96; // increased from 48 -> harder to cancel by slight horizontal move

    if (!active.cancelled && Math.abs(dy) > VERTICAL_CANCEL_THRESHOLD && Math.abs(dy) > Math.abs(dx) * 1.2) {
      // Consider it a deliberate vertical gesture (pull-to-refresh / scroll) only if vertical dominates
      active.cancelled = true;
      setPressedIndex(null);
      try {
        (active.target as Element)?.releasePointerCapture?.(active.pointerId);
      } catch {}
      activePointerRef.current = active;
      return;
    }

    if (!active.cancelled && Math.abs(dx) > HORIZONTAL_CANCEL_THRESHOLD) {
      active.cancelled = true;
      setPressedIndex(null);
      try {
        (active.target as Element)?.releasePointerCapture?.(active.pointerId);
      } catch {}
      activePointerRef.current = active;
      return;
    }
  }

  function handlePointerUp(e: React.PointerEvent, idx: number, c: number | 'back' | 'ok') {
    const active = activePointerRef.current;
    // If no active pointer, maybe pointerup fired after pointercancel; ignore
    if (!active) {
      setPressedIndex(null);
      return;
    }

    // Only trigger if this pointer is the same and not cancelled and index matches
    if (!active.cancelled && active.pointerId === e.pointerId && active.index === idx) {
      triggerActionForCell(c);
    } else {
      // If released over the same element even without capture, and not cancelled, allow it
      if (!active.cancelled && idx === pressedIndex) {
        triggerActionForCell(c);
      }
    }

    cleanupPointerCaptureByInfo(active);
    setPressedIndex(null);
    activePointerRef.current = null;
  }

  function handlePointerCancel(e: React.PointerEvent) {
    const active = activePointerRef.current;
    if (active) {
      cleanupPointerCaptureByInfo(active);
    } else {
      try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {}
    }
    activePointerRef.current = null;
    setPressedIndex(null);
  }

  function handlePointerLeave(e: React.PointerEvent, idx: number) {
    // If pointer moves outside the button quickly, we keep visual feedback lightly,
    // but do not auto-trigger. The pointermove logic will cancel for large movements.
    const active = activePointerRef.current;
    if (!active || active.index !== idx) {
      setPressedIndex(null);
    }
  }

  function cleanupPointerCaptureByInfo(info: { pointerId: number; target: EventTarget | null; index?: number }) {
    try {
      (info.target as Element)?.releasePointerCapture?.(info.pointerId);
    } catch {}
  }

  function handleKeyDown(e: React.KeyboardEvent, c: number | 'back' | 'ok') {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      triggerActionForCell(c);
    }
  }

  return (
    <div className="numpad-grid" role="group" aria-label="numpad" onPointerMove={handlePointerMove}>
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