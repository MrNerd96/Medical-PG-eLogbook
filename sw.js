// Service worker: caches the app shell so the logbook works fully offline.
const CACHE = 'pg-elogbook-v2';
const ASSETS = ['./', './index.html', './css/styles.css', './js/data.js', './js/app.js', './manifest.webmanifest', './icons/icon.svg',
  './mbbs/', './mbbs/index.html', './mbbs/js/ug-data.js', './mbbs/js/ug-app.js', './mbbs/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network-first (so updates arrive), falling back to cache when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match(e.request.url.includes('/mbbs/') ? './mbbs/index.html' : './index.html')))
  );
});
