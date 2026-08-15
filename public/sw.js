// Meetify Service Worker
// Strategy: Network-first for API routes, Cache-first for static assets

const CACHE_NAME = 'meetify-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-512.png',
];

// Install — pre-cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API routes: always network-first, never cache
  if (url.pathname.startsWith('/api/')) return;

  // Static assets (fonts, images, JS, CSS): cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache successful responses for static-looking paths
        if (response.ok && (
          url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?|css|js)$/)
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — return cached home page if available
        return caches.match('/') || new Response('Offline', { status: 503 });
      });
    })
  );
});
