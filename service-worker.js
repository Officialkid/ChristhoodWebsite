const CACHE_NAME = 'christhood-v4';
const PRECACHE_URLS = [
  '/',
  '/administration-cont.html',
  '/administration.html',
  '/apologetics.html',
  '/apostle.html',
  '/branch-registration.html',
  '/branch.html',
  '/campsregistration.html',
  '/christhood.html',
  '/Counselling-cont.html',
  '/Counselling.html',
  '/creative-cont.html',
  '/creative.html',
  '/debug-test.html',
  '/events.html',
  '/give.html',
  '/humanitarian.html',
  '/iAct.html',
  '/ifc-cont.html',
  '/impact.html',
  '/index.html',
  '/international-faith-chapel.html',
  '/jewels.html',
  '/ladies-cont.html',
  '/ladies.html',
  '/leadership.html',
  '/media-cont.html',
  '/media.html',
  '/men-cont.html',
  '/men.html',
  '/mision.html',
  '/missions-cont.html',
  '/missions-outreach.html',
  '/protocol-cont.html',
  '/protocol.html',
  '/teen-life.html',
  '/worship-cont.html',
  '/worship.html',
  '/counselling.css',
  '/events.css',
  '/humanitarian.css',
  '/impact.css',
  '/ladies.css',
  '/men.css',
  '/ministries.css',
  '/programs.css',
  '/style.css',
  '/chatbot.js',
  '/events.js',
  '/give.js',
  '/humanitarian.js',
  '/prog.js',
  '/script.js',
  '/manifest.json',
  '/image/logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .then(() => {
        if (self.registration && self.registration.waiting) {
          return self.clients.matchAll({ type: 'window' }).then(clients => {
            clients.forEach(client => {
              client.postMessage({ type: 'UPDATE_AVAILABLE' });
            });
          });
        }
        return undefined;
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const isSheets = requestUrl.hostname.includes('docs.google.com') && requestUrl.pathname.includes('/spreadsheets');
  const acceptHeader = event.request.headers.get('accept') || '';
  const isHtml = event.request.mode === 'navigate' || acceptHeader.includes('text/html');
  const isMedia = acceptHeader.includes('image') || acceptHeader.includes('video') || acceptHeader.includes('audio');

  if (isSheets) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (isHtml) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (isMedia) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

function networkFirst(request) {
  return fetch(request)
    .then(response => {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
      return response;
    })
    .catch(() => caches.match(request));
}

function cacheFirst(request) {
  return caches.match(request).then(cached => {
    if (cached) {
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        })
        .catch(() => undefined);
      return cached;
    }

    return fetch(request).then(response => {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
      return response;
    });
  });
}

function staleWhileRevalidate(request) {
  return caches.match(request).then(cached => {
    const networkFetch = fetch(request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        return response;
      })
      .catch(() => cached);

    return cached || networkFetch;
  });
}
