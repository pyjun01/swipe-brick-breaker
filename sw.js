const CACHE_NAME = 'brick-breaker-v9';
const ASSETS = [
  '/',
  '/index.html',
  '/en.html',
  '/sounds/ball-launch.mp3',
  '/sounds/brick-destruction.mp3',
  '/sounds/brick-hit.mp3',
  '/sounds/coin.mp3',
  '/sounds/game-over.mp3',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // HTML: network-first (always get fresh HTML with correct hashed asset refs)
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const clone = r.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Other assets: cache-first
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
