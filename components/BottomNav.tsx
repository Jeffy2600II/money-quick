'use client';
import React from "react";

/**
 * BottomNav: fixed at bottom, center FAB for "add/manage", right icon for history,
 * left icon for home. Icons are inline SVGs (copied/pasted into code).
 */

export default function BottomNav() {
  return (
    <nav className="mq-bottom-nav" role="navigation" aria-label="Main navigation">
      <div className="mq-bottom-nav-inner">
        <a href="/" className="mq-bottom-icon" aria-label="หน้าแรก">
          {/* Home icon (simple) */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z" fill="currentColor" />
          </svg>
        </a>

        {/* Center FAB is visually centered and elevated */}
        <a href="/manage" className="mq-bottom-fab" aria-label="เพิ่มรายการ">
          {/* Plus icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        <a href="/history" className="mq-bottom-icon" aria-label="ประวัติ">
          {/* History/clock icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 8v5l3 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12a9 9 0 1 1-3-6.27" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </nav>
  );
}