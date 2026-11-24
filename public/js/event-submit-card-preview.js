import { formatSurfEventSchedule, formatEventLocationLabel } from "./events-shared.js";

// Mirrors components/EventCard.js (the exact card shown on surfmate.eu/events/)
// so the submit-wizard preview matches the real site pixel-for-pixel.

const EVENT_TYPE_LABELS = {
  contest: "Contest",
  festival: "Festival",
  meetup: "Meetup",
  longboard: "Longboard",
  shortboard: "Shortboard",
  sup: "SUP",
  qs: "Qualifying Series",
  bwt: "Big Wave Tour",
  ct: "Championship Tour",
  national: "National",
  isa: "ISA",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function eventTypeBadgeLabel(eventTypes) {
  if (!eventTypes || !eventTypes.length) return "Event";
  for (const key of ["meetup", "festival", "contest"]) {
    if (eventTypes.includes(key)) return EVENT_TYPE_LABELS[key];
  }
  return EVENT_TYPE_LABELS[eventTypes[0]] || eventTypes[0];
}

function buildExactEventCard(event, { isPlaceholder }) {
  const dateLabel = formatSurfEventSchedule(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
    event.timezone,
  );
  const locationLabel = formatEventLocationLabel(event.locationName, event.countryCode);
  const typeBadge = eventTypeBadgeLabel(event.eventTypes);
  const dim = isPlaceholder ? "opacity:.55;" : "";

  const coverImg = event.coverImageUrl
    ? `<img src="${escapeHtml(event.coverImageUrl)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />`
    : "";

  return `
    <article class="esp-card" style="background:#fff;border-radius:15px;overflow:hidden;display:flex;flex-direction:column;">
      <div style="aspect-ratio:16/9;background:var(--sm-blue-light);position:relative;">
        ${coverImg}
        <span style="position:absolute;left:14px;top:14px;background:#fff;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(typeBadge)}</span>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:14px;flex:1;">
        <div style="display:flex;flex-direction:column;gap:4px;${dim}">
          <span style="font-size:14px;font-weight:600;color:var(--sm-muted);">${escapeHtml(dateLabel)}</span>
          <strong style="font-size:20px;font-weight:600;line-height:1.25;">${escapeHtml(event.title)}</strong>
          <span style="font-size:15px;color:var(--sm-muted);">${escapeHtml(locationLabel)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:auto;">
          <div style="display:flex;">
            <span style="width:28px;height:28px;border-radius:50%;background:var(--sm-blue);border:2px solid #fff;"></span>
            <span style="width:28px;height:28px;border-radius:50%;background:var(--sm-blue-light);border:2px solid #fff;margin-left:-8px;"></span>
          </div>
          <span style="font-size:14px;"><strong style="font-weight:600;">0</strong> Surfmates going</span>
        </div>
        <span class="sm-btn sm-btn-dark" style="text-align:center;justify-content:center;">I’m going – open in app</span>
      </div>
    </article>
  `;
}

export function createEventSubmitCardPreview(mountEl, asideEl) {
  if (!mountEl) {
    return { update() {}, syncVisibility() {} };
  }

  const grid = document.createElement("div");
  grid.className = "event-submit-preview-grid";
  grid.setAttribute("role", "presentation");
  mountEl.appendChild(grid);

  function syncVisibility(isVisible) {
    if (!asideEl) return;
    asideEl.hidden = !isVisible;
  }

  function update(snapshot = {}) {
    const title = String(snapshot.title ?? "").trim();
    const locationName = String(snapshot.locationName ?? "").trim();
    const isPlaceholder = !title && !locationName;

    const event = {
      title: title || "Your event name",
      scheduleType: snapshot.scheduleType || "exact",
      startsAt: snapshot.startsAt || null,
      endsAt: snapshot.endsAt || null,
      locationName: locationName || "Location",
      countryCode: snapshot.countryCode || null,
      eventTypes: Array.isArray(snapshot.eventTypes) ? snapshot.eventTypes : [],
      coverImageUrl: snapshot.coverImageUrl || null,
    };

    grid.innerHTML = buildExactEventCard(event, { isPlaceholder });
  }

  return { update, syncVisibility };
}
