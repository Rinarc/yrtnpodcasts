const CACHE_NAME = 'yrtn-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './music.json',
  './podcasts.json',
  './icon.png'
];

// 1. Install Service Worker and Cache Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activate and Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Strategy: Network First, fall back to Cache
// This ensures China users get the latest JSON if possible, but app works offline.
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like the MP3s or images from other sites)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If network fetch works, cache a copy and return it
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // If network fails (offline), return from cache
        return caches.match(event.request);
      })
  );
});