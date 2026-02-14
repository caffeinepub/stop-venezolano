// Minimal service worker for PWA installability
const CACHE_NAME = 'stop-venezolano-v1';

// Install event - minimal setup
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network-first strategy (no aggressive caching)
self.addEventListener('fetch', (event) => {
  // Let the browser handle the request normally
  event.respondWith(
    fetch(event.request).catch(() => {
      // Only serve from cache if network fails
      return caches.match(event.request);
    })
  );
});
