import {
  SURF_EVENT_TYPES,
  SURF_EVENT_TYPE_LABELS,
  buildExactDatetimeIso,
  composeEventDateIso,
  isEventDateOnOrAfterToday,
  parseEventDateLocalValue,
  validatePartnerEventSubmissionInput,
} from "./community-event-shared.js";
import { createEventSubmitCardPreview } from "./event-submit-card-preview.js";

const config = window.SURFMATE_SUPABASE;
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const WIZARD_STEP_COUNT = 6;
const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ACCESS_KEY = new URLSearchParams(window.location.search).get("k")?.trim() ?? "";

const WIZARD_STEPS = [
  {
    id: 1,
    label: "Contact",
    title: "How can we reach you?",
    lead: "We’ll only use this if we have a question about your event.",
  },
  {
    id: 2,
    label: "Partner",
    title: "Who’s organizing?",
    lead: "Your brand or series name — shown as the partner on the event.",
  },
  {
    id: 3,
    label: "Event",
    title: "What’s the event?",
    lead: "Name it and pin the location on the map.",
  },
  {
    id: 4,
    label: "When",
    title: "When does it happen?",
    lead: "Dates only, or include start and end times.",
  },
  {
    id: 5,
    label: "Type",
    title: "What kind of event?",
    lead: "Pick everything that fits — festival, contest, meetup, and more.",
  },
  {
    id: 6,
    label: "Send",
    title: "Almost done",
    lead: "Add your link, images, optional details — then submit for review.",
  },
];

let supabaseClient = null;
let supabaseLoadPromise = null;
let selectedPlace = null;
let placeSearchTimer = null;
let currentWizardStep = 1;

let coverFile = null;
let logoFile = null;
let coverPreviewUrl = null;
let logoPreviewUrl = null;

const els = {
  accessGate: document.getElementById("event-partner-access-gate"),
  loading: document.getElementById("event-submit-loading"),
  formSection: document.getElementById("event-submit-form-section"),
  success: document.getElementById("event-submit-success"),
  wizardStepsMap: document.getElementById("wizard-steps-map"),
  wizardStepKicker: document.getElementById("wizard-step-kicker"),
  wizardStepTitle: document.getElementById("wizard-step-title"),
  wizardStepLead: document.getElementById("wizard-step-lead"),
  wizardReview: document.getElementById("wizard-review"),
  wizardBack: document.getElementById("wizard-back"),
  wizardNav: document.getElementById("wizard-nav"),
  wizardNext: document.getElementById("wizard-next"),
  wizardStepPanels: document.querySelectorAll(".wizard-step"),
  form: document.getElementById("event-submit-form"),
  formError: document.getElementById("form-error"),
  submitterEmail: document.getElementById("submitter-email"),
  partnerName: document.getElementById("partner-name"),
  websiteUrl: document.getElementById("event-website-url"),
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
  coverInput: document.getElementById("event-cover-input"),
  logoInput: document.getElementById("event-logo-input"),
  coverPreview: document.getElementById("event-cover-preview"),
  logoPreview: document.getElementById("event-logo-preview"),
  clearCoverBtn: document.getElementById("clear-cover-btn"),
  clearLogoBtn: document.getElementById("clear-logo-btn"),
  submitBtn: document.getElementById("submit-event-btn"),
  submitAnotherBtn: document.getElementById("submit-another-btn"),
  submitterEmailError: document.getElementById("submitter-email-error"),
  partnerNameError: document.getElementById("partner-name-error"),
  websiteUrlError: document.getElementById("event-website-url-error"),
  coverError: document.getElementById("event-cover-error"),
  logoError: document.getElementById("event-logo-error"),
  eventTitleError: document.getElementById("event-title-error"),
  eventLocationError: document.getElementById("event-location-error"),
  eventTypesError: document.getElementById("event-types-error"),
  scheduleError: document.getElementById("schedule-error"),
};

const eventCardPreview = createEventSubmitCardPreview(
  document.getElementById("event-submit-card-preview-mount"),
  document.getElementById("event-submit-card-preview"),
);

const FIELD_ERROR_ELEMENTS = {
  submitterEmail: () => els.submitterEmailError,
  partnerName: () => els.partnerNameError,
  websiteUrl: () => els.websiteUrlError,
  eventTitle: () => els.eventTitleError,
  eventLocation: () => els.eventLocationError,
  eventTypes: () => els.eventTypesError,
  schedule: () => els.scheduleError,
  coverImage: () => els.coverError,
  logoImage: () => els.logoError,
};

function getSupabase() {
  if (!config?.url || !config?.anonKey) {
    return Promise.reject(new Error("Supabase is not configured on this page."));
  }

  if (supabaseClient) {
    return Promise.resolve(supabaseClient);
  }

  if (!supabaseLoadPromise) {
    supabaseLoadPromise = import("https://esm.sh/@supabase/supabase-js@2.49.1").then(
      ({ createClient }) => {
        supabaseClient = createClient(config.url, config.anonKey);
        return supabaseClient;
      },
    );
  }

  return supabaseLoadPromise;
}

function prefetchSupabase() {
  getSupabase().catch(() => {});
}

function refreshWizardElements() {
  els.wizardStepPanels = document.querySelectorAll(".wizard-step");
  els.wizardNav = document.getElementById("wizard-nav");
  els.wizardBack = document.getElementById("wizard-back");
  els.wizardNext = document.getElementById("wizard-next");
  els.submitBtn = document.getElementById("submit-event-btn");
}

function setWizardNavButton(button, isVisible) {
  if (!button) return;

  button.hidden = !isVisible;
  button.style.display = isVisible ? "" : "none";
  button.disabled = !isVisible;
  button.tabIndex = isVisible ? 0 : -1;

  if (isVisible) {
    button.removeAttribute("aria-hidden");
  } else {
    button.setAttribute("aria-hidden", "true");
  }
}

function syncWizardNavButtons() {
  const isFirstStep = currentWizardStep === 1;
  const isFinalStep = currentWizardStep === WIZARD_STEP_COUNT;

  els.wizardNav?.classList.toggle("is-first-step", isFirstStep);
  els.wizardNav?.classList.toggle("is-final-step", isFinalStep);

  setWizardNavButton(els.wizardBack, !isFirstStep);
  setWizardNavButton(els.wizardNext, !isFinalStep);
  setWizardNavButton(els.submitBtn, isFinalStep);
}

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
}

function clearFieldErrors() {
  Object.values(FIELD_ERROR_ELEMENTS).forEach((getEl) => hide(getEl()));
  els.submitterEmail?.classList.remove("is-invalid");
  els.title?.classList.remove("is-invalid");
  els.locationInput?.classList.remove("is-invalid");
  els.eventTypes?.classList.remove("is-invalid");
  setDateSegmentInvalid(els.startDate, false);
  setDateSegmentInvalid(els.endDate, false);
  setTimeSegmentInvalid(els.startTime, false);
  setTimeSegmentInvalid(els.endTime, false);
}

function showFieldError(fieldKey, message) {
  const getEl = FIELD_ERROR_ELEMENTS[fieldKey];
  const errorEl = getEl?.();
  if (!errorEl) return;

  if (!message) {
    hide(errorEl);
    return;
  }

  setText(errorEl, message);
  show(errorEl);
}

function markFieldInvalid(fieldKey, isInvalid = true) {
  const fieldMap = {
    submitterEmail: els.submitterEmail,
    partnerName: els.partnerName,
    websiteUrl: els.websiteUrl,
    eventTitle: els.title,
    eventLocation: els.locationInput,
    eventTypes: els.eventTypes,
    coverImage: els.coverInput,
    logoImage: els.logoInput,
  };
  fieldMap[fieldKey]?.classList.toggle("is-invalid", isInvalid);

  if (fieldKey === "schedule") {
    if (!isInvalid) {
      setDateSegmentInvalid(els.startDate, false);
      setDateSegmentInvalid(els.endDate, false);
      setTimeSegmentInvalid(els.startTime, false);
      setTimeSegmentInvalid(els.endTime, false);
    }
    return;
  }
}

function isDateContainerEmpty(container) {
  const { day, month, year } = getDateSegments(container);
  return (
    !String(day?.value ?? "").trim() &&
    !String(month?.value ?? "").trim() &&
    !String(year?.value ?? "").trim()
  );
}

function isDateContainerComplete(container) {
  const { day, month, year } = getDateSegments(container);
  return Boolean(
    String(day?.value ?? "").trim() &&
      String(month?.value ?? "").trim() &&
      String(year?.value ?? "").trim(),
  );
}

function clearScheduleFieldFeedback() {
  showFieldError("schedule", null);
  setDateSegmentInvalid(els.startDate, false);
  setDateSegmentInvalid(els.endDate, false);
  setTimeSegmentInvalid(els.startTime, false);
  setTimeSegmentInvalid(els.endTime, false);
}

function validateScheduleInput() {
  if (isDateContainerEmpty(els.startDate)) {
    setDateSegmentInvalid(els.startDate, true);
    return {
      ok: false,
      message: "Enter a valid start date (DD / MM / YYYY).",
      field: "schedule",
    };
  }

  if (!isDateContainerComplete(els.startDate)) {
    setDateSegmentInvalid(els.startDate, true);
    return {
      ok: false,
      message: "Enter a valid start date (DD / MM / YYYY).",
      field: "schedule",
    };
  }

  const startDateIso = readDateIsoFromContainer(els.startDate);
  if (!startDateIso) {
    setDateSegmentInvalid(els.startDate, true);
    return {
      ok: false,
      message: "Enter a valid start date (DD / MM / YYYY).",
      field: "schedule",
    };
  }

  let endDateIso = "";
  if (!isDateContainerEmpty(els.endDate)) {
    if (!isDateContainerComplete(els.endDate)) {
      setDateSegmentInvalid(els.endDate, true);
      return {
        ok: false,
        message: "Enter a valid end date (DD / MM / YYYY), or leave it empty.",
        field: "schedule",
      };
    }

    endDateIso = readDateIsoFromContainer(els.endDate);
    if (endDateIso === null) {
      setDateSegmentInvalid(els.endDate, true);
      return {
        ok: false,
        message: "Enter a valid end date (DD / MM / YYYY), or leave it empty.",
        field: "schedule",
      };
    }
  }

  if (!isEventDateOnOrAfterToday(startDateIso)) {
    setDateSegmentInvalid(els.startDate, true);
    return {
      ok: false,
      message: "Start date must be today or in the future.",
      field: "schedule",
    };
  }

  if (endDateIso && endDateIso < startDateIso) {
    setDateSegmentInvalid(els.endDate, true);
    return {
      ok: false,
      message: "End can't be before start.",
      field: "schedule",
    };
  }

  const scheduleType = getScheduleType();
  if (scheduleType === "exact_datetime") {
    normalizeTimeContainer(els.startTime);

    if (isTimeContainerEmpty(els.startTime)) {
      setTimeSegmentInvalid(els.startTime, true);
      return {
        ok: false,
        message: "Enter a start time.",
        field: "schedule",
      };
    }

    if (!isTimeContainerComplete(els.startTime)) {
      setTimeSegmentInvalid(els.startTime, true);
      return {
        ok: false,
        message: "Enter a valid start time (HH : MM).",
        field: "schedule",
      };
    }

    const startTime = readTimeFromContainer(els.startTime);
    if (startTime === null) {
      setTimeSegmentInvalid(els.startTime, true);
      return {
        ok: false,
        message: "Enter a valid start time (HH : MM).",
        field: "schedule",
      };
    }

    const endTimeResult = validateOptionalEndTime(els.endTime);
    if (!endTimeResult.ok) {
      setTimeSegmentInvalid(els.endTime, true);
      return {
        ok: false,
        message: endTimeResult.message,
        field: "schedule",
      };
    }

    const sameDay = !endDateIso || endDateIso === startDateIso;
    if (sameDay && endTimeResult.value && startTime && endTimeResult.value < startTime) {
      setTimeSegmentInvalid(els.endTime, true);
      return {
        ok: false,
        message: endDateIso
          ? "End time can't be before start time on the same day."
          : "End time can't be before start time. Pick a later time, or add an end date for overnight events.",
        field: "schedule",
      };
    }
  }

  const startsAtIso = buildStartsAtIso();
  const startsAtMs = startsAtIso ? Date.parse(startsAtIso) : Number.NaN;

  if (Number.isNaN(startsAtMs)) {
    setDateSegmentInvalid(els.startDate, true);
    return {
      ok: false,
      message: "Enter a valid start date (DD / MM / YYYY).",
      field: "schedule",
    };
  }

  if (scheduleType === "exact_datetime" && startsAtMs < Date.now()) {
    setDateSegmentInvalid(els.startDate, true);
    return {
      ok: false,
      message: "Start must be today or in the future.",
      field: "schedule",
    };
  }

  const endsAtIso = buildEndsAtIso();
  if (endsAtIso) {
    const endsAtMs = Date.parse(endsAtIso);
    if (endsAtMs < startsAtMs) {
      if (scheduleType === "exact_datetime") {
        const endTime = readTimeFromContainer(els.endTime);
        if (endTime) {
          setTimeSegmentInvalid(els.endTime, true);
          return {
            ok: false,
            message: endDateIso
              ? "End time can't be before start time on the same day."
              : "End time can't be before start time. Use a later time, or add an end date.",
            field: "schedule",
          };
        }
      }

      setDateSegmentInvalid(els.endDate, true);
      return {
        ok: false,
        message: "End can't be before start.",
        field: "schedule",
      };
    }
  }

  setDateSegmentInvalid(els.startDate, false);
  setDateSegmentInvalid(els.endDate, false);
  setTimeSegmentInvalid(els.startTime, false);
  setTimeSegmentInvalid(els.endTime, false);
  return { ok: true };
}

function showScheduleFieldFeedback() {
  if (isDateContainerEmpty(els.startDate)) {
    clearScheduleFieldFeedback();
    return;
  }

  if (!isDateContainerComplete(els.startDate)) {
    showFieldError("schedule", null);
    setDateSegmentInvalid(els.startDate, false);
    setDateSegmentInvalid(els.endDate, false);
    setTimeSegmentInvalid(els.startTime, false);
    setTimeSegmentInvalid(els.endTime, false);
    return;
  }

  const startDateIso = readDateIsoFromContainer(els.startDate);
  if (!startDateIso) {
    showFieldError("schedule", "Enter a valid start date (DD / MM / YYYY).");
    setDateSegmentInvalid(els.startDate, true);
    setDateSegmentInvalid(els.endDate, false);
    setTimeSegmentInvalid(els.startTime, false);
    setTimeSegmentInvalid(els.endTime, false);
    return;
  }

  if (!isDateContainerEmpty(els.endDate)) {
    if (!isDateContainerComplete(els.endDate)) {
      showFieldError("schedule", null);
      setDateSegmentInvalid(els.endDate, false);
      return;
    }

    const endDateIso = readDateIsoFromContainer(els.endDate);
    if (endDateIso === null) {
      showFieldError("schedule", "Enter a valid end date (DD / MM / YYYY), or leave it empty.");
      setDateSegmentInvalid(els.endDate, true);
      return;
    }

    if (endDateIso && endDateIso < startDateIso) {
      showFieldError("schedule", "End can't be before start.");
      setDateSegmentInvalid(els.endDate, true);
      return;
    }
  }

  clearScheduleFieldFeedback();
  showFormError(null);
}

function syncEventCardPreviewVisibility() {
  const visible = Boolean(els.formSection && !els.formSection.hidden);
  eventCardPreview.syncVisibility(visible);
}

function updateEventCardPreview() {
  let startsAt = null;
  let endsAt = null;

  if (isDateContainerComplete(els.startDate)) {
    startsAt = buildStartsAtIso({ mutate: false });
    endsAt = buildEndsAtIso({ mutate: false });
  }

  eventCardPreview.update({
    title: els.title?.value ?? "",
    locationName: selectedPlace?.locationName ?? "",
    countryCode: selectedPlace?.countryCode ?? null,
    scheduleType: getScheduleType(),
    startsAt,
    endsAt,
    eventTypes: getSelectedEventTypes(),
    coverImageUrl: coverPreviewUrl,
    logoUrl: logoPreviewUrl,
    isPartner: true,
  });
  syncEventCardPreviewVisibility();
}

function showForm() {
  hide(els.loading);
  show(els.formSection);
  hide(els.success);
  renderWizardProgressMap();
  goToWizardStep(1, { focus: false });
  updateEventCardPreview();
}

function bindWizardStepJumpHandlers() {
  if (!els.wizardStepsMap || els.wizardStepsMap.dataset.jumpBound === "true") return;

  els.wizardStepsMap.addEventListener("click", (event) => {
    const button = event.target.closest("[data-step-jump]");
    if (!button) return;

    const step = Number(button.dataset.stepJump);
    if (!Number.isFinite(step) || step >= currentWizardStep) return;
    goToWizardStep(step);
  });

  els.wizardStepsMap.dataset.jumpBound = "true";
}

function updateWizardProgressMarker(marker, step) {
  marker.classList.toggle("is-complete", step.id < currentWizardStep);
  marker.classList.toggle("is-active", step.id === currentWizardStep);

  const button = marker.querySelector("[data-step-jump]");
  if (!button) return;

  button.disabled = step.id >= currentWizardStep;
  button.setAttribute("aria-current", step.id === currentWizardStep ? "step" : "false");
  button.textContent = step.id < currentWizardStep ? "✓" : String(step.id);
}

function renderWizardProgressMap() {
  if (!els.wizardStepsMap) return;

  const existingMarkers = els.wizardStepsMap.querySelectorAll("[data-step-marker]");
  if (existingMarkers.length === WIZARD_STEP_COUNT) {
    existingMarkers.forEach((marker) => {
      const stepId = Number(marker.dataset.stepMarker);
      const step = WIZARD_STEPS.find((item) => item.id === stepId);
      if (step) updateWizardProgressMarker(marker, step);
    });
    return;
  }

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
}

function getWizardStepConfig(step = currentWizardStep) {
  return WIZARD_STEPS[step - 1] ?? WIZARD_STEPS[0];
}

function focusWizardStepField(step = currentWizardStep) {
  const focusTargets = {
    1: els.submitterEmail,
    2: els.partnerName,
    3: els.title,
    4: getDateSegments(els.startDate).day,
    5: els.eventTypes?.querySelector("input"),
    6: els.websiteUrl,
  };

  const target = focusTargets[step];
  target?.focus?.();
}

function renderWizardReview() {
  if (!els.wizardReview) return;

  const types = getSelectedEventTypes()
    .map((type) => SURF_EVENT_TYPE_LABELS[type] ?? type)
    .join(", ");

  const scheduleText = formatSchedulePreviewSummary(buildSchedulePreviewModel()) || "—";

  els.wizardReview.innerHTML = `
    <div class="wizard-review-row">
      <span class="wizard-review-label">Partner</span>
      <span class="wizard-review-value">${escapeHtml(els.partnerName?.value.trim() || "—")}</span>
    </div>
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
    <div class="wizard-review-row">
      <span class="wizard-review-label">Website</span>
      <span class="wizard-review-value">${escapeHtml(els.websiteUrl?.value.trim() || "—")}</span>
    </div>
    <div class="wizard-review-row">
      <span class="wizard-review-label">Cover</span>
      <span class="wizard-review-value">${coverFile ? escapeHtml(coverFile.name) : "—"}</span>
    </div>
    <div class="wizard-review-row">
      <span class="wizard-review-label">Logo</span>
      <span class="wizard-review-value">${logoFile ? escapeHtml(logoFile.name) : "—"}</span>
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

  if (currentWizardStep === WIZARD_STEP_COUNT) {
    renderWizardReview();
  }

  syncWizardNavButtons();

  renderWizardProgressMap();
}

function goToWizardStep(step, { focus = true } = {}) {
  currentWizardStep = Math.min(WIZARD_STEP_COUNT, Math.max(1, step));
  showFormError(null);
  clearFieldErrors();
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
      const email = els.submitterEmail?.value.trim() ?? "";
      if (!email) {
        return {
          ok: false,
          message: "Enter your email address so we can reach you.",
          field: "submitterEmail",
        };
      }
      if (!isValidEmail(email)) {
        return {
          ok: false,
          message: "Enter a valid email address (e.g. you@example.com).",
          field: "submitterEmail",
        };
      }
      return { ok: true };
    }
    case 2: {
      const partnerName = els.partnerName?.value.trim() ?? "";
      if (!partnerName) {
        return {
          ok: false,
          message: "Enter your partner or organizer name.",
          field: "partnerName",
        };
      }
      if (partnerName.length > 120) {
        return {
          ok: false,
          message: "Partner name must be at most 120 characters.",
          field: "partnerName",
        };
      }
      return { ok: true };
    }
    case 3: {
      const title = els.title?.value.trim() ?? "";
      if (!title) {
        return {
          ok: false,
          message: "Give your event a name.",
          field: "eventTitle",
        };
      }
      if (!selectedPlace) {
        return {
          ok: false,
          message: "Search for a location and tap a result to confirm it.",
          field: "eventLocation",
        };
      }
      return { ok: true };
    }
    case 4: {
      const result = validateScheduleInput();
      if (!result.ok) {
        return result;
      }

      updateSchedulePreview();
      return { ok: true };
    }
    case 5: {
      if (!getSelectedEventTypes().length) {
        return {
          ok: false,
          message: "Select at least one event type.",
          field: "eventTypes",
        };
      }
      return { ok: true };
    }
    case 6: {
      const websiteUrl = els.websiteUrl?.value.trim() ?? "";
      if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
        return {
          ok: false,
          message: "Website link must start with http:// or https://.",
          field: "websiteUrl",
        };
      }
      if (websiteUrl.length > 500) {
        return {
          ok: false,
          message: "Website link is too long.",
          field: "websiteUrl",
        };
      }
      const coverResult = validateMediaFile(coverFile, "cover");
      if (!coverResult.ok) return coverResult;
      const logoResult = validateMediaFile(logoFile, "logo");
      if (!logoResult.ok) return logoResult;
      return { ok: true };
    }
    default:
      return { ok: true };
  }
}

function applyWizardStepError(result) {
  clearFieldErrors();
  showFormError(result.message);

  if (result.field) {
    showFieldError(result.field, result.message);
    markFieldInvalid(result.field, true);
  }

  focusWizardStepField(currentWizardStep);

  const scrollTarget =
    (result.field && FIELD_ERROR_ELEMENTS[result.field]?.()) ||
    els.formError ||
    els.wizardNav;
  scrollTarget?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function handleWizardNext() {
  const result = validateWizardStep(currentWizardStep);
  if (!result.ok) {
    applyWizardStepError(result);
    return;
  }

  goToWizardStep(currentWizardStep + 1);
}

function handleWizardBack() {
  if (currentWizardStep <= 1) return;
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

  const iso = readDateIsoFromContainer(container);
  const empty = isDateContainerEmpty(container);
  const complete = isDateContainerComplete(container);

  if (empty) {
    setDateSegmentInvalid(container, false);
  } else if (complete) {
    setDateSegmentInvalid(container, iso === null);
  } else {
    setDateSegmentInvalid(container, false);
  }

  if (container === els.startDate || container === els.endDate) {
    showScheduleFieldFeedback();
  }
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

function getTimeSegments(container) {
  if (!container) {
    return { hour: null, minute: null, row: null };
  }

  return {
    hour: container.querySelector('[data-segment="hour"]'),
    minute: container.querySelector('[data-segment="minute"]'),
    row: container.querySelector(".time-segments-row"),
  };
}

function composeTimeValue(hour, minute) {
  const hourText = String(hour ?? "").trim();
  const minuteText = String(minute ?? "").trim();

  if (!hourText && !minuteText) {
    return { empty: true, ok: false, value: "" };
  }

  if (!hourText || !minuteText) {
    return { empty: false, ok: false, value: null };
  }

  if (!/^\d{1,2}$/.test(hourText) || !/^\d{1,2}$/.test(minuteText)) {
    return { empty: false, ok: false, value: null };
  }

  const hours = Number(hourText);
  const minutes = Number(minuteText);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    if (hours === 24 && minutes === 0) {
      return {
        empty: false,
        ok: true,
        value: "23:59",
      };
    }
    return { empty: false, ok: false, value: null };
  }

  return {
    empty: false,
    ok: true,
    value: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
  };
}

function isTimeContainerEmpty(container) {
  const { hour, minute } = getTimeSegments(container);
  return (
    !String(hour?.value ?? "").trim() && !String(minute?.value ?? "").trim()
  );
}

function isTimeContainerComplete(container) {
  const { hour, minute } = getTimeSegments(container);
  return Boolean(
    String(hour?.value ?? "").trim() && String(minute?.value ?? "").trim(),
  );
}

function normalizeTimeContainer(container) {
  const { hour, minute } = getTimeSegments(container);
  if (hour?.value && /^\d$/.test(hour.value)) {
    hour.value = hour.value.padStart(2, "0");
  }
  if (minute?.value && /^\d$/.test(minute.value)) {
    minute.value = minute.value.padStart(2, "0");
  }
}

/** Optional end time: hour-only becomes :00; stray minute-only input is cleared. */
function prepareOptionalEndTimeContainer(container) {
  normalizeTimeContainer(container);
  const { hour, minute } = getTimeSegments(container);
  const hourText = String(hour?.value ?? "").trim();
  const minuteText = String(minute?.value ?? "").trim();

  if (hourText && !minuteText && minute) {
    minute.value = "00";
    return;
  }

  if (!hourText && minuteText) {
    clearTimeSegments(container);
  }
}

function validateOptionalEndTime(container) {
  if (!container || isTimeContainerEmpty(container)) {
    return { ok: true, value: "" };
  }

  prepareOptionalEndTimeContainer(container);

  if (isTimeContainerEmpty(container)) {
    return { ok: true, value: "" };
  }

  const timeValue = readTimeFromContainer(container);
  if (timeValue === null) {
    return {
      ok: false,
      message: "Enter a valid end time (HH : MM), or leave it empty.",
    };
  }

  return { ok: true, value: timeValue };
}

function readTimeFromContainer(container) {
  const { hour, minute } = getTimeSegments(container);
  const result = composeTimeValue(hour?.value, minute?.value);

  if (result.empty) return "";
  if (!result.ok) return null;
  return result.value;
}

function setTimeSegmentInvalid(container, isInvalid) {
  const { row } = getTimeSegments(container);
  row?.classList.toggle("is-invalid", isInvalid);
}

function clearTimeSegments(container) {
  const { hour, minute } = getTimeSegments(container);
  if (hour) hour.value = "";
  if (minute) minute.value = "";
  setTimeSegmentInvalid(container, false);
}

function setTimeSegmentsDisabled(container, disabled) {
  const { hour, minute } = getTimeSegments(container);
  for (const input of [hour, minute]) {
    if (!input) continue;
    input.disabled = disabled;
  }
}

function focusTimeSegment(segment) {
  if (!segment) return;
  segment.focus();
  if (segment.value) {
    segment.select();
  }
}

function isFocusMovingWithinTimeContainer(container, relatedTarget) {
  return relatedTarget instanceof Node && container.contains(relatedTarget);
}

function handleTimeSegmentInput(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.dataset.segment) return;

  const container = input.closest(".time-segments");
  if (!container) return;

  input.value = input.value.replace(/\D/g, "").slice(0, 2);
  setTimeSegmentInvalid(container, false);

  const { hour, minute } = getTimeSegments(container);
  if (input.dataset.segment === "hour" && input.value.length >= 2 && minute) {
    window.setTimeout(() => {
      if (document.activeElement === input) {
        focusTimeSegment(minute);
      }
    }, 0);
  }

  updateSchedulePreview();
}

function handleTimeSegmentKeydown(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.dataset.segment) return;

  const { hour, minute } = getTimeSegments(input.closest(".time-segments"));
  const segment = input.dataset.segment;

  if (event.key === "Backspace" && input.value === "" && segment === "minute") {
    event.preventDefault();
    focusTimeSegment(hour);
  }

  if (event.key === "ArrowLeft" && input.selectionStart === 0 && segment === "minute") {
    event.preventDefault();
    focusTimeSegment(hour);
  }

  if (
    event.key === "ArrowRight" &&
    input.selectionStart === input.value.length &&
    segment === "hour"
  ) {
    event.preventDefault();
    focusTimeSegment(minute);
  }
}

function handleTimeSegmentPaste(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  const container = input.closest(".time-segments");
  if (!container) return;

  const pasted = event.clipboardData?.getData("text")?.trim() ?? "";
  const match = pasted.match(/^(\d{1,2})(?::?(\d{1,2}))?$/);
  if (!match) return;

  event.preventDefault();
  const { hour, minute } = getTimeSegments(container);
  if (hour) hour.value = match[1].replace(/\D/g, "").slice(0, 2);
  if (minute && match[2]) minute.value = match[2].replace(/\D/g, "").slice(0, 2);
  setTimeSegmentInvalid(container, false);
  focusTimeSegment(match[2] ? minute : hour);
  updateSchedulePreview();
  showScheduleFieldFeedback();
}

function handleTimeSegmentBlur(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.dataset.segment) return;

  const container = input.closest(".time-segments");
  if (!container) return;

  if (isFocusMovingWithinTimeContainer(container, event.relatedTarget)) {
    return;
  }

  const isOptionalEndTime = container === els.endTime;
  if (isOptionalEndTime) {
    prepareOptionalEndTimeContainer(container);
  } else {
    normalizeTimeContainer(container);
  }

  const timeValue = readTimeFromContainer(container);
  const hasAnyValue = !isTimeContainerEmpty(container);
  const isInvalid = isOptionalEndTime
    ? hasAnyValue && timeValue === null
    : hasAnyValue && !timeValue;

  setTimeSegmentInvalid(container, isInvalid);
  showScheduleFieldFeedback();
}

function bindTimeSegments(container) {
  const { hour, minute } = getTimeSegments(container);
  for (const input of [hour, minute]) {
    if (!input) continue;
    input.addEventListener("input", handleTimeSegmentInput);
    input.addEventListener("keydown", handleTimeSegmentKeydown);
    input.addEventListener("paste", handleTimeSegmentPaste);
    input.addEventListener("blur", handleTimeSegmentBlur);
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

function buildSchedulePreviewModel() {
  const startDateIso = readDateIsoFromContainer(els.startDate);
  if (!startDateIso) return null;

  const endDateIso = readDateIsoFromContainer(els.endDate);
  const withTime = getScheduleType() === "exact_datetime";
  let startTime = "";
  let endTime = "";
  if (withTime) {
    startTime = readTimeFromContainer(els.startTime);
    endTime = readTimeFromContainer(els.endTime);
  }
  const startDateLabel = formatDisplayDate(startDateIso);
  const endDateLabel = endDateIso ? formatDisplayDate(endDateIso) : null;
  const hasEndDate = Boolean(endDateIso);
  const sameCalendarDay = !hasEndDate || endDateIso === startDateIso;
  const hasEndTime = Boolean(endTime);
  const showEndBlock = hasEndDate && !sameCalendarDay;
  const showEndTimeOnStartBlock = withTime && sameCalendarDay && hasEndTime;
  const startTimeMissing = withTime && !startTime;

  let meta = "";
  if (withTime) {
    if (startTimeMissing) {
      meta = "Start time is required for dated events with times.";
    } else if (!hasEndDate && !hasEndTime) {
      meta = "Single-day event with start time.";
    } else if (sameCalendarDay && hasEndTime) {
      meta = "Single-day event with start and end time.";
    } else if (showEndBlock) {
      meta = "Multi-day event with times.";
    }
  } else if (!hasEndDate) {
    meta = "Single-day, all-day event.";
  } else if (sameCalendarDay) {
    meta = "All-day event.";
  } else {
    meta = "Multi-day, all-day event.";
  }

  return {
    withTime,
    startDateLabel,
    startTime,
    startTimeLabel: startTime ? formatDisplayTime(startTime) : null,
    startTimeMissing,
    endDateLabel: showEndBlock ? endDateLabel : null,
    endTime,
    endTimeLabel: endTime ? formatDisplayTime(endTime) : null,
    showEndBlock,
    showEndTimeOnStartBlock,
    endTimeOnEndBlock: showEndBlock && Boolean(endTime),
    sameCalendarDay: !hasEndDate || sameCalendarDay,
    allDay: !withTime,
    meta,
  };
}

function formatSchedulePreviewSummary(model) {
  if (!model) return "";

  const startPart = model.startTimeLabel
    ? `${model.startDateLabel}, ${model.startTimeLabel}`
    : model.startDateLabel;

  if (!model.showEndBlock && !model.showEndTimeOnStartBlock) {
    return startPart;
  }

  if (model.showEndTimeOnStartBlock && model.endTimeLabel) {
    return `${startPart} → ${model.endTimeLabel}`;
  }

  const endPart =
    model.endTimeOnEndBlock && model.endTimeLabel
      ? `${model.endDateLabel}, ${model.endTimeLabel}`
      : model.endDateLabel;

  return `${startPart} → ${endPart}`;
}

function renderSchedulePreviewBlock(label, dateLabel, timeLabel, options = {}) {
  const { note = "", timeMissing = false, timeMissingLabel = "Add time" } = options;

  const timeHtml = timeLabel
    ? `<span class="schedule-preview-block-time">${escapeHtml(timeLabel)}</span>`
    : timeMissing
      ? `<span class="schedule-preview-block-time is-missing">${escapeHtml(timeMissingLabel)}</span>`
      : note
        ? `<span class="schedule-preview-block-note">${escapeHtml(note)}</span>`
        : "";

  return `
    <div class="schedule-preview-block">
      <span class="schedule-preview-block-label">${escapeHtml(label)}</span>
      <strong class="schedule-preview-block-date">${escapeHtml(dateLabel)}</strong>
      ${timeHtml}
    </div>
  `;
}

function renderSchedulePreviewHtml(model) {
  if (!model) return "";

  const startNote = !model.withTime && model.sameCalendarDay ? "All day" : "";
  const startBlock = renderSchedulePreviewBlock("Start", model.startDateLabel, model.startTimeLabel, {
    note: startNote,
    timeMissing: model.startTimeMissing,
    timeMissingLabel: "Start time required",
  });

  if (!model.showEndBlock && !model.showEndTimeOnStartBlock) {
    return `
      <p class="schedule-preview-heading">Schedule preview</p>
      <div class="schedule-preview-range is-single-block">
        ${startBlock}
      </div>
      <p class="schedule-preview-meta${model.startTimeMissing ? " is-warning" : ""}">${escapeHtml(model.meta)}</p>
    `;
  }

  const endBlock = model.showEndBlock
    ? renderSchedulePreviewBlock("End", model.endDateLabel, model.endTimeOnEndBlock ? model.endTimeLabel : null, {
        note: !model.endTimeOnEndBlock && model.withTime ? "End of day" : !model.withTime ? "All day" : "",
      })
    : renderSchedulePreviewBlock("End", model.startDateLabel, model.endTimeLabel, {
        note: model.showEndTimeOnStartBlock ? "Same day" : "",
      });

  return `
    <p class="schedule-preview-heading">Schedule preview</p>
    <div class="schedule-preview-range">
      ${startBlock}
      <div class="schedule-preview-arrow" aria-hidden="true">→</div>
      ${endBlock}
    </div>
    <p class="schedule-preview-meta${model.startTimeMissing ? " is-warning" : ""}">${escapeHtml(model.meta)}</p>
  `;
}

function updateSchedulePreview() {
  updateEventCardPreview();

  if (!isDateContainerComplete(els.startDate)) {
    hide(els.schedulePreview);
    return;
  }

  const model = buildSchedulePreviewModel();
  if (!model || !els.schedulePreview) {
    hide(els.schedulePreview);
    return;
  }

  els.schedulePreview.innerHTML = renderSchedulePreviewHtml(model);
  show(els.schedulePreview);
}

function buildStartsAtIso(options = {}) {
  const { mutate = true } = options;
  const scheduleType = getScheduleType();
  const startDate = readDateIsoFromContainer(els.startDate);

  if (!startDate) return null;

  if (scheduleType === "exact") {
    return parseEventDateLocalValue(startDate);
  }

  if (mutate) {
    normalizeTimeContainer(els.startTime);
  }
  const startTime = readTimeFromContainer(els.startTime);
  if (!startTime) return null;

  return buildExactDatetimeIso(startDate, startTime);
}

function buildEndsAtIso(options = {}) {
  const { mutate = true } = options;
  const scheduleType = getScheduleType();
  const startDate = readDateIsoFromContainer(els.startDate);
  const endDate = readDateIsoFromContainer(els.endDate);

  if (endDate === null) return null;

  if (!endDate) {
    if (mutate) {
      prepareOptionalEndTimeContainer(els.endTime);
    }
    const endTime = readTimeFromContainer(els.endTime);
    if (scheduleType === "exact_datetime" && endTime && startDate) {
      return buildExactDatetimeIso(startDate, endTime);
    }
    return null;
  }

  if (scheduleType === "exact") {
    return parseEventDateLocalValue(endDate);
  }

  if (mutate) {
    prepareOptionalEndTimeContainer(els.endTime);
  }
  const endTime = readTimeFromContainer(els.endTime);
  return buildExactDatetimeIso(endDate, endTime || "23:59");
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
    setTimeSegmentsDisabled(els.startTime, false);
    setTimeSegmentsDisabled(els.endTime, false);
  } else {
    hide(els.datetimeFields);
    clearTimeSegments(els.startTime);
    clearTimeSegments(els.endTime);
    setTimeSegmentsDisabled(els.startTime, true);
    setTimeSegmentsDisabled(els.endTime, true);
  }

  updateSchedulePreview();
}

function updateEndDateMin() {
  updateSchedulePreview();
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
    updateEventCardPreview();
    return;
  }

  hide(els.selectedPlaceBox);
  show(els.placeHint);
  els.locationInput?.classList.remove("is-selected");
  els.locationInput?.removeAttribute("readonly");
  updateEventCardPreview();
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
  updateEventCardPreview();
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

function validateMediaFile(file, kind) {
  if (!file) return { ok: true };

  if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
    return {
      ok: false,
      message: `${kind === "cover" ? "Cover" : "Logo"} must be JPG, PNG, WebP, or GIF.`,
      field: kind === "cover" ? "coverImage" : "logoImage",
    };
  }

  if (file.size > MAX_MEDIA_BYTES) {
    return {
      ok: false,
      message: `${kind === "cover" ? "Cover" : "Logo"} must be 5 MB or smaller.`,
      field: kind === "cover" ? "coverImage" : "logoImage",
    };
  }

  return { ok: true };
}

function revokePreviewUrl(url) {
  if (url) URL.revokeObjectURL(url);
}

function renderMediaPreview(kind) {
  const isCover = kind === "cover";
  const file = isCover ? coverFile : logoFile;
  const previewEl = isCover ? els.coverPreview : els.logoPreview;
  const clearBtn = isCover ? els.clearCoverBtn : els.clearLogoBtn;

  if (!previewEl) return;

  if (isCover) {
    revokePreviewUrl(coverPreviewUrl);
    coverPreviewUrl = null;
  } else {
    revokePreviewUrl(logoPreviewUrl);
    logoPreviewUrl = null;
  }

  if (!file) {
    previewEl.hidden = true;
    previewEl.innerHTML = "";
    hide(clearBtn);
    updateEventCardPreview();
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  if (isCover) coverPreviewUrl = objectUrl;
  else logoPreviewUrl = objectUrl;

  previewEl.innerHTML = `<img src="${objectUrl}" alt="" />`;
  previewEl.hidden = false;
  show(clearBtn);
  updateEventCardPreview();
}

function clearMediaSelection(kind) {
  if (kind === "cover") {
    coverFile = null;
    if (els.coverInput) els.coverInput.value = "";
    showFieldError("coverImage", null);
    markFieldInvalid("coverImage", false);
  } else {
    logoFile = null;
    if (els.logoInput) els.logoInput.value = "";
    showFieldError("logoImage", null);
    markFieldInvalid("logoImage", false);
  }
  renderMediaPreview(kind);
}

function handleMediaInput(event, kind) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  const file = input.files?.[0] ?? null;
  const result = validateMediaFile(file, kind);
  if (!result.ok) {
    input.value = "";
    if (kind === "cover") coverFile = null;
    else logoFile = null;
    renderMediaPreview(kind);
    showFieldError(result.field, result.message);
    markFieldInvalid(result.field, true);
    showFormError(result.message);
    return;
  }

  if (kind === "cover") coverFile = file;
  else logoFile = file;

  showFieldError(kind === "cover" ? "coverImage" : "logoImage", null);
  markFieldInvalid(kind === "cover" ? "coverImage" : "logoImage", false);
  showFormError(null);
  renderMediaPreview(kind);
}

async function uploadPartnerMedia(file, kind) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);

  const response = await fetch(`${config.url.replace(/\/+$/, "")}/functions/v1/partner-event-media`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "x-partner-access-key": ACCESS_KEY,
    },
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `Upload failed (${response.status}).`);
  }

  if (!payload?.url) {
    throw new Error("Upload did not return a URL.");
  }

  return payload.url;
}

function showAccessGate() {
  hide(els.formSection);
  hide(els.success);
  hide(els.loading);
  show(els.accessGate);
  syncEventCardPreviewVisibility();
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
  clearMediaSelection("cover");
  clearMediaSelection("logo");
  clearDateSegments(els.startDate);
  clearDateSegments(els.endDate);
  showFormError(null);
  clearFieldErrors();
  updateDatetimeVisibility();
  hide(els.schedulePreview);
  setText(els.descriptionCount, "0 / 600");
  setText(els.noteCount, "0 / 500");
  els.success?.removeAttribute("data-event-id");
  currentWizardStep = 1;
  renderWizardStep();
  updateEventCardPreview();
}

function showSubmitAnotherForm() {
  resetEventForm();
  hide(els.success);
  show(els.formSection);
  els.submitterEmail?.focus();
  els.formSection?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatSubmitRpcError(message) {
  const text = String(message ?? "").trim();
  console.error("[submit_partner_event]", text);

  if (text.includes("events_partner_fields_check")) {
    return "Submit failed: database constraint events_partner_fields_check is still on the old version. Re-run the partner-fields hotfix SQL in Supabase (see migration 20260712180000_fix_partner_fields_check_pending.sql), then try again.";
  }
  if (text.includes("events_community_submission_fields_check")) {
    return "Submit failed: database constraint events_community_submission_fields_check is still on the old version. Re-run the community hotfix SQL in Supabase (see migration 20260712150000_fix_community_submission_constraint.sql), then try again.";
  }
  return text || "Something went wrong. Please try again.";
}

async function handleFinalSubmit() {
  showFormError(null);
  clearFieldErrors();

  if (!ACCESS_KEY) {
    showFormError("Invalid partner link — check the URL you were given.");
    return;
  }

  for (let step = 1; step <= 5; step += 1) {
    const result = validateWizardStep(step);
    if (!result.ok) {
      goToWizardStep(step);
      applyWizardStepError(result);
      return;
    }
  }

  const stepSix = validateWizardStep(6);
  if (!stepSix.ok) {
    goToWizardStep(6);
    applyWizardStepError(stepSix);
    return;
  }

  const input = {
    title: els.title?.value ?? "",
    partnerName: els.partnerName?.value ?? "",
    websiteUrl: els.websiteUrl?.value ?? "",
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

  const validation = validatePartnerEventSubmissionInput(input);
  if (!validation.ok) {
    showFormError(validation.message);
    return;
  }

  els.submitBtn.disabled = true;
  els.submitBtn.textContent = "Submitting…";

  let client;
  try {
    client = await getSupabase();
  } catch {
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = "Submit for review";
    showFormError("Supabase is not configured on this page.");
    return;
  }

  try {
    let coverImageUrl = null;
    let logoUrl = null;

    if (coverFile) {
      els.submitBtn.textContent = "Uploading cover…";
      coverImageUrl = await uploadPartnerMedia(coverFile, "cover");
    }

    if (logoFile) {
      els.submitBtn.textContent = "Uploading logo…";
      logoUrl = await uploadPartnerMedia(logoFile, "logo");
    }

    els.submitBtn.textContent = "Submitting…";

    const { data: eventId, error } = await client.rpc("submit_partner_event", {
      p_access_key: ACCESS_KEY,
      p_partner_name: input.partnerName.trim(),
      p_title: input.title.trim(),
      p_location_name: input.locationName.trim(),
      p_country_code: input.countryCode,
      p_latitude: input.latitude,
      p_longitude: input.longitude,
      p_schedule_type: input.scheduleType,
      p_starts_at: input.startsAt,
      p_ends_at: input.endsAt || null,
      p_event_types: input.eventTypes,
      p_submitter_email: input.submitterEmail.trim(),
      p_website_url: input.websiteUrl?.trim() || null,
      p_cover_image_url: coverImageUrl,
      p_logo_url: logoUrl,
      p_submitter_note: input.submitterNote?.trim() || null,
      p_description: input.description?.trim() || null,
    });

    els.submitBtn.disabled = false;
    els.submitBtn.textContent = "Submit for review";

    if (error) {
      showFormError(formatSubmitRpcError(error.message));
      return;
    }

    hide(els.formSection);
    show(els.success);
    syncEventCardPreviewVisibility();

    if (eventId) {
      els.success?.setAttribute("data-event-id", String(eventId));
    }
  } catch (error) {
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = "Submit for review";
    showFormError(error instanceof Error ? error.message : "Submission failed.");
  }
}

function handleFormSubmit(event) {
  event.preventDefault();

  if (currentWizardStep < WIZARD_STEP_COUNT) {
    handleWizardNext();
    return;
  }

  handleFinalSubmit();
}

function bindEvents() {
  bindWizardStepJumpHandlers();
  els.wizardBack?.addEventListener("click", handleWizardBack);
  els.wizardNext?.addEventListener("click", handleWizardNext);
  els.submitBtn?.addEventListener("click", handleFinalSubmit);
  els.submitAnotherBtn?.addEventListener("click", showSubmitAnotherForm);
  els.clearPlaceBtn?.addEventListener("click", clearPlaceSelection);
  els.form?.addEventListener("submit", handleFormSubmit);
  els.locationInput?.addEventListener("input", handleLocationInput);

  els.submitterEmail?.addEventListener("input", () => {
    showFieldError("submitterEmail", null);
    markFieldInvalid("submitterEmail", false);
    showFormError(null);
  });

  els.partnerName?.addEventListener("input", () => {
    showFieldError("partnerName", null);
    markFieldInvalid("partnerName", false);
    showFormError(null);
  });

  els.websiteUrl?.addEventListener("input", () => {
    showFieldError("websiteUrl", null);
    markFieldInvalid("websiteUrl", false);
    showFormError(null);
  });

  els.coverInput?.addEventListener("change", (event) => handleMediaInput(event, "cover"));
  els.logoInput?.addEventListener("change", (event) => handleMediaInput(event, "logo"));
  els.clearCoverBtn?.addEventListener("click", () => clearMediaSelection("cover"));
  els.clearLogoBtn?.addEventListener("click", () => clearMediaSelection("logo"));

  els.title?.addEventListener("input", () => {
    showFieldError("eventTitle", null);
    markFieldInvalid("eventTitle", false);
    showFormError(null);
    updateEventCardPreview();
  });

  els.locationInput?.addEventListener("input", () => {
    if (!selectedPlace) {
      showFieldError("eventLocation", null);
      markFieldInvalid("eventLocation", false);
      showFormError(null);
    }
  });

  els.eventTypes?.addEventListener("change", () => {
    showFieldError("eventTypes", null);
    markFieldInvalid("eventTypes", false);
    showFormError(null);
    updateEventCardPreview();
  });

  els.scheduleAllDay?.addEventListener("change", updateDatetimeVisibility);
  els.scheduleWithTime?.addEventListener("change", updateDatetimeVisibility);

  bindDateSegments(els.startDate);
  bindDateSegments(els.endDate);
  bindTimeSegments(els.startTime);
  bindTimeSegments(els.endTime);

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

function init() {
  if (!ACCESS_KEY) {
    showAccessGate();
    return;
  }

  hide(els.accessGate);
  refreshWizardElements();

  renderEventTypeChips();
  updateDatetimeVisibility();
  bindEvents();
  showForm();

  if (!config?.url || !config?.anonKey) {
    showFormError("Supabase is not configured on this page.");
    return;
  }

  prefetchSupabase();
}

init();
