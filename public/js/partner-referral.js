(function () {
  var APP_STORE_URL =
    "https://apps.apple.com/de/app/surfmate-surf-log-connect/id6760191082";
  var PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp&pcampaignid=web_share";
  var APP_SCHEME = "surfmate://";
  var SUBLINE =
    "Join the surf community. Log sessions, find spots, and meet surfers nearby.";
  var LOGO_SRC = "/assets/logo-surfmate-schriftzug.svg";

  var els = {
    title: document.getElementById("partner-referral-title"),
    copy: document.getElementById("partner-referral-copy"),
    logo: document.getElementById("partner-referral-logo"),
    logoImg: document.getElementById("partner-referral-logo-img"),
    cta: document.getElementById("partner-referral-cta"),
    primary: document.getElementById("partner-referral-primary"),
    secondary: document.getElementById("partner-referral-secondary"),
    badges: document.getElementById("partner-referral-badges"),
    note: document.getElementById("partner-referral-note"),
  };

  function detectPlatform() {
    var ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (/Android/i.test(ua)) return "android";
    return "desktop";
  }

  function getRawSlugFromLocation() {
    var url = new URL(window.location.href);
    var querySlug = url.searchParams.get("slug");
    if (querySlug) return querySlug;

    var segments = window.location.pathname.split("/").filter(Boolean);
    var pIndex = segments.indexOf("p");
    if (pIndex === -1) return "";
    return segments[pIndex + 1] || "";
  }

  function parsePartnerSlug(value) {
    var slug = String(value || "")
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9-]{2,30}$/.test(slug)) return "";
    return slug;
  }

  function unwrapRpcData(data) {
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
  }

  function setHidden(element, hidden) {
    if (!element) return;
    element.hidden = hidden;
  }

  function bindStoreLinks() {
    if (window.SurfmateStores) window.SurfmateStores.bind(document);
  }

  function setPrimaryStore(store) {
    if (!els.primary) return;
    els.primary.removeAttribute("data-store");
    if (store === "ios" || store === "android") {
      els.primary.setAttribute("data-store", store);
      els.primary.href = store === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
    }
    bindStoreLinks();
  }

  function showSurfmateLogo() {
    if (!els.logoImg || !els.logo) return;
    els.logoImg.src = LOGO_SRC;
    els.logoImg.alt = "Surfmate";
    els.logo.classList.add("is-logo");
    els.logo.classList.remove("is-partner-logo");
    setHidden(els.logo, false);
  }

  function showPartnerLogo(url, name) {
    if (!els.logoImg || !els.logo) return;

    if (!url) {
      showSurfmateLogo();
      return;
    }

    els.logo.classList.remove("is-logo");
    els.logo.classList.add("is-partner-logo");
    els.logoImg.alt = name || "";
    els.logoImg.onerror = showSurfmateLogo;
    els.logoImg.src = url;
    setHidden(els.logo, false);
  }

  function renderInvalid() {
    document.title = "Invite not found - Surfmate";
    showSurfmateLogo();
    els.title.textContent = "This Surfmate invite was not found";
    els.copy.textContent =
      "The link may be outdated or incorrect. You can still download Surfmate below.";
    els.primary.href = "/";
    els.primary.textContent = "Go to Surfmate";
    els.primary.removeAttribute("data-store");
    setHidden(els.cta, false);
    setHidden(els.secondary, true);
    setHidden(els.badges, false);
    bindStoreLinks();
    if (els.note) {
      els.note.textContent =
        "If you expected a partner invite, ask them to send you a fresh link.";
    }
  }

  function renderPartnerInvite(partner, platform) {
    var name = partner.name || "A Surfmate partner";
    document.title = name + " invited you to Surfmate";
    els.title.textContent = name + " invited you to Surfmate";
    els.copy.textContent = SUBLINE;
    showPartnerLogo(partner.logo_url || null, name);

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

    setHidden(els.cta, true);
    setHidden(els.secondary, true);
    setHidden(els.badges, false);
    bindStoreLinks();
    if (els.note) {
      els.note.textContent = "Download Surfmate on your phone to continue.";
    }
  }

  async function fetchPartnerLanding(slug, platform) {
    return window.SurfmateRpc.call("get_public_partner_landing", {
      p_slug: slug,
      p_platform_hint: platform,
      p_landing_context: document.referrer || "web_landing",
    });
  }

  async function init() {
    bindStoreLinks();
    var slug = parsePartnerSlug(getRawSlugFromLocation());

    if (!slug) {
      renderInvalid();
      return;
    }

    try {
      var platform = detectPlatform();
      var data = await fetchPartnerLanding(slug, platform);

      if (!data || data.found === false) {
        renderInvalid();
        return;
      }

      renderPartnerInvite(data, platform);
    } catch (error) {
      console.error("Failed to load partner landing page.", error);
      renderInvalid();
    }
  }

  init();
})();
