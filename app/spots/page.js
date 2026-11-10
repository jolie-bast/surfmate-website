import Header from "../../components/Header";
import Footer from "../../components/Footer";
import JsonLd from "../../components/JsonLd";
import SpotDirectory from "../../components/SpotDirectory";
import { getWebsiteSpots } from "../../lib/supabase";
import { countryName } from "../../lib/countries";
import { breadcrumbNode, countryPath, pageMetadata, spotItemListNode } from "../../lib/seo";

const TITLE = "Surf spots";
const DESCRIPTION =
  "Every spot the Surfmate community surfs most, ranked by real activity – with public sessions, local knowledge and events nearby.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/spots/",
});

export default async function SpotsIndexPage() {
  const spots = await getWebsiteSpots();
  const countries = [];
  for (const spot of spots) {
    if (countries.some((country) => country.code === spot.country_code)) continue;
    countries.push({
      code: spot.country_code,
      name: countryName(spot.country_code),
      path: countryPath(spot.country_code),
    });
  }

  return (
    <>
      <JsonLd
        data={[
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Spots", path: "/spots/" },
          ]),
          spotItemListNode(spots, "Surf spots on Surfmate"),
        ]}
      />
      <Header />
      <main>
        <section className="sm-container" style={{ padding: "48px 24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <p className="sm-eyebrow">Spot guide</p>
          <h1 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.95 }}>
            Who is surfing where?
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 640 }}>
            Ranked by how many Surfmates have actually logged a session there – not a curated top list. Every spot has
            its own page with public sessions, local knowledge and events nearby.
          </p>
        </section>

        <section className="sm-container" style={{ padding: "24px 24px 104px", display: "flex", flexDirection: "column", gap: 28 }}>
          {countries.length > 0 && (
            <nav aria-label="Spots by country" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {countries.map((country) => (
                <a key={country.code} href={country.path} className="sm-pill" style={{ fontSize: 14, textDecoration: "none" }}>
                  {country.name}
                </a>
              ))}
            </nav>
          )}
          <SpotDirectory spots={spots} />
        </section>
      </main>
      <Footer />
    </>
  );
}
