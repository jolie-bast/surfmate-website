(() => {
  const STORAGE_KEY = "surfmate_consent_v1";
  const GA_MEASUREMENT_ID = "G-DKK7DGE8ED";

  /** @type {{statistics: boolean}|null} */
  let consent = null;
  let bannerEl = null;
  let gaLoaded = false;

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

  function ensureGtagStub() {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };
  }

  function loadGA4Once() {
    if (gaLoaded) return;
    gaLoaded = true;

    ensureGtagStub();

    const existing = document.querySelector(
      `script[src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`,
    );
    if (!existing) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(s);
    }

    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID);
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
          <p class="consent-banner__title">Cookies & Analytics</p>
          <p class="consent-banner__text">
            We use necessary cookies to run this site. With your permission, we also use analytics (GA4) to understand usage and improve SurfMate.
            <a href="./datenschutz.html">Learn more</a>.
          </p>
        </div>
        <div class="consent-banner__actions">
          <button type="button" class="consent-btn" data-action="reject">Reject</button>
          <button type="button" class="consent-btn consent-btn--primary" data-action="accept">Accept analytics</button>
        </div>
      </div>
    `;

    wrapper.addEventListener("click", (e) => {
      const target = /** @type {HTMLElement|null} */ (e.target);
      const action = target?.getAttribute?.("data-action");
      if (!action) return;

      if (action === "accept") {
        writeStoredConsent({ statistics: true });
        loadGA4Once();
        removeBanner();
      }

      if (action === "reject") {
        writeStoredConsent({ statistics: false });
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
      loadGA4Once();
      return;
    }

    if (consent?.statistics === false) {
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
