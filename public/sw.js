// Meetify Service Worker
// Strategy: Network-first for API routes, Cache-first for static assets
// FCM: Background push notifications support

const CACHE_NAME = 'meetify-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-512.png',
];

// ── Firebase Messaging: Background Push Notifications ─────────────────────────
// importScripts is only available in SW context (not in Next.js module context)
// We use compat libraries as required by Firebase SW docs
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

  const firebaseConfig = {
    apiKey: 'AIzaSyAWKHPIr_QZq0KYw-3SkDCRe_zACdkkd4o',
    authDomain: 'meetuply-ae3bc.firebaseapp.com',
    projectId: 'meetuply-ae3bc',
    storageBucket: 'meetuply-ae3bc.firebasestorage.app',
    messagingSenderId: '752250926726',
    appId: '1:752250926726:web:98d2d7122acecf6a648307',
  };

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background push messages (app is closed / in background)
  messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {};
    const link = payload.fcmOptions?.link || '/bookings';

    if (!title) return;

    self.registration.showNotification(title, {
      body: body || '',
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      tag: 'meetify-push',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: link },
      actions: [
        { action: 'open', title: 'Open Meetify' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  });
} catch (e) {
  // Firebase messaging not available — graceful degradation
  console.warn('[SW] Firebase messaging init failed:', e.message);
}

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
