// Incremente ce numero a CHAQUE mise a jour de l'appli pour forcer le rafraichissement
const CACHE = 'devistp-v6';
const ASSETS = ['./index.html', './manifest.json'];

// Installation : on precharge, et on prend la main tout de suite
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

// Activation : on supprime les anciens caches (v1, etc.)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // bareme.json et les appels API : TOUJOURS le reseau, jamais le cache
  if (url.includes('bareme.json') || url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // index.html / navigation : RESEAU d'abord (derniere version), cache en secours
  if (e.request.mode === 'navigate' || url.includes('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request) || caches.match('./index.html'))
    );
    return;
  }

  // Reste (manifest, icones...) : cache d'abord, reseau en secours
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
