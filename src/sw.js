const CACHE_NAME = 'StoryApp-V2';
const ASSETS_TO_CACHE = [
  '/SHAREAPP/',
  '/SHAREAPP/index.html',
  '/SHAREAPP/favicon.png',
  '/SHAREAPP/manifest.json',
  '/SHAREAPP/app.bundle.js',
  '/SHAREAPP/sw.bundle.js',
  '/SHAREAPP/icons/icon-192.png',
  '/SHAREAPP/icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'
];

// Install Service Worker and Cache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .catch(err => {
        console.error('Cache error:', err);
      })
  );
});

// Fetch: Respond with cache or fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/SHAREAPP/index.html');
        }
      });
    })
  );
});

// Activate: Clean up old caches
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
