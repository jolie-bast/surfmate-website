// Structured data for the events listing, mirrored from the main repo's
// lib/seo.js (eventsItemListNode) but pointed at the canonical surfmate.eu
// URLs instead of this mirror's own.
const CANONICAL_EVENTS_URL = "https://surfmate.eu/events/";

export function eventPath(event) {
  return `${CANONICAL_EVENTS_URL}${event.id}/`;
}

function toIso(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function eventStartDate(event) {
  if (event.starts_at) return toIso(event.starts_at);
  if (event.event_year && event.event_month) {
    return new Date(Date.UTC(event.event_year, event.event_month - 1, 1)).toISOString();
  }
  if (event.event_year) return `${event.event_year}-01-01`;
  return null;
}

function eventEndDate(event) {
  if (event.ends_at) return toIso(event.ends_at);
  return null;
}

export function eventNode(event) {
  const startDate = eventStartDate(event);
  if (!startDate || !event.title) return null;

  const endDate = eventEndDate(event);
  const locationName = event.location_name || event.title;

  return {
    "@type": "Event",
    "@id": `${eventPath(event)}#event`,
    name: event.title,
    url: eventPath(event),
    startDate,
    ...(endDate ? { endDate } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: locationName,
      ...(event.country_code
        ? { address: { "@type": "PostalAddress", addressCountry: event.country_code } }
        : {}),
    },
    ...(isHttpUrl(event.website_url) ? { sameAs: event.website_url } : {}),
    ...(isHttpUrl(event.cover_image_url) ? { image: event.cover_image_url } : {}),
    description: event.location_name
      ? `${event.title} in ${event.location_name}. See who from Surfmate is going.`
      : `${event.title}. See who from Surfmate is going.`,
  };
}

export function eventsItemListNode(events) {
  const itemListElement = [];

  for (const event of events) {
    const node = eventNode(event);
    if (!node) continue;

    itemListElement.push({
      "@type": "ListItem",
      position: itemListElement.length + 1,
      item: node,
    });
  }

  return {
    "@type": "ItemList",
    name: "Upcoming surf events",
    url: CANONICAL_EVENTS_URL,
    itemListElement,
  };
}
