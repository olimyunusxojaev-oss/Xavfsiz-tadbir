/* Офлайн иш учун оддий service worker: саҳифа ва ресурслар кэшланади,
   янги версия тармоқдан олинади (network-first), тармоқ бўлмаса кэшдан. */
const CACHE = 'xavfsiz-tadbir-v11';
const SHELL = [
  'index.html', 'kabinet.html', 'xarita.html', 'admin.html', 'monitoring.html', 'qonunchilik.html',
  'assets/img/milliy-gvardiya.png', 'assets/img/favicon.png',
  'assets/css/main.css', 'assets/css/skin.css',
  'assets/js/i18n.js', 'assets/js/i18n-dict.js', 'assets/js/calc.js', 'assets/js/core.js', 'assets/js/remote.js', 'assets/js/geo.js', 'assets/js/contract.js',
  'assets/js/illustrations.js', 'assets/js/payments.js', 'assets/js/portal.js', 'assets/js/kabinet.js', 'assets/js/xarita.js', 'assets/js/monitoring.js', 'assets/js/qonunchilik.js', 'assets/js/laws.js'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const cacheable = url.origin === location.origin || /cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (!cacheable) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () { return caches.match(req, { ignoreSearch: true }); }));
});
