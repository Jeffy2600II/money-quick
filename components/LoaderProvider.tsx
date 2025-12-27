'use client';

import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import '../styles/loader.css'; // โหลดสไตล์เฉพาะของ loader

type LoaderOptions = {
  minDurationMs ? : number;
};

type LoaderContextType = {
  show: (message ? : string, opts ? : LoaderOptions) => void;
  hide: (force ? : boolean) => void;
  setDefaultMinDuration: (ms: number) => void;
};

/**
 * LoaderContext
 * - useLoader().show('ข้อความ') เพื่อเปิด overlay
 * - useLoader().hide() เพื่อปิด (แต่จะรับประกันการแสดงอย่างน้อย minDuration)
 * - useLoader().show(..., { minDurationMs: 600 }) เพื่อปรับเวลาเฉพาะการเรียกครั้งนั้น
 * - useLoader().setDefaultMinDuration(ms) เพื่อเปลี่ยนค่าเริ่มต้น (ms)
 */
const LoaderContext = createContext < LoaderContextType | null > (null);

export function useLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error('useLoader must be used within LoaderProvider');
  return ctx;
}

export default function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState < string | undefined > ('กำลังโหลด...');
  
  // Default minimum display duration (ms). Set to 800ms as requested.
  const defaultMinDurationRef = useRef < number > (800);
  
  // timestamp when loader was last shown
  const lastShownAtRef = useRef < number > (0);
  // current min duration for the active show (may be overridden per-call)
  const currentMinDurationRef = useRef < number > (defaultMinDurationRef.current);
  
  // scheduled hide timeout id
  const scheduledHideRef = useRef < number | null > (null);
  
  function clearScheduledHide() {
    if (scheduledHideRef.current) {
      window.clearTimeout(scheduledHideRef.current);
      scheduledHideRef.current = null;
    }
  }
  
  const api = useMemo < LoaderContextType > (() => ({
    show: (msg ? : string, opts ? : LoaderOptions) => {
      if (msg) setMessage(msg);
      else setMessage('กำลังโหลด...');
      
      // set min duration for this show call (fallback to default)
      currentMinDurationRef.current = opts?.minDurationMs ?? defaultMinDurationRef.current;
      
      // record shown time and show immediately
      lastShownAtRef.current = Date.now();
      
      // clear any pending hide so we won't prematurely hide
      clearScheduledHide();
      
      setVisible(true);
    },
    
    hide: (force: boolean = false) => {
      // If force requested, hide immediately
      if (force) {
        clearScheduledHide();
        setVisible(false);
        return;
      }
      
      // compute elapsed time since shown
      const elapsed = Date.now() - (lastShownAtRef.current || 0);
      const required = currentMinDurationRef.current ?? defaultMinDurationRef.current;
      const remaining = required - elapsed;
      
      if (remaining <= 0) {
        // satisfied min duration, hide now
        clearScheduledHide();
        setVisible(false);
      } else {
        // schedule hide after remaining time
        clearScheduledHide();
        scheduledHideRef.current = window.setTimeout(() => {
          scheduledHideRef.current = null;
          setVisible(false);
        }, remaining);
      }
    },
    
    setDefaultMinDuration: (ms: number) => {
      defaultMinDurationRef.current = Math.max(0, Math.floor(ms));
    },
  }), []);
  
  // Clean up scheduled timer if provider unmounts
  React.useEffect(() => {
    return () => {
      if (scheduledHideRef.current) {
        window.clearTimeout(scheduledHideRef.current);
        scheduledHideRef.current = null;
      }
    };
  }, []);
  
  return (
    <LoaderContext.Provider value={api}>
      {children}
      {/* Render overlay directly (no portal) — position:fixed + high z-index ensures it sits above content */}
      <div className={`mq-loader-root ${visible ? 'visible' : ''}`} aria-hidden={!visible}>
        <div className="mq-loader-backdrop" />
        <div className="mq-loader-card" role="status" aria-live="polite">
          {/* Use the same logo DOM structure as the rest of the app so global styles apply */}
          <div className="logo">
            <div className="logo-line1">Money</div>
            <div className="logo-line2">quick</div>
          </div>
          <div className="mq-loader-message">{message}</div>
        </div>
      </div>
    </LoaderContext.Provider>
  );
}