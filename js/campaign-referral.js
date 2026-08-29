(function () {
  var APP_STORE_URL =
    "https://apps.apple.com/de/app/surfmate-surf-log-connect/id6760191082";
  var PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp&pcampaignid=web_share";
  var APP_SCHEME = "surfmate://";
  var SKIP_KEY = "surfmate_campaign_store_redirect";
  var TITLE = "Join Surfmate";
  var SUBLINE =
    "Log sessions, find spots, and meet surfers nearby.";

  var els = {
    title: document.getElementById("campaign-landing-title"),
    copy: document.getElementById("campaign-landing-copy"),
    logo: document.getElementById("campaign-landing-logo"),
    cta: document.getElementById("campaign-landing-cta"),
    primary: document.getElementById("campaign-landing-primary"),
    secondary: document.getElementById("campaign-landing-secondary"),
    badges: document.getElementById("campaign-landing-badges"),
    note: document.getElementById("campaign-landing-note"),
  };

  var activeSlug = "";

  function detectPlatform() {
    var ua = navigator.userAgent || "";
    var platform = navigator.platform || "";
    var maxTouchPoints = navigator.maxTouchPoints || 0;
    var isIOS =
      /iPhone|iPad|iPod/i.test(ua) ||
      (platform === "MacIntel" && maxTouchPoints > 1);

    if (isIOS) return "ios";
    if (/Android/i.test(ua)) return "android";
    return "desktop";
  }

  function getRawSlugFromLocation() {
    var url = new URL(window.location.href);
    var querySlug = url.searchParams.get("slug");
    if (querySlug) return querySlug;

    var segments = window.location.pathname.split("/").filter(Boolean);
    var gIndex = segments.indexOf("g");
    if (gIndex === -1) return "";
    return segments[gIndex + 1] || "";
  }

  function parseCampaignSlug(value) {
    var slug = String(value || "")
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9-]{2,30}$/.test(slug)) return "";
    return slug;
  }

  function setHidden(element, hidden) {
    if (!element) return;
    element.hidden = hidden;
  }

  function openStore(store) {
    if (window.SurfmateStores) {
      window.SurfmateStores.open(store);
      return;
    }
    window.location.href = store === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
  }

  function recordStoreClick(store) {
    if (!activeSlug || !window.SurfmateRpc) {
      return Promise.resolve();
    }

    return window.SurfmateRpc
      .call("record_marketing_campaign_store_click", {
        p_slug: activeSlug,
        p_store: store,
        p_platform_hint: detectPlatform(),
      })
      .catch(function (error) {
        console.error("Failed to record campaign store click.", error);
      });
  }

  function bindTrackedStoreLinks() {
    document.querySelectorAll("[data-store]").forEach(function (link) {
      if (link.dataset.storeBound === "true") return;
      link.dataset.storeBound = "true";
      link.addEventListener("click", function (event) {
        var store = link.getAttribute("data-store");
        if (store !== "ios" && store !== "android") return;
        event.preventDefault();
        recordStoreClick(store).finally(function () {
          openStore(store);
        });
      });
    });

    if (window.SurfmateStores) window.SurfmateStores.bind(document);
  }

  function setPrimaryStore(store) {
    if (!els.primary) return;
    els.primary.removeAttribute("data-store");
    if (store === "ios" || store === "android") {
      els.primary.setAttribute("data-store", store);
      els.primary.href = store === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
    }
    bindTrackedStoreLinks();
  }

  function renderDownload(platform) {
    document.title = TITLE;
    setHidden(els.logo, true);
    els.title.textContent = TITLE;
    els.copy.textContent = SUBLINE;
    els.primary.textContent = "Download Surfmate";

    if (els.secondary) {
      els.secondary.href = APP_SCHEME;
    }

    if (platform === "ios") {
      setPrimaryStore("ios");
      setHidden(els.cta, false);
      setHidden(els.secondary, false);
      setHidden(els.badges, true);
      if (els.note) {
        els.note.textContent =
          "If Surfmate is already installed, your phone may open the app directly.";
      }
      return;
    }

    if (platform === "android") {
      setPrimaryStore("android");
      setHidden(els.cta, false);
      setHidden(els.secondary, false);
      setHidden(els.badges, true);
      if (els.note) {
        els.note.textContent =
          "If Surfmate is already installed, your phone may open the app directly.";
      }
      return;
    }

    els.primary.removeAttribute("data-store");
    setHidden(els.cta, true);
    setHidden(els.secondary, true);
    setHidden(els.badges, false);
    bindTrackedStoreLinks();
    if (els.note) {
      els.note.textContent = "Download Surfmate on your phone to continue.";
    }
  }

  async function fetchCampaignLanding(slug, platform) {
    return window.SurfmateRpc.call("get_public_marketing_campaign_landing", {
      p_slug: slug,
      p_platform_hint: platform,
      p_landing_context: document.referrer || "web_landing",
    });
  }

  async function init() {
    bindTrackedStoreLinks();
    var slug = parseCampaignSlug(getRawSlugFromLocation());
    var platform = detectPlatform();
    activeSlug = slug || "";

    // Mobile auto-redirect runs in <head>. This script is the fallback
    // for desktop, ?web, or after returning from the store.
    if (slug) {
      try {
        var alreadyRedirected = false;
        try {
          alreadyRedirected = sessionStorage.getItem(SKIP_KEY) === "1";
        } catch (error) {}

        if (!alreadyRedirected) {
          await fetchCampaignLanding(slug, platform);
        }
      } catch (error) {
        console.error("Failed to load marketing campaign landing.", error);
      }
    }

    renderDownload(platform);
  }

  init();
})();
