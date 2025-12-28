'use client';
import React, { useRef, useState, useEffect } from "react";

type Props = {
  // legacy callbacks (per-key)
  onNum ? : (n: number) => void;
  onBack ? : () => void;
  onOk ? : () => void;
  // controlled value mode (preferred for numeric inputs)
  value ? : string; // if provided, component acts controlled
  onChange ? : (v: string) => void;
  // visual / behaviour options
  variant ? : 'pin' | 'tiled'; // pin: round keys (existing); tiled: grid with borders
  showOk ? : boolean;
  showClear ? : boolean;
  showDot ? : boolean;
  okLabel ? : string;
  disabled ? : boolean;
  maxDecimals ? : number;
  maxLength ? : number;
  className ? : string;
};

export default function Numpad({
  onNum,
  onBack,
  onOk,
  value,
  onChange,
  variant = 'pin',
  showOk = true,
  showClear = false,
  showDot = true,
  okLabel = '✔',
  disabled = false,
  maxDecimals = 2,
  maxLength = 15,
  className,
}: Props) {
  // internal state when uncontrolled
  const [internal, setInternal] = useState < string > ('');
  const val = value !== undefined ? value : internal;
  
  useEffect(() => {
    if (value !== undefined) return;
    // keep internal as '0' or '' consistent? start empty
    setInternal('');
  }, [value]);
  
  // helper for emitting change (controlled or not)
  function emitChange(next: string) {
    if (value !== undefined && onChange) {
      onChange(next);
    } else {
      setInternal(next);
      if (onChange) onChange(next); // also call onChange in uncontrolled if supplied
    }
  }
  
  // action helpers for legacy callbacks
  function triggerActionForCell(c: number | 'back' | 'ok' | 'clear' | 'dot') {
    if (disabled) return;
    if (typeof c === 'number') {
      if (onNum) onNum(c);
      // also update controlled string if present
      const next = appendDigit(val ?? '', String(c));
      emitChange(next);
    } else if (c === 'back') {
      if (onBack) onBack();
      emitChange((val ?? '').slice(0, -1));
    } else if (c === 'ok') {
      if (onOk) onOk();
    } else if (c === 'clear') {
      emitChange('');
    } else if (c === 'dot') {
      emitChange(handleDot(val ?? ''));
    }
  }
  
  function appendDigit(prev: string, digit: string) {
    // validation rules:
    // - limit total length
    // - allow one dot, maxDecimals digits after dot
    // - avoid leading zeros like "00" except "0" -> "0x"
    if (!prev) return digit;
    if (prev.includes('.')) {
      const [i, f] = prev.split('.');
      if ((f || '').length >= maxDecimals) return prev;
    }
    if (prev.length >= maxLength) return prev;
    if (prev === '0' && digit === '0') return prev;
    if (prev === '0' && digit !== '.') return digit; // replace leading zero
    return prev + digit;
  }
  
  function handleDot(v: string) {
    if (!showDot) return v;
    if (v.includes('.')) return v;
    if (!v) return '0.';
    if (v.length >= maxLength) return v;
    return v + '.';
  }
  
  // keyboard support for accessibility
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (disabled) return;
      if (/\d/.test(e.key)) {
        triggerActionForCell(Number(e.key));
      } else if (e.key === 'Backspace') {
        triggerActionForCell('back');
      } else if (e.key === 'Enter') {
        triggerActionForCell('ok');
      } else if ((e.key === '.' || e.key === ',') && showDot) {
        triggerActionForCell('dot');
      } else if (e.key === 'Escape') {
        // no-op here; overlay should handle escape
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [val, disabled, showDot]);
  
  // layout cells for tiled variant (3x4 grid)
  const tiledCells: Array < number | 'clear' | 'back' | 'ok' | null > = [
    1, 2, 3,
    4, 5, 6,
    7, 8, 9,
    showClear ? 'clear' : null, 0, 'back'
  ];
  
  return (
    <div className={`numpad-root ${variant === 'tiled' ? 'numpad-tiled' : 'numpad-pin'} ${className ?? ''}`} role="group" aria-label="numpad">
      {/* display (only when acting as standalone numeric input) */}
      {onChange && (
        <div className="numpad-display" aria-live="polite">
          {val === '' ? <span className="muted">0</span> : val}
        </div>
      )}

      {variant === 'pin' ? (
        <div className="numpad-grid-pin" role="group">
          {[
            1,2,3,
            4,5,6,
            7,8,9,
            showOk ? 'ok' : null, 0, 'back'
          ].map((c, idx) => {
            if (c === null) return <div key={idx} className="numpad-cell" />;
            const isNum = typeof c === 'number';
            const isBack = c === 'back';
            const isOk = c === 'ok';
            const btnClass = `numpad-key ${isBack ? 'numpad-key-back' : ''}`;
            if (isOk && !showOk) return <div key={idx} className="numpad-cell" />;
            return (
              <button
                key={idx}
                type="button"
                className={btnClass}
                onClick={() => triggerActionForCell(isNum ? c as number : (c as 'back' | 'ok'))}
                aria-label={isNum ? `Number ${c}` : isBack ? 'Backspace' : 'Confirm'}
                disabled={disabled}
              >
                <span className="numpad-key-label">{isNum ? String(c) : isBack ? '⌫' : okLabel}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="numpad-grid-tiled" role="group">
          {tiledCells.map((c, idx) => {
            if (c === null) return <div key={idx} className="numpad-cell-tiled empty" />;
            if (c === 'clear') {
              return (
                <button key={idx} className="numpad-key-tiled action" onClick={() => triggerActionForCell('clear')} aria-label="ล้าง" disabled={disabled}>
                  ล้าง
                </button>
              );
            }
            if (c === 'back') {
              return (
                <button key={idx} className="numpad-key-tiled action" onClick={() => triggerActionForCell('back')} aria-label="ลบ" disabled={disabled}>
                  ⌫
                </button>
              );
            }
            // numeric
            return (
              <button key={idx} className="numpad-key-tiled" onClick={() => triggerActionForCell(c as number)} aria-label={`ตัวเลข ${c}`} disabled={disabled}>
                {c}
              </button>
            );
          })}
        </div>
      )}

      {/* bottom controls for tiled variant: dot + OK */}
      {variant === 'tiled' && (
        <div className="numpad-tiled-bottom">
          {showDot && <button className="numpad-dot" onClick={() => triggerActionForCell('dot')} aria-label="จุดทศนิยม" disabled={disabled}>.</button>}
          <div style={{ flex: 1 }} />
          <button className="numpad-ok" onClick={() => triggerActionForCell('ok')} aria-label="ตกลง" disabled={disabled}>{okLabel}</button>
        </div>
      )}
    </div>
  );
}