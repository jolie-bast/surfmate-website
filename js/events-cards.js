import { SURF_EVENT_TYPE_LABELS } from "./community-event-shared.js";
import {
  formatEventLocationLabel,
  formatSurfEventSchedule,
  isSurfEventLiveNow,
} from "./events-shared.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function hasWebsite(url) {
  return typeof url === "string" && url.trim().length > 0;
}

function isInvertFriendlyLogo(url) {
  const path = String(url).split(/[?#]/)[0].toLowerCase();
  return /\.(png|webp|svg)$/.test(path);
}

function buildTypeTagsHtml(eventTypes, selectedTypes = new Set()) {
  if (!eventTypes?.length) return "";

  const chips = eventTypes
    .map((type) => {
      const label = SURF_EVENT_TYPE_LABELS[type] ?? type;
      const highlighted = selectedTypes.has(type) ? " is-highlighted" : "";
      return `<span class="events-type-tag${highlighted}">${escapeHtml(label)}</span>`;
    })
    .join("");

  return `<div class="events-card-tags">${chips}</div>`;
}

export function buildEventCard(event, options = {}) {
  const selectedTypes = options.selectedTypes ?? new Set();

  const dateLabel = formatSurfEventSchedule(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
  );
  const locationLabel = formatEventLocationLabel(event.locationName, event.countryCode);
  const isLive = isSurfEventLiveNow(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
  );

  const omitEmptyCover = Boolean(options.omitEmptyCover);

  const coverHtml = event.coverImageUrl
    ? `<div class="events-card-cover"><img src="${escapeHtml(event.coverImageUrl)}" alt="" loading="lazy" decoding="async" /></div>`
    : omitEmptyCover
      ? ""
      : `<div class="events-card-cover events-card-cover--empty"></div>`;

  const logoHtml = event.logoUrl
    ? `<div class="events-card-logo${isInvertFriendlyLogo(event.logoUrl) ? " is-logo-mono" : ""}"><img src="${escapeHtml(event.logoUrl)}" alt="" loading="lazy" decoding="async" /></div>`
    : "";

  const partnerBadge = event.isPartner
    ? `<span class="events-card-badge events-card-badge--partner">Partner</span>`
    : "";

  const liveBadge = isLive
    ? `<span class="events-card-badge events-card-badge--live"><span class="events-on-dot" aria-hidden="true"></span>ON</span>`
    : "";

  const liveHeatsLink = hasWebsite(event.liveHeatsUrl)
    ? `<a href="${escapeHtml(event.liveHeatsUrl.trim())}" class="events-card-live-link" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Live heats</a>`
    : "";

  const inner = `
    ${coverHtml}
    ${logoHtml}
    <div class="events-card-body">
      <div class="events-card-badges">${partnerBadge}${liveBadge}</div>
      <h3 class="events-card-title">${escapeHtml(event.title)}</h3>
      <p class="events-card-meta"><i class="bi bi-calendar3" aria-hidden="true"></i> ${escapeHtml(dateLabel)}</p>
      <p class="events-card-meta"><i class="bi bi-geo-alt" aria-hidden="true"></i> ${escapeHtml(locationLabel)}</p>
      ${buildTypeTagsHtml(event.eventTypes, selectedTypes)}
      ${liveHeatsLink}
    </div>
  `;

  const liveClass = isLive ? " events-card--on" : "";

  if (hasWebsite(event.websiteUrl)) {
    return `<a href="${escapeHtml(event.websiteUrl.trim())}" class="events-card${liveClass}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(event.title)}">${inner}</a>`;
  }

  return `<article class="events-card events-card--static${liveClass}" aria-label="${escapeHtml(event.title)}">${inner}</article>`;
}

export function buildMobileStripCard(event, options = {}) {
  const isSelected = Boolean(options.selected);

  const dateLabel = formatSurfEventSchedule(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
  );
  const locationLabel = formatEventLocationLabel(event.locationName, event.countryCode);
  const isLive = isSurfEventLiveNow(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
  );

  const typeLabel = event.eventTypes?.[0]
    ? SURF_EVENT_TYPE_LABELS[event.eventTypes[0]] ?? event.eventTypes[0]
    : "";

  const badges = [
    event.isPartner ? `<span class="events-strip-card-badge">Partner</span>` : "",
    isLive
      ? `<span class="events-strip-card-badge events-strip-card-badge--live"><span class="events-on-dot" aria-hidden="true"></span>Live</span>`
      : "",
    typeLabel
      ? `<span class="events-strip-card-badge events-strip-card-badge--type">${escapeHtml(typeLabel)}</span>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const websiteLink = hasWebsite(event.websiteUrl)
    ? `<a href="${escapeHtml(event.websiteUrl.trim())}" class="events-strip-card-link" data-strip-link="true" target="_blank" rel="noopener noreferrer" aria-label="Open website for ${escapeHtml(event.title)}" onclick="event.stopPropagation()"><i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a>`
    : "";

  const selectedClass = isSelected ? " is-selected" : "";
  const liveClass = isLive ? " events-strip-card--live" : "";

  return `
    <div
      class="events-strip-card${selectedClass}${liveClass}"
      data-event-id="${escapeHtml(event.id)}"
      role="listitem"
      tabindex="0"
      aria-pressed="${isSelected ? "true" : "false"}"
      aria-label="${escapeHtml(event.title)}"
    >
      <span class="events-strip-card-top">
        ${badges ? `<span class="events-strip-card-badges">${badges}</span>` : ""}
        ${websiteLink}
      </span>
      <span class="events-strip-card-title">${escapeHtml(event.title)}</span>
      <span class="events-strip-card-meta"><i class="bi bi-calendar3" aria-hidden="true"></i> ${escapeHtml(dateLabel)}</span>
      <span class="events-strip-card-meta"><i class="bi bi-geo-alt" aria-hidden="true"></i> ${escapeHtml(locationLabel)}</span>
    </div>
  `;
}
