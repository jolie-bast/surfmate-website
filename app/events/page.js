import Header from "../../components/Header";
import Footer from "../../components/Footer";
import EventCard from "../../components/EventCard";
import JsonLd from "../../components/JsonLd";
import { getWebsiteEvents, getWebsiteEventGoingCount } from "../../lib/supabase";
import { isUpcomingOrLive, eventSortStart } from "../../lib/events";
import { breadcrumbNode, eventsItemListNode, pageMetadata } from "../../lib/seo";

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
  const events = await loadEvents();

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
      </main>

      <Footer />
    </>
  );
}
