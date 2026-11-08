// Shared "is this event upcoming or currently happening" logic, used by the
// homepage and the spot page so both treat events consistently.

function eventDateBounds(event) {
  if (event.starts_at) {
    return {
      start: new Date(event.starts_at),
      end: event.ends_at ? new Date(event.ends_at) : new Date(event.starts_at),
    };
  }

  // Some events only carry a year/month schedule (no exact starts_at yet).
  if (event.event_year) {
    const month = event.event_month ? event.event_month - 1 : 0;
    const start = new Date(Date.UTC(event.event_year, month, 1));
    const end = new Date(Date.UTC(event.event_year, month + 1, 0, 23, 59, 59));
    return { start, end };
  }

  return null;
}

export function isUpcomingOrLive(event, now = new Date()) {
  if (event.is_expired) return false;
  const bounds = eventDateBounds(event);
  if (!bounds) return false;
  return bounds.end >= now;
}

export function eventSortStart(event) {
  const bounds = eventDateBounds(event);
  return bounds ? bounds.start.getTime() : Infinity;
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
