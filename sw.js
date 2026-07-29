const SHELL_CACHE = 'bandien-shell-v3';
const RUNTIME_CACHE = 'bandien-runtime-v3';
const APP_SHELL = [
  './nhatky/',
  './nhatky/manifest.json',
  './css/app.css',
  './js/config.js',
  './js/api.js',
  './js/sso.js',
  './js/offline-queue.js',
  './js/pwa.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) =>
    Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => null)))
  ));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
      .map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('./nhatky/');
    return Response.error();
  }));
});

