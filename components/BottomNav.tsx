'use client';
import React from "react";

/**
 * BottomNav adapted to use the modern-styles.min.css conventions.
 * - Uses .bottom-nav, .nav-item, .svg-wrapper, .label
 * - Center FAB is kept as before (mq-bottom-fab) and not changed (per request).
 * - The "home" button is removed (left slot intentionally empty/hidden).
 * - Right slot contains "history" icon (with label).
 */

export default function BottomNav() {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {/* left slot intentionally omitted (home button removed per request).
          Provide a hidden placeholder to help center the FAB visually on some devices. */}
      <button className="nav-item" aria-hidden style={{ visibility: 'hidden', pointerEvents: 'none' }}>
        <div className="svg-wrapper" />
        <span className="label" />
      </button>

      {/* Center FAB (unchanged visual: kept as mq-bottom-fab from earlier) */}
      <a href="/manage" className="mq-bottom-fab" aria-label="เพิ่มรายการ">
        {/* Plus icon (kept as before) */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      {/* Right: History */}
      <a href="/history" className="nav-item" aria-label="ประวัติ">
        <div className="svg-wrapper" aria-hidden>
          {/* Clock / history icon (inline SVG copied for offline use) */}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 8v5l3 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12a9 9 0 1 1-3-6.27" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="label">ประวัติ</span>
      </a>
    </nav>
  );
}