// Enscra Codex — offline support. Bump CACHE when you want phones to drop old files.
const CACHE = 'enscra-codex-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './icon-maskable-192.png', './icon-maskable-512.png',
  './art/sera.jpg', './art/isolde.jpg', './art/nora.jpg', './art/mave.jpg', './art/edric2.jpg', './art/sorene2.jpg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('enscra-codex-') && k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
const put = (req, res) => { if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; };
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || e.request.headers.has('range')) return; // let audio streaming go straight to the network
  const url = new URL(e.request.url);
  const page = url.origin === location.origin && (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/'));
  if (page) {
    // newest page when online, cached copy when offline
    e.respondWith(fetch(e.request).then(r => put(e.request, r)).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else if (url.origin === location.origin && url.pathname.includes('/codex/')) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => put(e.request, res))));
  } else if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => put(e.request, res))));
  }
});
