const CACHE = 'bpmruler-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/measure', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest']).catch(() => {})));
});
self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) =>
      hit ||
      fetch(e.request).then((res) => {
        const copy = res.clone();
        if (res.ok && new URL(e.request.url).origin === location.origin)
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match('/'))
    )
  );
});
