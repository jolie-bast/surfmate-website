import Header from "../components/Header";
import Footer from "../components/Footer";
import EventCard from "../components/EventCard";
import JsonLd from "../components/JsonLd";
import { getWebsiteEvents, getWebsiteEventGoingCount } from "../lib/supabase-events";
import { isUpcomingOrLive, eventSortStart } from "../lib/events";
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
  const events = await loadEvents();

  return (
    <>
      <JsonLd data={eventsItemListNode(events)} />
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
          <a href="https://surfmate.eu/events/submit/" className="sm-btn sm-btn-accent" style={{ alignSelf: "flex-start" }}>
            Got an event to add? Submit it on Surfmate →
          </a>
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
