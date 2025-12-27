'use client';
import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import Numpad from "./Numpad";

/**
 * PinInput (forwardRef)
 * - onSubmit(pin) called when pin complete
 * - expose method triggerError() to flash red on dots and optionally clear / keep input
 *
 * New: accept `disabled` prop (parent can disable the whole input / numpad).
 */
export type PinInputHandle = {
  triggerError: (duration?: number) => void;
};

const PinInput = forwardRef<PinInputHandle, {
  onSubmit: (pin: string) => void | Promise<void | boolean>;
  requiredLength?: number;
  disabled?: boolean;
}>(({ onSubmit, requiredLength = 6, disabled = false }, ref) => {
  const [input, setInput] = useState("");
  const pendingRef = useRef(false);
  const dotsRef = useRef<HTMLDivElement | null>(null);
  const errorTimeoutRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    triggerError(duration = 900) {
      const el = dotsRef.current;
      if (!el) return;
      el.classList.add('pin-error');
      if (errorTimeoutRef.current) {
        window.clearTimeout(errorTimeoutRef.current);
      }
      const id = window.setTimeout(() => {
        el.classList.remove('pin-error');
        errorTimeoutRef.current = null;
      }, duration);
      errorTimeoutRef.current = id;
    }
  }), []);

  useEffect(() => {
    if (input.length === requiredLength && !pendingRef.current && !disabled) {
      const t = setTimeout(() => {
        void submit(input);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [input, requiredLength, disabled]);

  async function submit(pin: string) {
    if (pendingRef.current) return;
    if (disabled) return;
    if (pin.length !== requiredLength) return;
    pendingRef.current = true;
    try {
      const res = await onSubmit(pin);
      if (res === false) {
        // failed -> keep input (page should call triggerError via ref)
      } else {
        // success -> clear input silently
        setInput("");
      }
    } catch {
      // page-level will show popup; keep input
    } finally {
      pendingRef.current = false;
    }
  }

  function handleNum(n: number) {
    if (disabled) return;
    setInput(prev => (prev.length >= requiredLength ? prev : prev + String(n)));
  }
  function handleBack() {
    if (pendingRef.current || disabled) return;
    setInput(prev => prev.slice(0, -1));
  }

  return (
    <div className={`pin-input-root ${disabled ? 'pin-input-disabled' : ''}`}>
      <div className="pin-dots" aria-hidden ref={dotsRef}>
        {Array.from({ length: requiredLength }, (_, i) => {
          const filled = i < input.length;
          return (
            <div key={i} className={`pin-dot ${filled ? "filled" : ""}`} />
          );
        })}
      </div>

      <Numpad
        onNum={handleNum}
        onBack={handleBack}
        onOk={() => submit(input)}
        showOk={false}
        disabled={disabled}
      />
    </div>
  );
});

PinInput.displayName = 'PinInput';
export default PinInput;