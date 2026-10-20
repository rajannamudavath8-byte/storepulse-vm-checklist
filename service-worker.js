const CACHE_NAME = "storepulse-vm-audit-v1";
const APP_SHELL = ["./", "./manifest.webmanifest", "./storepulse-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("storepulse-vm-audit-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const cachedResponse = response.clone();
        event.waitUntil(caches.open(CACHE_NAME)
          .then((cache) => cache.put("./", cachedResponse)));
      }
      return response;
    }).catch(() => caches.match("./")));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) {
        const cachedResponse = response.clone();
        event.waitUntil(caches.open(CACHE_NAME)
          .then((cache) => cache.put(request, cachedResponse)));
      }
      return response;
    });
  }));
});