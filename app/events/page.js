import Header from "../../components/Header";
import Footer from "../../components/Footer";
import EventCard from "../../components/EventCard";
import JsonLd from "../../components/JsonLd";
import { getWebsiteEvents, getWebsiteEventGoingCount, getWebsiteTopEvents } from "../../lib/supabase";
import { isUpcomingOrLive, eventSortStart } from "../../lib/events";
import { countryName } from "../../lib/countries";
import { breadcrumbNode, eventPath, eventsItemListNode, pageMetadata } from "../../lib/seo";

const DESCRIPTION = "Contests, festivals and meetups worldwide – see who is going and meet the crew there.";

export const metadata = pageMetadata({
  title: "Surf events",
  description: DESCRIPTION,
  path: "/events/",
});

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

export default async function EventsIndexPage() {
  const [events, topEvents] = await Promise.all([loadEvents(), getWebsiteTopEvents(6)]);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events/" },
          ]),
          eventsItemListNode(events),
        ]}
      />
      <Header />
      <main>

      <section className="sm-container" style={{ padding: "48px 24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <p className="sm-eyebrow">Upcoming surf events</p>
        <h1 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.95 }}>
          See who is going.
        </h1>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 640 }}>
          Contests, festivals and meetups worldwide. Tap “I’m going” and meet the crew there.
        </p>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--sm-muted)" }}>
          Every Sunday we post upcoming surf events worldwide.
        </p>
        <a href="/events/submit/" style={{ fontSize: 15, fontWeight: 600 }}>Submit an event →</a>
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
              <a key={e.id} href={eventPath(e)} style={{ color: "inherit", textDecoration: "none", display: "flex", flexDirection: "column", gap: 10 }}>
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
