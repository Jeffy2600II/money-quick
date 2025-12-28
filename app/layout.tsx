'use client';
import '../styles/modern-styles.min.css';
import '../styles/globals.css';
import PopupProvider from '../components/PopupProvider';
import LoaderProvider from '../components/LoaderProvider';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import { SWRConfig } from 'swr';
import { fetchWithTimeout } from '../lib/fetcher';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* preconnect to same origin and common APIs to reduce latency */}
        <link rel="preconnect" href="/" />
      </head>
      <body>
        <SWRConfig
          value={{
            fetcher: (resource: string, init?: any) => fetchWithTimeout(resource, init),
            // sensible defaults for stability and UX
            revalidateOnFocus: false,
            dedupingInterval: 2000, // collapse duplicate requests within 2s
            errorRetryCount: 3,
            errorRetryInterval: 1000,
            focusThrottleInterval: 60000,
            onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
              // exponential backoff but limit retries
              if (retryCount >= 3) return;
              const next = Math.min(30000, 1000 * Math.pow(2, retryCount)); // 1s,2s,4s ...
              setTimeout(() => revalidate({ retryCount: retryCount + 1 }), next);
            },
          }}
        >
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