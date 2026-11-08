import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getWebsiteSpots } from "../../lib/supabase";
import { countryName, countrySlug } from "../../lib/countries";

export const metadata = {
  title: "Surf spots · Surfmate",
  description:
    "Every spot the Surfmate community surfs most, ranked by real activity – with public sessions, local knowledge and events nearby.",
};

export default async function SpotsIndexPage() {
  const spots = await getWebsiteSpots();

  return (
    <>
      <Header />

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

      <section className="sm-container" style={{ padding: "24px 24px 104px" }}>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--sm-border-strong)" }}>
          {spots.map((spot, i) => (
            <li key={spot.id} style={{ borderBottom: "1px solid var(--sm-border-strong)" }}>
              <a
                href={`/spots/${countrySlug(spot.country_code)}/${spot.region_slug}/${spot.slug}/`}
                style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 20, padding: "20px 4px", flexWrap: "wrap" }}
              >
                <span style={{ fontSize: 13, color: "var(--sm-muted)", width: 28 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ flex: 1, minWidth: 180, fontSize: 20, fontWeight: 600 }}>{spot.name}</span>
                <span style={{ fontSize: 15, color: "var(--sm-muted)" }}>{spot.region}, {countryName(spot.country_code)}</span>
                <span className="sm-pill" style={{ fontSize: 13 }}>
                  {spot.surfer_count > 0 ? `${spot.surfer_count} surfed here` : "New"}
                </span>
                <span aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <Footer />
    </>
  );
}
