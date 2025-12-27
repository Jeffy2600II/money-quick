'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import '../styles/loader.css'; // โหลดสไตล์เฉพาะของ loader

type LoaderContextType = {
  show: (message ? : string) => void;
  hide: () => void;
};

/**
 * LoaderContext
 * - useLoader().show('ข้อความ') เพื่อเปิด overlay
 * - useLoader().hide() เพื่อปิด
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
  
  const api = useMemo < LoaderContextType > (() => ({
    show: (msg ? : string) => {
      if (msg) setMessage(msg);
      else setMessage('กำลังโหลด...');
      setVisible(true);
    },
    hide: () => {
      setVisible(false);
      // ไม่รีเซ็ตข้อความ ให้ยังคงข้อความล่าสุดไว้จนกว่าจะมีการเปลี่ยน
    },
  }), []);
  
  return (
    <LoaderContext.Provider value={api}>
      {children}
      {typeof window !== 'undefined' && ReactDOM.createPortal(
        <div className={`mq-loader-root ${visible ? 'visible' : ''}`} aria-hidden={!visible}>
          <div className="mq-loader-backdrop" />
          <div className="mq-loader-card" role="status" aria-live="polite">
            <div className="mq-loader-logo">
              <div className="logo-line1">Money</div>
              <div className="logo-line2">quick</div>
            </div>
            <div className="mq-loader-message">{message}</div>
          </div>
        </div>,
        document.body
      )}
    </LoaderContext.Provider>
  );
}