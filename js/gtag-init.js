/* Google tag (gtag.js) + Consent Mode default: analytics denied until banner accept */
window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
window.gtag = gtag;

gtag("consent", "default", {
  analytics_storage: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  wait_for_update: 500,
});

gtag("js", new Date());

let debugMode = false;
try {
  debugMode =
    new URL(window.location.href).searchParams.get("ga_debug") === "1" ||
    window.localStorage.getItem("surfmate_ga_debug") === "1";
} catch {
  debugMode = false;
}

gtag("config", "G-DKK7DGE8ED", {
  anonymize_ip: true,
  debug_mode: debugMode,
});
