'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const url = '/sw.js';
      // Register when page is stable
      const doRegister = async () => {
        try {
          const reg = await navigator.serviceWorker.register(url, { scope: '/' });
          // console.log('Service worker registered', reg);
        } catch (e) {
          // console.warn('SW registration failed', e);
        }
      };
      
      // register after load to avoid blocking
      if (document.readyState === 'complete') doRegister();
      else window.addEventListener('load', doRegister);
    }
  }, []);
  
  return null;
}