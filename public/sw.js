// Meova Service Worker
// Strategy: Network-first for API routes, Cache-first for static assets
// FCM & WebPush: Background push notifications support with dynamic category theming

const CACHE_VERSION = '2026-09-03T11:47'; // ← updated on deploy
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

// ── Standard Web Push: Background Push Notifications ─────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Meova', body: event.data ? event.data.text() : '' };
  }

  const notifType = (data.type || '').toLowerCase();
  const isCall = notifType === 'incoming_call' || notifType === 'call' || !!data.isCall || data.tag?.startsWith('incoming-call');
  const title = data.title || (isCall ? 'Incoming Campus Voice Call' : 'Meova');
  const body = data.body || '';
  const link = data.url || data.link || (isCall ? '/bookings' : '/');

  // Avatar / Thumbnail resolution: prefer real sender photo over app icon
  const avatarPhoto = data.photo || data.senderPhoto || data.callerPhoto || data.icon || '/icon-192.png';

  // 1. INCOMING CALL NOTIFICATION
  if (isCall) {
    const callOptions = {
      body: body || 'Peer is calling you for your campus meetup...',
      icon: avatarPhoto,
      badge: '/badge.png',
      tag: `call-${data.bookingId || 'active'}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [500, 250, 500, 250, 500, 250, 500, 250, 500],
      data: { url: link, isCall: true, bookingId: data.bookingId },
      actions: [
        { action: 'accept', title: 'Accept Call' },
        { action: 'decline', title: 'Decline' },
      ],
    };
    event.waitUntil(self.registration.showNotification(title, callOptions));
    return;
  }

  // 2. CATEGORY-SPECIFIC NOTIFICATIONS
  let actions = [{ action: 'open', title: 'Open Meova' }];
  let vibratePattern = [150, 80, 150];

  if (notifType === 'message' || notifType === 'chat') {
    actions = [{ action: 'reply', title: 'Open Chat' }];
    vibratePattern = [200, 100, 200];
  } else if (notifType === 'booking' || notifType === 'meetup') {
    actions = [{ action: 'view', title: 'View Meetup' }];
    vibratePattern = [250, 100, 150];
  } else if (notifType === 'sparks' || notifType === 'wallet' || notifType === 'tip') {
    actions = [{ action: 'view', title: 'View Balance' }];
    vibratePattern = [100, 80, 100, 80, 100];
  } else if (notifType === 'gig' || notifType === 'job') {
    actions = [{ action: 'view', title: 'View Gig' }];
  } else if (notifType === 'circle' || notifType === 'community') {
    actions = [{ action: 'view', title: 'View Circle' }];
  }

  const options = {
    body,
    icon: avatarPhoto,
    badge: '/badge.png',
    tag: data.tag || `meova-${notifType || 'gen'}-${Date.now()}`,
    renotify: true,
    vibrate: vibratePattern,
    data: { url: link, type: notifType },
    actions,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification click handler ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'decline' || event.action === 'dismiss') return;

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
            // Revalidate in background to keep data fresh
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
