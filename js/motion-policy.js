/**
 * Hero-only motion policy for slow networks and save-data mode.
 * Story and other sections always animate (except prefers-reduced-motion).
 */
(function () {
  function getNetworkConnection() {
    return (
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection ||
      null
    );
  }

  function hasSlowNetworkConnection() {
    const connection = getNetworkConnection();
    if (!connection) return false;
    if (connection.saveData) return true;

    const slowTypes = ["slow-2g", "2g"];
    return slowTypes.includes(connection.effectiveType);
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function shouldSkipHeroAnimations() {
    if (prefersReducedMotion()) return true;
    if (document.documentElement.classList.contains("skip-hero-animations")) {
      return true;
    }
    return hasSlowNetworkConnection();
  }

  if (hasSlowNetworkConnection()) {
    document.documentElement.classList.add("skip-hero-animations");
  }

  window.prefersReducedMotion = prefersReducedMotion;
  window.shouldSkipHeroAnimations = shouldSkipHeroAnimations;
  window.hasSlowNetworkConnection = hasSlowNetworkConnection;
})();
