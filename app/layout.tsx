'use client';
import '../styles/modern-styles.min.css';
import '../styles/globals.css';
import PopupProvider from '../components/PopupProvider';
import LoaderProvider from '../components/LoaderProvider';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import { SWRConfig } from 'swr';
import { fetchWithTimeout } from '../lib/fetcher';

/**
 * RootLayout with an inline optimistic auth check that runs as early as possible.
 * - Fast path: if no local session PIN -> redirect to /lock immediately.
 * - If local PIN exists -> reveal page immediately (optimistic) and verify in background.
 *   If verification fails, remove local PIN and redirect to /lock.
 *
 * Notes:
 * - Pages that should skip auth (e.g. /lock, /setup-pin, /api) are excluded.
 * - This approach prioritizes perceived speed while keeping the security flow intact.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const inlineAuthScript = `
  (function(){
    try {
      var path = location.pathname || '/';
      var skipPrefixes = ['/lock','/setup-pin','/change-pin','/settings','/api','/sw.js','/_next'];
      for (var i=0;i<skipPrefixes.length;i++){
        if (path.indexOf(skipPrefixes[i]) === 0) {
          // Skip auth check for these paths
          try { document.documentElement.style.visibility = 'visible'; } catch(e){}
          return;
        }
      }

      // Protected page: quick local check
      var pin = null;
      try { pin = localStorage.getItem('pin'); } catch(e){ pin = null; }

      if (!pin) {
        // No local session -> immediate redirect to lock
        try { location.replace('/lock'); } catch(e){}
        return;
      }

      // Optimistic reveal for speed; background verification will enforce correctness
      try { document.documentElement.style.visibility = 'visible'; } catch(e){}

      fetch('/api/pin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin }),
        cache: 'no-store',
        credentials: 'same-origin'
      }).then(function(res){
        if (!res.ok) {
          try { localStorage.removeItem('pin'); } catch(e){}
          try { location.replace('/lock'); } catch(e){}
          return;
        }
        return res.json();
      }).then(function(json){
        if (!json || !json.ok || !json.data || !json.data.ok) {
          try { localStorage.removeItem('pin'); } catch(e){}
          try { location.replace('/lock'); } catch(e){}
        }
      }).catch(function(){
        // network error: keep page visible (so user can continue offline); do not force redirect
      });

    } catch(e) {
      try { document.documentElement.style.visibility = 'visible'; } catch(e){}
    }
  })();
  `;
  
  return (
    <html lang="th">
      <head>
        <script dangerouslySetInnerHTML={{ __html: inlineAuthScript }} />
      </head>
      <body>
        <SWRConfig value={{ fetcher: (resource: string, init?: any) => fetchWithTimeout(resource, init) }}>
          <PopupProvider>
            <LoaderProvider>
              {children}
              <ServiceWorkerRegister />
              {/* BottomNav intentionally not rendered globally — pages that need it should render it themselves */}
            </LoaderProvider>
          </PopupProvider>
        </SWRConfig>
      </body>
    </html>
  );
}