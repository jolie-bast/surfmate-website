import Header from "../components/Header";
import Footer from "../components/Footer";
import EventCard from "../components/EventCard";
import {
  getWebsiteEvents,
  getWebsiteEventGoingCount,
  getWebsitePartners,
  getWebsiteSpots,
  getWebsiteUserCount,
} from "../lib/supabase";
import { countrySlug, countryName } from "../lib/countries";
import { isUpcomingOrLive, eventSortStart } from "../lib/events";

async function loadUpcomingEvents() {
  const events = await getWebsiteEvents();
  const now = new Date();
  const upcoming = events
    .filter((e) => isUpcomingOrLive(e, now))
    .sort((a, b) => eventSortStart(a) - eventSortStart(b))
    .slice(0, 3);

  return Promise.all(
    upcoming.map(async (e) => ({
      ...e,
      going: await getWebsiteEventGoingCount(e.id),
    })),
  );
}

function allPartners(partners) {
  return [
    ...(partners.local_businesses || []),
    ...(partners.event_partners || []),
    ...(partners.product_partners || []),
  ].filter((p) => !p.hide_logo_on_website);
}

// Round down to a clean "N00+" so the stat doesn't look like it's ticking up
// by one with every signup, and still fall back to a safe default if the
// RPC is unreachable at build time.
function surferCountLabel(count) {
  if (!count || count < 100) return "2,000+";
  const rounded = Math.floor(count / 100) * 100;
  return `${rounded.toLocaleString("en-US")}+`;
}

export default async function HomePage() {
  const [events, partners, spots, userCount] = await Promise.all([
    loadUpcomingEvents(),
    getWebsitePartners(),
    getWebsiteSpots(),
    getWebsiteUserCount(),
  ]);
  const partnerLogos = allPartners(partners).slice(0, 6);
  const surferCount = surferCountLabel(userCount);

  return (
    <>
      <Header />

      {/* HERO */}
      <section
        id="top"
        className="sm-container"
        style={{ padding: "72px 24px 88px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 56 }}
      >
        <div style={{ flex: "1 1 480px", minWidth: 0, display: "flex", flexDirection: "column", gap: 28 }}>
          <p className="sm-eyebrow">The surf community app</p>
          <h1 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(48px, 6.6vw, 96px)", lineHeight: 0.92, letterSpacing: "-0.01em" }}>
            Find surfers nearby.
          </h1>
          <p className="sm-seattle" style={{ margin: 0, fontSize: "clamp(26px, 2.6vw, 36px)", lineHeight: 1.1 }}>
            Meet online. Surf together offline.
          </p>
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 520 }}>
            Surfmate connects surfers worldwide. See who surfs your spot, share spotchecks, join meetups – and turn
            strangers in the line-up into surf friends.
          </p>
          <div id="download" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <a href="https://apps.apple.com/app/id6760191082" aria-label="Download on the App Store">
              <img src="/assets/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg" alt="Download on the App Store" style={{ height: 52, width: "auto", display: "block" }} />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp" aria-label="Get it on Google Play">
              <img src="/assets/GetItOnGooglePlay_Badge_Web_color_English.svg" alt="Get it on Google Play" style={{ height: 52, width: "auto", display: "block" }} />
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, color: "var(--sm-ink)" }}>
            <div style={{ display: "flex" }}>
              <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--sm-blue)", border: "2px solid #fff" }} />
              <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--sm-blue-light)", border: "2px solid #fff", marginLeft: -10 }} />
              <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--sm-mint)", border: "2px solid #fff", marginLeft: -10 }} />
            </div>
            <span><strong style={{ fontWeight: 600 }}>{surferCount} surfers</strong> already connect on Surfmate</span>
          </div>
        </div>

        <div style={{ flex: "1 1 460px", minWidth: 0, position: "relative" }}>
          <div style={{ position: "relative", borderRadius: 15, overflow: "hidden", background: "var(--sm-mint)", aspectRatio: "4 / 5" }}>
            <img
              src="/images/hero-meetup-talking.webp"
              alt="Two surfers talking at a Surfmate meetup"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 40%", display: "block" }}
            />
          </div>
          <div style={{ position: "absolute", left: -24, bottom: 64, background: "#fff", borderRadius: 15, padding: "16px 18px", boxShadow: "0 8px 28px rgba(26,26,26,0.12)", display: "flex", alignItems: "center", gap: 12, maxWidth: 280 }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--sm-blue)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14c2.4 0 4.1 1.5 4.6 4" /></svg>
            </span>
            <span style={{ fontSize: 14, lineHeight: 1.35 }}><strong style={{ fontWeight: 600, display: "block" }}>Surfers nearby</strong>open to paddle out together</span>
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section id="events" style={{ background: "var(--sm-mint)" }}>
        <div className="sm-container" style={{ padding: "80px 24px", display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 680 }}>
              <p className="sm-eyebrow">Upcoming surf events</p>
              <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(34px, 4.4vw, 60px)", lineHeight: 1 }}>See who is going.</h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)" }}>
                Contests, festivals and meetups worldwide. Tap “I’m going” and meet the crew there.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontSize: 15, fontWeight: 600 }}>
              <a href="/events/submit/">Submit an event</a>
              <a href="/events/">All events →</a>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {events.length === 0 && (
              <p style={{ fontSize: 16, color: "var(--sm-ink)" }}>No upcoming events right now – check back soon.</p>
            )}
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      </section>

      {/* LIVE FROM THE COMMUNITY */}
      <section style={{ borderTop: "1px solid var(--sm-border)" }}>
        <div className="sm-container" style={{ padding: "88px 24px 96px", display: "flex", flexDirection: "column", gap: 36 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 680 }}>
              <p className="sm-eyebrow">Live from the community</p>
              <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(34px, 4.4vw, 60px)", lineHeight: 1 }}>This is Surfmate.</h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)" }}>
                Real meetups, real spotchecks, real sessions – shared by surfers on the app.
              </p>
            </div>
            <a href="/#spots" style={{ fontSize: 15, fontWeight: 600 }}>See sessions by spot →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <div style={{ gridColumn: "span 2", position: "relative", minHeight: 420, borderRadius: 15, overflow: "hidden", background: "var(--sm-blue-light)" }}>
              <img src="/images/community-peniche-laughing.webp" alt="Surfers laughing together at the Surfmate meetup in Peniche" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "60% 45%", display: "block" }} />
              <span style={{ position: "absolute", left: 14, bottom: 14, background: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 600 }}>Meetup · Peniche, Portugal</span>
            </div>
            <div style={{ position: "relative", minHeight: 300, borderRadius: 15, overflow: "hidden", background: "var(--sm-mint)" }}>
              <img src="/images/community-eisbach-spotcheck.webp" alt="Phone showing a Surfmate spotcheck from the Eisbach" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <span style={{ position: "absolute", left: 14, bottom: 14, background: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 600 }}>Spotcheck · Eisbach, Germany</span>
            </div>
            <div style={{ position: "relative", minHeight: 300, borderRadius: 15, overflow: "hidden", background: "var(--sm-blue-light)" }}>
              <img src="/images/community-surf-journal.webp" alt="Phone showing a surf journal in the Surfmate app at the meetup" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <span style={{ position: "absolute", left: 14, bottom: 14, background: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 600 }}>Surf journal</span>
            </div>
            <div style={{ position: "relative", minHeight: 300, borderRadius: 15, overflow: "hidden", background: "var(--sm-blue-light)" }}>
              <img src="/images/community-after-surf.webp" alt="Surfers chatting and laughing after the session at the Peniche meetup" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <span style={{ position: "absolute", left: 14, bottom: 14, background: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 600 }}>After-surf hangs</span>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section id="community" style={{ background: "var(--sm-black)", color: "#fff" }}>
        <div className="sm-container" style={{ padding: "96px 24px", display: "flex", flexDirection: "column", gap: 56 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "space-between", alignItems: "flex-end" }}>
            <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(34px, 4.4vw, 60px)", lineHeight: 1, maxWidth: 760 }}>
              The app is just the start. The real thing happens in the water.
            </h2>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "#E6E6E6", maxWidth: 380 }}>
              We build Surfmate so you spend less time on your phone and more time in the line-up – with people who
              get it.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {[
              { step: "01 · FIND", title: "Find your people", body: "See who surfed your spot lately and which surfers nearby are open to connect – at home or on a surf trip." },
              { step: "02 · CONNECT", title: "Connect online", body: "Follow surfers, chat, build crews and share spotchecks – real-time conditions without group-chat spam." },
              { step: "03 · MEET", title: "Surf together offline", body: "Paddle out together, join meetups, contests and festivals – and see who else is going before you get there." },
            ].map((card) => (
              <div key={card.step} style={{ border: "1px solid #3a3a3a", borderRadius: 15, padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", color: "var(--sm-blue)" }}>{card.step}</span>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{card.title}</h3>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "#E6E6E6" }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER QUOTE */}
      <section id="story" className="sm-container" style={{ padding: "104px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 56 }}>
        <div style={{ flex: "0 1 360px", minWidth: 0 }}>
          <img src="/images/founder-jolie-quote.webp" alt="Jolie, founder of Surfmate, with her surfboard" style={{ display: "block", width: "100%", aspectRatio: "4 / 5", objectFit: "cover", borderRadius: 15 }} />
        </div>
        <figure style={{ flex: "1 1 480px", minWidth: 0, margin: 0, display: "flex", flexDirection: "column", gap: 24 }}>
          <blockquote className="sm-seattle" style={{ margin: 0, fontSize: "clamp(34px, 4vw, 56px)", lineHeight: 1.1 }}>
            “I had no surf friends, so I built an app to find them.”
          </blockquote>
          <figcaption style={{ fontSize: 16, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 560 }}>
            <strong style={{ fontWeight: 600, color: "var(--sm-black)" }}>Jolie, founder of Surfmate.</strong> Learning
            to surf alone, without a crew or a local spot, showed her how much the people around you matter. Surfmate
            is built for every surfer who is still looking for theirs.
          </figcaption>
        </figure>
      </section>

      {/* FEATURES */}
      <section style={{ background: "var(--sm-mint)" }}>
        <div className="sm-container" style={{ padding: "96px 24px", display: "flex", flexDirection: "column", gap: 48 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
            <p className="sm-eyebrow">Everything in one app</p>
            <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1 }}>Your surf life, organized</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { title: "Log sessions", body: "Photos, conditions, notes and how it felt – never lose a surf memory again." },
              { title: "Share spotchecks", body: "Post what the waves look like right now and see who of your friends is heading out." },
              { title: "Spots & notes", body: "Public spots, your secret ones, plus webcams, tides and personal notes in one place." },
              { title: "Events & meetups", body: "Contests, festivals and community meetups worldwide – see who is going and meet there." },
              { title: "Chats & crews", body: "Message surf friends, create groups and plan the next session together." },
              { title: "Private means private", body: "Secret spots stay secret. You decide what is public – and no ads in your feed." },
            ].map((f) => (
              <div key={f.title} style={{ background: "#fff", borderRadius: 15, padding: 26, display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--sm-ink)" }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SURF CALENDAR */}
      <section style={{ background: "var(--sm-mint)" }}>
        <div className="sm-container" style={{ padding: "0 24px 96px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 56 }}>
          <div style={{ flex: "1 1 380px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
            <p className="sm-eyebrow">Surf calendar</p>
            <h3 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(28px, 3.4vw, 44px)", lineHeight: 1 }}>See how often you really surf.</h3>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 460 }}>
              Every logged session lands in your surf calendar. Count your surf days per month and keep your weekly
              streak alive – surf at least once a week to keep it going.
            </p>
          </div>
          <img src="/images/feature-surf-calendar.webp" alt="Surfmate surf calendar" style={{ flex: "0 1 420px", minWidth: 0, width: "100%", height: "auto", display: "block", borderRadius: 15, boxShadow: "0 12px 36px rgba(26,26,26,0.10)" }} />
        </div>
      </section>

      {/* SURF MAP */}
      <section style={{ background: "var(--sm-mint)" }}>
        <div className="sm-container" style={{ padding: "0 24px 96px", display: "flex", flexWrap: "wrap-reverse", alignItems: "center", gap: 56 }}>
          <div style={{ flex: "0 1 460px", minWidth: 0, background: "#fff", borderRadius: 15, padding: 16, boxSizing: "border-box", boxShadow: "0 12px 36px rgba(26,26,26,0.10)" }}>
            <img src="/images/feature-surf-map.webp" alt="Personal surf map in the Surfmate app" style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
          <div style={{ flex: "1 1 380px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
            <p className="sm-eyebrow">Personal surf map</p>
            <h3 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(28px, 3.4vw, 44px)", lineHeight: 1 }}>Everywhere you have surfed.</h3>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 460 }}>
              Every country, every spot, every session – on your own world map. Watch your surf journey grow with
              each trip.
            </p>
          </div>
        </div>
      </section>

      {/* FEEDBACK */}
      <section className="sm-container" style={{ padding: "104px 24px 0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 56 }}>
        <img
          src="/images/feedback-wall-peniche.webp"
          alt="Feedback wall with sticky notes and ideas for Surfmate at the Peniche meetup"
          style={{ flex: "1 1 520px", minWidth: 0, width: "100%", aspectRatio: "3 / 2", objectFit: "cover", borderRadius: 15, display: "block" }}
        />
        <div style={{ flex: "1 1 380px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          <p className="sm-eyebrow">Built with the community</p>
          <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1 }}>You are the most important ingredient.</h2>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)" }}>
            Surfmate grows with the people who use it. Share your feedback and ideas for the app – what you miss,
            what bugs you, what would make your surf life easier.
          </p>
          <a href="/support/" className="sm-btn sm-btn-dark" style={{ alignSelf: "flex-start" }}>Share feedback &amp; ideas</a>
        </div>
      </section>

      {/* SPOTS DIRECTORY */}
      <section id="spots" className="sm-container" style={{ padding: "104px 24px", display: "flex", flexWrap: "wrap", gap: 56 }}>
        <div style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <p className="sm-eyebrow">Spot guide</p>
          <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1 }}>Who is surfing where?</h2>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)" }}>
            The spots the community actually surfs most, ranked by real activity. Every spot has its own page – with
            public sessions, local knowledge and events nearby.
          </p>
          <a href="/spots/" className="sm-btn sm-btn-outline" style={{ alignSelf: "flex-start" }}>Explore all spots</a>
        </div>
        <ol style={{ flex: "1 1 560px", minWidth: 0, listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--sm-border-strong)" }}>
          {spots.slice(0, 8).map((spot, i) => (
            <li key={spot.id} style={{ borderBottom: "1px solid var(--sm-border-strong)" }}>
              <a
                href={`/spots/${countrySlug(spot.country_code)}/${spot.region_slug}/${spot.slug}/`}
                style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 20, padding: "20px 4px" }}
              >
                <span style={{ fontSize: 13, color: "var(--sm-muted)", width: 24 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ flex: 1, fontSize: 20, fontWeight: 600 }}>{spot.name}</span>
                <span style={{ fontSize: 15, color: "var(--sm-muted)" }}>{spot.region}, {countryName(spot.country_code)}</span>
                <span aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* TEAM */}
      <section id="team" className="sm-container" style={{ padding: "104px 24px", display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
          <p className="sm-eyebrow">Team</p>
          <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1 }}>Surf nerds behind the platform</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {[
            { name: "Jolie Bast", role: "Founder · Stoked developer", photo: "/images/team-jolie-bast.webp" },
            { name: "Mavie", role: "Social media", color: "var(--sm-mint)" },
            { name: "Magnus Wolter", role: "Business development", color: "var(--sm-blue-light)" },
            { name: "Nikolaus Lieberum", role: "Keeps the spots accurate", color: "var(--sm-blue-light)" },
            { name: "Marlene Volz", role: "Networking & on-site", color: "var(--sm-mint)" },
            { name: "Marlene Wüsten", role: "Photography & branding", photo: "/images/team-marlene-wuesten.webp" },
            { name: "Maurizio", role: "Events", color: "var(--sm-mint)" },
            { name: "Lou", role: "Newsletter", color: "var(--sm-blue-light)" },
            { name: "Paul Grey", role: "Team rider", color: "var(--sm-mint)" },
          ].map((member) => (
            <div key={member.name} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {member.photo ? (
                <img src={member.photo} alt={member.name} style={{ display: "block", width: "100%", aspectRatio: "4 / 5", objectFit: "cover", borderRadius: 15 }} />
              ) : (
                <div style={{ borderRadius: 15, background: member.color, aspectRatio: "4 / 5" }} />
              )}
              <strong style={{ fontSize: 18, fontWeight: 600 }}>{member.name}</strong>
              <span style={{ fontSize: 15, color: "var(--sm-muted)" }}>{member.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PARTNERS */}
      <section id="partners" style={{ background: "var(--sm-mint)" }}>
        <div className="sm-container" style={{ padding: "96px 24px", display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 640 }}>
              <p className="sm-eyebrow">Partners</p>
              <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1 }}>Brands, events and local spots</h2>
            </div>
            <a href="mailto:hello@surf-mate.de" style={{ fontSize: 15, fontWeight: 600 }}>Become a partner →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
            {partnerLogos.length === 0 && (
              <p style={{ fontSize: 16, color: "var(--sm-ink)" }}>Partner logos coming soon.</p>
            )}
            {partnerLogos.map((p) => (
              <div key={p.id} style={{ background: "#fff", borderRadius: 15, height: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                {p.logo_url ? (
                  <img src={p.logo_url} alt={p.name} style={{ display: "block", maxWidth: "75%", maxHeight: 40, width: "auto", height: "auto" }} />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--sm-muted)" }}>{p.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section id="blog" className="sm-container" style={{ padding: "104px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
          <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1 }}>Surfmate Stories</h2>
        </div>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 560 }}>
          Stories from the community, trip reports and spot guides – coming soon.
        </p>
      </section>

      {/* WEAR TEASER */}
      <section style={{ background: "var(--sm-black)", color: "#fff" }}>
        <div className="sm-container" style={{ padding: "96px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 64 }}>
          <img
            src="/images/wear-hoodie-back-solo.webp"
            alt="Surfmate Wear hoodie, back print: Surfmate, Your Surf. Your Story."
            style={{ flex: "1 1 420px", minWidth: 0, width: "100%", aspectRatio: "4 / 5", objectFit: "cover", objectPosition: "50% 20%", borderRadius: 15, display: "block" }}
          />
          <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 28 }}>
            <span style={{ width: 220, display: "flex", flexDirection: "column", alignItems: "center", gap: 11 }}>
              <img src="/images/logo-surfmate-white.png" alt="Surfmate" style={{ width: "100%", height: "auto", display: "block" }} />
              <span className="sm-seattle" style={{ fontSize: 24, lineHeight: 1.1, whiteSpace: "nowrap" }}>Your Surf. Your Story.</span>
            </span>
            <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(40px, 5.4vw, 76px)", lineHeight: 0.95 }}>Made for the ones who paddle out.</h2>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "#E6E6E6", maxWidth: 440 }}>
              Surfmate Wear – the brand behind the community. Wear your surf story.
            </p>
            <a href="/shop/" className="sm-btn" style={{ background: "#fff", color: "var(--sm-black)", padding: "14px 22px", fontSize: 16 }}>
              Get early access to Wear
            </a>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="sm-container" style={{ padding: "104px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 28 }}>
        <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(36px, 5vw, 68px)", lineHeight: 0.98, maxWidth: 900 }}>
          Your next surf friend is already out there.
        </h2>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 560 }}>
          Download Surfmate for free and see who is surfing near you.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          <a href="https://apps.apple.com/app/id6760191082" aria-label="Download on the App Store">
            <img src="/assets/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg" alt="Download on the App Store" style={{ height: 52, width: "auto", display: "block" }} />
          </a>
          <a href="https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp" aria-label="Get it on Google Play">
            <img src="/assets/GetItOnGooglePlay_Badge_Web_color_English.svg" alt="Get it on Google Play" style={{ height: 52, width: "auto", display: "block" }} />
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
