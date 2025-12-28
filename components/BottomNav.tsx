'use client';
import React, { useEffect, useRef, useState } from "react";

/**
 * BottomNav (revised)
 * - Structure & behaviour adapted to the modern-navigation example you provided:
 *   - Renders nav items with .nav-item, .svg-wrapper and .label so CSS animations (::before etc.) work
 *   - Keeps center FAB as before (unchanged look/position)
 *   - No "home" button (left slot intentionally empty as requested)
 *   - Active item gets 'active-1' class; svg-wrapper receives temporary 'animate' class on click to trigger ripple
 *   - Basic hide-on-scroll behaviour (mobile): hide nav when scrolling down, show when scrolling up
 *
 * Notes:
 * - This is a focused, lightweight port of the important behaviours from modern-navigation.min.js
 *   (active state, ripple/animate, hide-on-scroll). If you want the full feature set (config JSON,
 *   left-rail mounting, language changes, external commands), I can add that next.
 */

const NAV_ITEMS = [
  // Left slot omitted by design (placeholder handled in markup)
  // Right / primary actions:
  {
    key: "history",
    url: "/history",
    label: "ประวัติ",
    // inline SVG (stroke uses currentColor so CSS can recolor it)
    svg: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 8v5l3 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12a9 9 0 1 1-3-6.27" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  // you can add more nav items here if needed (settings etc.)
];

export default function BottomNav() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef<number>(typeof window !== "undefined" ? window.scrollY : 0);
  const ticking = useRef(false);
  const touchActive = useRef(false);

  useEffect(() => {
    // set active item based on pathname on mount
    function resolveActive() {
      if (typeof window === "undefined") return;
      const path = window.location.pathname || "/";
      const found = NAV_ITEMS.find(i => path.startsWith(i.url));
      setActiveKey(found ? found.key : null);
    }
    resolveActive();

    // hide-on-scroll / show-on-scroll behaviour
    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        const current = window.scrollY;
        const delta = current - (lastScrollY.current || 0);
        // if user is touching (mobile) allow same behaviour but be a bit gentler
        if (Math.abs(delta) > 6) {
          if (delta > 0) {
            // scrolling down -> hide
            setVisible(false);
          } else {
            // scrolling up -> show
            setVisible(true);
          }
          lastScrollY.current = current;
        }
        ticking.current = false;
      });
    }

    function onTouchStart() { touchActive.current = true; lastScrollY.current = window.scrollY; }
    function onTouchEnd() { touchActive.current = false; }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // helper: animate svg-wrapper on click, and set active class
  function handleNavClick(e: React.MouseEvent, itemKey: string) {
    // find the svg-wrapper inside the clicked element and add .animate temporarily
    const el = (e.currentTarget as HTMLElement);
    const wrapper = el.querySelector<HTMLElement>(".svg-wrapper");
    if (wrapper) {
      wrapper.classList.remove("animate");
      // force reflow to restart animation
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      wrapper.offsetWidth;
      wrapper.classList.add("animate");
    }
    setActiveKey(itemKey);
    // allow normal navigation via anchor href (no preventDefault)
  }

  return (
    <nav
      className="bottom-nav"
      role="navigation"
      aria-label="Main navigation"
      // hide by translating down when not visible (CSS will manage transform)
      style={{ transform: visible ? undefined : "translateY(110%)", transition: "transform 300ms ease" }}
    >
      {/* left placeholder (hidden) to keep center fab visually centered) */}
      <div style={{ width: 50 }} aria-hidden />

      {/* center FAB (unchanged visual per request) */}
      <a href="/manage" className="mq-bottom-fab" aria-label="เพิ่มรายการ">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      {/* right-side nav items (render in order) */}
      <div style={{ display: "flex", gap: 6 }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeKey === item.key;
          return (
            <a
              key={item.key}
              href={item.url}
              className={`nav-item ${isActive ? "active-1" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => handleNavClick(e, item.key)}
            >
              <div className="svg-wrapper" aria-hidden>
                {item.svg}
                {/* ripple element is not required here because CSS uses ::before on .svg-wrapper */}
              </div>
              <span className="label">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}