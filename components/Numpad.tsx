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

  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  /**
   * activePointerRef stores:
   *  - pointerId, index, target
   *  - startX/startY
   *  - startTime
   *  - cancelled (bool)
   *  - candidateSince (timestamp) when movement first crossed cancel criteria
   *  - buttonRect: DOMRect of the button at pointerdown time
   */
  const activePointerRef = useRef<{
    pointerId: number;
    index: number;
    target: EventTarget | null;
    startX: number;
    startY: number;
    startTime: number;
    cancelled: boolean;
    candidateSince: number | null;
    buttonRect: DOMRect | null;
  } | null>(null);

  function triggerActionForCell(c: number | 'back' | 'ok') {
    if (disabled) return;
    if (typeof c === 'number') onNum(c);
    else if (c === 'back') onBack();
    else if (c === 'ok' && onOk) onOk();
  }

  function handlePointerDown(e: React.PointerEvent, idx: number, c: number | 'back' | 'ok') {
    if (disabled) return;
    setPressedIndex(idx);
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {}
    // capture button rect at the start
    let rect: DOMRect | null = null;
    try {
      rect = (e.target as Element).getBoundingClientRect();
    } catch {}
    activePointerRef.current = {
      pointerId: e.pointerId,
      index: idx,
      target: e.target,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      cancelled: false,
      candidateSince: null,
      buttonRect: rect,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const active = activePointerRef.current;
    if (!active) return;
    if (e.pointerId !== active.pointerId) return;

    const dx = e.clientX - active.startX;
    const dy = e.clientY - active.startY;

    /**
     * Conservative (harder-to-cancel) thresholds and rules:
     * - Vertical threshold relatively large (VERTICAL_CANCEL_THRESHOLD)
     * - Horizontal threshold large (HORIZONTAL_CANCEL_THRESHOLD)
     * - Allow small movement inside an extended button rect (EXTEND_MARGIN)
     * - Require movement to be sustained for SUSTAIN_MS before cancelling
     */
    const VERTICAL_CANCEL_THRESHOLD = 40;    // px (bigger -> harder to cancel)
    const HORIZONTAL_CANCEL_THRESHOLD = 120; // px (bigger -> harder to cancel)
    const EXTEND_MARGIN = 22;                // px: allow this extra leeway around button
    const SUSTAIN_MS = 90;                   // ms: must hold movement beyond threshold for this long

    // If buttonRect is available, compute extended rect
    const rect = active.buttonRect;
    let insideExtendedRect = true;
    if (rect) {
      insideExtendedRect = (
        e.clientX >= rect.left - EXTEND_MARGIN &&
        e.clientX <= rect.right + EXTEND_MARGIN &&
        e.clientY >= rect.top - EXTEND_MARGIN &&
        e.clientY <= rect.bottom + EXTEND_MARGIN
      );
    }

    // Determine cancel reason(s)
    let verticalCancel = false;
    if (Math.abs(dy) > VERTICAL_CANCEL_THRESHOLD && Math.abs(dy) > Math.abs(dx) * 1.3) {
      verticalCancel = true;
    }
    let horizontalCancel = false;
    if (Math.abs(dx) > HORIZONTAL_CANCEL_THRESHOLD) {
      horizontalCancel = true;
    }
    let outOfBoundsCancel = !insideExtendedRect;

    // Final cancel: only if any cancel condition true AND sustained OR clearly out of extended bounds
    if ((verticalCancel || horizontalCancel || outOfBoundsCancel)) {
      const now = Date.now();
      // immediate cancel if pointer is far outside extended rect (strong signal)
      const FAR_OUT_MARGIN = 96;
      if (rect && (e.clientX < rect.left - FAR_OUT_MARGIN || e.clientX > rect.right + FAR_OUT_MARGIN || e.clientY < rect.top - FAR_OUT_MARGIN || e.clientY > rect.bottom + FAR_OUT_MARGIN)) {
        active.cancelled = true;
        setPressedIndex(null);
        try { (active.target as Element)?.releasePointerCapture?.(active.pointerId); } catch {}
        activePointerRef.current = active;
        return;
      }

      // otherwise check sustain: set candidateSince if not set
      if (!active.candidateSince) {
        active.candidateSince = now;
      } else if (now - active.candidateSince >= SUSTAIN_MS) {
        // sustained beyond threshold -> cancel
        active.cancelled = true;
        setPressedIndex(null);
        try { (active.target as Element)?.releasePointerCapture?.(active.pointerId); } catch {}
        activePointerRef.current = active;
        return;
      }
    } else {
      // no cancel condition — reset candidate timer
      active.candidateSince = null;
      // keep pressedIndex as is
    }
  }

  function handlePointerUp(e: React.PointerEvent, idx: number, c: number | 'back' | 'ok') {
    const active = activePointerRef.current;
    if (!active) {
      setPressedIndex(null);
      return;
    }

    // Trigger only when not cancelled, and pointer matches the recorded one
    if (!active.cancelled && active.pointerId === e.pointerId && active.index === idx) {
      triggerActionForCell(c);
    } else {
      // fallback: if not cancelled and released over same visual button, allow it
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
    // don't aggressively clear pressed visual — user may return finger quickly.
    const active = activePointerRef.current;
    if (!active || active.index !== idx) {
      // small delay could be introduced but keep simple: just clear visual
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