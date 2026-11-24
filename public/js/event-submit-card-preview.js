import { formatSurfEventSchedule, formatEventLocationLabel } from "./events-shared.js";

// Two previews, each an exact copy of a real Surfmate surface:
// - Website: mirrors components/EventCard.js (surfmate.eu/events/).
// - In-app: mirrors apps/mobile's features/events/components/EventCard.tsx,
//   including the overlapping partner-logo tile on the cover.

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

const CALENDAR_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

const PIN_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';

// Mirrors components/EventCard.js (surfmate.eu/events/) exactly.
function buildWebsiteCard(event, { isPlaceholder }) {
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
    <article style="background:#fff;border-radius:15px;overflow:hidden;display:flex;flex-direction:column;">
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

// Mirrors apps/mobile EventCard.tsx (AppColors tokens inlined as hex).
function buildInAppCard(event, { isPlaceholder }) {
  const dateLabel = formatSurfEventSchedule(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
    event.timezone,
  );
  const locationLabel = formatEventLocationLabel(event.locationName, event.countryCode);
  const dim = isPlaceholder ? "opacity:.55;" : "";
  const hasCover = Boolean(event.coverImageUrl);
  const hasLogo = Boolean(event.logoUrl);

  const logoTile = (position) => `
    <div style="${position};width:52px;height:52px;border-radius:14px;background:#fff;border:1px solid #D1D5DB;box-shadow:0 3px 6px rgba(0,0,0,0.12);display:flex;align-items:center;justify-content:center;z-index:2;box-sizing:border-box;">
      <img src="${escapeHtml(event.logoUrl)}" alt="" style="width:36px;height:36px;object-fit:contain;" />
    </div>
  `;

  const coverSection = hasCover
    ? `
      <div style="width:100%;aspect-ratio:2;background:#F8FAFC;position:relative;">
        <img src="${escapeHtml(event.coverImageUrl)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />
        ${hasLogo ? logoTile("position:absolute;left:14px;bottom:-26px") : ""}
      </div>
    `
    : "";

  const bodyPaddingTop = hasCover && hasLogo ? 34 : 10;
  const inlineLogo = !hasCover && hasLogo ? logoTile("position:relative;margin-bottom:4px") : "";

  const typeTags = event.eventTypes?.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">${event.eventTypes
        .map(
          (type) =>
            `<span style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:4px 10px;background:#F3F3F1;font-size:12px;line-height:16px;font-weight:600;color:#1a1a1a;">${escapeHtml(EVENT_TYPE_LABELS[type] ?? type)}</span>`,
        )
        .join("")}</div>`
    : "";

  return `
    <div style="position:relative;background:#fff;border-radius:15px;border:1px solid #E8EEF0;overflow:hidden;display:flex;flex-direction:column;">
      ${coverSection}
      <div style="padding:14px;padding-top:${bodyPaddingTop}px;display:flex;flex-direction:column;gap:6px;">
        ${inlineLogo}
        <strong style="font-size:16px;line-height:21px;font-weight:700;color:#1a1a1a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;${dim}">${escapeHtml(event.title)}</strong>
        <div style="display:flex;align-items:center;gap:6px;color:#1a1a1a;${dim}">
          ${CALENDAR_ICON}
          <span style="font-size:13px;font-weight:600;color:#1a1a1a;">${escapeHtml(dateLabel)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;color:#5E5E5E;${dim}">
          ${PIN_ICON}
          <span style="font-size:13px;font-weight:400;color:#5E5E5E;">${escapeHtml(locationLabel)}</span>
        </div>
        ${typeTags}
      </div>
    </div>
  `;
}

export function createEventSubmitCardPreview(mountEl, asideEl) {
  if (!mountEl) {
    return { update() {}, syncVisibility() {} };
  }

  mountEl.innerHTML = `
    <div class="event-submit-preview-col">
      <p class="event-submit-preview-col-label">Website</p>
      <p class="event-submit-preview-col-sublabel">surfmate.eu/events · surf-events.com</p>
      <div class="event-submit-preview-grid" data-preview-slot="website" role="presentation"></div>
    </div>
    <div class="event-submit-preview-col">
      <p class="event-submit-preview-col-label">In-app</p>
      <p class="event-submit-preview-col-sublabel">Surfmate app calendar</p>
      <div class="event-submit-preview-grid" data-preview-slot="app" role="presentation"></div>
    </div>
  `;
  const websiteSlot = mountEl.querySelector('[data-preview-slot="website"]');
  const appSlot = mountEl.querySelector('[data-preview-slot="app"]');

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
      logoUrl: snapshot.logoUrl || null,
    };

    websiteSlot.innerHTML = buildWebsiteCard(event, { isPlaceholder });
    appSlot.innerHTML = buildInAppCard(event, { isPlaceholder });
  }

  return { update, syncVisibility };
}
