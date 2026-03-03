const CACHE_VERSION = 'futa-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const MAP_CACHE = `${CACHE_VERSION}-maps`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
  '/placeholder.svg'
];

// Map tile domains to cache
const MAP_TILE_DOMAINS = [
  'api.maptiler.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/locations',
  '/api/search'
];

/**
 * Install event - cache essential assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Skipping waiting');
        return self.skipWaiting();
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              !cacheName.startsWith(CACHE_VERSION) &&
              cacheName.startsWith('futa-')
            ) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Map tiles: cache first, fallback to network
  if (MAP_TILE_DOMAINS.some(domain => url.hostname.includes(domain))) {
    event.respondWith(cacheMapTiles(request));
    return;
  }

  // API calls: network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // Static assets: cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(networkFirst(request));
});

/**
 * Cache-first strategy for map tiles
 */
async function cacheMapTiles(request) {
  try {
    const cache = await caches.open(MAP_CACHE);
    const cached = await cache.match(request);

    if (cached) {
      console.log('[Service Worker] Cache hit (map):', request.url);
      return cached;
    }

    const response = await fetch(request);

    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch error (map):', error);
    return caches.match('/offline.html') || new Response('Offline');
  }
}

/**
 * Network-first strategy for API calls
 */
async function networkFirstAPI(request) {
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);

    if (cached) {
      console.log('[Service Worker] Cache hit (API):', request.url);
      return cached;
    }

    return new Response(
      JSON.stringify({
        error: 'Offline - No cached data available',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      }
    );
  }
}

/**
 * Cache-first strategy for static assets
 */
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);

    if (cached) {
      console.log('[Service Worker] Cache hit (static):', request.url);
      return cached;
    }

    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch error (static):', error);
    return new Response('Offline');
  }
}

/**
 * Network-first strategy with cache fallback
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);

    if (cached) {
      console.log('[Service Worker] Cache hit (dynamic):', request.url);
      return cached;
    }

    // Return offline page if available
    return caches.match('/offline.html') || new Response('Offline');
  }
}

/**
 * Helper to check if URL is a static asset
 */
function isStaticAsset(pathname) {
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname === '/' ||
    pathname === '/index.html'
  );
}

/**
 * Message handler for communication from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(event.data.cacheName).then(() => {
      event.ports[0].postMessage({ cleared: true });
    });
  }

  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map((cacheName) =>
          caches.open(cacheName).then((cache) =>
            cache.keys().then((requests) => ({
              name: cacheName,
              count: requests.length
            }))
          )
        )
      ).then((cacheInfo) => {
        event.ports[0].postMessage({ caches: cacheInfo });
      });
    });
  }
});

/**
 * Background sync handler (future enhancement)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-locations') {
    event.waitUntil(
      // In production, sync location data when connection is restored
      Promise.resolve()
    );
  }
});

console.log('[Service Worker] Loaded and ready');
