const CACHE_NAME = 'job-tracker-cache-v3';
const MANIFEST_DATA = {
  name: 'Job & Internship Tracker',
  short_name: 'Job Tracker',
  description: 'Track job and internship applications with interview feedback and reminders',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#1e3a8a',
  background_color: '#ffffff',
  icons: [
    {
      src: '/pwa-192x192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/pwa-512x512.png',
      sizes: '512x512',
      type: 'image/png',
    },
    {
      src: '/pwa-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

const STATIC_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-seed manifest
      const manifestBlob = new Blob([JSON.stringify(MANIFEST_DATA, null, 2)], {
        type: 'application/manifest+json',
      });
      const manifestResponse = new Response(manifestBlob, {
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
      cache.put('/manifest.json', manifestResponse);

      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching partial warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Purging old service worker cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Directly serve manifest.json as JSON, never allowing cookie_check.html redirect
  if (url.pathname === '/manifest.json') {
    event.respondWith(
      caches.match('/manifest.json').then((cached) => {
        if (cached) return cached;
        return fetch(event.request, { credentials: 'include' })
          .then((res) => {
            if (res && res.ok && res.headers.get('content-type')?.includes('json')) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put('/manifest.json', clone));
              return res;
            }
            return new Response(JSON.stringify(MANIFEST_DATA, null, 2), {
              headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
            });
          })
          .catch(() => {
            return new Response(JSON.stringify(MANIFEST_DATA, null, 2), {
              headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
            });
          });
      })
    );
    return;
  }

  // Skip external APIs and Supabase
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api')) {
    return;
  }

  // Network-First for Navigation requests (HTML) to avoid stale bundle 404 white screens
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Stale-While-Revalidate for other static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
