'use client';
import React, { useRef, useState, useEffect } from "react";

type Props = {
  value ? : number | string;
  onNum: (n: number) => void;
  onBack: () => void;
  onOk ? : () => void;
  showOk ? : boolean;
  disabled ? : boolean;
};

/**
 * Numpad (professional-tuned)
 * - Pointer-based "press & release" interaction (pointerdown + pointerup) with pointer capture
 * - Input queue to ensure order when taps happen very quickly
 * - Long-press repeat for Backspace (like professional apps)
 * - Small vibration feedback when available
 * - Keyboard support (Enter / Space)
 * - Defensive throttling to avoid accidental double-fire
 */
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
  
  // visual pressed index
  const [pressedIndex, setPressedIndex] = useState < number | null > (null);
  
  // pointer tracking (to validate pointerup corresponds to prior pointerdown)
  const activePointerRef = useRef < { pointerId: number;index: number;target: EventTarget | null } | null > (null);
  
  // queue of actions to execute sequentially (prevents lost taps when user taps very fast)
  const actionQueueRef = useRef < Array < () => void >> ([]);
  const processingRef = useRef(false);
  
  // long-press state for backspace repeat
  const longPressTimerRef = useRef < number | null > (null);
  const repeatTimerRef = useRef < number | null > (null);
  
  // small minimum interval between processed actions to avoid double firing (ms)
  const MIN_ACTION_SPACING = 20;
  
  // vibration helper (graceful)
  function haptic() {
    try {
      if (navigator && 'vibrate' in navigator) {
        // short subtle tick
        (navigator as any).vibrate?.(10);
      }
    } catch {}
  }
  
  // enqueue action (will be processed in order)
  function enqueueAction(action: () => void) {
    actionQueueRef.current.push(action);
    processQueue();
  }
  
  async function processQueue() {
    if (processingRef.current) return;
    processingRef.current = true;
    while (actionQueueRef.current.length > 0) {
      const fn = actionQueueRef.current.shift();
      if (!fn) break;
      try {
        fn();
        // ensure minimal spacing so very quick taps still register visually and logically
        await new Promise(res => setTimeout(res, MIN_ACTION_SPACING));
      } catch {
        // swallow
      }
    }
    processingRef.current = false;
  }
  
  function triggerActionForCell(c: number | 'back' | 'ok') {
    if (disabled) return;
    // enqueue actual action to maintain order under rapid input
    if (typeof c === 'number') {
      enqueueAction(() => {
        haptic();
        onNum(c);
      });
    } else if (c === 'back') {
      enqueueAction(() => {
        haptic();
        onBack();
      });
    } else if (c === 'ok' && onOk) {
      enqueueAction(() => {
        haptic();
        onOk();
      });
    }
  }
  
  function handlePointerDown(e: React.PointerEvent, idx: number, c: number | 'back' | 'ok') {
    if (disabled) return;
    setPressedIndex(idx);
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      activePointerRef.current = { pointerId: e.pointerId, index: idx, target: e.target };
    } catch {}
    
    // If backspace, start long-press timer to enable repeating deletes
    if (c === 'back') {
      // after holdDelay ms, start repeating at repeatInterval ms
      const holdDelay = 500;
      const repeatInterval = 120;
      longPressTimerRef.current = window.setTimeout(() => {
        // trigger first repeat immediately then set repeating interval
        triggerActionForCell('back');
        repeatTimerRef.current = window.setInterval(() => {
          triggerActionForCell('back');
        }, repeatInterval);
      }, holdDelay);
    }
  }
  
  function cleanupPointerCapture(e: React.PointerEvent) {
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {}
    activePointerRef.current = null;
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (repeatTimerRef.current) {
      window.clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  }
  
  function handlePointerUp(e: React.PointerEvent, idx: number, c: number | 'back' | 'ok') {
    if (disabled) {
      cleanupPointerCapture(e);
      setPressedIndex(null);
      return;
    }
    const active = activePointerRef.current;
    // Only trigger if pointerup corresponds to the same pointerdown on this button (press & release)
    if (active && active.pointerId === e.pointerId && active.index === idx) {
      // For backspace, if long-press already started, don't trigger an extra single back (we already fired repeats).
      if (c === 'back' && repeatTimerRef.current) {
        // long-press occurred; cleanup only (repeat already fired)
      } else {
        triggerActionForCell(c);
      }
    } else {
      // Fallback: if still pressed index matches, treat as tap
      if (pressedIndex === idx) triggerActionForCell(c);
    }
    cleanupPointerCapture(e);
    // small visual delay so user sees press feedback
    window.requestAnimationFrame(() => {
      setPressedIndex(null);
    });
  }
  
  function handlePointerCancel(e: React.PointerEvent) {
    cleanupPointerCapture(e);
    setPressedIndex(null);
  }
  
  function handlePointerLeave(e: React.PointerEvent, idx: number) {
    // if finger drags out, keep visual pressed but don't auto-trigger;
    // when pointerup occurs elsewhere, pointerup logic will handle/not trigger.
    const active = activePointerRef.current;
    if (!active || active.index !== idx) setPressedIndex(null);
  }
  
  function handleKeyDown(e: React.KeyboardEvent, c: number | 'back' | 'ok') {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      // emulate press visual briefly
      setPressedIndex(-1); // temporary generic pressed
      setTimeout(() => setPressedIndex(null), 120);
      triggerActionForCell(c);
    } else if (c === 'back' && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      triggerActionForCell('back');
    }
  }
  
  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
      if (repeatTimerRef.current) window.clearInterval(repeatTimerRef.current);
      actionQueueRef.current = [];
    };
  }, []);
  
  return (
    <div className="numpad-grid" role="group" aria-label="numpad">
      {cells.map((c, idx) => {
        if (c === null) return <div key={idx} className="numpad-cell" />;

        const isNum = typeof c === 'number';
        const isBack = c === 'back';
        const isOk = c === 'ok';

        if (isOk && !onOk) return <div key={idx} className="numpad-cell" />;

        const ariaDisabled = disabled ? true : undefined;
        const btnClass = [
          "numpad-key",
          isBack ? "numpad-key-back" : "",
          pressedIndex === idx ? "pressed" : "",
        ].join(" ").trim();

        return (
          <button
            key={idx}
            type="button"
            aria-label={isNum ? `Number ${c}` : isBack ? 'Backspace' : 'Confirm'}
            aria-disabled={ariaDisabled}
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
              ? <span className="numpad-key-icon" aria-hidden>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
                    <path d="M20 6a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-11l-5 -5a1.5 1.5 0 0 1 0 -2l5 -5z" />
                    <path d="M12 10l4 4m0 -4l-4 4" />
                  </svg>
                </span>
              : <span className="numpad-key-label">{isNum ? String(c) : '✔'}</span>}
          </button>
        );
      })}
    </div>
  );
}