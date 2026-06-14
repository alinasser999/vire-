/* Service worker — offline-first cache for the whole game.
   Bump CACHE to invalidate after a release. */
const CACHE = 'gm3d-v2';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './styles/tokens.css', './styles/base.css', './styles/board.css',
  './styles/ui.css', './styles/screens.css', './styles/animations.css',
  './src/main.js', './icons/icon.svg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  // network-first for same-origin modules (fresh code), cache fallback offline
  e.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match('./index.html')))
  );
});
