const CACHE_NAME = 'brick-breaker-v8';
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
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
