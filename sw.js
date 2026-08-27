/* Exampedia Service Worker
 * Scope: /exampedia/
 *
 * Strategy:
 * - Cache only the same-origin app shell.
 * - Navigation: network-first, cached index fallback.
 * - Same-origin static GETs: stale-while-revalidate.
 * - Cross-origin requests (Firebase, Gemini, CDN libraries, Google auth): pass through.
 *
 * This avoids caching API/auth responses and keeps the app updateable.
 */

const CACHE_VERSION = "exampedia-v1";
const APP_CACHE = `${CACHE_VERSION}-app`;
const APP_SHELL = [
  "/exampedia/",
  "/exampedia/index.html",
  "/exampedia/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== APP_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept third-party requests such as Firebase, Gemini, CDN,
  // Google Identity, etc.
  if (url.origin !== self.location.origin) return;

  // Only control the Exampedia path.
  if (!url.pathname.startsWith("/exampedia/")) return;

  // HTML navigation: network first, then cached app shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_CACHE).then((cache) => cache.put("/exampedia/index.html", copy));
          return response;
        })
        .catch(() =>
          caches.match("/exampedia/index.html").then(
            (cached) =>
              cached ||
              new Response(
                "<h1>Exampedia is offline</h1><p>Please reconnect and try again.</p>",
                { headers: { "Content-Type": "text/html; charset=utf-8" } }
              )
          )
        )
    );
    return;
  }

  // Same-origin resources: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(APP_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
