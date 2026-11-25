"use client";

// Sends first-time mobile visitors straight to the App/Play Store instead of
// the homepage — the homepage lost this when it moved from static index.html
// to Next.js. Skips in-app browsers (their store redirects are unreliable),
// repeat visits this session, same-origin navigations, and anyone who adds
// ?web=1 to stay on the site.

import { useEffect } from "react";
import { getSmartAppLink } from "../lib/appLinks";

const SKIP_KEY = "surfmate_skip_store_redirect";
const IN_APP_BROWSER_RE =
  /Instagram|FBAN|FBAV|FB_IAB|Line\/|Twitter|TikTok|musical_ly|BytedanceWebview|TTWebView|Snapchat|aweme/i;

export default function AppStoreRedirect() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("web")) return;

    const ua = navigator.userAgent || "";
    if (IN_APP_BROWSER_RE.test(ua)) return;

    try {
      if (sessionStorage.getItem(SKIP_KEY) === "1") return;
    } catch {}

    try {
      if (document.referrer) {
        const referrerHost = new URL(document.referrer).hostname;
        if (referrerHost === window.location.hostname) return;
      }
    } catch {}

    const smartLink = getSmartAppLink();
    if (!smartLink) return;

    try {
      sessionStorage.setItem(SKIP_KEY, "1");
    } catch {}

    window.location.href = smartLink;
  }, []);

  return null;
}
