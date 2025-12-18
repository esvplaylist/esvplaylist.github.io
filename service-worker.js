// Change this to your repository name
var GHPATH = '/esvplaylist.github.io';
 
// Choose a different app prefix name
var APP_PREFIX = 'esvp_';
 
// The version of the cache. Every time you change any of the files
// you need to change this version (version_01, version_02…). 
// If you don't change the version, the service worker will give your
// users the old files!
var VERSION = 'version_47';
 
// The files to make available for offline use. make sure to add 
// others to this list
var URLS = [    
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/headphone-symbol.png`
]

const CACHE = 'esv-playlist-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('fetch', event => {
    const req = event.request;

    // Only cache audio when browser fetches it naturally
    if (req.destination === 'audio') {
        event.respondWith(
            caches.open('esv-playlist-v1').then(async cache => {
                const cached = await cache.match(req);
                if (cached) return cached;

                const response = await fetch(req);
                cache.put(req, response.clone());
                return response;
            })
        );
        return;
    }

    event.respondWith(
        fetch(req).catch(() => caches.match(req))
    );
});