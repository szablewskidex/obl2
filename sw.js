const CACHE_NAME = 'bungvo-v2';
const urlsToCache = [
  '/index.html',
  '/js/game.js',
  '/js/obstacles.js',
  '/js/player.js',
  '/js/world.js',
  '/js/physics.js',
  '/js/ui.js',
  '/js/gamepad.js',
  '/js/fullscreen.js',
  '/js/main.js',
  '/assets/charatlas.png',
  '/assets/oblck.png',
  '/assets/oblckclck.png',
  '/assets/oblockfence.png',
  '/assets/police_car.png',
  '/assets/nieb.png',
  '/assets/download.png',
  '/assets/platform.png'
];

// Install event - cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
