/**
 * Public Supabase client config (same project as the Surfmate app).
 * URL + publishable anon key are safe to expose in the browser.
 */
window.SURFMATE_SUPABASE = {
  url: "https://jycbthjasldnqavajrlf.supabase.co",
  anonKey: "sb_publishable_Q1q7u9-B8zs4JZuA7HMigw_LPyMkagk",
  /** Set via js/mapbox-config.js (local) or GitHub Actions secret on deploy. */
  mapboxToken: "",
  /** Public OAuth client ID (same as app EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID). */
  googleWebClientId:
    "1088673105685-bujfumdaf3tnsndkksdklf8mkfvm7p5o.apps.googleusercontent.com",
};
