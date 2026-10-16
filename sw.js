// Offline support for the Zairo Quotation Builder.
// After you change any file and redeploy, raise the version number so phones pick up the update.
const CACHE = 'zairo-quotes-v3';

const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/logo.png',
  'assets/logo-white.png',
  'assets/hero.jpg',
  'assets/hero-cover.jpg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-64.png',
  ...['400', '500', '600', '700'].flatMap(w => [`assets/fonts/inter-latin-${w}-normal.woff2`, `assets/fonts/inter-latin-ext-${w}-normal.woff2`]),
  ...['500', '600', '700'].flatMap(w => [`assets/fonts/poppins-latin-${w}-normal.woff2`, `assets/fonts/poppins-latin-ext-${w}-normal.woff2`])
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // The page itself: use the latest version when online, the saved copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); }
          return res;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Images, fonts, icons: serve the saved copy straight away and refresh it in the background.
  event.respondWith(
    caches.match(req).then(hit => {
      const fresh = fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => hit);
      return hit || fresh;
    })
  );
});
