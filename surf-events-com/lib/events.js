// Shared "is this event upcoming or currently happening" logic, mirrored
// from the main surfmate-website repo's lib/events.js.

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

export function isEventLiveNow(event, now = new Date()) {
  const bounds = eventDateBounds(event);
  return bounds ? bounds.start <= now && now <= bounds.end : false;
}

function sameCalendarDay(a, b, timeZone) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(a) === fmt.format(b);
}

// A human date (range) for an event: "7 Nov", "7–11 Nov", "28 Oct – 2 Nov",
// "28 Dec 2026 – 3 Jan 2027", "November 2026" (year/month-only schedule), or
// "Date TBA" when nothing is known yet.
export function eventDateLabel(event) {
  const tz = event.timezone || "UTC";

  if (event.starts_at) {
    const start = new Date(event.starts_at);
    const end = event.ends_at ? new Date(event.ends_at) : null;
    const day = (d) => new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: tz }).format(d);
    const month = (d) => new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: tz }).format(d);
    const year = (d) => new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: tz }).format(d);
    const full = (d) => `${day(d)} ${month(d)}`;

    if (!end || sameCalendarDay(start, end, tz)) return full(start);

    const sameYear = year(start) === year(end);
    const sameMonth = sameYear && month(start) === month(end);

    if (sameMonth) return `${day(start)}–${day(end)} ${month(end)}`;
    if (sameYear) return `${full(start)} – ${full(end)}`;
    return `${full(start)} ${year(start)} – ${full(end)} ${year(end)}`;
  }

  if (event.event_year) {
    if (event.event_month) {
      return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
        new Date(Date.UTC(event.event_year, event.event_month - 1, 1)),
      );
    }
    return String(event.event_year);
  }

  return "Date TBA";
}

// "14:00" or "14:00–18:00" for an exact-time event; "" when only a
// year/month schedule is known (there is no time of day to show).
export function eventTimeLabel(event) {
  if (!event.starts_at) return "";
  const tz = event.timezone || "UTC";
  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : null;
  const time = (d) => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(d);
  if (!end || time(start) === time(end)) return time(start);
  return `${time(start)}–${time(end)}`;
}
