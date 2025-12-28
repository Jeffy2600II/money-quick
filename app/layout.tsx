'use client';
import '../styles/modern-styles.min.css'; // <-- ensure bottom-nav styles are loaded app-wide
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
              {/* Note: BottomNav component intentionally NOT rendered here.
                  Pages that need the bottom navigation should import and render it themselves.
                  modern-styles.min.css is imported above so BottomNav will be styled correctly
                  when a page chooses to render it. */}
            </LoaderProvider>
          </PopupProvider>
        </SWRConfig>
      </body>
    </html>
  );
}