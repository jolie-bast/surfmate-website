// Platform-aware "Get the app" redirect — sends iOS/Android visitors
// straight to their store instead of the page's badge pair.

export const APP_STORE_URL = "https://apps.apple.com/app/id6760191082";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp";

export function detectAppPlatform() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return null;
}

export function getSmartAppLink() {
  const platform = detectAppPlatform();
  if (platform === "ios") return APP_STORE_URL;
  if (platform === "android") return PLAY_STORE_URL;
  return null;
}
