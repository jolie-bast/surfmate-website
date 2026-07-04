import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  SURF_EVENT_TYPES,
  SURF_EVENT_TYPE_LABELS,
  buildExactDatetimeIso,
  composeEventDateIso,
  parseEventDateLocalValue,
  validateCommunityEventSubmissionInput,
} from "./community-event-shared.js";

const config = window.SURFMATE_SUPABASE;
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const SUBMIT_PAGE_URL = `${window.location.origin}/events/submit/`;

let supabase = null;
let session = null;
let selectedPlace = null;
let placeSearchTimer = null;
let googleSignInBusy = false;
let googleButtonRendered = false;

const els = {
  loading: document.getElementById("event-submit-loading"),
  authGate: document.getElementById("event-submit-auth"),
  formSection: document.getElementById("event-submit-form-section"),
  success: document.getElementById("event-submit-success"),
  authError: document.getElementById("auth-error"),
  authMessage: document.getElementById("auth-message"),
  signInForm: document.getElementById("sign-in-form"),
  magicLinkForm: document.getElementById("magic-link-form"),
  googleSigninContainer: document.getElementById("google-signin-container"),
  signOutBtn: document.getElementById("sign-out-btn"),
  signedInEmail: document.getElementById("signed-in-email"),
  form: document.getElementById("event-submit-form"),
  formError: document.getElementById("form-error"),
  title: document.getElementById("event-title"),
  locationInput: document.getElementById("event-location"),
  placeResults: document.getElementById("place-results"),
  placeStatus: document.getElementById("place-status"),
  placeHint: document.getElementById("place-hint"),
  selectedPlaceBox: document.getElementById("selected-place"),
  selectedPlaceName: document.getElementById("selected-place-name"),
  clearPlaceBtn: document.getElementById("clear-place-btn"),
  scheduleAllDay: document.getElementById("schedule-all-day"),
  scheduleWithTime: document.getElementById("schedule-with-time"),
  datetimeFields: document.getElementById("datetime-fields"),
  schedulePreview: document.getElementById("schedule-preview"),
  startDate: document.getElementById("start-date"),
  endDate: document.getElementById("end-date"),
  startTime: document.getElementById("start-time"),
  endTime: document.getElementById("end-time"),
  eventTypes: document.getElementById("event-types"),
  description: document.getElementById("event-description"),
  descriptionCount: document.getElementById("description-count"),
  note: document.getElementById("submitter-note"),
  noteCount: document.getElementById("note-count"),
  submitBtn: document.getElementById("submit-event-btn"),
  submitAnotherBtn: document.getElementById("submit-another-btn"),
};

function hide(el) {
  if (el) {
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");
  }
}

function show(el) {
  if (el) {
    el.hidden = false;
    el.removeAttribute("aria-hidden");
  }
}

function setText(el, text) {
  if (el) el.textContent = text;
}

function setPlaceStatus(message, tone = "") {
  setText(els.placeStatus, message);
  if (!els.placeStatus) return;
  els.placeStatus.className = "field-status";
  if (tone) els.placeStatus.classList.add(`is-${tone}`);
}

function showFormError(message) {
  if (!message) {
    hide(els.formError);
    return;
  }
  setText(els.formError, message);
  show(els.formError);
  els.formError?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showAuthError(message) {
  if (!message) {
    hide(els.authError);
    return;
  }
  setText(els.authError, message);
  show(els.authError);
}

function showAuthMessage(message) {
  if (!message) {
    hide(els.authMessage);
    return;
  }
  setText(els.authMessage, message);
  show(els.authMessage);
}

function getScheduleType() {
  return els.scheduleWithTime?.checked ? "exact_datetime" : "exact";
}

function getDateSegments(container) {
  if (!container) {
    return { day: null, month: null, year: null, row: null };
  }

  return {
    day: container.querySelector('[data-segment="day"]'),
    month: container.querySelector('[data-segment="month"]'),
    year: container.querySelector('[data-segment="year"]'),
    row: container.querySelector(".date-segments-row"),
  };
}

function readDateIsoFromContainer(container) {
  const { day, month, year } = getDateSegments(container);
  const result = composeEventDateIso(day?.value, month?.value, year?.value);

  if (result.empty) return "";
  if (!result.ok) return null;
  return result.iso;
}

function setDateSegmentInvalid(container, isInvalid) {
  const { row } = getDateSegments(container);
  row?.classList.toggle("is-invalid", isInvalid);
}

function clearDateSegments(container) {
  const { day, month, year } = getDateSegments(container);
  if (day) day.value = "";
  if (month) month.value = "";
  if (year) year.value = "";
  setDateSegmentInvalid(container, false);
}

function focusDateSegment(segment) {
  segment?.focus();
  segment?.select();
}

function splitPastedDate(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return { day: isoMatch[3], month: isoMatch[2], year: isoMatch[1] };
  }

  const parts = trimmed.split(/[./-]/).map((part) => part.trim());
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return { day: parts[2], month: parts[1], year: parts[0] };
    }
    return { day: parts[0], month: parts[1], year: parts[2] };
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 8) {
    return {
      day: digits.slice(0, 2),
      month: digits.slice(2, 4),
      year: digits.slice(4, 8),
    };
  }

  return null;
}

function applyDateSegments(container, segments) {
  const { day, month, year } = getDateSegments(container);
  if (!segments || !day || !month || !year) return;

  day.value = segments.day.replace(/\D/g, "").slice(0, 2);
  month.value = segments.month.replace(/\D/g, "").slice(0, 2);
  year.value = segments.year.replace(/\D/g, "").slice(0, 4);
  setDateSegmentInvalid(container, false);
  updateEndDateMin();
  updateSchedulePreview();
}

function handleDateSegmentInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.dataset.segment) return;

  const container = input.closest(".date-segments");
  if (!container) return;

  input.value = input.value.replace(/\D/g, "");
  setDateSegmentInvalid(container, false);

  const segment = input.dataset.segment;
  const { day, month, year } = getDateSegments(container);

  if (segment === "day" && input.value.length >= 2) {
    focusDateSegment(month);
  } else if (segment === "month" && input.value.length >= 2) {
    focusDateSegment(year);
  }

  updateEndDateMin();
  updateSchedulePreview();
}

function handleDateSegmentKeydown(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.dataset.segment) return;

  const { day, month, year } = getDateSegments(input.closest(".date-segments"));
  const segment = input.dataset.segment;

  if (event.key === "Backspace" && input.value === "") {
    if (segment === "month") {
      event.preventDefault();
      focusDateSegment(day);
    } else if (segment === "year") {
      event.preventDefault();
      focusDateSegment(month);
    }
  }

  if (event.key === "ArrowLeft" && input.selectionStart === 0) {
    if (segment === "month") {
      event.preventDefault();
      focusDateSegment(day);
    } else if (segment === "year") {
      event.preventDefault();
      focusDateSegment(month);
    }
  }

  if (event.key === "ArrowRight" && input.selectionStart === input.value.length) {
    if (segment === "day") {
      event.preventDefault();
      focusDateSegment(month);
    } else if (segment === "month") {
      event.preventDefault();
      focusDateSegment(year);
    }
  }
}

function handleDateSegmentPaste(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  const container = input.closest(".date-segments");
  if (!container) return;

  const pasted = event.clipboardData?.getData("text");
  const segments = splitPastedDate(pasted);
  if (!segments) return;

  event.preventDefault();
  applyDateSegments(container, segments);

  const { year } = getDateSegments(container);
  focusDateSegment(year);
}

function handleDateSegmentBlur(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.dataset.segment) return;

  const container = input.closest(".date-segments");
  if (!container) return;

  const required = container.dataset.dateRequired === "true";
  const iso = readDateIsoFromContainer(container);
  const { day, month, year } = getDateSegments(container);
  const hasAnyValue = Boolean(day?.value || month?.value || year?.value);

  if (required) {
    setDateSegmentInvalid(container, hasAnyValue && iso === null);
    return;
  }

  setDateSegmentInvalid(container, hasAnyValue && iso === null);
}

function bindDateSegments(container) {
  const { day, month, year } = getDateSegments(container);
  for (const input of [day, month, year]) {
    if (!input) continue;
    input.addEventListener("input", handleDateSegmentInput);
    input.addEventListener("keydown", handleDateSegmentKeydown);
    input.addEventListener("paste", handleDateSegmentPaste);
    input.addEventListener("blur", handleDateSegmentBlur);
  }
}

function formatDisplayDate(dateValue) {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDisplayTime(timeValue) {
  if (!timeValue) return null;
  const [hours, minutes] = timeValue.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function updateSchedulePreview() {
  const startDate = readDateIsoFromContainer(els.startDate);
  if (!startDate) {
    hide(els.schedulePreview);
    return;
  }

  const endDate = readDateIsoFromContainer(els.endDate);
  const withTime = getScheduleType() === "exact_datetime";
  const startLabel = formatDisplayDate(startDate);
  const endLabel = endDate ? formatDisplayDate(endDate) : null;

  let preview = withTime ? "Starts " : "";
  preview += startLabel;

  if (withTime && els.startTime?.value) {
    preview += ` at ${formatDisplayTime(els.startTime.value)}`;
  }

  if (endLabel && endLabel !== startLabel) {
    preview += ` → ends ${endLabel}`;
    if (withTime && els.endTime?.value) {
      preview += ` at ${formatDisplayTime(els.endTime.value)}`;
    }
  } else if (withTime && els.endTime?.value) {
    preview += `, until ${formatDisplayTime(els.endTime.value)}`;
  } else if (!endLabel) {
    preview += withTime ? " (single day)" : " (all day, single date)";
  } else {
    preview += withTime ? " (all day)" : " (all day)";
  }

  setText(els.schedulePreview, preview);
  show(els.schedulePreview);
}

function buildStartsAtIso() {
  const scheduleType = getScheduleType();
  const startDate = readDateIsoFromContainer(els.startDate);

  if (!startDate) return null;

  if (scheduleType === "exact") {
    return parseEventDateLocalValue(startDate);
  }

  return buildExactDatetimeIso(startDate, els.startTime?.value || "00:00");
}

function buildEndsAtIso() {
  const scheduleType = getScheduleType();
  const startDate = readDateIsoFromContainer(els.startDate);
  const endDate = readDateIsoFromContainer(els.endDate);

  if (endDate === null) return null;

  if (!endDate) {
    if (scheduleType === "exact_datetime" && els.endTime?.value && startDate) {
      return buildExactDatetimeIso(startDate, els.endTime.value);
    }
    return null;
  }

  if (scheduleType === "exact") {
    return parseEventDateLocalValue(endDate);
  }

  return buildExactDatetimeIso(endDate, els.endTime?.value || "23:59");
}

function getSelectedEventTypes() {
  return Array.from(
    els.eventTypes?.querySelectorAll('input[type="checkbox"]:checked') ?? [],
  ).map((input) => input.value);
}

function renderEventTypeChips() {
  if (!els.eventTypes) return;

  els.eventTypes.innerHTML = SURF_EVENT_TYPES.map((type) => {
    const id = `event-type-${type}`;
    return `
      <label class="event-type-chip" for="${id}">
        <input type="checkbox" id="${id}" name="eventTypes" value="${type}" />
        <span>${SURF_EVENT_TYPE_LABELS[type]}</span>
      </label>
    `;
  }).join("");
}

function updateDatetimeVisibility() {
  const withTime = getScheduleType() === "exact_datetime";

  if (withTime) {
    show(els.datetimeFields);
    if (els.startTime) els.startTime.disabled = false;
    if (els.endTime) els.endTime.disabled = false;
  } else {
    hide(els.datetimeFields);
    if (els.startTime) {
      els.startTime.value = "";
      els.startTime.disabled = true;
    }
    if (els.endTime) {
      els.endTime.value = "";
      els.endTime.disabled = true;
    }
  }

  updateSchedulePreview();
}

function updateEndDateMin() {
  const startDate = readDateIsoFromContainer(els.startDate);
  const endDate = readDateIsoFromContainer(els.endDate);

  if (!startDate || endDate === null || !endDate) return;

  if (endDate < startDate) {
    clearDateSegments(els.endDate);
    updateSchedulePreview();
  }
}

function renderSelectedPlace() {
  if (selectedPlace) {
    setText(els.selectedPlaceName, selectedPlace.locationName);
    show(els.selectedPlaceBox);
    hide(els.placeHint);
    els.locationInput?.classList.add("is-selected");
    els.locationInput?.setAttribute("readonly", "readonly");
    setPlaceStatus("", "");
    if (els.placeResults) els.placeResults.innerHTML = "";
    setPlaceResultsOpen(false);
    return;
  }

  hide(els.selectedPlaceBox);
  show(els.placeHint);
  els.locationInput?.classList.remove("is-selected");
  els.locationInput?.removeAttribute("readonly");
}

function clearPlaceSelection() {
  selectedPlace = null;
  if (els.locationInput) {
    els.locationInput.value = "";
    els.locationInput.removeAttribute("readonly");
    els.locationInput.classList.remove("is-selected");
  }
  if (els.placeResults) els.placeResults.innerHTML = "";
  setPlaceResultsOpen(false);
  setPlaceStatus("", "");
  show(els.placeHint);
  hide(els.selectedPlaceBox);
  els.locationInput?.focus();
}

function switchAuthTab(tabName) {
  document.querySelectorAll(".auth-tab").forEach((tab) => {
    const isActive = tab.dataset.authTab === tabName;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  document.querySelectorAll(".auth-panel").forEach((panel) => {
    const isActive = panel.dataset.authPanel === tabName;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  showAuthError(null);
  showAuthMessage(null);
}

function cleanAuthRedirectFromUrl() {
  window.history.replaceState(null, "", window.location.pathname);
}

async function consumeAuthReturnUrl() {
  const query = new URLSearchParams(window.location.search);
  const queryError = query.get("error");
  const queryErrorDescription = query.get("error_description");

  if (queryError) {
    showAuthError(queryErrorDescription || queryError);
    cleanAuthRedirectFromUrl();
    return;
  }

  const authCode = query.get("code");
  if (authCode) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
    cleanAuthRedirectFromUrl();
    if (exchangeError) {
      showAuthError(exchangeError.message);
    }
    return;
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : "";
  if (!hash) return;

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const error = params.get("error");
  const errorDescription = params.get("error_description");

  if (error) {
    showAuthError(errorDescription || error);
    cleanAuthRedirectFromUrl();
    return;
  }

  if (!accessToken || !refreshToken) return;

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  cleanAuthRedirectFromUrl();

  if (sessionError) {
    showAuthError(sessionError.message);
  }
}

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Sign-In.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In."));
    document.head.appendChild(script);
  });
}

function getGoogleButtonWidth() {
  const container = els.googleSigninContainer;
  if (!container) return 320;
  const width = container.getBoundingClientRect().width;
  return Math.max(240, Math.min(400, Math.round(width || 320)));
}

function renderOfficialGoogleButton() {
  const container = els.googleSigninContainer;
  const clientId = config.googleWebClientId;

  if (!container || !clientId || !window.google?.accounts?.id) {
    return;
  }

  container.innerHTML = "";
  google.accounts.id.initialize({
    client_id: clientId,
  });

  google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    width: getGoogleButtonWidth(),
    click_listener: () => {
      void handleGoogleSignIn();
    },
  });

  googleButtonRendered = true;
}

async function ensureOfficialGoogleButton() {
  if (!config.googleWebClientId || !els.googleSigninContainer) return;

  try {
    await loadGoogleIdentityServices();
    renderOfficialGoogleButton();
  } catch (error) {
    console.error("Google Sign-In button failed to load:", error);
    setText(
      els.googleSigninContainer,
      "Google Sign-In is temporarily unavailable. Please use email instead.",
    );
  }
}

async function handleGoogleSignIn() {
  if (googleSignInBusy) return;

  showAuthError(null);
  showAuthMessage(null);
  googleSignInBusy = true;

  const callbackUrl = new URL("/auth/callback.html", window.location.origin);
  callbackUrl.searchParams.set("next", SUBMIT_PAGE_URL);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.href,
    },
  });

  googleSignInBusy = false;

  if (error) {
    showAuthError(error.message);
  }
}

function renderSignedInState(user) {
  setText(els.signedInEmail, user?.email ?? "Signed in");
  hide(els.loading);
  hide(els.authGate);
  show(els.formSection);
  hide(els.success);
}

function renderSignedOutState() {
  hide(els.loading);
  show(els.authGate);
  hide(els.formSection);
  hide(els.success);
  void ensureOfficialGoogleButton();
}

async function refreshSession() {
  try {
    const { data: { session: nextSession }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Session check failed:", error);
    }
    session = nextSession;

    if (session?.user) {
      renderSignedInState(session.user);
    } else {
      renderSignedOutState();
    }
  } catch (error) {
    console.error("Session check failed:", error);
    renderSignedOutState();
  } finally {
    hide(els.loading);
  }
}

async function searchPlaces(query) {
  const {
    data: { session: currentSession },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !currentSession?.access_token) {
    throw new Error("Sign in to search locations.");
  }

  session = currentSession;

  const url = `${config.url.replace(/\/+$/, "")}/functions/v1/places-search?q=${encodeURIComponent(query)}&limit=8`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${currentSession.access_token}`,
      apikey: config.anonKey,
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const serverMessage =
      payload && typeof payload.error === "string" ? payload.error : null;

    if (response.status === 401) {
      throw new Error("Session expired — please sign out and sign in again.");
    }
    if (response.status === 503) {
      throw new Error(
        "Location search is not configured on the server yet. Please try again later.",
      );
    }
    if (response.status === 502 && serverMessage) {
      throw new Error(serverMessage);
    }
    throw new Error(serverMessage ?? `Place search failed (${response.status}).`);
  }

  return payload?.results ?? [];
}

function setPlaceResultsOpen(isOpen) {
  if (!els.placeResults || !els.locationInput) return;
  if (isOpen) {
    show(els.placeResults);
    els.locationInput.setAttribute("aria-expanded", "true");
  } else {
    hide(els.placeResults);
    els.locationInput.setAttribute("aria-expanded", "false");
  }
}

function renderPlaceResults(results) {
  if (!els.placeResults) return;

  if (!results.length) {
    els.placeResults.innerHTML = "";
    setPlaceResultsOpen(false);
    return;
  }

  els.placeResults.innerHTML = results
    .map(
      (place) => `
      <li role="presentation">
        <button type="button" class="place-result-btn" data-place-id="${escapeHtml(place.id)}" role="option">
          <span class="place-result-name">${escapeHtml(place.placeName)}</span>
          ${
            place.subtitle
              ? `<span class="place-result-subtitle">${escapeHtml(place.subtitle)}</span>`
              : ""
          }
        </button>
      </li>
    `,
    )
    .join("");

  setPlaceResultsOpen(true);

  els.placeResults.querySelectorAll(".place-result-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const placeId = button.dataset.placeId;
      const place = results.find((item) => item.id === placeId);
      if (!place) return;

      selectedPlace = {
        locationName: place.placeName,
        countryCode: place.countryCode ?? null,
        latitude: place.latitude,
        longitude: place.longitude,
      };

      if (els.locationInput) {
        els.locationInput.value = place.placeName;
      }
      els.placeResults.innerHTML = "";
      setPlaceResultsOpen(false);
      renderSelectedPlace();
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function handleLocationInput() {
  if (selectedPlace) return;

  const query = els.locationInput?.value.trim() ?? "";
  setPlaceStatus("", "");

  if (query.length < MIN_QUERY_LENGTH) {
    if (els.placeResults) els.placeResults.innerHTML = "";
    setPlaceResultsOpen(false);
    return;
  }

  clearTimeout(placeSearchTimer);
  setPlaceStatus("Searching…", "searching");

  placeSearchTimer = setTimeout(async () => {
    try {
      const results = await searchPlaces(query);
      renderPlaceResults(results);
      setPlaceStatus(
        results.length ? "Tap a result to confirm the location." : "No matches — try a different search.",
        results.length ? "" : "error",
      );
    } catch (error) {
      if (els.placeResults) els.placeResults.innerHTML = "";
      setPlaceResultsOpen(false);
      setPlaceStatus(
        error instanceof Error ? error.message : "Place search failed.",
        "error",
      );
    }
  }, DEBOUNCE_MS);
}

async function handleSignIn(event) {
  event.preventDefault();
  showAuthError(null);
  showAuthMessage(null);

  const formData = new FormData(els.signInForm);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    showAuthError("Enter your email and password.");
    return;
  }

  const submitButton = els.signInForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  submitButton.disabled = false;

  if (error) {
    showAuthError(error.message);
    return;
  }

  await refreshSession();
}

async function handleMagicLink(event) {
  event.preventDefault();
  showAuthError(null);
  showAuthMessage(null);

  const formData = new FormData(els.magicLinkForm);
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    showAuthError("Enter your email address.");
    return;
  }

  const submitButton = els.magicLinkForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: SUBMIT_PAGE_URL,
    },
  });

  submitButton.disabled = false;

  if (error) {
    showAuthError(error.message);
    return;
  }

  showAuthMessage("Check your inbox — the link opens this page, signed in.");
}

function resetEventForm() {
  els.form?.reset();
  clearPlaceSelection();
  clearDateSegments(els.startDate);
  clearDateSegments(els.endDate);
  showFormError(null);
  updateDatetimeVisibility();
  hide(els.schedulePreview);
  setText(els.descriptionCount, "0 / 600");
  setText(els.noteCount, "0 / 500");
  els.success?.removeAttribute("data-event-id");
}

function showSubmitAnotherForm() {
  resetEventForm();
  hide(els.success);
  show(els.formSection);
  els.title?.focus();
  els.formSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleSignOut() {
  await supabase.auth.signOut();
  session = null;
  selectedPlace = null;
  resetEventForm();
  renderSignedOutState();
}

async function handleSubmit(event) {
  event.preventDefault();
  showFormError(null);

  if (!session?.user) {
    showFormError("Sign in to submit an event.");
    return;
  }

  if (!selectedPlace) {
    showFormError("Pick a location from the search results.");
    els.locationInput?.focus();
    return;
  }

  const startDateIso = readDateIsoFromContainer(els.startDate);
  if (!startDateIso) {
    setDateSegmentInvalid(els.startDate, true);
    showFormError("Enter a valid start date (DD / MM / YYYY).");
    focusDateSegment(getDateSegments(els.startDate).day);
    return;
  }

  const endDateIso = readDateIsoFromContainer(els.endDate);
  if (endDateIso === null) {
    setDateSegmentInvalid(els.endDate, true);
    showFormError("Enter a valid end date (DD / MM / YYYY), or leave it empty.");
    focusDateSegment(getDateSegments(els.endDate).day);
    return;
  }

  const input = {
    title: els.title?.value ?? "",
    locationName: selectedPlace.locationName,
    countryCode: selectedPlace.countryCode ?? null,
    latitude: selectedPlace.latitude,
    longitude: selectedPlace.longitude,
    scheduleType: getScheduleType(),
    startsAt: buildStartsAtIso() ?? "",
    endsAt: buildEndsAtIso(),
    eventTypes: getSelectedEventTypes(),
    description: els.description?.value ?? null,
    submitterNote: els.note?.value ?? null,
  };

  const validation = validateCommunityEventSubmissionInput(input);
  if (!validation.ok) {
    showFormError(validation.message);
    return;
  }

  els.submitBtn.disabled = true;
  els.submitBtn.textContent = "Submitting…";

  const { data: eventId, error } = await supabase.rpc("submit_community_event", {
    p_title: input.title.trim(),
    p_location_name: input.locationName.trim(),
    p_country_code: input.countryCode,
    p_latitude: input.latitude,
    p_longitude: input.longitude,
    p_schedule_type: input.scheduleType,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_event_types: input.eventTypes,
    p_submitter_note: input.submitterNote?.trim() || null,
    p_description: input.description?.trim() || null,
  });

  els.submitBtn.disabled = false;
  els.submitBtn.textContent = "Submit for review";

  if (error) {
    showFormError(error.message);
    return;
  }

  hide(els.formSection);
  hide(els.authGate);
  show(els.success);

  if (eventId) {
    els.success?.setAttribute("data-event-id", String(eventId));
  }
}

function bindEvents() {
  els.signInForm?.addEventListener("submit", handleSignIn);
  els.magicLinkForm?.addEventListener("submit", handleMagicLink);
  els.signOutBtn?.addEventListener("click", handleSignOut);
  els.submitAnotherBtn?.addEventListener("click", showSubmitAnotherForm);
  els.clearPlaceBtn?.addEventListener("click", clearPlaceSelection);
  els.form?.addEventListener("submit", handleSubmit);
  els.locationInput?.addEventListener("input", handleLocationInput);

  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      switchAuthTab(tab.dataset.authTab);
    });
  });

  els.scheduleAllDay?.addEventListener("change", updateDatetimeVisibility);
  els.scheduleWithTime?.addEventListener("change", updateDatetimeVisibility);

  bindDateSegments(els.startDate);
  bindDateSegments(els.endDate);

  [els.startTime, els.endTime].forEach((input) => {
    input?.addEventListener("change", updateSchedulePreview);
    input?.addEventListener("input", updateSchedulePreview);
  });

  els.note?.addEventListener("input", () => {
    const length = els.note.value.length;
    setText(els.noteCount, `${length} / 500`);
  });

  els.description?.addEventListener("input", () => {
    const length = els.description.value.length;
    setText(els.descriptionCount, `${length} / 600`);
  });

  els.locationInput?.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.placeResults) {
      els.placeResults.innerHTML = "";
    }
  });

  window.addEventListener("resize", () => {
    if (!googleButtonRendered || !els.googleSigninContainer || els.authGate?.hidden) {
      return;
    }
    renderOfficialGoogleButton();
  });

  document.addEventListener("click", (event) => {
    if (!els.placeResults || !els.locationInput || selectedPlace) return;
    const target = event.target;
    if (
      target instanceof Node &&
      !els.placeResults.contains(target) &&
      target !== els.locationInput &&
      !els.locationInput.contains(target) &&
      !(target instanceof Element && target.closest(".location-autocomplete"))
    ) {
      els.placeResults.innerHTML = "";
      setPlaceResultsOpen(false);
    }
  });
}

async function init() {
  if (!config?.url || !config?.anonKey) {
    hide(els.loading);
    showAuthError("Supabase is not configured on this page.");
    show(els.authGate);
    return;
  }

  supabase = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });

  renderEventTypeChips();
  updateDatetimeVisibility();
  bindEvents();

  supabase.auth.onAuthStateChange(() => {
    void refreshSession();
  });

  await consumeAuthReturnUrl();
  await refreshSession();
}

init().catch((error) => {
  console.error("Event submit init failed:", error);
  hide(els.loading);
  showAuthError("Something went wrong loading this page. Please refresh and try again.");
  show(els.authGate);
});
