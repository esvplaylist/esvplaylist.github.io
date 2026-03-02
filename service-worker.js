// Change this to your repository name
var GHPATH = '/esvplaylist.github.io';
 
// Choose a different app prefix name
var APP_PREFIX = 'esvp_';
 
// The version of the cache. Every time you change any of the files
// you need to change this version (version_01, version_02…). 
// If you don't change the version, the service worker will give your
// users the old files!
var VERSION = '3.0.7';
 
// The files to make available for offline use. make sure to add 
// others to this list
var URLS = [    
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/headphone-symbol.png`,
  `${GHPATH}/manifest.json`,
  `${GHPATH}/service-worker.js`,
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined'
]

const CACHE_NAME = APP_PREFIX + VERSION;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;

            return fetch(event.request).then((res) => {
                // Dynamically cache UI files so the app works offline
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, res.clone());
                    return res;
                });
            }).catch(() => {
                // Offline fallback for page navigation
                if (event.request.mode === 'navigate') {
                    return caches.match(`${GHPATH}/index.html`);
                }
            });
        })
    );
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
});