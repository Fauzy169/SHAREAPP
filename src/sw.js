const CACHE_NAME = 'StoryApp-V3';
const API_CACHE_NAME = 'StoryApp-API-V1';

const ASSETS_TO_CACHE = [
  '/SHAREAPP/',
  '/SHAREAPP/index.html',
  '/SHAREAPP/favicon.png',
  '/SHAREAPP/manifest.json',
  '/SHAREAPP/app.bundle.js',
  '/SHAREAPP/sw.bundle.js',
  '/SHAREAPP/icons/icon-192.png',
  '/SHAREAPP/icons/icon-512.png'
];


const EXTERNAL_RESOURCES = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);

        // Cache lokal satu per satu
        for (const url of ASSETS_TO_CACHE) {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn(`⚠️ Gagal cache local: ${url}`, err);
          }
        }

        // Cache eksternal satu per satu
        for (const url of EXTERNAL_RESOURCES) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
            } else {
              console.warn(`⚠️ Respon gagal untuk ${url}: ${response.status}`);
            }
          } catch (err) {
            console.warn(`⚠️ Gagal fetch eksternal: ${url}`, err);
          }
        }

        console.log('✅ Service worker install selesai');
      } catch (err) {
        console.error('🚫 Cache installation failed:', err);
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API caching - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(API_CACHE_NAME);
          cache.put(request, response.clone());
          return response;
        } catch (err) {
          const cached = await caches.match(request);
          return cached || new Response(JSON.stringify({ error: 'Offline mode' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      })()
    );
    return;
  }

  // Asset caching - cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
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
        console.log('⏳ Syncing offline stories...');
        // Tambahkan logic sinkronisasi ke server di sini jika ada
      })()
    );
  }
});
