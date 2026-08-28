/**
 * Examcamp PWA Registration
 * GitHub Pages project path:
 * https://yeasir-rifat.github.io/examcamp/
 */

(() => {
  "use strict";

  const SW_URL = "/examcamp/sw.js";
  const SW_SCOPE = "/examcamp/";

  // Check browser support
  if (!("serviceWorker" in navigator)) {
    console.info("[Examcamp PWA] Service Worker is not supported.");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_URL, {
        scope: SW_SCOPE,
        updateViaCache: "none"
      });

      console.info(
        "[Examcamp PWA] Service Worker registered successfully:",
        registration.scope
      );

      // Check for a new version
      registration.update().catch(() => {});

    } catch (error) {
      console.error(
        "[Examcamp PWA] Service Worker registration failed:",
        error
      );
    }
  });

  /**
   * Public helper for detecting standalone/PWA mode.
   */
  window.ExamcampPWA = {
    isStandalone() {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
      );
    },

    async update() {
      try {
        const registration =
          await navigator.serviceWorker.getRegistration(SW_SCOPE);

        if (registration) {
          await registration.update();
          return true;
        }

        return false;
      } catch (error) {
        console.error(
          "[Examcamp PWA] Update check failed:",
          error
        );

        return false;
      }
    }
  };
})();
