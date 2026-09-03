/* Service worker — cache App Shell pour jeu hors-ligne (PWA). */
var CACHE = 'q4c-v1';
var ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './assets/icon-180.png',
  './assets/icon-512.png',
  './src/core/util.js',
  './src/core/font.js',
  './src/core/gfx.js',
  './src/core/input.js',
  './src/core/audio.js',
  './src/core/sprites.js',
  './src/data/tables.js',
  './src/data/monsters.js',
  './src/data/story.js',
  './src/data/maps.js',
  './src/engine/save.js',
  './src/engine/bake.js',
  './src/engine/assets.js',
  './src/engine/dungeon.js',
  './src/engine/party.js',
  './src/engine/battle.js',
  './src/engine/ui.js',
  './src/engine/world.js',
  './src/engine/main.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(function (hit) {
    if (hit) return hit;
    return fetch(e.request).then(function (res) {
      if (!res || res.status !== 200 || res.type === 'opaque') return res;
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () { return caches.match('./index.html'); });
  }));
});
