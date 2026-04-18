/* SpinCircle Service Worker v3 */
const CACHE = 'spincircle-v3';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

/* Install: precache shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE).catch(()=>{}))
      .then(() => self.skipWaiting())
  );
});

/* Activate: delete old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch: network-first for Firebase/API, cache-first for assets */
self.addEventListener('fetch', e => {
  const url = e.request.url;
  /* Always network for Firebase, fonts, external APIs */
  if (
    url.includes('firebasedatabase') ||
    url.includes('googleapis') ||
    url.includes('firebaseapp') ||
    url.includes('gstatic') ||
    e.request.method !== 'GET'
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)
        .then(cached => cached || new Response('Offline', {status: 503}))
      )
  );
});
