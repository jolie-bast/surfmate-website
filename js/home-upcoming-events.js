import {
  compareSurfEventsBySchedule,
  filterEvents,
  formatEventLocationLabel,
  formatSurfEventSchedule,
  isSurfEventLiveNow,
  mapEventRow,
} from "./events-shared.js";

const UPCOMING_LIMIT = 5;

const els = {
  section: null,
  loading: null,
  error: null,
  list: null,
  empty: null,
};

function getConfig() {
  return window.SURFMATE_SUPABASE;
}

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

function findElements() {
  els.section = document.getElementById("upcoming-events");
  els.loading = document.getElementById("upcoming-events-loading");
  els.error = document.getElementById("upcoming-events-error");
  els.list = document.getElementById("upcoming-events-list");
  els.empty = document.getElementById("upcoming-events-empty");
}

function setLoading(isLoading) {
  if (els.loading) els.loading.hidden = !isLoading;
}

function setError(message) {
  if (!els.error) return;
  const text = String(message ?? "").trim();
  els.error.textContent = text;
  els.error.hidden = !text;
}

async function fetchEvents(maxAttempts = 3) {
  const config = getConfig();
  if (!config?.url || !config?.anonKey) {
    throw new Error("Supabase is not configured.");
  }

  const url = `${config.url.replace(/\/+$/, "")}/rest/v1/rpc/get_website_events`;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: "{}",
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(body || `Request failed (${response.status}).`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid events response.");
      }

      return data.map(mapEventRow);
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
      }
    }
  }

  throw lastError ?? new Error("Could not load events.");
}

function buildEventRow(event) {
  const dateLabel = formatSurfEventSchedule(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
  );
  const locationLabel = formatEventLocationLabel(event.locationName, event.countryCode);
  const isOn = isSurfEventLiveNow(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
  );

  const badges = [
    isOn ? '<span class="upcoming-event-badge upcoming-event-badge--on"><span class="upcoming-on-dot" aria-hidden="true"></span>ON</span>' : "",
    event.isPartner ? '<span class="upcoming-event-badge upcoming-event-badge--partner">Partner</span>' : "",
  ]
    .filter(Boolean)
    .join("");

  const inner = `
    <span class="upcoming-event-date">${escapeHtml(dateLabel)}</span>
    <div class="upcoming-event-main">
      <p class="upcoming-event-title">${escapeHtml(event.title)}</p>
      <p class="upcoming-event-location">${escapeHtml(locationLabel)}</p>
    </div>
    ${badges ? `<div class="upcoming-event-badges">${badges}</div>` : ""}
  `;

  const href = hasWebsite(event.websiteUrl) ? event.websiteUrl.trim() : "/events/";

  if (hasWebsite(event.websiteUrl)) {
    return `<a href="${escapeHtml(href)}" class="upcoming-event-row" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  }

  return `<a href="/events/" class="upcoming-event-row">${inner}</a>`;
}

function renderUpcomingEvents(events) {
  const upcoming = filterEvents(events, {
    searchQuery: "",
    selectedTypes: new Set(),
    upcomingOnly: true,
  })
    .sort(compareSurfEventsBySchedule)
    .slice(0, UPCOMING_LIMIT);

  if (!upcoming.length) {
    if (els.list) {
      els.list.hidden = true;
      els.list.innerHTML = "";
    }
    if (els.empty) els.empty.hidden = false;
    return;
  }

  if (els.empty) els.empty.hidden = true;
  if (els.list) {
    els.list.innerHTML = upcoming.map(buildEventRow).join("");
    els.list.hidden = false;
  }
}

async function initHomeUpcomingEvents() {
  findElements();
  if (!els.section) return;

  setLoading(true);
  setError("");

  try {
    const events = await fetchEvents();
    renderUpcomingEvents(events);
  } catch (error) {
    console.error("Home upcoming events failed:", error);
    setError("Could not load events right now.");
    if (els.list) els.list.hidden = true;
    if (els.empty) els.empty.hidden = true;
  } finally {
    setLoading(false);
  }
}

function waitForSectionAndInit(attempt = 0) {
  findElements();
  if (els.section) {
    initHomeUpcomingEvents();
    return;
  }

  if (attempt < 20) {
    setTimeout(() => waitForSectionAndInit(attempt + 1), 200);
  }
}

waitForSectionAndInit();
