window.SurfmateStores = (function () {
  var APP_STORE_URL =
    "https://apps.apple.com/de/app/surfmate-surf-log-connect/id6760191082";
  var PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp&pcampaignid=web_share";
  var APP_STORE_ITMS = "itms-apps://apps.apple.com/app/id6760191082";
  var PLAY_STORE_MARKET = "market://details?id=com.joliebast.surfmateapp";
  var IN_APP_RE =
    /Instagram|FBAN|FBAV|FB_IAB|Line\/|Twitter|TikTok|musical_ly|BytedanceWebview|TTWebView|Snapchat|aweme/i;

  function isInAppBrowser() {
    return IN_APP_RE.test(navigator.userAgent || "");
  }

  function go(url) {
    window.location.href = url;
  }

  function open(store) {
    var isIOS = store === "ios";
    var httpsUrl = isIOS ? APP_STORE_URL : PLAY_STORE_URL;
    var nativeUrl = isIOS ? APP_STORE_ITMS : PLAY_STORE_MARKET;

    if (isInAppBrowser()) {
      go(nativeUrl);
      window.setTimeout(function () {
        go(httpsUrl);
      }, 600);
      return;
    }

    go(httpsUrl);
  }

  function openSystemBrowser() {
    var href = window.location.href;
    var ua = navigator.userAgent || "";

    if (/iPhone|iPad|iPod/i.test(ua)) {
      go(href.replace(/^https:\/\//i, "x-safari-https://"));
      return;
    }

    if (/Android/i.test(ua)) {
      var path = href.replace(/^https:\/\//i, "");
      go(
        "intent://" +
          path +
          "#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=" +
          encodeURIComponent(href) +
          ";end"
      );
      return;
    }

    go(href);
  }

  function bind(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-store]").forEach(function (link) {
      if (link.dataset.storeBound === "true") return;
      link.dataset.storeBound = "true";
      link.addEventListener("click", function (event) {
        var store = link.getAttribute("data-store");
        if (store !== "ios" && store !== "android") return;
        event.preventDefault();
        open(store);
      });
    });

    scope.querySelectorAll("[data-open-system-browser]").forEach(function (link) {
      if (link.dataset.browserBound === "true") return;
      link.dataset.browserBound = "true";
      link.hidden = !isInAppBrowser();
      link.addEventListener("click", function (event) {
        event.preventDefault();
        openSystemBrowser();
      });
    });
  }

  return {
    APP_STORE_URL: APP_STORE_URL,
    PLAY_STORE_URL: PLAY_STORE_URL,
    isInAppBrowser: isInAppBrowser,
    open: open,
    openSystemBrowser: openSystemBrowser,
    bind: bind,
  };
})();
