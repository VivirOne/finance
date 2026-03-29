const CACHE = 'ji-finance-v2';
const ASSETS = [
  '/finance/icon-192.png',
  '/finance/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML pages: always network first so updates deploy immediately
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Firebase/Google APIs: network only
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Everything else (icons, fonts): cache first
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    const clone = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, clone));
    return res;
  })));
});
