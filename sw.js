/* LO Sales Coach service worker — bump CACHE_NAME with APP_VERSION on every release. */
/* eslint-disable no-restricted-globals */
const APP_VERSION = '3.167';
const CACHE_NAME = 'sc-lo-v' + APP_VERSION;
const OFFLINE_CACHE = CACHE_NAME + '-offline';

const PRECACHE_ASSETS = [
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-32.png'
];

function isDocumentRequest(req) {
  if (req.mode === 'navigate') return true;
  if (req.destination === 'document') return true;
  try {
    const path = new URL(req.url, self.location.origin).pathname;
    if (path === '/' || path === '/index.html' || /\.html$/i.test(path)) return true;
  } catch (e) {
    /* ignore */
  }
  const accept = req.headers.get('accept') || '';
  return accept.includes('text/html');
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          PRECACHE_ASSETS.map((url) =>
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
            .filter((k) => k !== CACHE_NAME && k !== OFFLINE_CACHE)
            .filter((k) => k.indexOf('lo-sw-') === 0 || k.indexOf('sc-lo-') === 0)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname === '/sw.js') return;

  if (isDocumentRequest(req)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(OFFLINE_CACHE).then((c) => {
              c.put(req, copy.clone()).catch(() => {});
              c.put(new Request('/index.html'), copy).catch(() => {});
            }).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match('/index.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
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
