// Change this to your repository name
var GHPATH = '/esvplaylist.github.io';
 
// Choose a different app prefix name
var APP_PREFIX = 'esvplaylist_';
 
// The version of the cache. Every time you change any of the files
// you need to change this version (version_01, version_02…). 
// If you don't change the version, the service worker will give your
// users the old files!
var VERSION = '3.8.0';
 
// The files to make available for offline use. make sure to add 
// others to this list
var URLS = [    
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/headphone-symbol.png`
]

const CACHE_NAME = `${APP_PREFIX}-${VERSION}`;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/headphone-symbol.png',
  '/service-worker.js',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
  // add more assets if needed
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
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
                    return caches.match('/index.html');
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

  if (event.data && event.data.type === 'CACHE_TRACKS') {
    const urls = event.data.urls;
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        for (const url of urls) {
          try {
            const cachedRes = await cache.match(url);
            if (!cachedRes) {
              // mode: 'no-cors' allows caching cross-origin audio from ESV
              const fetchRes = await fetch(url, { mode: 'no-cors' });
              await cache.put(url, fetchRes);
            }
          } catch (err) {
            console.error('Failed to cache track:', url, err);
          }
        }
      })
    );
  }
});