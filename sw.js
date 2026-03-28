const CACHE = 'mzec-gis-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.js',
  'https://unpkg.com/maplibre-gl@4.1.2/dist/maplibre-gl.css'
];

// Install: cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for tiles and libs, network-first for basemap
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Vector tiles (.pbf) — cache forever once loaded
  if (url.endsWith('.pbf')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        }).catch(() => new Response('', { status: 204 }));
      })
    );
    return;
  }

  // Basemap tiles (carto/esri) — network first, fall back to cache
  if (url.includes('cartocdn.com') || url.includes('arcgisonline.com')) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request).then(c => c || new Response('', { status: 204 })))
    );
    return;
  }

  // Everything else — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.ok && e.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
