const CACHE_NAME = 'StoryApp-V3';
const API_CACHE_NAME = 'StoryApp-API-V1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json',
  '/app.bundle.js',
  '/sw.bundle.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

const EXTERNAL_RESOURCES = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache resource lokal dulu
        return cache.addAll(ASSETS_TO_CACHE)
          .then(() => {
            // Cache resource eksternal secara terpisah dengan error handling
            return Promise.all(
              EXTERNAL_RESOURCES.map(url => {
                return fetch(url)
                  .then(response => {
                    if (response.ok) return cache.put(url, response);
                  })
                  .catch(err => {
                    console.warn(`Failed to cache ${url}:`, err);
                  });
              })
            );
          });
      })
      .catch(err => {
        console.error('Cache installation failed:', err);
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API caching with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(request);
          
          // Clone and cache the response
          const cache = await caches.open(API_CACHE_NAME);
          cache.put(request, networkResponse.clone());
          
          return networkResponse;
        } catch (error) {
          // Fallback to cache if network fails
          const cachedResponse = await caches.match(request);
          return cachedResponse || new Response(JSON.stringify({ error: 'Offline mode' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
    return;
  }

  // For other assets: cache-first strategy
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      return cachedResponse || fetch(request).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Push Notification handler
self.addEventListener('push', (event) => {
  const payload = event.data?.json() || { title: 'New Story', body: 'A new story has been posted!' };
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/SHAREAPP/icons/icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    event.waitUntil(
      (async () => {
        // Implementasi sync logic di sini
        console.log('Syncing offline stories...');
      })()
    );
  }
});