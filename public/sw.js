// Meova Service Worker
// Strategy: Network-first for dynamic routes, Stale-While-Revalidate for static shell assets.
// Offline Fallback support for PWA / Android WebView.

const CACHE_VERSION = '2026-09-14T20:35'; // ← updated on deploy
const CACHE_NAME = `Meova-v${CACHE_VERSION}`;
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-512.png',
  '/icon-192.png',
  '/icon-maskable-512.png',
  '/icon-maskable-192.png',
  '/apple-touch-icon.png',
  '/badge.png',
  '/notif-icon.png',
  '/logo.png',
  '/offline',
];

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

// ── Fetch: Network-first for dynamic, cache-fallback for shell ────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests, browser extensions, and localhost development (prevents HMR reload loops)
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return;

  // Never cache API routes, auth endpoints, or Supabase calls
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('identitytoolkit')
  ) {
    return;
  }

  // Static shell assets: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((networkRes) => {
            if (networkRes.ok) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkRes;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Navigation / Page routes: Instant Stale-While-Revalidate with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // 1. Check if cached shell exists
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            fetch(request)
              .then(async (networkRes) => {
                if (networkRes && networkRes.ok) {
                  const cache = await caches.open(CACHE_NAME);
                  cache.put(request, networkRes.clone());
                }
              })
              .catch(() => {});
            return cachedResponse;
          }

          // 2. If no cache yet, fetch from network and store in cache
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          const cached = await caches.match(request);
          if (cached) return cached;
          return caches.match('/offline');
        }
      })()
    );
    return;
  }
});

// ── Push Event: Background Push Notifications (Mobile PWA & Desktop) ────────
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Meova', body: event.data.text() };
    }
  }

  const title = data.title || 'Meova';
  const options = {
    body: data.body || '',
    icon: data.icon || data.senderPhoto || '/icon-192.png',
    badge: data.badge || '/badge.png',
    tag: data.tag || `meova-push-${Date.now()}`,
    data: {
      url: data.url || '/',
      ...data,
    },
    vibrate: data.isCall ? [300, 100, 300, 100, 300] : [200, 100, 200],
    renotify: true,
    requireInteraction: Boolean(data.isCall),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click: Focus existing PWA window or open target route ────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (targetUrl && client.navigate) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ── In-App Client Messages: Immediate notification through Service Worker ─────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title = 'Meova', body = '', icon = '/icon-192.png', badge = '/badge.png', url = '/', tag, isCall = false } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon,
        badge,
        data: { url },
        tag: tag || `meova-local-${Date.now()}`,
        vibrate: isCall ? [300, 100, 300, 100, 300] : [100, 50, 100],
        renotify: true,
      })
    );
  }
});

