'use client';
import '../styles/modern-styles.min.css';
import '../styles/globals.css';
import PopupProvider from '../components/PopupProvider';
import LoaderProvider from '../components/LoaderProvider';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import { SWRConfig } from 'swr';
import { fetchWithTimeout } from '../lib/fetcher';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Inline script runs as early as possible in <head> to check localStorage pin and redirect fast.
  // It hides page until check completes (only for pages where check is applicable).
  const inlineAuthScript = `
  (function(){
    try {
      var path = location.pathname || '/';
      // pages to skip (lock/setup pages and API routes)
      var skipPrefixes = ['/lock','/setup-pin','/change-pin','/settings','/api','/sw.js','/_next'];
      for (var i=0;i<skipPrefixes.length;i++){
        if (path.indexOf(skipPrefixes[i]) === 0) {
          // ensure page visible on skipped pages
          try { document.documentElement.style.visibility = 'visible'; } catch(e){}
          return;
        }
      }

      // Hide document immediately to avoid flashing content before auth completes
      try { document.documentElement.style.visibility = 'hidden'; } catch(e){}

      var pin = null;
      try { pin = localStorage.getItem('pin'); } catch(e){ pin = null; }

      if (!pin) {
        // no local session -> redirect to lock quickly
        try { location.replace('/lock'); } catch(e){ }
        return;
      }

      // verify pin with backend asynchronously
      // Use fetch; don't block on response, but redirect to /lock if invalid.
      fetch('/api/pin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin }),
        cache: 'no-store',
        credentials: 'same-origin'
      }).then(function(res){
        if (!res.ok) {
          try { localStorage.removeItem('pin'); } catch(e){}
          location.replace('/lock');
          return;
        }
        return res.json();
      }).then(function(json){
        if (!json || !json.ok || !json.data || !json.data.ok) {
          try { localStorage.removeItem('pin'); } catch(e){}
          try { location.replace('/lock'); } catch(e){}
          return;
        }
        // success -> reveal page
        try { document.documentElement.style.visibility = 'visible'; } catch(e){}
      }).catch(function(err){
        // On network error: reveal page so user can see UI; optionally we could redirect.
        try { document.documentElement.style.visibility = 'visible'; } catch(e){}
      });

    } catch(e){
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
              {/* BottomNav intentionally removed from global layout.
                  Pages that require the bottom navigation (e.g. dashboard) should render it themselves. */}
            </LoaderProvider>
          </PopupProvider>
        </SWRConfig>
      </body>
    </html>
  );
}