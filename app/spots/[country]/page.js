import { notFound } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import JsonLd from "../../../components/JsonLd";
import { getWebsiteSpots } from "../../../lib/supabase";
import { countryName, countrySlug, slugToCountryCode } from "../../../lib/countries";
import { breadcrumbNode, countryPath, pageMetadata, regionPath, spotItemListNode } from "../../../lib/seo";

export async function generateStaticParams() {
  const spots = await getWebsiteSpots();
  return [...new Set(spots.map((spot) => countrySlug(spot.country_code)))].map((country) => ({ country }));
}

export async function generateMetadata({ params }) {
  const { country } = await params;
  const code = slugToCountryCode(country);
  if (!code) return {};
  const name = countryName(code);
  return pageMetadata({
    title: `Surf spots in ${name}`,
    description: `Surf spots in ${name} that the Surfmate community actually logs. See who has surfed there, public sessions and events nearby.`,
    path: `/spots/${country}/`,
  });
}

export default async function CountrySpotsPage({ params }) {
  const { country } = await params;
  const code = slugToCountryCode(country);
  if (!code) notFound();

  const spots = (await getWebsiteSpots()).filter((spot) => spot.country_code === code);
  if (spots.length === 0) notFound();

  const name = countryName(code);
  const regions = [];
  for (const spot of spots) {
    let region = regions.find((entry) => entry.slug === spot.region_slug);
    if (!region) {
      region = { slug: spot.region_slug, name: spot.region, spots: [] };
      regions.push(region);
    }
    region.spots.push(spot);
  }

  return (
    <>
      <JsonLd
        data={[
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Spots", path: "/spots/" },
            { name, path: countryPath(code) },
          ]),
          spotItemListNode(spots, `Surf spots in ${name}`),
        ]}
      />
      <Header />
      <main>
        <section className="sm-container" style={{ padding: "48px 24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <nav aria-label="Breadcrumb" style={{ fontSize: 14, color: "var(--sm-muted)", display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a href="/spots/">Spots</a>
            <span aria-hidden="true">/</span>
            <span>{name}</span>
          </nav>
          <p className="sm-eyebrow">Spot guide · {name}</p>
          <h1 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.95 }}>
            Surf spots in {name}
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 640 }}>
            The spots Surfmates actually log in {name}, grouped by region. Each spot has its own page with public
            sessions, local knowledge and events nearby.
          </p>
        </section>

        <section className="sm-container" style={{ padding: "8px 24px 104px", display: "flex", flexDirection: "column", gap: 48 }}>
          {regions.map((region) => (
            <div key={region.slug} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h2 className="sm-heavy" style={{ margin: 0, fontSize: 32, lineHeight: 1 }}>
                <a href={regionPath(region.spots[0])} style={{ textDecoration: "none" }}>
                  {region.name}
                </a>
              </h2>
              <ol style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--sm-border-strong)" }}>
                {region.spots.map((spot) => (
                  <li key={spot.id} style={{ borderBottom: "1px solid var(--sm-border-strong)" }}>
                    <a
                      href={`/spots/${country}/${spot.region_slug}/${spot.slug}/`}
                      style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 20, padding: "18px 4px" }}
                    >
                      <span style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>{spot.name}</span>
                      <span className="sm-pill" style={{ fontSize: 13 }}>
                        {spot.surfer_count > 0 ? `${spot.surfer_count} surfed here` : "New"}
                      </span>
                      <span aria-hidden="true">→</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
