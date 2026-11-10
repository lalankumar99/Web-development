const CACHE_NAME = 'lk-smart-studies-v1.0';

// Core assets to pre-cache on install
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.gif',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

// 1. INSTALL EVENT: Cache core static files
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Some assets skipped during initial cache:', err);
      });
    })
  );
});

// 2. ACTIVATE EVENT: Clean up old caches when version updates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH EVENT: Stale-While-Revalidate for fast performance + Offline Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Update cache with fresh copy if valid
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and navigating to a page, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });

      // Return cached copy immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
