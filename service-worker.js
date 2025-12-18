// Change this to your repository name
var GHPATH = '/esvplaylist.github.io';
 
// Choose a different app prefix name
var APP_PREFIX = 'esvp_';
 
// The version of the cache. Every time you change any of the files
// you need to change this version (version_01, version_02…). 
// If you don't change the version, the service worker will give your
// users the old files!
var VERSION = 'version_44';
 
// The files to make available for offline use. make sure to add 
// others to this list
var URLS = [    
  `${GHPATH}/`,
  `${GHPATH}/index.html`,
  `${GHPATH}/headphone-symbol.png`
]

const CACHE = 'esv-playlist-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('fetch', e => {
    if (e.request.url.includes('audio.esv.org')) {
        e.respondWith(
            caches.open(CACHE).then(async cache => {
                const cached = await cache.match(e.request);
                if (cached) return cached;
                const res = await fetch(e.request);
                cache.put(e.request, res.clone());
                return res;
            })
        );
    }
});