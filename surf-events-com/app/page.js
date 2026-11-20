import Header from "../components/Header";
import Footer from "../components/Footer";
import EventCard from "../components/EventCard";
import JsonLd from "../components/JsonLd";
import { getWebsiteEvents, getWebsiteEventGoingCount, getWebsiteTopEvents } from "../lib/supabase-events";
import { isUpcomingOrLive, eventSortStart } from "../lib/events";
import { countryName } from "../lib/countries";
import { eventsItemListNode } from "../lib/seo";

const DESCRIPTION = "Contests, festivals and meetups worldwide – see who is going and meet the crew there.";

// This page mirrors surfmate.eu/events/ content-for-content, but is not the
// canonical version of it: surfmate.eu/events/ stays the indexed original,
// this domain just gives the same listing a dedicated, easy-to-find home.
export const metadata = {
  title: "Surf Events",
  description: DESCRIPTION,
  alternates: {
    canonical: "https://surfmate.eu/events/",
  },
  openGraph: {
    type: "website",
    url: "https://surf-events.com/",
    siteName: "Surf Events",
    locale: "en_US",
    title: "Surf Events – surf contests, festivals & meetups worldwide",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: "Surf Events – surf contests, festivals & meetups worldwide",
    description: DESCRIPTION,
  },
};

async function loadEvents() {
  const events = await getWebsiteEvents();
  const now = new Date();
  const upcoming = events.filter((e) => isUpcomingOrLive(e, now)).sort((a, b) => eventSortStart(a) - eventSortStart(b));

  return Promise.all(
    upcoming.map(async (e) => ({
      ...e,
      going: await getWebsiteEventGoingCount(e.id),
    })),
  );
}

export default async function SurfEventsPage() {
  const [events, topEvents] = await Promise.all([loadEvents(), getWebsiteTopEvents(6)]);

  return (
    <>
      <JsonLd data={eventsItemListNode(events)} />
      <Header />
      <main>
        <section className="sm-container" style={{ padding: "48px 24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <p className="sm-eyebrow">Upcoming surf events</p>
          <h1 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.95 }}>
            Surf Events Worldwide
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 640 }}>
            Contests, festivals and meetups worldwide. Tap “I’m going” and meet the crew there.
          </p>
        </section>

        <section className="sm-container" style={{ padding: "24px 24px 104px" }}>
          {events.length === 0 ? (
            <p style={{ fontSize: 16, color: "var(--sm-ink)" }}>No upcoming events right now – check back soon.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </section>

        {topEvents.length > 0 && (
          <section className="sm-container" style={{ padding: "0 24px 104px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
              <p className="sm-eyebrow" style={{ margin: 0 }}>Most popular</p>
              <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(28px, 3.5vw, 40px)", lineHeight: 1.05 }}>
                Where Surfmates have been
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {topEvents.map((e) => (
                <a key={e.id} href={`/events/${e.id}/`} style={{ color: "inherit", textDecoration: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ aspectRatio: "4 / 3", borderRadius: 15, overflow: "hidden", background: "var(--sm-blue-light)", position: "relative" }}>
                    {e.cover_image_url && (
                      <img src={e.cover_image_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    <span style={{ position: "absolute", left: 10, bottom: 10, background: "#fff", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                      {e.attendee_count} went
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <strong style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.25 }}>{e.title}</strong>
                    <span style={{ fontSize: 14, color: "var(--sm-muted)" }}>
                      {e.location_name}
                      {e.country_code ? `, ${countryName(e.country_code)}` : ""}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
