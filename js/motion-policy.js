/**
 * Decides when to skip typewriters and scroll-driven animations
 * (slow network, save-data mode, prefers-reduced-motion).
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

    const slowTypes = ["slow-2g", "2g", "3g"];
    return slowTypes.includes(connection.effectiveType);
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function shouldSkipAnimations() {
    if (prefersReducedMotion()) return true;
    if (document.documentElement.classList.contains("skip-animations")) {
      return true;
    }
    return hasSlowNetworkConnection();
  }

  if (hasSlowNetworkConnection()) {
    document.documentElement.classList.add("skip-animations");
  }

  window.prefersReducedMotion = prefersReducedMotion;
  window.shouldSkipAnimations = shouldSkipAnimations;
  window.hasSlowNetworkConnection = hasSlowNetworkConnection;
})();
