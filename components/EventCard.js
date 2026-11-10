import eventTypeBadge from "./EventTypeBadge";
import { eventDateLabel } from "../lib/events";
import { countryName } from "../lib/countries";

export default function EventCard({ event }) {
  return (
    <article style={{ background: "#fff", borderRadius: 15, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ aspectRatio: "16 / 9", background: "var(--sm-blue-light)", position: "relative" }}>
        {event.cover_image_url && (
          <img src={event.cover_image_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <span style={{ position: "absolute", left: 14, top: 14, background: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {eventTypeBadge(event.event_types)}
        </span>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--sm-muted)" }}>{eventDateLabel(event)}</span>
          <strong style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.25 }}>{event.title}</strong>
          <span style={{ fontSize: 15, color: "var(--sm-muted)" }}>
            {event.location_name}
            {event.country_code ? `, ${countryName(event.country_code)}` : ""}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto" }}>
          <div style={{ display: "flex" }}>
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--sm-blue)", border: "2px solid #fff" }} />
            <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--sm-blue-light)", border: "2px solid #fff", marginLeft: -8 }} />
          </div>
          <span style={{ fontSize: 14 }}>
            <strong style={{ fontWeight: 600 }}>{event.going}</strong> Surfmates going
          </span>
        </div>
        <a href="/#download" className="sm-btn sm-btn-dark" style={{ textAlign: "center", justifyContent: "center" }}>
          I’m going – open in app
        </a>
        {event.website_url && (
          <a href={event.website_url} style={{ fontSize: 14, fontWeight: 600, textAlign: "center" }}>
            Event details ↗
          </a>
        )}
      </div>
    </article>
  );
}
