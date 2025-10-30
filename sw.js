const CACHE_NAME = 'bungvo-v3-offline';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/main.js',
  '/js/player.js',
  '/js/world.js',
  '/js/weapons.js',
  '/js/enemies.js',
  '/js/obstacles.js',
  '/js/gamepad.js',
  '/js/fullscreen.js',
  '/js/touch.js',
  '/js/haptics.js',
  '/assets/charatlas.png',
  '/assets/charsheet.png',
  '/assets/idle.png',
  '/assets/jump.png',
  '/assets/frontanim.png',
  '/assets/shootanim.png',
  '/assets/shootwalkanim.png',
  '/assets/shootfrontanim.png',
  '/assets/weapon-hand.png',
  '/assets/moneta.png',
  '/assets/obstacle1.png',
  '/assets/oblockfence.png',
  '/assets/oblockmid.png',
  '/assets/police_car.png',
  '/assets/nieb.png',
  '/assets/skys.png',
  '/assets/download.png',
  '/assets/platform.png',
  '/assets/shot.mp3',
  '/assets/shots3.mp3',
  '/assets/GAME_over.mp4',
  '/manifest.json'
];

// Install event - cache files
self.addEventListener('install', event => {
  console.log('📦 Service Worker installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened, caching files...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ All files cached successfully!');
      })
      .catch(err => {
        console.error('❌ Cache failed:', err);
      })
  );
});

// Fetch event - Cache First strategy for offline support
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return cached response
        if (response) {
          return response;
        }
        
        // Not in cache - try network and cache the response
        return fetch(event.request).then(networkResponse => {
          // Don't cache non-GET requests or non-ok responses
          if (event.request.method !== 'GET' || !networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          
          // Clone the response (can only be consumed once)
          const responseToCache = networkResponse.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return networkResponse;
        }).catch(() => {
          // Network failed - if it's a navigation request, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // For other requests, just fail gracefully
          return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated - Offline mode ready!');
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});
