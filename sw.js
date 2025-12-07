const CACHE_NAME = 'payboss-v3-offline';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

// 1. Install & Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching assets for offline');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activate & Clean Old Cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Strategy (Stale-While-Revalidate)
// Coba ambil dari cache dulu biar cepat, lalu update dari network di background
self.addEventListener('fetch', (event) => {
  // Hanya cache request GET (aset statis)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update cache dengan versi terbaru dari network
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      // Return cached response immediately if available, else wait for network
      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Handle Notification (Tetap dipertahankan)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.text() : 'Notifikasi Baru dari PayBoss';
  self.registration.showNotification('PayBoss Cafe', {
    body: data,
    icon: 'https://cdn-icons-png.flaticon.com/512/1041/1041891.png'
  });
});
