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

/** Build ISO timestamp from date + time inputs in the user's local timezone. */
export function buildExactDatetimeIso(dateValue, timeValue) {
  if (!dateValue) return null;
  const time = timeValue || "00:00";
  const local = new Date(`${dateValue}T${time}`);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
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
