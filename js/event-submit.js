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
const WIZARD_STEP_COUNT = 5;

const WIZARD_STEPS = [
  {
    id: 1,
    label: "Contact",
    title: "How can we reach you?",
    lead: "We’ll only use this if we have a question about your event.",
  },
  {
    id: 2,
    label: "Event",
    title: "What’s the event?",
    lead: "Name it and pin the location on the map.",
  },
  {
    id: 3,
    label: "When",
    title: "When does it happen?",
    lead: "Dates only, or include start and end times.",
  },
  {
    id: 4,
    label: "Type",
    title: "What kind of event?",
    lead: "Pick everything that fits — festival, contest, meetup, and more.",
  },
  {
    id: 5,
    label: "Send",
    title: "Almost done",
    lead: "Add optional details, check the summary, then submit.",
  },
];

let supabase = null;
let selectedPlace = null;
let placeSearchTimer = null;
let currentWizardStep = 1;

const els = {
  loading: document.getElementById("event-submit-loading"),
  formSection: document.getElementById("event-submit-form-section"),
  success: document.getElementById("event-submit-success"),
  wizardStepsMap: document.getElementById("wizard-steps-map"),
  wizardStepKicker: document.getElementById("wizard-step-kicker"),
  wizardStepTitle: document.getElementById("wizard-step-title"),
  wizardStepLead: document.getElementById("wizard-step-lead"),
  wizardReview: document.getElementById("wizard-review"),
  wizardBack: document.getElementById("wizard-back"),
  wizardNext: document.getElementById("wizard-next"),
  wizardStepPanels: document.querySelectorAll(".wizard-step"),
  form: document.getElementById("event-submit-form"),
  formError: document.getElementById("form-error"),
  submitterEmail: document.getElementById("submitter-email"),
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

function showForm() {
  hide(els.loading);
  show(els.formSection);
  hide(els.success);
  renderWizardProgressMap();
  goToWizardStep(1, { focus: false });
}

function renderWizardProgressMap() {
  if (!els.wizardStepsMap) return;

  els.wizardStepsMap.innerHTML = WIZARD_STEPS.map((step) => {
    const state =
      step.id < currentWizardStep
        ? "is-complete"
        : step.id === currentWizardStep
          ? "is-active"
          : "";

    const disabled = step.id >= currentWizardStep ? "disabled" : "";

    return `
      <li class="wizard-step-marker ${state}" data-step-marker="${step.id}">
        <button
          type="button"
          class="wizard-step-marker-btn"
          data-step-jump="${step.id}"
          aria-label="Go to step ${step.id}: ${step.label}"
          aria-current="${step.id === currentWizardStep ? "step" : "false"}"
          ${disabled}
        >
          ${step.id < currentWizardStep ? "✓" : step.id}
        </button>
        <span class="wizard-step-marker-label">${step.label}</span>
      </li>
    `;
  }).join("");

  els.wizardStepsMap.querySelectorAll("[data-step-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.stepJump);
      if (!Number.isFinite(step) || step >= currentWizardStep) return;
      goToWizardStep(step);
    });
  });
}

function getWizardStepConfig(step = currentWizardStep) {
  return WIZARD_STEPS[step - 1] ?? WIZARD_STEPS[0];
}

function focusWizardStepField(step = currentWizardStep) {
  const focusTargets = {
    1: els.submitterEmail,
    2: els.title,
    3: getDateSegments(els.startDate).day,
    4: els.eventTypes?.querySelector("input"),
    5: els.description,
  };

  const target = focusTargets[step];
  target?.focus?.();
}

function renderWizardReview() {
  if (!els.wizardReview) return;

  const types = getSelectedEventTypes()
    .map((type) => SURF_EVENT_TYPE_LABELS[type] ?? type)
    .join(", ");

  const scheduleText = els.schedulePreview?.hidden
    ? "—"
    : els.schedulePreview?.textContent?.trim() || "—";

  els.wizardReview.innerHTML = `
    <div class="wizard-review-row">
      <span class="wizard-review-label">Event</span>
      <span class="wizard-review-value">${escapeHtml(els.title?.value.trim() || "—")}</span>
    </div>
    <div class="wizard-review-row">
      <span class="wizard-review-label">Location</span>
      <span class="wizard-review-value">${escapeHtml(selectedPlace?.locationName || "—")}</span>
    </div>
    <div class="wizard-review-row">
      <span class="wizard-review-label">When</span>
      <span class="wizard-review-value">${escapeHtml(scheduleText)}</span>
    </div>
    <div class="wizard-review-row">
      <span class="wizard-review-label">Type</span>
      <span class="wizard-review-value">${escapeHtml(types || "—")}</span>
    </div>
  `;
}

function renderWizardStep() {
  const configStep = getWizardStepConfig();

  setText(els.wizardStepKicker, `Step ${currentWizardStep} of ${WIZARD_STEP_COUNT}`);
  setText(els.wizardStepTitle, configStep.title);
  setText(els.wizardStepLead, configStep.lead);

  els.wizardStepPanels?.forEach((panel) => {
    const step = Number(panel.dataset.step);
    const isActive = step === currentWizardStep;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  if (currentWizardStep === 1) {
    hide(els.wizardBack);
  } else {
    show(els.wizardBack);
  }

  if (currentWizardStep === WIZARD_STEP_COUNT) {
    hide(els.wizardNext);
    show(els.submitBtn);
    renderWizardReview();
  } else {
    show(els.wizardNext);
    hide(els.submitBtn);
  }

  renderWizardProgressMap();
}

function goToWizardStep(step, { focus = true } = {}) {
  currentWizardStep = Math.min(WIZARD_STEP_COUNT, Math.max(1, step));
  showFormError(null);
  renderWizardStep();
  if (focus) {
    requestAnimationFrame(() => focusWizardStepField(currentWizardStep));
  }
  els.formSection?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function isValidEmail(value) {
  const email = String(value ?? "").trim();
  return email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateWizardStep(step) {
  switch (step) {
    case 1: {
      if (!isValidEmail(els.submitterEmail?.value)) {
        return { ok: false, message: "Enter a valid email address." };
      }
      return { ok: true };
    }
    case 2: {
      const title = els.title?.value.trim() ?? "";
      if (!title) {
        return { ok: false, message: "Enter an event name." };
      }
      if (!selectedPlace) {
        return { ok: false, message: "Pick a location from the search results." };
      }
      return { ok: true };
    }
    case 3: {
      const startDateIso = readDateIsoFromContainer(els.startDate);
      if (!startDateIso) {
        setDateSegmentInvalid(els.startDate, true);
        return { ok: false, message: "Enter a valid start date (DD / MM / YYYY)." };
      }

      const endDateIso = readDateIsoFromContainer(els.endDate);
      if (endDateIso === null) {
        setDateSegmentInvalid(els.endDate, true);
        return {
          ok: false,
          message: "Enter a valid end date (DD / MM / YYYY), or leave it empty.",
        };
      }

      updateSchedulePreview();
      return { ok: true };
    }
    case 4: {
      if (!getSelectedEventTypes().length) {
        return { ok: false, message: "Select at least one event type." };
      }
      return { ok: true };
    }
    default:
      return { ok: true };
  }
}

function handleWizardNext() {
  const result = validateWizardStep(currentWizardStep);
  if (!result.ok) {
    showFormError(result.message);
    focusWizardStepField(currentWizardStep);
    return;
  }

  goToWizardStep(currentWizardStep + 1);
}

function handleWizardBack() {
  goToWizardStep(currentWizardStep - 1);
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

async function searchPlacesWithPhoton(query) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=en`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Place search failed (${response.status}).`);
  }

  const payload = await response.json().catch(() => null);

  return (payload?.features ?? [])
    .map((feature) => {
      const props = feature.properties ?? {};
      const coordinates = feature.geometry?.coordinates ?? [];
      const longitude = Number(coordinates[0]);
      const latitude = Number(coordinates[1]);
      const name = String(props.name ?? props.city ?? props.state ?? "Location").trim();
      const placeName = [name, props.city, props.country]
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .filter((part, index, parts) => parts.indexOf(part) === index)
        .slice(0, 2)
        .join(", ");

      return {
        id: `${props.osm_type ?? "place"}-${props.osm_id ?? `${latitude},${longitude}`}`,
        placeName: placeName || name,
        subtitle:
          [props.city, props.state, props.country]
            .map((part) => String(part ?? "").trim())
            .filter(Boolean)
            .join(", ") || null,
        countryCode: props.countrycode ? String(props.countrycode).toUpperCase() : null,
        latitude,
        longitude,
      };
    })
    .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
}

async function searchPlaces(query) {
  return searchPlacesWithPhoton(query);
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
  currentWizardStep = 1;
  renderWizardStep();
}

function showSubmitAnotherForm() {
  resetEventForm();
  hide(els.success);
  show(els.formSection);
  els.submitterEmail?.focus();
  els.formSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function handleSubmit(event) {
  event.preventDefault();
  showFormError(null);

  if (currentWizardStep !== WIZARD_STEP_COUNT) {
    goToWizardStep(WIZARD_STEP_COUNT);
    return;
  }

  for (let step = 1; step <= 4; step += 1) {
    const result = validateWizardStep(step);
    if (!result.ok) {
      showFormError(result.message);
      goToWizardStep(step);
      return;
    }
  }

  const input = {
    title: els.title?.value ?? "",
    submitterEmail: els.submitterEmail?.value ?? "",
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
    p_submitter_email: input.submitterEmail.trim(),
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
  show(els.success);

  if (eventId) {
    els.success?.setAttribute("data-event-id", String(eventId));
  }
}

function bindEvents() {
  els.wizardBack?.addEventListener("click", handleWizardBack);
  els.wizardNext?.addEventListener("click", handleWizardNext);
  els.submitAnotherBtn?.addEventListener("click", showSubmitAnotherForm);
  els.clearPlaceBtn?.addEventListener("click", clearPlaceSelection);
  els.form?.addEventListener("submit", handleSubmit);
  els.locationInput?.addEventListener("input", handleLocationInput);

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
    showFormError("Supabase is not configured on this page.");
    show(els.formSection);
    return;
  }

  supabase = createClient(config.url, config.anonKey);

  renderEventTypeChips();
  updateDatetimeVisibility();
  bindEvents();
  showForm();
}

init().catch((error) => {
  console.error("Event submit init failed:", error);
  hide(els.loading);
  showFormError("Something went wrong loading this page. Please refresh and try again.");
  show(els.formSection);
});
