/* LO Sales Coach service worker — app shell cache + Web Push */
/* eslint-disable no-restricted-globals */
const SW_VERSION = 'lo-sw-v1-20260806';
const SHELL_CACHE = SW_VERSION + '-shell';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/css/tailwind-built.css?v=20260721-noloadspin',
  '/css/main.css?v=20260806-pwa',
  '/js/api.js?v=20260806-pwa',
  '/js/ui.js?v=20260729-no-backdrop',
  '/js/main.js?v=20260730-gen-modal',
  '/js/early-boot.js?v=20260730-gen-modal',
  '/js/feature-loader.js?v=20260806-pwa',
  '/js/app-version.js',
  '/js/features/pwa-push.js?v=20260806-pwa'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('[sw] precache skip', url, err && err.message);
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('lo-sw-') && k !== SHELL_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API
  if (url.pathname.startsWith('/api/')) return;

  // Network-first for navigations / HTML
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('/index.html'))
        )
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'LO Sales Coach',
    body: 'You have an update from your coach.',
    url: '/',
    tag: 'lo-coach'
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = Object.assign(data, parsed || {});
    }
  } catch (e) {
    try {
      const t = event.data && event.data.text();
      if (t) data.body = t;
    } catch (e2) {
      /* ignore */
    }
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    tag: data.tag || 'lo-coach',
    renotify: !!data.renotify,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title || 'LO Sales Coach', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  const abs = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus().then((c) => {
            if (c && c.navigate) return c.navigate(abs);
            // Fallback: postMessage so the page can showSection
            try {
              c.postMessage({ type: 'lo-push-navigate', url: targetUrl });
            } catch (e) {
              /* ignore */
            }
            return c;
          });
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(abs);
      return undefined;
    })
  );
});
