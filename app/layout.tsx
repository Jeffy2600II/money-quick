'use client';
import '../styles/globals.css';
import PopupProvider from '../components/PopupProvider';
import LoaderProvider from '../components/LoaderProvider';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import { SWRConfig } from 'swr';
import { fetchWithTimeout } from '../lib/fetcher';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <SWRConfig value={{
          fetcher: (resource: string, init?: any) => fetchWithTimeout(resource, init),
          dedupingInterval: 10_000,        // de-duplicate identical requests for 10s
          focusThrottleInterval: 60_000,   // don't revalidate on focus more than once per minute
          revalidateOnFocus: false,        // avoid unnecessary revalidations in mobile
          shouldRetryOnError: false,
          errorRetryCount: 1,
        }}>
          <PopupProvider>
            <LoaderProvider>
              {children}
              <ServiceWorkerRegister />
            </LoaderProvider>
          </PopupProvider>
        </SWRConfig>
      </body>
    </html>
  );
}