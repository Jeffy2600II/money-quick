/* sw.js - simple service worker
   - caches static assets (cache-first)
   - supports stale-while-revalidate for GET /api/... if server returns header 'x-cacheable: 1'
   - NOTE: to enable API caching, the backend MUST set header: X-Cacheable: 1
*/

const STATIC_CACHE = 'mq-static-v1';
const API_CACHE = 'mq-api-v1';
const STATIC_URLS = [
  '/', // index
  '/styles/globals.css',
  // add other static assets you want cached by default
];

// Install: cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => {
        if (k !== STATIC_CACHE && k !== API_CACHE) return caches.delete(k);
        return Promise.resolve();
      })
    ))
  );
  self.clients.claim();
});

// Helper to clone and optionally cache response (only cache if response header x-cacheable == '1')
async function maybeCacheAPIResponse(request, response) {
  try {
    const cloned = response.clone();
    const cacheable = cloned.headers.get('x-cacheable') === '1';
    if (cacheable) {
      const cache = await caches.open(API_CACHE);
      await cache.put(request, cloned);
    }
  } catch (e) {
    // ignore
  }
}

// Fetch handler
self.addEventListener('fetch', event => {
  const req = event.request;
  
  // Only handle GET
  if (req.method !== 'GET') return;
  
  const url = new URL(req.url);
  
  // 1) Static assets (cache-first)
  if (req.destination === 'style' || req.destination === 'script' || req.destination === 'image' || url.pathname === '/') {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(networkRes => {
          // cache static file for offline
          caches.open(STATIC_CACHE).then(cache => cache.put(req, networkRes.clone()));
          return networkRes;
        }).catch(() => cached || new Response(null, { status: 503 }));
      })
    );
    return;
  }
  
  // 2) API endpoints: implement stale-while-revalidate only if there's a cached value. We require server to mark cacheable responses with X-Cacheable: 1 header.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE);
      const cached = await cache.match(req);
      if (cached) {
        // start revalidation in background
        event.waitUntil(
          fetch(req).then(networkRes => {
            // only cache if server says cacheable
            maybeCacheAPIResponse(req, networkRes).catch(() => {});
          }).catch(() => {})
        );
        return cached;
      } else {
        // no cache -> fetch network; if response includes header x-cacheable=1 we'll cache it
        try {
          const networkRes = await fetch(req);
          // cache if server allows
          await maybeCacheAPIResponse(req, networkRes);
          return networkRes;
        } catch {
          return new Response(null, { status: 503 });
        }
      }
    })());
    return;
  }
  
  // default fallback: network-first
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});