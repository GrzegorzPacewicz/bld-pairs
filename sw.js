const CACHE = "bld-pairs-v4";
const ASSETS = [
  "/bld-pairs/",
  "/bld-pairs/index.html",
  "/bld-pairs/style.css",
  "/bld-pairs/app.js",
  "/bld-pairs/icon.svg",
  "/bld-pairs/manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request)),
  );
});
