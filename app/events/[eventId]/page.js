import { notFound } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import JsonLd from "../../../components/JsonLd";
import eventTypeBadge from "../../../components/EventTypeBadge";
import {
  getWebsiteEvent,
  getWebsiteEventAttendanceCounts,
  getWebsiteEvents,
} from "../../../lib/supabase";
import { eventDateLabel, eventSortStart, eventTimeLabel, isEventLiveNow, isUpcomingOrLive } from "../../../lib/events";
import { countryName } from "../../../lib/countries";
import { breadcrumbNode, eventNode, eventPath, pageMetadata, spotPath } from "../../../lib/seo";

export async function generateStaticParams() {
  const events = await getWebsiteEvents();
  return events.map((event) => ({ eventId: event.id }));
}

export async function generateMetadata({ params }) {
  const { eventId } = await params;
  const event = await getWebsiteEvent(eventId);
  if (!event) return {};

  const description =
    event.description?.trim() ||
    (event.location_name
      ? `${event.title} in ${event.location_name}. See who from Surfmate is going.`
      : `${event.title}. See who from Surfmate is going.`);

  return pageMetadata({
    title: event.title,
    description,
    path: eventPath(event),
    ...(event.cover_image_url
      ? { image: { url: event.cover_image_url, width: 1200, height: 630, alt: event.title } }
      : {}),
  });
}

// Custom label wins; otherwise percent + appliesTo produce e.g. "10% on festival tickets".
// Mirrors the app's resolveEventCommunityDiscountDisplay.
function communityDiscount(event) {
  const buttonLabel = event.community_discount_button_label?.trim() || "Join event";
  const customLabel = event.community_discount_custom_label?.trim();
  if (customLabel) return { chip: null, message: customLabel, buttonLabel };

  const appliesTo = event.community_discount_applies_to?.trim();
  const percent = event.community_discount_percent;
  if (percent == null || percent <= 0 || !appliesTo) return null;

  return { chip: `${percent}%`, message: `on ${appliesTo}`, buttonLabel };
}

function sharedTypeCount(event, otherTypes) {
  const types = new Set(event.event_types || []);
  return (otherTypes || []).filter((type) => types.has(type)).length;
}

function attendanceHeadline(counts, isPast) {
  if (isPast) {
    const went = (counts.went || 0) + (counts.going || 0);
    return went > 0 ? `${went} Surfmate${went === 1 ? "" : "s"} went` : null;
  }
  const parts = [];
  if (counts.going > 0) parts.push(`${counts.going} going`);
  if (counts.maybe > 0) parts.push(`${counts.maybe} maybe`);
  return parts.length ? parts.join(" · ") : null;
}

export default async function EventDetailPage({ params }) {
  const { eventId } = await params;
  const event = await getWebsiteEvent(eventId);
  if (!event) notFound();

  const [counts, allEvents] = await Promise.all([
    getWebsiteEventAttendanceCounts(event.id),
    getWebsiteEvents(),
  ]);

  const now = new Date();
  const isPast = !isUpcomingOrLive(event, now);
  const isLive = isEventLiveNow(event, now);
  const headline = attendanceHeadline(counts, isPast);
  const discount = communityDiscount(event);
  const timeLabel = eventTimeLabel(event);
  const websiteUrl = event.website_url?.trim() || "";
  const liveHeatsUrl = event.live_heats_url?.trim() || "";
  const eventLinkUrl = websiteUrl || liveHeatsUrl;
  const showWebsiteRow = Boolean(websiteUrl);
  const showLiveHeatsRow = Boolean(liveHeatsUrl) && liveHeatsUrl !== websiteUrl;
  const instagramUrl = event.instagram_username
    ? `https://www.instagram.com/${encodeURIComponent(event.instagram_username)}/`
    : null;
  const mapUrl =
    event.latitude != null && event.longitude != null
      ? `https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=15/${event.latitude}/${event.longitude}`
      : null;

  // Same-category events first (ranked by how many categories they share),
  // then other upcoming events by date, so the list is never empty.
  const upcomingOthers = allEvents.filter((e) => e.id !== event.id && isUpcomingOrLive(e, now));
  const similarEvents = upcomingOthers
    .filter((e) => sharedTypeCount(event, e.event_types) > 0)
    .sort((a, b) => sharedTypeCount(event, b.event_types) - sharedTypeCount(event, a.event_types) || eventSortStart(a) - eventSortStart(b));
  const otherUpcoming = upcomingOthers
    .filter((e) => sharedTypeCount(event, e.event_types) === 0)
    .sort((a, b) => eventSortStart(a) - eventSortStart(b));
  const otherEvents = [...similarEvents, ...otherUpcoming].slice(0, 4);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events/" },
            { name: event.title, path: eventPath(event) },
          ]),
          eventNode(event),
        ]}
      />
      <Header />
      <main>
        <section className="sm-container" style={{ padding: "32px 24px 0" }}>
          <nav aria-label="Breadcrumb" style={{ fontSize: 14, color: "var(--sm-muted)", display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a href="/">Home</a>
            <span aria-hidden="true">/</span>
            <a href="/events/">Events</a>
            <span aria-hidden="true">/</span>
            <span style={{ color: "var(--sm-black)", fontWeight: 600 }}>{event.title}</span>
          </nav>
        </section>

        {event.cover_image_url && (
          // The outer wrapper deliberately has no overflow:hidden — only the
          // inner photo box clips to the rounded corners — so the logo tile
          // can hang half below the photo without being cut off.
          <section className="sm-container" style={{ padding: "20px 24px 0" }}>
            <div style={{ position: "relative" }}>
              <div style={{ borderRadius: "var(--sm-radius)", overflow: "hidden", aspectRatio: "16 / 9", background: "var(--sm-blue-light)" }}>
                <img
                  src={event.cover_image_url}
                  alt=""
                  style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              {event.logo_url && (
                <div
                  style={{
                    position: "absolute",
                    left: 20,
                    bottom: -36,
                    width: 72,
                    height: 72,
                    borderRadius: 14,
                    background: "#fff",
                    border: "1px solid var(--sm-border)",
                    boxShadow: "0 3px 6px rgba(0,0,0,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img src={event.logo_url} alt="" style={{ width: 52, height: 52, objectFit: "contain" }} />
                </div>
              )}
            </div>
          </section>
        )}

        <section className="sm-container" style={{ padding: "48px 24px 24px", display: "flex", flexDirection: "column", gap: 14, marginTop: event.cover_image_url && event.logo_url ? 44 : 0 }}>
          <p className="sm-eyebrow" style={{ margin: 0 }}>
            {isLive ? "● ON NOW · " : ""}
            {eventTypeBadge(event.event_types)}
            {event.is_partner && event.partner_name ? ` · ${event.partner_name}` : ""}
          </p>
          <h1 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(36px, 5vw, 60px)", lineHeight: 1.02 }}>
            {event.title}
          </h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--sm-black)" }}>{eventDateLabel(event)}</span>
            {timeLabel && <span style={{ fontSize: 15, color: "var(--sm-muted)" }}>{timeLabel}</span>}
            {event.location_name && (
              <span style={{ fontSize: 15, color: "var(--sm-muted)" }}>
                {event.location_name}
                {event.country_code ? `, ${countryName(event.country_code)}` : ""}
              </span>
            )}
          </div>

          {discount && (
            <span className="sm-pill" style={{ alignSelf: "flex-start" }}>
              {discount.chip ? `${discount.chip} ${discount.message}` : discount.message} — in the Surfmate app
            </span>
          )}

          {event.description && (
            <p style={{ margin: "6px 0 0", fontSize: 16, lineHeight: 1.6, color: "var(--sm-ink)", maxWidth: 680 }}>
              {event.description}
            </p>
          )}
        </section>

        <section className="sm-container" style={{ padding: "0 24px 56px", display: "flex", flexWrap: "wrap", gap: 48 }}>
          <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
            {headline && (
              <div style={{ background: "var(--sm-mint)", borderRadius: "var(--sm-radius)", padding: "16px 20px", fontSize: 16, fontWeight: 600 }}>
                {headline}
              </div>
            )}

            {event.linked_spots.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Surf spots</h2>
                {event.linked_spots.map((spot) =>
                  spot.slug && spot.region_slug && spot.country_code ? (
                    <a key={spot.id} href={spotPath(spot)} style={{ fontSize: 15, fontWeight: 600 }}>
                      {spot.name} →
                    </a>
                  ) : (
                    <span key={spot.id} style={{ fontSize: 15, color: "var(--sm-ink)" }}>
                      {spot.name}
                    </span>
                  ),
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600 }}>
                  📍 {event.location_name || "View venue"} on the map ↗
                </a>
              )}
              {showLiveHeatsRow && (
                <a href={liveHeatsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600 }}>
                  Live heats ↗
                </a>
              )}
              {showWebsiteRow && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600 }}>
                  Event website ↗
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 600 }}>
                  @{event.instagram_username} on Instagram ↗
                </a>
              )}
            </div>
          </div>

          <aside style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "var(--sm-black)", color: "#fff", borderRadius: "var(--sm-radius)", padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
              <strong className="sm-heavy" style={{ fontSize: 24, lineHeight: 1.1 }}>Going to {event.title}?</strong>
              <p style={{ margin: 0, fontSize: 15, color: "#d9d9d9" }}>
                Open it in the Surfmate app to RSVP, see who else is going and join the event chat.
              </p>
              <a href="/#download" className="sm-btn sm-btn-accent" style={{ width: "100%", textAlign: "center", justifyContent: "center" }}>
                I’m going – open in app
              </a>
              {eventLinkUrl && (
                <a href={eventLinkUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "#fff", textAlign: "center" }}>
                  {discount ? discount.buttonLabel : "Event details"} ↗
                </a>
              )}
            </div>

            {otherEvents.length > 0 && (
              <div style={{ border: "1px solid var(--sm-border)", borderRadius: "var(--sm-radius)", padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                  {similarEvents.length > 0 ? "Similar events" : "More events"}
                </h3>
                {otherEvents.map((e) => (
                  <a key={e.id} href={eventPath(e)} style={{ fontSize: 15 }}>
                    {e.title} →
                  </a>
                ))}
              </div>
            )}
          </aside>
        </section>

        <div className="sm-container" style={{ padding: "0 24px 80px" }}>
          <a href="/events/" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 16, fontWeight: 600 }}>
            ← All events
          </a>
        </div>

        <section id="app" style={{ background: "var(--sm-mint)" }}>
          <div className="sm-container" style={{ padding: "80px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <img src="/images/app-icon.png" alt="" style={{ width: 72, height: 72, borderRadius: 16, display: "block" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <strong className="sm-heavy" style={{ fontSize: "clamp(26px, 3vw, 40px)", lineHeight: 1 }}>See who’s going, in the app</strong>
                <span style={{ fontSize: 17, color: "var(--sm-ink)" }}>RSVP, join the event chat and meet the crew there — free on iOS and Android.</span>
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
      </main>
      <Footer />
    </>
  );
}
