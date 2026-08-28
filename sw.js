/**
 * Examcamp Service Worker
 *
 * GitHub Pages:
 * https://yeasir-rifat.github.io/examcamp/
 */

"use strict";

/* =========================================================
   CONFIGURATION
   ========================================================= */

const CACHE_VERSION = "examcamp-v2";

const APP_CACHE = `${CACHE_VERSION}-app`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

/*
 * Only cache files that are guaranteed to exist.
 * Do not add external Firebase/Gemini/CDN URLs here.
 */
const APP_SHELL = [
  "/examcamp/",
  "/examcamp/index.html",
  "/examcamp/manifest.json"
];


/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => {
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error(
          "[Examcamp SW] Installation failed:",
          error
        );
      })
  );
});


/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName.startsWith("examcamp-") &&
                cacheName !== APP_CACHE &&
                cacheName !== ASSET_CACHE
              );
            })
            .map((cacheName) => {
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Only handle requests from the same origin
  if (url.origin !== self.location.origin) {
    return;
  }

  // Only handle the /examcamp/ application
  if (!url.pathname.startsWith("/examcamp/")) {
    return;
  }


  /* -------------------------------------------------------
     NAVIGATION REQUESTS
     Network first → Offline fallback
     ------------------------------------------------------- */

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();

            caches.open(APP_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }

          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);

          if (cachedPage) {
            return cachedPage;
          }

          const fallback = await caches.match(
            "/examcamp/index.html"
          );

          if (fallback) {
            return fallback;
          }

          return new Response(
            "Examcamp is currently offline.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            }
          );
        })
    );

    return;
  }


  /* -------------------------------------------------------
     STATIC ASSETS
     Cache first → Network fallback
     ------------------------------------------------------- */

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          /*
           * Only cache successful basic responses.
           */
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const responseClone = response.clone();

            caches.open(ASSET_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }

          return response;
        })
        .catch(() => {
          return new Response("", {
            status: 503,
            statusText: "Offline"
          });
        });
    })
  );
});


/* =========================================================
   MESSAGE HANDLER
   ========================================================= */

self.addEventListener("message", (event) => {
  if (!event.data) {
    return;
  }

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith("examcamp-"))
            .map((name) => caches.delete(name))
        );
      })
    );
  }
});
