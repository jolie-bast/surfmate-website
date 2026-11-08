import { notFound } from "next/navigation";
import Header from "../../../../../components/Header";
import Footer from "../../../../../components/Footer";
import {
  getWebsiteEvents,
  getWebsiteSpot,
  getWebsiteSpots,
  getWebsiteSpotSessions,
  getWebsiteSpotSurfedCount,
} from "../../../../../lib/supabase";
import { countryName, countrySlug } from "../../../../../lib/countries";
import { isUpcomingOrLive, eventSortStart, distanceKm } from "../../../../../lib/events";

const NEARBY_EVENT_RADIUS_KM = 300;

export async function generateStaticParams() {
  const spots = await getWebsiteSpots();
  return spots.map((spot) => ({
    country: countrySlug(spot.country_code),
    region: spot.region_slug,
    spot: spot.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { spot: slug } = await params;
  const spot = await getWebsiteSpot(slug);
  if (!spot) return {};
  return {
    title: `${spot.name} · Surf spot in ${spot.region} · Surfmate`,
    description: `See who surfs ${spot.name} in ${spot.region}, ${countryName(spot.country_code)}. Public sessions, local knowledge and events nearby, on Surfmate.`,
  };
}

function formatSessionDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default async function SpotPage({ params }) {
  const { spot: slug } = await params;
  const spot = await getWebsiteSpot(slug);
  if (!spot) notFound();

  const [surfedCount, sessions, allSpots, events] = await Promise.all([
    getWebsiteSpotSurfedCount(slug),
    getWebsiteSpotSessions(slug),
    getWebsiteSpots(),
    getWebsiteEvents(),
  ]);

  const moreInRegion = allSpots.filter((s) => s.region_slug === spot.region_slug && s.slug !== spot.slug);
  const now = new Date();
  const nearbyEvent = events
    .filter((e) => isUpcomingOrLive(e, now) && e.latitude != null && e.longitude != null)
    .map((e) => ({ ...e, distanceKm: distanceKm(spot.latitude, spot.longitude, e.latitude, e.longitude) }))
    .filter((e) => e.distanceKm <= NEARBY_EVENT_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm || eventSortStart(a) - eventSortStart(b))[0];

  return (
    <>
      <Header />

      {/* SPOT HEADER */}
      <section className="sm-container" style={{ padding: "32px 24px 48px", display: "flex", flexDirection: "column", gap: 28 }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 14, color: "var(--sm-muted)", display: "flex", flexWrap: "wrap", gap: 8 }}>
          <a href="/spots/">Spots</a>
          <span aria-hidden="true">/</span>
          <span>{countryName(spot.country_code)}</span>
          <span aria-hidden="true">/</span>
          <span>{spot.region}</span>
          <span aria-hidden="true">/</span>
          <span>{spot.name}</span>
        </nav>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="sm-eyebrow">Surf spot · {spot.region}, {countryName(spot.country_code)}</p>
            <h1 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(52px, 7vw, 104px)", lineHeight: 0.9 }}>{spot.name}</h1>
          </div>
        </div>
      </section>

      {/* WHO SURFS HERE */}
      <section className="sm-container" style={{ padding: "0 24px 72px" }}>
        <div style={{ background: "var(--sm-black)", color: "#fff", borderRadius: 15, padding: 36, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex" }}>
              <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--sm-blue)", border: "3px solid #1A1A1A" }} />
              <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--sm-blue-light)", border: "3px solid #1A1A1A", marginLeft: -14 }} />
              <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--sm-mint)", border: "3px solid #1A1A1A", marginLeft: -14 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <strong className="sm-heavy" style={{ fontSize: 28, lineHeight: 1 }}>{surfedCount} Surfmates have surfed here</strong>
              <span style={{ fontSize: 16, color: "#E6E6E6" }}>See who they are and paddle out together next time.</span>
            </div>
          </div>
          <a href="https://apps.apple.com/app/id6760191082" className="sm-btn" style={{ background: "var(--sm-blue)", color: "var(--sm-black)", padding: "14px 22px", fontSize: 16 }}>
            Find surfers at {spot.name}
          </a>
        </div>
      </section>

      {/* SESSIONS + SIDEBAR */}
      <section className="sm-container" style={{ padding: "0 24px 96px", display: "flex", flexWrap: "wrap", gap: 48 }}>
        <div style={{ flex: "999 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
            <h2 className="sm-heavy" style={{ margin: 0, fontSize: 36, lineHeight: 1 }}>Recent sessions</h2>
            <span style={{ fontSize: 14, color: "var(--sm-muted)" }}>Public sessions only · shown with a delay</span>
          </div>

          {sessions.length === 0 && (
            <div style={{ border: "1px solid var(--sm-border)", borderRadius: 15, padding: 32, fontSize: 16, lineHeight: 1.55, color: "var(--sm-ink)" }}>
              No public sessions here yet. Sessions shared from the app with "Show on website" turned on will appear
              here, with a short delay.
            </div>
          )}

          {sessions.map((s) => (
            <article key={s.id} style={{ border: "1px solid var(--sm-border)", borderRadius: 15, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {s.surfer_avatar_url ? (
                  <img src={s.surfer_avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <span style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--sm-blue-light)" }} />
                )}
                <span style={{ fontSize: 15, lineHeight: 1.35 }}>
                  <strong style={{ fontWeight: 600, display: "block" }}>{s.surfer_display_name || "A Surfmate"}</strong>
                  <span style={{ color: "var(--sm-muted)" }}>{formatSessionDate(s.session_date)}{s.session_time_label ? ` · ${s.session_time_label}` : ""}</span>
                </span>
              </div>
              {s.media_urls && s.media_urls.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  {s.media_urls.slice(0, 2).map((url) => (
                    <img key={url} src={url} alt="" style={{ borderRadius: 12, aspectRatio: "4 / 3", objectFit: "cover", width: "100%" }} />
                  ))}
                </div>
              )}
              {s.notes && <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55 }}>{s.notes}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13, fontWeight: 500 }}>
                {(s.highlights || []).map((h) => (
                  <span key={h} className="sm-pill">{h}</span>
                ))}
                {(s.emotions || []).map((e) => (
                  <span key={e} className="sm-pill">{e}</span>
                ))}
              </div>
            </article>
          ))}

          <a href="https://apps.apple.com/app/id6760191082" className="sm-btn sm-btn-outline" style={{ alignSelf: "flex-start" }}>
            See all sessions in the app
          </a>
        </div>

        <aside style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ borderRadius: 15, background: "var(--sm-mint)", overflow: "hidden", position: "relative", aspectRatio: "4 / 3" }}>
            <span
              style={{
                position: "absolute",
                left: `${20 + (Math.abs(spot.longitude) % 1) * 60}%`,
                top: `${20 + (Math.abs(spot.latitude) % 1) * 60}%`,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "var(--sm-black)",
                border: "3px solid #fff",
                transform: "translate(-50%, -50%)",
              }}
            />
            <span style={{ position: "absolute", left: 14, bottom: 12, fontSize: 12, fontWeight: 600, color: "var(--sm-black)" }}>Approximate location</span>
          </div>
          <div style={{ border: "1px solid var(--sm-border)", borderRadius: 15, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>About this spot</h3>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--sm-ink)" }}>
              {spot.name} is one of the spots the Surfmate community keeps coming back to in {spot.region}. Download
              the app for tides, webcams and local notes from other surfers.
            </p>
          </div>
          {nearbyEvent && (
            <div style={{ border: "1px solid var(--sm-border)", borderRadius: 15, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Events nearby</h3>
              <a href={nearbyEvent.website_url || "/events/"} style={{ textDecoration: "none", display: "flex", gap: 14, alignItems: "center" }}>
                <span style={{ flex: "none", width: 52, height: 52, borderRadius: 12, background: "var(--sm-black)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>
                    {new Intl.DateTimeFormat("en-GB", { month: "short" }).format(new Date(eventSortStart(nearbyEvent))).toUpperCase()}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{new Date(eventSortStart(nearbyEvent)).getDate()}</span>
                </span>
                <span style={{ fontSize: 15, lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 600, display: "block" }}>{nearbyEvent.title}</strong>
                  <span style={{ color: "var(--sm-muted)" }}>{nearbyEvent.location_name}</span>
                </span>
              </a>
            </div>
          )}
          {moreInRegion.length > 0 && (
            <div style={{ border: "1px solid var(--sm-border)", borderRadius: 15, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>More spots in {spot.region}</h3>
              {moreInRegion.map((s) => (
                <a key={s.id} href={`/spots/${countrySlug(s.country_code)}/${s.region_slug}/${s.slug}/`} style={{ fontSize: 15 }}>
                  {s.name} →
                </a>
              ))}
            </div>
          )}
        </aside>
      </section>

      {/* APP CTA */}
      <section id="app" style={{ background: "var(--sm-mint)" }}>
        <div className="sm-container" style={{ padding: "80px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <img src="/images/app-icon.png" alt="" style={{ width: 72, height: 72, borderRadius: 16, display: "block" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <strong className="sm-heavy" style={{ fontSize: "clamp(26px, 3vw, 40px)", lineHeight: 1 }}>Surfing {spot.name} soon?</strong>
              <span style={{ fontSize: 17, color: "var(--sm-ink)" }}>See who is there, share a spotcheck and paddle out together.</span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href="https://apps.apple.com/app/id6760191082" aria-label="Download on the App Store">
              <img src="/assets/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg" alt="Download on the App Store" style={{ height: 52, width: "auto", display: "block" }} />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp" aria-label="Get it on Google Play">
              <img src="/assets/GetItOnGooglePlay_Badge_Web_color_English.svg" alt="Get it on Google Play" style={{ height: 52, width: "auto", display: "block" }} />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
