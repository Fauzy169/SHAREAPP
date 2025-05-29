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

// sw.js - tambahkan bagian ini

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API caching strategy (cache-first with network fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((response) => {
          // Clone the response to cache it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default strategy for other requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request).catch(() => {
        if (request.mode === 'navigate') {
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

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-stories') {
    console.log('Sync event triggered');
    event.waitUntil(syncOfflineStories());
  }
});

async function syncOfflineStories() {
  const offlineStories = await getAllData();
  for (const story of offlineStories) {
    const formData = new FormData();
    for (const key in story) {
      formData.append(key, story[key]);
    }
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${story.isGuest ? '' : localStorage.getItem(CONFIG.USER_TOKEN_KEY)}` },
        body: formData,
      });
      if (response.ok) {
        await deleteData(story.id);
        console.log(`Cerita offline "${story.id}" berhasil disinkronkan.`);
      }
    } catch (error) {
      console.error(`Gagal menyinkronkan cerita offline "${story.id}":`, error);
    }
  }
}