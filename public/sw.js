// GeoPatriot Web Service Worker (Phase 12 / PRD #19 & Rules #14)
// Versi cache app shell.
// PENTING: file ini disajikan statis (tidak diproses build Next.js), jadi
// versi TIDAK auto-bump per deploy. WAJIB naikkan angka versi ini secara
// manual setiap kali asset app shell berubah signifikan, agar event
// "activate" benar-benar membersihkan cache lama (audit finding F-01).
const CACHE_NAME = "geopatriot-shell-v2";

// Asset statis inti yang dicache pada tahap instalasi untuk ketersediaan offline app shell (Rules #14.4)
const PRECACHE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/app-icon.png",
];

/**
 * Event install: Melakukan precache app shell dan mengaktifkan service worker baru segera.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn("[SW] Precache gagal (bisa terjadi saat dev):", err);
      }),
  );
});

/**
 * Event activate: Membersihkan cache versi lama dan mengambil alih kontrol klien (clients.claim).
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          }),
        );
      })
      .then(() => {
        return self.clients.claim();
      }),
  );
});

/**
 * Memeriksa apakah URL request aman untuk dicache.
 * Sesuai Rules #14.3: Jangan cache response yang berpotensi menyimpan data lokasi pengguna.
 *
 * Default-deny berbasis origin (bukan substring-match pada URL) sebagai
 * satu-satunya aturan: hanya resource SAME-ORIGIN (aset aplikasi sendiri)
 * yang boleh dicache. LocationIQ dan provider eksternal lain manapun di
 * masa depan otomatis tidak pernah dicache tanpa perlu didaftarkan manual
 * (audit finding F-02 — menghindari human-error menambah provider baru).
 */
function isSafeToCache(url) {
  return url.origin === self.location.origin;
}

/**
 * Event fetch: Strategi caching adaptif untuk navigasi dan asset statis.
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Hanya proses HTTP/HTTPS GET request
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Jangan cache API lokasi atau layanan pihak ketiga yang sensitif privasi (Rules #14.3)
  if (!isSafeToCache(url)) {
    return;
  }

  // 1. Strategi untuk Dokumen Navigasi (HTML App Shell): Network-First dengan Fallback ke Cache
  // Memastikan pengguna selalu mendapat versi terbaru saat online, namun tetap bisa membuka aplikasi saat offline di lapangan (PRD #18)
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback ke app shell root jika navigasi ke rute lain saat offline
          return caches.match("/");
        }),
    );
    return;
  }

  // 2. Strategi untuk Asset Statis (Next.js JS Chunks, CSS, Images, Fonts): Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Jaringan gagal saat offline, kembalikan cached jika ada
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      }),
    );
    return;
  }

  // 3. Permintaan lainnya: Network-First dengan Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      }),
  );
});
