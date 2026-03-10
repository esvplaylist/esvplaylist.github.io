// Change this to your repository name
var GHPATH = '/esvplaylist.github.io';
 
// Choose a different app prefix name
var APP_PREFIX = 'esvplaylist_';
 
// The version of the cache. Every time you change any of the files
// you need to change this version (version_01, version_02…). 
// If you don't change the version, the service worker will give your
// users the old files!
var VERSION = '3.6.1';
 
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
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                const rangeHeader = event.request.headers.get('range');
                if (rangeHeader) {
                    // It's a range request; handle it from the cached full response.
                    return cachedResponse.arrayBuffer().then(buffer => {
                        const rangeMatch = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
                        if (!rangeMatch) {
                            // If the range header format is not what we expect, return the full response.
                            return cachedResponse;
                        }

                        const start = Number(rangeMatch[1]);
                        const end = rangeMatch[2] ? Number(rangeMatch[2]) : buffer.byteLength - 1;

                        // Ensure the requested range is valid.
                        if (start >= buffer.byteLength) {
                            return new Response(null, {
                                status: 416,
                                statusText: 'Range Not Satisfiable',
                                headers: { 'Content-Range': `bytes */${buffer.byteLength}` }
                            });
                        }

                        const slicedData = buffer.slice(start, end + 1);
                        
                        const headers = new Headers();
                        if (cachedResponse.headers.has('Content-Type')) {
                            headers.set('Content-Type', cachedResponse.headers.get('Content-Type'));
                        }
                        headers.set('Content-Length', slicedData.byteLength);
                        headers.set('Content-Range', `bytes ${start}-${end}/${buffer.byteLength}`);
                        headers.set('Accept-Ranges', 'bytes');

                        return new Response(slicedData, {
                            status: 206,
                            statusText: 'Partial Content',
                            headers: headers
                        });
                    });
                }
                // Not a range request, so return the cached response as is.
                return cachedResponse;
            }

            // Not in cache, so go to the network.
            return fetch(event.request).then((res) => {
                // Dynamically cache files so the app works offline.
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, res.clone());
                    return res;
                });
            }).catch(() => {
                // If the fetch fails (e.g., offline) and it's a navigation request,
                // serve the offline fallback page.
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                // For other failed requests, let the browser handle the error.
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