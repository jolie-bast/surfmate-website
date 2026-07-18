/**
 * Mirrors @surfmate/shared community-event-submissions + surf-events.
 * Keep in sync with packages/shared in the Surfmate monorepo.
 */

export const SURF_EVENT_TYPES = [
  "shortboard",
  "longboard",
  "bodyboard",
  "festival",
  "contest",
  "film",
  "meetup",
  "qs",
  "ct",
  "cs",
  "national",
  "isa",
  "bwt",
  "sup",
  "skate",
  "clean_up",
];

export const SURF_EVENT_TYPE_LABELS = {
  shortboard: "Shortboard",
  longboard: "Longboard",
  bodyboard: "Bodyboard",
  festival: "Festival",
  contest: "Contest",
  film: "Film",
  meetup: "Meetup",
  qs: "QS",
  ct: "CT",
  cs: "CS",
  national: "National",
  isa: "ISA",
  bwt: "Big Wave",
  sup: "SUP",
  skate: "Skate",
  clean_up: "Clean up",
};

export const COMMUNITY_EVENT_SCHEDULE_TYPES = ["exact", "exact_datetime"];

export const COMMUNITY_EVENT_DESCRIPTION_MAX_LENGTH = 600;

function isSurfEventType(value) {
  return SURF_EVENT_TYPES.includes(value);
}

function isCommunityEventScheduleType(value) {
  return COMMUNITY_EVENT_SCHEDULE_TYPES.includes(value);
}

/** Build YYYY-MM-DD from day/month/year segments (European order). */
export function composeEventDateIso(day, month, year) {
  const d = String(day ?? "").trim();
  const m = String(month ?? "").trim();
  const y = String(year ?? "").trim();

  if (!d && !m && !y) {
    return { ok: false, empty: true, iso: null };
  }

  if (!d || !m || !y) {
    return { ok: false, empty: false, iso: null };
  }

  if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) {
    return { ok: false, empty: false, iso: null };
  }

  const dd = d.padStart(2, "0");
  const mm = m.padStart(2, "0");
  const iso = `${y}-${mm}-${dd}`;
  const date = new Date(`${iso}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return { ok: false, empty: false, iso: null };
  }

  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() + 1 !== Number(mm) ||
    date.getDate() !== Number(dd)
  ) {
    return { ok: false, empty: false, iso: null };
  }

  return { ok: true, empty: false, iso };
}

export function getLocalDateKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** True when YYYY-MM-DD is today or later in the user's local timezone. */
export function isEventDateOnOrAfterToday(isoYmd) {
  const value = String(isoYmd ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return value >= getLocalDateKey();
}

/** Persist calendar days at noon UTC (same as admin parseEventDateLocalValue). */
export function parseEventDateLocalValue(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T12:00:00.000Z`;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T12:00:00.000Z`;
}

export const DEFAULT_EVENT_TIMEZONE = "Europe/Berlin";

export const EVENT_TIMEZONE_OPTIONS = [
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST)" },
  { value: "Europe/Lisbon", label: "Europe/Lisbon (WET/WEST)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "Europe/Madrid", label: "Europe/Madrid (CET/CEST)" },
  { value: "Atlantic/Canary", label: "Atlantic/Canary (WET/WEST)" },
  { value: "Atlantic/Azores", label: "Atlantic/Azores" },
  { value: "Africa/Casablanca", label: "Africa/Casablanca" },
  { value: "Indian/Mauritius", label: "Indian/Mauritius" },
  { value: "Asia/Jakarta", label: "Asia/Jakarta (WIB)" },
  { value: "Asia/Makassar", label: "Asia/Makassar (WITA)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland" },
  { value: "Pacific/Honolulu", label: "Pacific/Honolulu" },
  { value: "America/Los_Angeles", label: "America/Los Angeles" },
  { value: "America/Denver", label: "America/Denver" },
  { value: "America/New_York", label: "America/New York" },
  { value: "America/Sao_Paulo", label: "America/Sao Paulo" },
  { value: "America/Costa_Rica", label: "America/Costa Rica" },
  { value: "Pacific/Tahiti", label: "Pacific/Tahiti" },
  { value: "UTC", label: "UTC" },
];

export function resolveEventTimezone(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return DEFAULT_EVENT_TIMEZONE;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: trimmed });
    return trimmed;
  } catch {
    return DEFAULT_EVENT_TIMEZONE;
  }
}

function readZonedParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const values = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }
  const hourRaw = Number(values.hour ?? "0");
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: hourRaw === 24 ? 0 : hourRaw,
    minute: Number(values.minute ?? "0"),
    second: Number(values.second ?? "0"),
  };
}

function getTimeZoneOffsetMs(utcMs, timeZone) {
  const parts = readZonedParts(new Date(utcMs), timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - utcMs;
}

/** Convert wall-clock date+time in an IANA timezone to a UTC ISO string. */
export function zonedWallTimeToUtcIso(year, month, day, hour, minute, timeZone) {
  const zone = resolveEventTimezone(timeZone);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const offset = getTimeZoneOffsetMs(utcGuess, zone);
  let utcMs = utcGuess - offset;
  const offsetAfter = getTimeZoneOffsetMs(utcMs, zone);
  if (offsetAfter !== offset) utcMs = utcGuess - offsetAfter;
  return new Date(utcMs).toISOString();
}

export function formatDateInTimeZone(date, timeZone) {
  return readZonedParts(date, resolveEventTimezone(timeZone));
}

export function isSameCalendarDayInTimeZone(a, b, timeZone) {
  const zone = resolveEventTimezone(timeZone);
  const left = formatDateInTimeZone(a, zone);
  const right = formatDateInTimeZone(b, zone);
  return left.year === right.year && left.month === right.month && left.day === right.day;
}

export function buildTimezoneSelectOptionsHtml(selected = DEFAULT_EVENT_TIMEZONE) {
  const current = resolveEventTimezone(selected);
  return EVENT_TIMEZONE_OPTIONS.map((option) => {
    const selectedAttr = option.value === current ? " selected" : "";
    return `<option value="${option.value}"${selectedAttr}>${option.label}</option>`;
  }).join("");
}

/** Build ISO timestamp from date + time wall-clock values in the given timezone. */
export function buildExactDatetimeIso(dateValue, timeValue, timeZone = DEFAULT_EVENT_TIMEZONE) {
  if (!dateValue) return null;
  const time = timeValue || "00:00";
  const match = String(`${dateValue}T${time}`).match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return zonedWallTimeToUtcIso(year, month, day, hours, minutes, timeZone);
}

export function validateCommunityEventSubmissionInput(input) {
  const title = input.title.trim();
  if (title.length < 1 || title.length > 200) {
    return { ok: false, message: "Event name must be between 1 and 200 characters." };
  }

  const locationName = input.locationName.trim();
  if (locationName.length < 1 || locationName.length > 200) {
    return { ok: false, message: "Location is required." };
  }

  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    return { ok: false, message: "Pick a location from search." };
  }

  const countryCode = input.countryCode?.trim().toUpperCase() ?? "";
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    return { ok: false, message: "Country code must be a 2-letter ISO code." };
  }

  if (!isCommunityEventScheduleType(input.scheduleType)) {
    return {
      ok: false,
      message: "Only exact dates (with or without times) can be submitted.",
    };
  }

  const startsAt = input.startsAt.trim();
  if (!startsAt) {
    return { ok: false, message: "Start date is required." };
  }

  const startsAtMs = Date.parse(startsAt);
  if (Number.isNaN(startsAtMs)) {
    return { ok: false, message: "Start date is invalid." };
  }

  const startDateKey = startsAt.slice(0, 10);
  if (input.scheduleType === "exact") {
    if (!isEventDateOnOrAfterToday(startDateKey)) {
      return { ok: false, message: "Start date must be today or in the future." };
    }
  } else if (startsAtMs < Date.now()) {
    return { ok: false, message: "Start must be today or in the future." };
  }

  const endsAt = input.endsAt?.trim() ?? "";
  if (endsAt) {
    const endsAtMs = Date.parse(endsAt);
    if (Number.isNaN(endsAtMs)) {
      return { ok: false, message: "End date is invalid." };
    }
    if (endsAtMs < startsAtMs) {
      return { ok: false, message: "End can't be before start." };
    }
  }

  if (input.eventTypes.length < 1) {
    return { ok: false, message: "Select at least one event type." };
  }

  for (const type of input.eventTypes) {
    if (!isSurfEventType(type)) {
      return { ok: false, message: "One or more event types are not allowed." };
    }
  }

  const note = input.submitterNote?.trim() ?? "";
  if (note.length > 500) {
    return { ok: false, message: "Note must be at most 500 characters." };
  }

  const submitterEmail = input.submitterEmail?.trim() ?? "";
  if (!submitterEmail) {
    return { ok: false, message: "Email is required so we can reach you about your submission." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterEmail)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  if (submitterEmail.length > 254) {
    return { ok: false, message: "Email must be at most 254 characters." };
  }

  const description = input.description?.trim() ?? "";
  if (description.length > COMMUNITY_EVENT_DESCRIPTION_MAX_LENGTH) {
    return {
      ok: false,
      message: `Description must be at most ${COMMUNITY_EVENT_DESCRIPTION_MAX_LENGTH} characters.`,
    };
  }

  return { ok: true };
}

export function validatePartnerEventSubmissionInput(input) {
  const base = validateCommunityEventSubmissionInput(input);
  if (!base.ok) return base;

  const partnerName = input.partnerName?.trim() ?? "";
  if (partnerName.length < 1 || partnerName.length > 120) {
    return {
      ok: false,
      message: "Partner / organizer name must be between 1 and 120 characters.",
    };
  }

  const websiteUrl = input.websiteUrl?.trim() ?? "";
  if (websiteUrl && websiteUrl.length > 500) {
    return { ok: false, message: "Website link is too long." };
  }
  if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
    return { ok: false, message: "Website link must start with http:// or https://." };
  }

  return { ok: true };
}
