// Norden Finance Service Worker
const CACHE_NAME = 'norden-v1.3.0-static';
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/brand/norden-icon.png',
  '/brand/apple-touch-icon.png',
  '/brand/favicon-32.png',
  '/brand/favicon-64.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Precaching partial failure is non-fatal
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Never cache API, auth, or upload requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.includes('/cron/')
  ) {
    return;
  }

  // Next.js static files and brand assets (Immutable/Static -> Cache First)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/brand/')
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // Page navigations -> Network First (bypass cache storage for private routes)
  if (req.mode === 'navigate') {
    const isPrivateRoute =
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/onboarding') ||
      url.pathname.startsWith('/norden-control-center') ||
      url.pathname.startsWith('/upgrade') ||
      url.pathname.startsWith('/settings');

    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200 && !isPrivateRoute) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          if (!isPrivateRoute) {
            const cached = await caches.match(req);
            if (cached) return cached;
          }
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) return offlinePage;
          const fallback = await caches.match('/');
          if (fallback && !isPrivateRoute) return fallback;
          return new Response('Offline - Norden Finance', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }
});

// Handle notification click to bring Norden Finance window to focus
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/dashboard');
      }
    })
  );
});

