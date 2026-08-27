/* Exampedia PWA registration
 * Add this script near the end of index(1).html, before </body>.
 */
(() => {
  "use strict";

  const SW_URL = "/exampedia/sw.js";
  const SW_SCOPE = "/exampedia/";

  if (!("serviceWorker" in navigator)) {
    console.info("[Exampedia] Service Workers are not supported.");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_URL, {
        scope: SW_SCOPE,
        updateViaCache: "none",
      });

      console.info("[Exampedia] Service Worker registered:", registration.scope);

      // Check for a new worker when the app is opened.
      registration.update().catch(() => {});

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            console.info("[Exampedia] A new version is ready.");
          }
        });
      });
    } catch (error) {
      console.error("[Exampedia] Service Worker registration failed:", error);
    }
  });

  // Useful for debugging the actual launch mode.
  window.ExampediaPWA = {
    isStandalone() {
      return window.matchMedia("(display-mode: standalone)").matches ||
             window.navigator.standalone === true;
    }
  };
})();
