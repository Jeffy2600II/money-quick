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
      <head />
      <body>
        <SWRConfig value={{ fetcher: (resource: string, init?: any) => fetchWithTimeout(resource, init) }}>
          <PopupProvider>
            <LoaderProvider>
              {children}
              <ServiceWorkerRegister />
              {/* Note: BottomNav intentionally removed from global layout.
                  Pages that require the bottom navigation (e.g. dashboard) should render it themselves. */}
            </LoaderProvider>
          </PopupProvider>
        </SWRConfig>
      </body>
    </html>
  );
}