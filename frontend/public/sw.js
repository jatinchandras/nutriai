// public/sw.js — NutriAI Service Worker
// Strategy: network-first for everything on first load,
// cache only used as fallback when offline.
const CACHE_NAME = 'nutriai-v2';

// ── Install: skip waiting immediately, don't pre-cache ────────────
// We avoid pre-caching the app shell because it causes the blank
// screen bug — the SW serves a stale shell before React hydrates.
self.addEventListener('install', (event) => {
  self.skipWaiting(); // activate immediately, don't wait for old SW to die
});

// ── Activate: delete ALL old caches, claim all clients ────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// ── Fetch: network-first for EVERYTHING ──────────────────────────
// On a good connection this is identical to no service worker.
// Only falls back to cache when genuinely offline.
self.addEventListener('fetch', (event) => {
  // Skip non-GET and browser-internal requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses for same-origin requests
        if (response.ok && new URL(event.request.url).hostname === self.location.hostname) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: try cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests offline, serve cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // For API calls offline, return friendly error
          if (event.request.url.includes('/api/')) {
            return new Response(
              JSON.stringify({ error: 'You are offline. Please reconnect.' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          }
        });
      })
  );
});

// ── Push notifications ────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'NutriAI', {
      body: data.body || 'Time to log your meal!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
