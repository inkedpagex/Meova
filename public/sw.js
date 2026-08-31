// Meova Service Worker
// Strategy: Network-first for API routes, Cache-first for static assets
// FCM: Background push notifications support
//
// ⚡ CACHE VERSIONING — This timestamp is updated on every deploy.
// Old users' service workers will detect the new version, activate immediately,
// and purge the old cache — no manual "Clear Cache" needed by anyone.
// Just update this timestamp whenever you deploy a major change.

const CACHE_VERSION = '2026-08-30T19:43'; // ← update this on deploy
const CACHE_NAME = `Meova-v${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-512.png',
];

// ── Standard Web Push: Background Push Notifications ─────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Meova Notification', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Meova';
  const body = data.body || '';
  const link = data.url || data.link || '/bookings';

  const options = {
    body,
    icon: '/icon-512.png',
    badge: '/icon-512.png',
    tag: 'meova-push',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: link },
    actions: [
      { action: 'open', title: 'Open Meova' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Install: pre-cache critical shell assets ─────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: Network first for API/HTML, cache-first for static assets ─────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Always network-first for API routes and Next.js data fetching
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) return;

  // For HTML navigations (like `/`, `/onboarding`, `/login`), bypass cache to prevent redirect loops.
  if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // Static assets (fonts, images, JS, CSS): cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache successful responses for static-looking paths
        if (response.ok && (
          url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?|css|js)$/) ||
          url.pathname.startsWith('/_next/static/')
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
