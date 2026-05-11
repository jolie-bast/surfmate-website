// Include Manager für HTML Partials
class IncludeManager {
  static async loadIncludes() {
    const includes = document.querySelectorAll("[data-include]");

    for (const include of includes) {
      try {
        const file = include.getAttribute("data-include");
        const response = await fetch(`/includes/${file}`);

        if (response.ok) {
          const content = await response.text();
          include.innerHTML = content;
          include.removeAttribute("data-include");
        } else {
          console.error(`Fehler beim Laden von ${file}:`, response.status);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Include-Datei:", error);
      }
    }
  }
}

function isAppleDevice() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // iPadOS can report itself as "MacIntel", so touch capability is required.
  return (
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Mac/i.test(platform) && maxTouchPoints > 1)
  );
}

function getSafeAreaTopInset() {
  return "env(safe-area-inset-top, 0px)";
}

function findConnectionBannerCandidate() {
  const selectors = [
    ".no-connection-banner",
    ".offline-banner",
    ".network-status-banner",
    "[data-connection-banner]",
    "[data-network-banner]",
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  const candidates = document.querySelectorAll("div, section, aside");
  for (const element of candidates) {
    const text = (element.textContent || "").trim().toLowerCase();
    if (!text) continue;

    if (
      text.includes("no connection") ||
      text.includes("no internet") ||
      text.includes("keine verbindung")
    ) {
      return element;
    }
  }

  return null;
}

function adjustNoConnectionBannerForApple() {
  if (!isAppleDevice()) return;

  const banner = findConnectionBannerCandidate();
  if (!banner) return;

  banner.style.top = getSafeAreaTopInset();
  banner.style.transform = "none";
  banner.style.zIndex = "2100";
  banner.style.left = "0";
  banner.style.right = "0";
}

function initNoConnectionBannerAdjustment() {
  if (!isAppleDevice()) return;

  adjustNoConnectionBannerForApple();

  const observer = new MutationObserver(() => {
    adjustNoConnectionBannerForApple();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Lade Includes wenn DOM geladen ist

document.addEventListener("DOMContentLoaded", () => {
  initNoConnectionBannerAdjustment();

  IncludeManager.loadIncludes()
    .then(() => {
      // Initialisiere Custom Scrollbars und Navigation nach dem Laden der Includes
      if (typeof window.initCustomScrollbars === "function") {
        window.initCustomScrollbars();
      }
      if (typeof window.initNavigation === "function") {
        window.initNavigation();
      }
    })
    .catch((error) => {
      console.error("Fehler beim Laden der Includes:", error);
    });
});
