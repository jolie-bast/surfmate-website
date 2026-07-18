/**
 * Event display, filter, and calendar helpers for the website.
 * Mirrors @surfmate/shared surf-events (keep in sync with the monorepo).
 */

import {
  SURF_EVENT_TYPES,
  SURF_EVENT_TYPE_LABELS,
  DEFAULT_EVENT_TIMEZONE,
  formatDateInTimeZone,
  isSameCalendarDayInTimeZone,
  resolveEventTimezone,
} from "./community-event-shared.js";

export { SURF_EVENT_TYPES, SURF_EVENT_TYPE_LABELS, DEFAULT_EVENT_TIMEZONE };

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const LONG_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const CALENDAR_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function isExactDateScheduleType(scheduleType) {
  return scheduleType === "exact" || scheduleType === "exact_datetime";
}

function formatEventDateOnlyUtc(date) {
  const day = date.getUTCDate();
  const month = SHORT_MONTHS[date.getUTCMonth()] ?? "?";
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function formatEventDateOnlyInTimeZone(date, timeZone) {
  const parts = formatDateInTimeZone(date, timeZone);
  const month = SHORT_MONTHS[parts.month - 1] ?? "?";
  return `${parts.day} ${month} ${parts.year}`;
}

function isSameCalendarDayUtc(a, b) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatSurfEventMonthYear(month, year) {
  const monthLabel = SHORT_MONTHS[month - 1] ?? String(month);
  return `${monthLabel} ${year}`;
}

export function formatSurfEventDateRange(startsAt, endsAt, timeZone = null) {
  try {
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return startsAt;

    const formatDate = timeZone
      ? (date) => formatEventDateOnlyInTimeZone(date, timeZone)
      : formatEventDateOnlyUtc;
    const sameDay = timeZone
      ? (a, b) => isSameCalendarDayInTimeZone(a, b, timeZone)
      : isSameCalendarDayUtc;

    const startLabel = formatDate(start);
    if (!endsAt) return startLabel;

    const end = new Date(endsAt);
    if (Number.isNaN(end.getTime())) return startLabel;
    if (sameDay(start, end)) return startLabel;

    return `${startLabel} – ${formatDate(end)}`;
  } catch {
    return startsAt;
  }
}

export function formatSurfEventTimeRange(scheduleType, startsAt, endsAt, timeZone = null) {
  if (scheduleType !== "exact_datetime" || !startsAt) return null;
  try {
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return null;
    const zone = resolveEventTimezone(timeZone);
    const pad = (n) => String(n).padStart(2, "0");
    const startParts = formatDateInTimeZone(start, zone);
    const startTime = `${pad(startParts.hour)}:${pad(startParts.minute)}`;
    if (!endsAt) return startTime;
    const end = new Date(endsAt);
    if (Number.isNaN(end.getTime())) return startTime;
    const endParts = formatDateInTimeZone(end, zone);
    const endTime = `${pad(endParts.hour)}:${pad(endParts.minute)}`;
    if (startTime === endTime && isSameCalendarDayInTimeZone(start, end, zone)) {
      return startTime;
    }
    return `${startTime} – ${endTime}`;
  } catch {
    return null;
  }
}

export function formatSurfEventSchedule(
  scheduleType,
  startsAt,
  endsAt,
  eventYear,
  eventMonth = null,
  timeZone = null,
) {
  if (scheduleType === "year" && eventYear != null) {
    return String(eventYear);
  }

  if (scheduleType === "month_year" && eventYear != null && eventMonth != null) {
    return formatSurfEventMonthYear(eventMonth, eventYear);
  }

  if (!startsAt) {
    return "Date TBD";
  }

  if (scheduleType === "exact_datetime") {
    return formatSurfEventDateRange(startsAt, endsAt, resolveEventTimezone(timeZone));
  }

  return formatSurfEventDateRange(startsAt, endsAt);
}

export function isSurfEventLiveNow(
  scheduleType,
  startsAt,
  endsAt,
  eventYear = null,
  eventMonth = null,
  timeZone = null,
) {
  if (scheduleType === "month_year" && eventYear != null && eventMonth != null) {
    const now = new Date();
    return now.getFullYear() === eventYear && now.getMonth() + 1 === eventMonth;
  }

  if (scheduleType === "exact_datetime" && startsAt) {
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return false;

    const nowMs = Date.now();
    const startMs = start.getTime();

    if (!endsAt) {
      return (
        nowMs >= startMs &&
        isSameCalendarDayInTimeZone(new Date(), start, resolveEventTimezone(timeZone))
      );
    }

    const end = new Date(endsAt);
    if (Number.isNaN(end.getTime())) {
      return nowMs >= startMs;
    }

    return nowMs >= startMs && nowMs <= end.getTime();
  }

  if (scheduleType !== "exact" || !startsAt) return false;

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return false;

  const today = startOfLocalDay(new Date());
  const startDay = startOfLocalDay(start);

  if (!endsAt) {
    return today === startDay;
  }

  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) {
    return today === startDay;
  }

  const endDay = startOfLocalDay(end);
  const rangeStart = Math.min(startDay, endDay);
  const rangeEnd = Math.max(startDay, endDay);
  return today >= rangeStart && today <= rangeEnd;
}

export function isSurfEventPast(
  scheduleType,
  startsAt,
  endsAt,
  eventYear = null,
  eventMonth = null,
) {
  if (isSurfEventLiveNow(scheduleType, startsAt, endsAt, eventYear, eventMonth)) {
    return false;
  }

  const now = new Date();
  const today = startOfLocalDay(now);

  if (scheduleType === "year" && eventYear != null) {
    return now.getFullYear() > eventYear;
  }

  if (scheduleType === "month_year" && eventYear != null && eventMonth != null) {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return year > eventYear || (year === eventYear && month > eventMonth);
  }

  if (scheduleType === "exact_datetime" && startsAt) {
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return false;

    const nowMs = Date.now();
    if (!endsAt) {
      return nowMs > start.getTime();
    }

    const end = new Date(endsAt);
    if (Number.isNaN(end.getTime())) {
      return nowMs > start.getTime();
    }

    return nowMs > end.getTime();
  }

  if (scheduleType !== "exact" || !startsAt) return false;

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return false;

  const startDay = startOfLocalDay(start);

  if (!endsAt) {
    return today > startDay;
  }

  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) {
    return today > startDay;
  }

  const endDay = startOfLocalDay(end);
  return today > Math.max(startDay, endDay);
}

function getUtcEndOfMonthTimestamp(year, month) {
  return Date.UTC(year, month, 0, 23, 59, 59, 999);
}

function getUtcEndOfYearTimestamp(year) {
  return Date.UTC(year, 11, 31, 23, 59, 59, 999);
}

export function getSurfEventScheduleSortKey(event) {
  const { scheduleType, startsAt, eventYear, eventMonth } = event;

  if (isExactDateScheduleType(scheduleType)) {
    if (startsAt) {
      const timestamp = new Date(startsAt).getTime();
      if (!Number.isNaN(timestamp)) return timestamp;
    }
    return Number.MAX_SAFE_INTEGER;
  }

  if (scheduleType === "month_year") {
    if (eventYear != null && eventMonth != null) {
      return getUtcEndOfMonthTimestamp(eventYear, eventMonth);
    }
    return Number.MAX_SAFE_INTEGER;
  }

  if (scheduleType === "year") {
    if (eventYear != null) {
      return getUtcEndOfYearTimestamp(eventYear);
    }
    return Number.MAX_SAFE_INTEGER;
  }

  return Number.MAX_SAFE_INTEGER;
}

export function compareSurfEventsBySchedule(left, right) {
  const keyDiff = getSurfEventScheduleSortKey(left) - getSurfEventScheduleSortKey(right);
  if (keyDiff !== 0) return keyDiff;
  return String(left.id).localeCompare(String(right.id));
}

export function formatCalendarDayKey(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function getCalendarMonthBounds(year, month) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  return { monthStart, monthEnd };
}

export function surfEventOverlapsCalendarMonth(event, year, month) {
  if (event.scheduleType === "month_year") {
    return event.eventYear === year && event.eventMonth === month;
  }

  if (event.scheduleType === "year") {
    return event.eventYear === year;
  }

  if (!isExactDateScheduleType(event.scheduleType) || !event.startsAt) {
    return false;
  }

  const start = new Date(event.startsAt);
  if (Number.isNaN(start.getTime())) return false;

  const { monthStart, monthEnd } = getCalendarMonthBounds(year, month);
  const monthStartMs = monthStart.getTime();
  const monthEndMs = monthEnd.getTime();
  const startMs = start.getTime();

  if (!event.endsAt) {
    return startMs >= monthStartMs && startMs <= monthEndMs;
  }

  const end = new Date(event.endsAt);
  if (Number.isNaN(end.getTime())) {
    return startMs >= monthStartMs && startMs <= monthEndMs;
  }

  return startMs <= monthEndMs && end.getTime() >= monthStartMs;
}

export function getSurfEventExactCalendarDayKeys(event) {
  if (!isExactDateScheduleType(event.scheduleType) || !event.startsAt) {
    return [];
  }

  const start = new Date(event.startsAt);
  if (Number.isNaN(start.getTime())) return [];

  if (event.scheduleType === "exact_datetime") {
    const zone = resolveEventTimezone(event.timezone);
    const startParts = formatDateInTimeZone(start, zone);
    let endParts = startParts;
    if (event.endsAt) {
      const end = new Date(event.endsAt);
      if (!Number.isNaN(end.getTime())) {
        endParts = formatDateInTimeZone(end, zone);
      }
    }
    const startKeyMs = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
    const endKeyMs = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
    const rangeStart = Math.min(startKeyMs, endKeyMs);
    const rangeEnd = Math.max(startKeyMs, endKeyMs);
    const keys = [];
    for (let cursor = rangeStart; cursor <= rangeEnd; cursor += 24 * 60 * 60 * 1000) {
      const day = new Date(cursor);
      keys.push(formatCalendarDayKey(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate()));
    }
    return keys;
  }

  const startDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  let endDay = startDay;

  if (event.endsAt) {
    const end = new Date(event.endsAt);
    if (!Number.isNaN(end.getTime())) {
      endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
    }
  }

  const rangeStart = startDay.getTime() <= endDay.getTime() ? startDay : endDay;
  const rangeEnd = startDay.getTime() <= endDay.getTime() ? endDay : startDay;

  const keys = [];
  const cursor = new Date(rangeStart);
  while (cursor.getTime() <= rangeEnd.getTime()) {
    keys.push(formatCalendarDayKey(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate()));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return keys;
}

export function groupSurfEventsForCalendarDay(events, year, month, day) {
  const dayKey = formatCalendarDayKey(year, month, day);
  const exact = [];
  const monthYear = [];
  const yearOnly = [];

  for (const event of events) {
    if (isExactDateScheduleType(event.scheduleType) && event.startsAt) {
      if (getSurfEventExactCalendarDayKeys(event).includes(dayKey)) {
        exact.push(event);
      }
      continue;
    }

    if (
      event.scheduleType === "month_year" &&
      event.eventYear === year &&
      event.eventMonth === month
    ) {
      monthYear.push(event);
      continue;
    }

    if (event.scheduleType === "year" && event.eventYear === year) {
      yearOnly.push(event);
    }
  }

  return { exact, monthYear, yearOnly };
}

export function buildCalendarMonthWeeks(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells = [];
  for (let index = 0; index < startOffset; index += 1) {
    cells.push({ kind: "empty" });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ kind: "day", day });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ kind: "empty" });
  }

  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export function getDefaultSelectedDayForMonth(year, month) {
  const today = new Date();
  if (today.getFullYear() === year && today.getMonth() + 1 === month) {
    return today.getDate();
  }
  return 1;
}

export function formatMonthYearLabel(year, month) {
  return `${LONG_MONTHS[month - 1] ?? month} ${year}`;
}

function countryCodeToFlagEmoji(countryCode) {
  const code = String(countryCode ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  const offset = 0x1f1e6 - 65;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
}

export function formatEventLocationLabel(locationName, countryCode) {
  const name = String(locationName ?? "").trim();
  const flag = countryCodeToFlagEmoji(countryCode);
  if (!flag) return name;
  if (!name) return flag;
  return `${name} ${flag}`;
}

export function matchesEventSearchQuery(event, normalizedQuery) {
  if (!normalizedQuery) return true;

  const haystack = [event.title, event.locationName, event.partnerName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export function filterEvents(events, filters) {
  const { searchQuery = "", selectedTypes = new Set(), upcomingOnly = true } = filters;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const includePast = normalizedQuery.length >= 3;

  return events.filter((event) => {
    if (selectedTypes.size > 0) {
      const types = event.eventTypes ?? [];
      const matches = [...selectedTypes].some((type) => types.includes(type));
      if (!matches) return false;
    }

    if (upcomingOnly && !includePast) {
      if (event.isExpired) return false;
      const past = isSurfEventPast(
        event.scheduleType,
        event.startsAt,
        event.endsAt,
        event.eventYear,
        event.eventMonth,
      );
      if (past) return false;
    }

    if (normalizedQuery.length >= 3 && !matchesEventSearchQuery(event, normalizedQuery)) {
      return false;
    }

    return true;
  });
}

/** Resolve a URL slug or label to a canonical event type id. */
export function resolveEventTypeSlug(raw) {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return null;

  if (SURF_EVENT_TYPES.includes(value)) return value;

  for (const type of SURF_EVENT_TYPES) {
    const label = (SURF_EVENT_TYPE_LABELS[type] ?? type).toLowerCase();
    if (label === value || label.replace(/\s+/g, "-") === value) {
      return type;
    }
  }

  return null;
}

export function parseEventTypesFromUrlValue(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return new Set();

  const types = new Set();
  for (const part of value.split(",")) {
    const resolved = resolveEventTypeSlug(part);
    if (resolved) types.add(resolved);
  }

  return types;
}

const EVENTS_PAGE_VIEW_MODES = new Set(["list", "calendar"]);

/**
 * Read shareable filter state from ?type=contest,festival&q=…&view=calendar
 * Also accepts ?types=… or ?filter=… as aliases for type.
 */
export function readEventsPageUrlState(searchParams) {
  const params = searchParams instanceof URLSearchParams
    ? searchParams
    : new URLSearchParams(searchParams);

  const typeRaw =
    params.get("type") ?? params.get("types") ?? params.get("filter") ?? "";
  const selectedTypes = parseEventTypesFromUrlValue(typeRaw);

  const searchQuery = String(params.get("q") ?? params.get("search") ?? "").trim();

  let viewMode = "list";
  const viewRaw = String(params.get("view") ?? "").trim().toLowerCase();
  if (EVENTS_PAGE_VIEW_MODES.has(viewRaw)) {
    viewMode = viewRaw;
  }

  return { selectedTypes, searchQuery, viewMode };
}

/** Build query string for the current events page filter state (defaults omitted). */
export function buildEventsPageSearchParams(filters) {
  const {
    searchQuery = "",
    selectedTypes = new Set(),
    viewMode = "list",
  } = filters;

  const params = new URLSearchParams();

  if (selectedTypes.size > 0) {
    const types = [...selectedTypes]
      .filter((type) => SURF_EVENT_TYPES.includes(type))
      .sort();
    if (types.length) params.set("type", types.join(","));
  }

  const query = String(searchQuery ?? "").trim();
  if (query) params.set("q", query);

  if (viewMode === "calendar") params.set("view", "calendar");

  return params;
}

export function mapEventRow(row) {
  return {
    id: row.id,
    title: row.title ?? "",
    description: row.description ?? null,
    scheduleType: row.schedule_type ?? "exact",
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
    timezone: resolveEventTimezone(row.timezone),
    eventYear: row.event_year ?? null,
    eventMonth: row.event_month ?? null,
    locationName: row.location_name ?? "",
    countryCode: row.country_code ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    eventTypes: Array.isArray(row.event_types) ? row.event_types : [],
    coverImageUrl: row.cover_image_url ?? null,
    websiteUrl: row.website_url ?? null,
    liveHeatsUrl: row.live_heats_url ?? null,
    isPartner: Boolean(row.is_partner),
    partnerName: row.partner_name ?? null,
    logoUrl: row.logo_url ?? null,
    isFeatured: Boolean(row.is_featured),
    isExpired: Boolean(row.is_expired),
  };
}
