(() => {
  const STORAGE_KEY = "surfmate_consent_v1";

  /** @type {{statistics: boolean}|null} */
  let consent = null;
  let bannerEl = null;

  function readStoredConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.statistics !== "boolean") return null;
      return { statistics: parsed.statistics };
    } catch {
      return null;
    }
  }

  function writeStoredConsent(next) {
    consent = next;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          statistics: next.statistics,
          ts: Date.now(),
        }),
      );
    } catch {
      // ignore storage errors (private mode etc.)
    }
  }

  function applyAnalyticsConsent(statistics) {
    if (typeof window.gtag !== "function") return;
    window.gtag("consent", "update", {
      analytics_storage: statistics ? "granted" : "denied",
    });
    if (statistics) {
      window.gtag("event", "page_view");
    }
  }

  function removeBanner() {
    if (!bannerEl) return;
    bannerEl.remove();
    bannerEl = null;
  }

  function renderBanner() {
    if (bannerEl) return;

    const wrapper = document.createElement("div");
    wrapper.className = "consent-banner";
    wrapper.setAttribute("role", "dialog");
    wrapper.setAttribute("aria-live", "polite");
    wrapper.innerHTML = `
      <div class="consent-banner__grid">
        <div>
          <p class="consent-banner__title">Cookies</p>
          <p class="consent-banner__text">
            We use essential cookies to make this site work. If you’d like, you can also allow analytics (GA4) so we can understand what’s helpful and improve SurfMate.
            <a href="./datenschutz.html">Learn more</a>.
          </p>
        </div>
        <div class="consent-banner__actions">
          <button type="button" class="consent-btn" data-action="reject">Not now</button>
          <button type="button" class="consent-btn consent-btn--primary" data-action="accept">Allow analytics</button>
        </div>
      </div>
    `;

    wrapper.addEventListener("click", (e) => {
      const target = /** @type {HTMLElement|null} */ (e.target);
      const action = target?.getAttribute?.("data-action");
      if (!action) return;

      if (action === "accept") {
        writeStoredConsent({ statistics: true });
        applyAnalyticsConsent(true);
        removeBanner();
      }

      if (action === "reject") {
        writeStoredConsent({ statistics: false });
        applyAnalyticsConsent(false);
        removeBanner();
      }
    });

    document.body.appendChild(wrapper);
    bannerEl = wrapper;
  }

  function openPreferences() {
    renderBanner();
  }

  function init() {
    consent = readStoredConsent();

    if (consent?.statistics === true) {
      applyAnalyticsConsent(true);
      return;
    }

    if (consent?.statistics === false) {
      applyAnalyticsConsent(false);
      return;
    }

    renderBanner();
  }

  window.SurfmateConsent = {
    open: openPreferences,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
