import { getWebsiteSpots } from "../lib/supabase";
import { countrySlug } from "../lib/countries";
import { absoluteUrl, countryPath, regionPath, spotPath } from "../lib/seo";

export const dynamic = "force-static";

const STATIC_PATHS = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/spots/", changeFrequency: "weekly", priority: 0.9 },
  { path: "/events/", changeFrequency: "daily", priority: 0.9 },
  { path: "/events/submit/", changeFrequency: "monthly", priority: 0.5 },
  { path: "/shop/", changeFrequency: "weekly", priority: 0.7 },
  { path: "/partners/", changeFrequency: "monthly", priority: 0.6 },
  { path: "/creators/", changeFrequency: "monthly", priority: 0.6 },
  { path: "/team.html", changeFrequency: "monthly", priority: 0.5 },
  { path: "/join/", changeFrequency: "monthly", priority: 0.5 },
  { path: "/support/", changeFrequency: "monthly", priority: 0.4 },
  { path: "/impressum.html", changeFrequency: "yearly", priority: 0.2 },
  { path: "/legal.html", changeFrequency: "yearly", priority: 0.2 },
  { path: "/datenschutz.html", changeFrequency: "yearly", priority: 0.2 },
  { path: "/datenschutz-app.html", changeFrequency: "yearly", priority: 0.2 },
  { path: "/datenschutz-dwv.html", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms.html", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms-of-sale.html", changeFrequency: "yearly", priority: 0.2 },
  { path: "/withdrawal-policy.html", changeFrequency: "yearly", priority: 0.2 },
  { path: "/community-guidelines.html", changeFrequency: "yearly", priority: 0.3 },
  { path: "/data-deletion.html", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap() {
  const spots = await getWebsiteSpots();
  const countries = new Map();
  const regions = new Map();

  for (const spot of spots) {
    const country = countrySlug(spot.country_code);
    countries.set(country, countryPath(spot.country_code));
    regions.set(`${country}/${spot.region_slug}`, regionPath(spot));
  }

  const entries = [
    ...STATIC_PATHS,
    ...[...countries.values()].map((path) => ({ path, changeFrequency: "weekly", priority: 0.8 })),
    ...[...regions.values()].map((path) => ({ path, changeFrequency: "weekly", priority: 0.7 })),
    ...spots.map((spot) => ({ path: spotPath(spot), changeFrequency: "weekly", priority: 0.8 })),
  ];

  return entries.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));
}
