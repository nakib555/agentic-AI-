
const CACHE_NAME = 'agentic-ai-cache-{{VERSION}}';

const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/favicon.svg',
    '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Fetch items individually to log failures
        return Promise.all(PRECACHE_ASSETS.map(url => {
            return fetch(url).then(res => {
                if (!res.ok) throw new Error(`Request failed: ${url} - ${res.status}`);
                return cache.put(url, res);
            }).catch(err => {
                console.error(`[SW] Failed to cache ${url}:`, err);
                throw err; // Propagate to fail installation if critical assets are missing
            });
        }));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. Ignore API, Extensions, and non-GET methods
  if (event.request.method !== 'GET' || 
      url.pathname.startsWith('/api/') || 
      url.protocol === 'chrome-extension:') {
    return;
  }

  // 2. Network First Strategy for HTML / Navigation
  // This ensures the user always gets the latest index.html with correct JS hashes
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Update cache with the fresh HTML
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // 3. Cache First Strategy for Static Assets (JS, CSS, Images)
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Return cached response if found
        if (response) {
            return response;
        }

        // Otherwise fetch from network
        return fetch(event.request).then(networkResponse => {
          // Only cache valid responses
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
