
const CACHE_NAME = 'agentic-ai-cache-{{VERSION}}';

const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/index.js',
    '/styles/main.css',
    '/favicon.svg',
    '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.all(PRECACHE_ASSETS.map(url => {
            return fetch(url).then(res => {
                if (!res.ok) throw new Error(`Request failed: ${url} - ${res.status}`);
                return cache.put(url, res);
            }).catch(err => {
                console.error(`[SW] Failed to cache ${url}:`, err);
                throw err;
            });
        }));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(event.request);
      
      const networkFetch = fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          cache.put(event.request, response.clone());
        }
        return response;
      }).catch(() => {
        // Network failed, rely on cache if available
      });

      return cachedResponse || networkFetch;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
