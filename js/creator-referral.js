(function () {
  var config = window.SURFMATE_SUPABASE;
  var supabaseClient = null;
  var supabaseLoadPromise = null;
  var APP_STORE_URL =
    "https://apps.apple.com/de/app/surfmate-surf-log-connect/id6760191082";
  var PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp&pcampaignid=web_share";

  var els = {
    title: document.getElementById("creator-referral-title"),
    copy: document.getElementById("creator-referral-copy"),
    cta: document.getElementById("creator-referral-cta"),
    primary: document.getElementById("creator-referral-primary"),
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

  function getSlugFromLocation() {
    var url = new URL(window.location.href);
    var querySlug = url.searchParams.get("slug");

    if (querySlug) {
      return sanitizeSlug(querySlug);
    }

    var segments = window.location.pathname.split("/").filter(Boolean);
    var cIndex = segments.indexOf("c");
    if (cIndex === -1) return "";
    return sanitizeSlug(segments[cIndex + 1] || "");
  }

  function sanitizeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
  }

  function storeSlug(slug) {
    try {
      window.localStorage.setItem("surfmate_creator_slug", slug);
    } catch (error) {
      // Ignore storage failures in private browsing or hardened browsers.
    }
  }

  function extractDisplayName(data, slug) {
    if (!data || typeof data !== "object") {
      return formatSlug(slug);
    }

    return (
      data.display_name ||
      data.creator_display_name ||
      data.creator_name ||
      (data.creator && data.creator.display_name) ||
      formatSlug(slug)
    );
  }

  function formatSlug(slug) {
    return String(slug || "A Surfmate creator")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, function (char) {
        return char.toUpperCase();
      });
  }

  function setPrimaryCta(href, label) {
    els.primary.href = href;
    els.primary.textContent = label;
    els.cta.hidden = false;
  }

  function showBadges(show) {
    els.badges.hidden = !show;
  }

  function renderInvalid() {
    document.title = "Invite not found - Surfmate";
    els.title.textContent = "This Surfmate invite was not found";
    els.copy.textContent =
      "The creator link may be outdated or incorrect. You can still explore Surfmate and download the app below.";
    setPrimaryCta("/", "Go to Surfmate");
    showBadges(true);
    els.note.textContent =
      "If you expected a creator invite, ask them to send you a fresh link.";
  }

  function renderCreatorInvite(displayName, platform) {
    document.title = displayName + " invited you to Surfmate";
    els.title.textContent = displayName + " invited you to Surfmate";

    if (platform === "ios") {
      els.copy.textContent =
        "Download Surfmate on your iPhone or iPad and join the community through this creator invite.";
      setPrimaryCta(APP_STORE_URL, "Download on the App Store");
      showBadges(false);
      return;
    }

    if (platform === "android") {
      els.copy.textContent =
        "Download Surfmate on Android and join the community through this creator invite.";
      setPrimaryCta(PLAY_STORE_URL, "Get it on Google Play");
      showBadges(false);
      return;
    }

    els.copy.textContent =
      "You are on desktop right now. Download Surfmate on your phone using the badges below to continue with this creator invite.";
    setPrimaryCta("/", "Explore Surfmate");
    showBadges(true);
  }

  async function init() {
    var slug = getSlugFromLocation();

    if (!slug) {
      renderInvalid();
      return;
    }

    storeSlug(slug);

    try {
      var client = await getSupabase();
      var platform = detectPlatform();
      var result = await client.rpc("record_creator_link_click", {
        p_slug: slug,
        p_platform_hint: platform,
        p_landing_context: document.referrer || null,
      });

      if (result.error) {
        throw result.error;
      }

      var data = result.data;
      if (!data || data.recorded === false) {
        renderInvalid();
        return;
      }

      renderCreatorInvite(extractDisplayName(data, slug), platform);
    } catch (error) {
      console.error("Failed to load creator referral landing page.", error);
      renderInvalid();
    }
  }

  init();
})();
