(function () {
  var config = window.SURFMATE_SUPABASE;
  var supabaseClient = null;
  var supabaseLoadPromise = null;
  var APP_STORE_URL =
    "https://apps.apple.com/de/app/surfmate-surf-log-connect/id6760191082";
  var PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp&pcampaignid=web_share";
  var APP_SCHEME = "surfmate://";
  var SUBLINE =
    "Join the surf community. Log sessions, find spots, and meet surfers nearby.";
  var LOGO_SRC = "/assets/logo-surfmate-schriftzug.svg";

  var els = {
    title: document.getElementById("creator-referral-title"),
    copy: document.getElementById("creator-referral-copy"),
    avatar: document.getElementById("creator-referral-avatar"),
    avatarImg: document.getElementById("creator-referral-avatar-img"),
    cta: document.getElementById("creator-referral-cta"),
    primary: document.getElementById("creator-referral-primary"),
    secondary: document.getElementById("creator-referral-secondary"),
    badges: document.getElementById("creator-referral-badges"),
    note: document.getElementById("creator-referral-note"),
  };

  function getSupabase() {
    if (!config || !config.url || !config.anonKey) {
      return Promise.reject(new Error("Supabase is not configured."));
    }

    if (supabaseClient) {
      return Promise.resolve(supabaseClient);
    }

    if (!supabaseLoadPromise) {
      supabaseLoadPromise = import("https://esm.sh/@supabase/supabase-js@2.49.1").then(
        function (module) {
          supabaseClient = module.createClient(config.url, config.anonKey);
          return supabaseClient;
        }
      );
    }

    return supabaseLoadPromise;
  }

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
    var cIndex = segments.indexOf("c");
    if (cIndex === -1) return "";
    return segments[cIndex + 1] || "";
  }

  function parseCreatorSlug(value) {
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

  function storeSlug(slug) {
    try {
      window.localStorage.setItem("surfmate_creator_slug", slug);
    } catch (error) {}

    try {
      document.cookie =
        "surfmate_creator=" +
        encodeURIComponent(slug) +
        "; max-age=86400; path=/; secure; samesite=lax";
    } catch (error) {}
  }

  function setHidden(element, hidden) {
    if (!element) return;
    element.hidden = hidden;
  }

  function showLogoFallback() {
    if (!els.avatarImg || !els.avatar) return;
    els.avatarImg.src = LOGO_SRC;
    els.avatarImg.alt = "Surfmate";
    els.avatar.classList.add("is-logo");
    setHidden(els.avatar, false);
  }

  function showAvatar(url) {
    if (!els.avatarImg || !els.avatar) {
      return;
    }

    if (!url) {
      showLogoFallback();
      return;
    }

    els.avatar.classList.remove("is-logo");
    els.avatarImg.alt = "";
    els.avatarImg.onerror = showLogoFallback;
    els.avatarImg.src = url;
    setHidden(els.avatar, false);
  }

  function renderInvalid() {
    document.title = "Invite not found - Surfmate";
    showLogoFallback();
    els.title.textContent = "This Surfmate invite was not found";
    els.copy.textContent =
      "The link may be outdated or incorrect. You can still download Surfmate below.";
    els.primary.href = "/";
    els.primary.textContent = "Go to Surfmate";
    setHidden(els.cta, false);
    setHidden(els.secondary, true);
    setHidden(els.badges, false);
    if (els.note) {
      els.note.textContent =
        "If you expected a creator invite, ask them to send you a fresh link.";
    }
  }

  function renderCreatorInvite(creator, platform) {
    var displayName = creator.display_name || creator.username || "A Surfmate creator";
    document.title = displayName + " invited you to Surfmate";
    els.title.textContent = displayName + " invited you to Surfmate";
    els.copy.textContent = SUBLINE;
    showAvatar(creator.avatar_url || null);

    els.primary.textContent = "Download Surfmate";
    if (els.secondary) {
      els.secondary.href = APP_SCHEME;
    }

    if (platform === "ios") {
      els.primary.href = APP_STORE_URL;
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
      els.primary.href = PLAY_STORE_URL;
      setHidden(els.cta, false);
      setHidden(els.secondary, false);
      setHidden(els.badges, true);
      if (els.note) {
        els.note.textContent =
          "If Surfmate is already installed, your phone may open the app directly.";
      }
      return;
    }

    els.primary.href = APP_STORE_URL;
    setHidden(els.cta, true);
    setHidden(els.secondary, true);
    setHidden(els.badges, false);
    if (els.note) {
      els.note.textContent = "Download Surfmate on your phone to continue.";
    }
  }

  async function fetchCreatorLanding(client, slug, platform) {
    var result = await client.rpc("get_public_creator_landing", {
      p_slug: slug,
      p_platform_hint: platform,
      p_landing_context: document.referrer || null,
    });

    if (!result.error) {
      return unwrapRpcData(result.data);
    }

    var message = String((result.error && result.error.message) || "");
    var missingLandingRpc = /get_public_creator_landing|could not find the function/i.test(
      message
    );

    if (!missingLandingRpc) {
      throw result.error;
    }

    var fallback = await client.rpc("record_creator_link_click", {
      p_slug: slug,
      p_platform_hint: platform,
      p_landing_context: document.referrer || null,
    });

    if (fallback.error) {
      throw fallback.error;
    }

    var fallbackData = unwrapRpcData(fallback.data);
    if (!fallbackData || fallbackData.recorded === false) {
      return { found: false };
    }

    return {
      found: true,
      slug: slug,
      username: fallbackData.username || slug,
      display_name:
        fallbackData.display_name ||
        fallbackData.creator_display_name ||
        fallbackData.creator_name ||
        null,
      avatar_url: fallbackData.avatar_url || null,
    };
  }

  async function init() {
    var slug = parseCreatorSlug(getRawSlugFromLocation());

    if (!slug) {
      renderInvalid();
      return;
    }

    try {
      var client = await getSupabase();
      var platform = detectPlatform();
      var data = await fetchCreatorLanding(client, slug, platform);

      if (!data || data.found === false) {
        renderInvalid();
        return;
      }

      storeSlug(data.slug || slug);
      renderCreatorInvite(data, platform);
    } catch (error) {
      console.error("Failed to load creator landing page.", error);
      renderInvalid();
    }
  }

  init();
})();
