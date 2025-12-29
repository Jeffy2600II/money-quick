'use client';
import React, { useEffect, useMemo } from 'react';
import '../styles/modern-styles.min.css';
import '../styles/globals.css';
import PopupProvider from '../components/PopupProvider';
import LoaderProvider from '../components/LoaderProvider';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import { SWRConfig } from 'swr';
import { fetchWithTimeout } from '../lib/fetcher';
import { prefetchKey } from '../lib/prefetch';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  /**
   * SWR configuration (memoized)
   * - provider: separate Map per window (clean, predictable cache lifecycle)
   * - fetcher: uses fetchWithTimeout wrapper (central place for timeout/retries/backoff)
   * - cacheEnabled defaults handled by fetchWithTimeout per-request; here we set sensible SWR defaults
   */
  const swrConfig = useMemo(() => ({
    // global fetcher delegating to fetchWithTimeout (which supports in-memory caching + swr option)
    // fetcher signature: (resource, init) => fetchWithTimeout(...)
    fetcher: (resource: string, init ? : any) => fetchWithTimeout(resource, init),
    provider: () => new Map(), // new Map for client-side cache store
    revalidateOnFocus: false,
    dedupingInterval: 2000, // collapse duplicate requests within 2s
    errorRetryCount: 3,
    errorRetryInterval: 1000,
    focusThrottleInterval: 60_000,
    // onErrorRetry: exponential backoff with limit
    onErrorRetry: (error: any, key: string, config: any, revalidate: any, { retryCount }: { retryCount: number }) => {
      if (retryCount >= 3) return;
      const next = Math.min(30_000, 1000 * Math.pow(2, retryCount)); // 1s,2s,4s...
      setTimeout(() => revalidate({ retryCount: retryCount + 1 }), next);
    },
  }), []);
  
  // Warm some critical keys on first client mount to reduce perceived latency.
  // We intentionally do lightweight prefetch (non-blocking).
  useEffect(() => {
    // Don't block render; prefetch in background.
    void(async () => {
      try {
        // prefetch commonly used endpoints to warm SWR/global fetch cache + service worker cache if applicable
        await Promise.all([
          prefetchKey('/api/balance', { cacheEnabled: true, ttl: 30_000, swr: true }).catch(() => null),
          prefetchKey('/api/history', { cacheEnabled: true, ttl: 30_000, swr: true }).catch(() => null),
          prefetchKey('/api/config', { cacheEnabled: true, ttl: 30_000, swr: true }).catch(() => null),
        ]);
      } catch {
        // ignore prefetch errors — don't break UI
      }
    })();
  }, []);
  
  return (
    <html lang="th">
      <head>
        {/* Preconnect to font origin to reduce font load latency */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body>
        <SWRConfig value={swrConfig}>
          <PopupProvider>
            <LoaderProvider>
              {children}
              <ServiceWorkerRegister />
              {/* BottomNav intentionally not global — pages render when needed */}
            </LoaderProvider>
          </PopupProvider>
        </SWRConfig>
      </body>
    </html>
  );
}