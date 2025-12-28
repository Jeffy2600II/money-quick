'use client';
import '../styles/globals.css';
import PopupProvider from '../components/PopupProvider';
import LoaderProvider from '../components/LoaderProvider';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import { SWRConfig } from 'swr';
import { fetchWithTimeout } from '../lib/fetcher';
import BottomNav from '../components/BottomNav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        {/* If you have a dedicated API hostname, consider adding preconnect here:
            <link rel="preconnect" href="https://api.example.com" />
        */}
      </head>
      <body>
        <SWRConfig value={{ fetcher: (resource: string, init?: any) => fetchWithTimeout(resource, init) }}>
          <PopupProvider>
            <LoaderProvider>
              {children}
              <ServiceWorkerRegister />
              {/* Bottom navigation stays fixed across the app */}
              <BottomNav />
            </LoaderProvider>
          </PopupProvider>
        </SWRConfig>
      </body>
    </html>
  );
}