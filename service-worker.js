const CACHE_NAME = "anything-under-the-sun-discount-calculator-v1";
const APP_SHELL_URLS = [
  "./index.html",
  "./css/style.css",
  "./js/script.js",
  "./js/pwa.js",
  "./manifest.webmanifest",
  "./assets/ANYTHING%20UNDER%20THE%20SUN.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-512-maskable.png",
  "./assets/vendor/jspdf.umd.min.js",
  "./assets/vendor/jspdf.plugin.autotable.min.js",
  "./assets/vendor/Roboto-Variable.ttf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) =>
            cacheName.startsWith("anything-under-the-sun-discount-calculator-") &&
            cacheName !== CACHE_NAME
          )
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async (error) => {
        const cache = await caches.open(CACHE_NAME);
        const cachedPage = await cache.match(request);
        const appEntry = await cache.match(new URL("./index.html", self.registration.scope).href);
        if (cachedPage || appEntry) {
          return cachedPage || appEntry;
        }
        throw error;
      })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
      }
      return response;
    })
  );
});
