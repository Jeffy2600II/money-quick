'use client';
import '../styles/globals.css';
import PopupProvider from '../components/PopupProvider';
import LoaderProvider from '../components/LoaderProvider';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import PreventPullToRefresh from '../components/PreventPullToRefresh';
import { SWRConfig } from 'swr';
import { fetchWithTimeout } from '../lib/fetcher';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* If you have a dedicated API hostname, consider adding preconnect here:
            <link rel="preconnect" href="https://api.example.com" />
            (left out because origin may be same)
        */}
      </head>
      <body>
        {/* Prevent pull-to-refresh / overscroll gesture on supported browsers */}
        <PreventPullToRefresh />

        <SWRConfig value={{ fetcher: (resource: string, init?: any) => fetchWithTimeout(resource, init) }}>
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