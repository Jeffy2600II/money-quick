'use client';

import { useEffect } from 'react';

/**
 * PreventPullToRefresh
 * - Globally prevents pull-to-refresh / overscroll refresh on mobile browsers.
 * - Uses CSS (overscroll-behavior) + touchmove prevention for iOS fallback.
 *
 * Usage: mount this in your RootLayout (inside body) once.
 */
export default function PreventPullToRefresh() {
  useEffect(() => {
    let startY = 0;
    
    function onTouchStart(e: TouchEvent) {
      if (e.touches && e.touches.length > 0) {
        startY = e.touches[0].clientY;
      } else {
        startY = 0;
      }
    }
    
    function onTouchMove(e: TouchEvent) {
      // Only run on single-finger gestures
      if (!e.touches || e.touches.length > 1) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      // scrollingElement is the page scroll container
      const scroller = document.scrollingElement || document.documentElement;
      
      // If we're at the top and user is pulling down (diff > 0), prevent default to stop pull-to-refresh
      if ((scroller && scroller.scrollTop === 0) && diff > 0) {
        // preventDefault requires passive: false when adding listener
        e.preventDefault();
      }
    }
    
    // Add listeners: touchstart can be passive, touchmove must be non-passive to allow preventDefault
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove as EventListener, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove as EventListener);
    };
  }, []);
  
  return null;
}