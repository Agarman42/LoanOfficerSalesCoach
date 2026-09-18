/* LO Sales Coach service worker — bump CACHE_NAME with APP_VERSION on every release. */
/* eslint-disable no-restricted-globals */
const APP_VERSION = '3.172';
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

function swFallbackResponse() {
  return new Response('', {
    status: 504,
    statusText: 'Offline',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

function ensureResponse(value) {
  return value instanceof Response ? value : swFallbackResponse();
}

function shouldSkipFetchIntercept(req) {
  const raw = String((req && req.url) || '');
  if (!raw) return true;
  if (raw === 'about:srcdoc' || raw.startsWith('about:')) return true;
  let url;
  try {
    url = new URL(raw);
  } catch (e) {
    return true;
  }
  if (url.protocol === 'about:' || url.protocol === 'blob:' || url.protocol === 'data:') return true;
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.startsWith('/api/')) return true;
  if (url.pathname === '/sw.js') return true;
  return false;
}

function isShellScriptRequest(req) {
  try {
    const p = new URL(req.url, self.location.origin).pathname;
    return p === '/js/app-version.js' || p === '/js/feature-loader.js' || p === '/index.html';
  } catch (e) {
    return false;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (shouldSkipFetchIntercept(req)) return;

  // Never cache-first the version footer or loader (v3.141 frozen-query class).
  if (isShellScriptRequest(req) && !isDocumentRequest(req)) {
    event.respondWith(
      fetch(req)
        .then((res) => ensureResponse(res))
        .catch(() => caches.match(req).then((hit) => ensureResponse(hit)))
    );
    return;
  }

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
          return ensureResponse(res);
        })
        .catch(() =>
          caches
            .match(req)
            .then((hit) => hit || caches.match('/index.html'))
            .then((hit) => ensureResponse(hit))
        )
        .then((res) => ensureResponse(res))
    );
    return;
  }

  event.respondWith(
    caches
      .match(req)
      .then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
            }
            return ensureResponse(res);
          })
          .catch(() => ensureResponse(cached));
      })
      .then((res) => ensureResponse(res))
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
