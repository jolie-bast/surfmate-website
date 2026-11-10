import { notFound } from "next/navigation";
import Header from "../../../../components/Header";
import Footer from "../../../../components/Footer";
import JsonLd from "../../../../components/JsonLd";
import SpotDirectory from "../../../../components/SpotDirectory";
import { getWebsiteSpots } from "../../../../lib/supabase";
import { countryName, countrySlug, slugToCountryCode } from "../../../../lib/countries";
import { breadcrumbNode, countryPath, pageMetadata, regionPath, spotItemListNode } from "../../../../lib/seo";

export async function generateStaticParams() {
  const spots = await getWebsiteSpots();
  const pairs = new Map();
  for (const spot of spots) {
    const country = countrySlug(spot.country_code);
    pairs.set(`${country}/${spot.region_slug}`, { country, region: spot.region_slug });
  }
  return [...pairs.values()];
}

export async function generateMetadata({ params }) {
  const { country, region } = await params;
  const spots = (await getWebsiteSpots()).filter(
    (spot) => countrySlug(spot.country_code) === country && spot.region_slug === region,
  );
  const spot = spots[0];
  if (!spot) return {};
  const name = countryName(spot.country_code);
  return pageMetadata({
    title: `Surf spots in ${spot.region}`,
    description: `Surf spots in ${spot.region}, ${name}, ranked by real Surfmate sessions. See who has surfed there and which events are nearby.`,
    path: regionPath(spot),
  });
}

export default async function RegionSpotsPage({ params }) {
  const { country, region } = await params;
  const code = slugToCountryCode(country);
  const spots = (await getWebsiteSpots()).filter(
    (spot) => countrySlug(spot.country_code) === country && spot.region_slug === region,
  );
  const spot = spots[0];
  if (!code || !spot) notFound();

  const name = countryName(code);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Spots", path: "/spots/" },
            { name, path: countryPath(code) },
            { name: spot.region, path: regionPath(spot) },
          ]),
          spotItemListNode(spots, `Surf spots in ${spot.region}, ${name}`),
        ]}
      />
      <Header />
      <main>
        <section className="sm-container" style={{ padding: "48px 24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <nav aria-label="Breadcrumb" style={{ fontSize: 14, color: "var(--sm-muted)", display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a href="/spots/">Spots</a>
            <span aria-hidden="true">/</span>
            <a href={countryPath(code)}>{name}</a>
            <span aria-hidden="true">/</span>
            <span>{spot.region}</span>
          </nav>
          <p className="sm-eyebrow">Spot guide · {spot.region}, {name}</p>
          <h1 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.95 }}>
            Surf spots in {spot.region}
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 640 }}>
            Spots in {spot.region}, {name}, ranked by how many Surfmates have logged a session there. Open a spot to
            see public sessions and events nearby.
          </p>
        </section>

        <section className="sm-container" style={{ padding: "24px 24px 104px" }}>
          <SpotDirectory spots={spots} />
        </section>
      </main>
      <Footer />
    </>
  );
}
