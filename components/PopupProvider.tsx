'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import '../styles/popup.css';

type PopupOptions = {
  duration ? : number; // ms, default 2500
};

type PopupContextType = {
  show: (message: string, opts ? : PopupOptions) => void;
  hide: () => void;
};

const PopupContext = createContext < PopupContextType | null > (null);

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error('usePopup must be used within PopupProvider');
  return ctx;
}

/**
 * PopupProvider: provide show/hide for transient popups (toast-like)
 * - popups do not shift layout (fixed overlay)
 * - default auto-dismiss (duration), can be overridden
 */
export default function PopupProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [timeoutId, setTimeoutId] = useState < number | null > (null);
  
  const api = useMemo < PopupContextType > (() => ({
    show(msg: string, opts ? : PopupOptions) {
      const duration = opts?.duration ?? 2500;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      setMessage(msg);
      setVisible(true);
      const id = window.setTimeout(() => {
        setVisible(false);
        setTimeoutId(null);
      }, duration);
      setTimeoutId(id);
    },
    hide() {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        setTimeoutId(null);
      }
      setVisible(false);
    },
  }), [timeoutId]);
  
  return (
    <PopupContext.Provider value={api}>
      {children}
      <div className={`mq-popup-root ${visible ? 'visible' : ''}`} aria-hidden={!visible} role="status" aria-live="polite">
        <div className="mq-popup-card">
          <div className="mq-popup-message">{message}</div>
        </div>
      </div>
    </PopupContext.Provider>
  );
}