import { getWebsiteSpots } from "../lib/supabase";
import { countrySlug } from "../lib/countries";

export const dynamic = "force-static";

const STATIC_PATHS = [
  "/",
  "/spots/",
  "/events/",
  "/events/submit/",
  "/partners/",
  "/creators/",
  "/team.html",
  "/join/",
  "/shop/",
  "/support/",
  "/impressum.html",
  "/legal.html",
  "/datenschutz.html",
  "/datenschutz-app.html",
  "/datenschutz-dwv.html",
  "/terms.html",
  "/terms-of-sale.html",
  "/withdrawal-policy.html",
  "/community-guidelines.html",
  "/data-deletion.html",
];

export default async function sitemap() {
  const spots = await getWebsiteSpots();
  const spotPaths = spots.map(
    (spot) => `/spots/${countrySlug(spot.country_code)}/${spot.region_slug}/${spot.slug}/`,
  );

  return [...STATIC_PATHS, ...spotPaths].map((path) => ({
    url: `https://surfmate.eu${path}`,
  }));
}
