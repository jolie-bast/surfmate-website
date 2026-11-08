import { buildEventCard } from "./events-cards.js";
import {
  compareSurfEventsBySchedule,
  filterEvents,
  mapEventRow,
} from "./events-shared.js";

const UPCOMING_PREVIEW_LIMIT = 6;

const els = {
  section: null,
  loading: null,
  error: null,
  preview: null,
  grid: null,
  empty: null,
  count: null,
  discover: null,
};

function getConfig() {
  return window.SURFMATE_SUPABASE;
}

function findElements() {
  els.section = document.getElementById("upcoming-events");
  els.loading = document.getElementById("upcoming-events-loading");
  els.error = document.getElementById("upcoming-events-error");
  els.preview = document.getElementById("upcoming-events-preview");
  els.grid = document.getElementById("upcoming-events-grid");
  els.empty = document.getElementById("upcoming-events-empty");
  els.count = document.getElementById("upcoming-events-count");
  els.discover = document.getElementById("upcoming-events-discover");
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

function formatListedCount(count) {
  return new Intl.NumberFormat(undefined).format(count);
}

function updateDiscoverCta(totalListed) {
  if (!els.count || !els.discover) return;

  if (typeof totalListed !== "number" || totalListed <= 0) {
    els.count.textContent = "all";
    els.discover.setAttribute(
      "aria-label",
      "Discover all listed surf events on the events page",
    );
    return;
  }

  const label = formatListedCount(totalListed);
  els.count.textContent = label;

  const eventWord = totalListed === 1 ? "event" : "events";
  els.discover.setAttribute(
    "aria-label",
    `Discover ${label} listed surf ${eventWord} on the events page`,
  );
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

function renderUpcomingEvents(events) {
  const totalListed = events.length;
  updateDiscoverCta(totalListed);

  const upcoming = filterEvents(events, {
    searchQuery: "",
    selectedTypes: new Set(),
    upcomingOnly: true,
  }).sort(compareSurfEventsBySchedule);

  const preview = upcoming.slice(0, UPCOMING_PREVIEW_LIMIT);
  const hasMore = upcoming.length > preview.length;

  if (!preview.length) {
    if (els.preview) {
      els.preview.hidden = true;
      els.preview.classList.remove("has-more");
    }
    if (els.grid) els.grid.innerHTML = "";
    if (els.empty) els.empty.hidden = false;
    return;
  }

  if (els.empty) els.empty.hidden = true;
  if (els.preview) {
    els.preview.hidden = false;
    els.preview.classList.toggle("has-more", hasMore);
  }
  if (els.grid) {
    els.grid.innerHTML = preview
      .map((event) =>
        buildEventCard(event, { selectedTypes: new Set(), omitEmptyCover: true }),
      )
      .join("");
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
    updateDiscoverCta(null);
    if (els.preview) {
      els.preview.hidden = true;
      els.preview.classList.remove("has-more");
    }
    if (els.grid) els.grid.innerHTML = "";
    if (els.empty) els.empty.hidden = true;
  } finally {
    setLoading(false);
    if (typeof window.syncStoryJourney === "function") {
      requestAnimationFrame(() => window.syncStoryJourney());
    }
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
