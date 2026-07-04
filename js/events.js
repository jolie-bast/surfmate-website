import {
  SURF_EVENT_TYPES,
  SURF_EVENT_TYPE_LABELS,
  CALENDAR_WEEKDAY_LABELS,
  buildCalendarMonthWeeks,
  compareSurfEventsBySchedule,
  filterEvents,
  formatEventLocationLabel,
  formatMonthYearLabel,
  formatSurfEventSchedule,
  getDefaultSelectedDayForMonth,
  getSurfEventExactCalendarDayKeys,
  groupSurfEventsForCalendarDay,
  isSurfEventLiveNow,
  mapEventRow,
  surfEventOverlapsCalendarMonth,
} from "./events-shared.js";

function getConfig() {
  return window.SURFMATE_SUPABASE;
}

const config = getConfig();

const els = {
  loading: document.getElementById("events-loading"),
  error: document.getElementById("events-error"),
  status: document.getElementById("events-status"),
  search: document.getElementById("events-search"),
  upcomingToggle: document.getElementById("events-upcoming-toggle"),
  filterChips: document.getElementById("events-filter-chips"),
  viewToggle: document.getElementById("events-view-toggle"),
  listSection: document.getElementById("events-list-section"),
  listGrid: document.getElementById("events-list-grid"),
  calendarSection: document.getElementById("events-calendar-section"),
  calendarRoot: document.getElementById("events-calendar"),
  calendarDayList: document.getElementById("events-calendar-day-list"),
  mapSection: document.getElementById("events-map-section"),
  mapStatus: document.getElementById("events-map-status"),
  mapContainer: document.getElementById("events-map"),
};

const EUROPE_CENTER = { lng: 10, lat: 52 };
const DEFAULT_ZOOM = 4;

const state = {
  allEvents: [],
  viewMode: "list",
  searchQuery: "",
  selectedTypes: new Set(),
  upcomingOnly: true,
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth() + 1,
  calendarDay: getDefaultSelectedDayForMonth(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
  ),
};

let map = null;
let mapMarkers = [];
let searchDebounceTimer = null;

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

function isInvertFriendlyLogo(url) {
  const path = String(url).split(/[?#]/)[0].toLowerCase();
  return /\.(png|webp|svg)$/.test(path);
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

function setStatus(message) {
  if (!els.status) return;
  const text = String(message ?? "").trim();
  els.status.textContent = text;
  els.status.hidden = !text;
}

function setMapStatus(message, isError = false) {
  if (!els.mapStatus) return;
  const text = String(message ?? "").trim();
  els.mapStatus.textContent = text;
  els.mapStatus.classList.toggle("is-error", isError);
  els.mapStatus.hidden = !text;
}

function getFilteredEvents() {
  const filtered = filterEvents(state.allEvents, {
    searchQuery: state.searchQuery,
    selectedTypes: state.selectedTypes,
    upcomingOnly: state.upcomingOnly,
  });

  return [...filtered].sort(compareSurfEventsBySchedule);
}

function getCalendarMonthEvents(filteredEvents) {
  return filteredEvents.filter((event) =>
    surfEventOverlapsCalendarMonth(event, state.calendarYear, state.calendarMonth),
  );
}

function showViewSection(mode) {
  if (els.listSection) els.listSection.hidden = mode !== "list";
  if (els.calendarSection) els.calendarSection.hidden = mode !== "calendar";
  if (els.mapSection) els.mapSection.hidden = mode !== "map";

  if (els.viewToggle) {
    for (const button of els.viewToggle.querySelectorAll("[data-view]")) {
      const isActive = button.dataset.view === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    }
  }

  if (mode === "map" && map) {
    requestAnimationFrame(() => {
      map.invalidateSize();
      fitMapToEvents(getFilteredEvents());
    });
  }
}

function buildTypeTagsHtml(eventTypes, selectedTypes) {
  if (!eventTypes?.length) return "";

  const chips = eventTypes
    .map((type) => {
      const label = SURF_EVENT_TYPE_LABELS[type] ?? type;
      const highlighted = selectedTypes.has(type) ? " is-highlighted" : "";
      return `<span class="events-type-tag${highlighted}">${escapeHtml(label)}</span>`;
    })
    .join("");

  return `<div class="events-card-tags">${chips}</div>`;
}

function buildEventCard(event) {
  const dateLabel = formatSurfEventSchedule(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
  );
  const locationLabel = formatEventLocationLabel(event.locationName, event.countryCode);
  const isLive = isSurfEventLiveNow(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
  );

  const coverHtml = event.coverImageUrl
    ? `<div class="events-card-cover"><img src="${escapeHtml(event.coverImageUrl)}" alt="" loading="lazy" decoding="async" /></div>`
    : `<div class="events-card-cover events-card-cover--empty"></div>`;

  const logoHtml = event.logoUrl
    ? `<div class="events-card-logo${isInvertFriendlyLogo(event.logoUrl) ? " is-logo-mono" : ""}"><img src="${escapeHtml(event.logoUrl)}" alt="" loading="lazy" decoding="async" /></div>`
    : "";

  const partnerBadge = event.isPartner
    ? `<span class="events-card-badge events-card-badge--partner">Partner</span>`
    : "";

  const liveBadge = isLive
    ? `<span class="events-card-badge events-card-badge--live">ON</span>`
    : "";

  const liveHeatsLink = hasWebsite(event.liveHeatsUrl)
    ? `<a href="${escapeHtml(event.liveHeatsUrl.trim())}" class="events-card-live-link" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Live heats</a>`
    : "";

  const inner = `
    ${coverHtml}
    ${logoHtml}
    <div class="events-card-body">
      <div class="events-card-badges">${partnerBadge}${liveBadge}</div>
      <h3 class="events-card-title">${escapeHtml(event.title)}</h3>
      <p class="events-card-meta"><i class="bi bi-calendar3" aria-hidden="true"></i> ${escapeHtml(dateLabel)}</p>
      <p class="events-card-meta"><i class="bi bi-geo-alt" aria-hidden="true"></i> ${escapeHtml(locationLabel)}</p>
      ${buildTypeTagsHtml(event.eventTypes, state.selectedTypes)}
      ${liveHeatsLink}
    </div>
  `;

  if (hasWebsite(event.websiteUrl)) {
    return `<a href="${escapeHtml(event.websiteUrl.trim())}" class="events-card" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(event.title)}">${inner}</a>`;
  }

  return `<article class="events-card events-card--static" aria-label="${escapeHtml(event.title)}">${inner}</article>`;
}

function renderList() {
  if (!els.listGrid) return;

  const events = getFilteredEvents();

  if (!events.length) {
    els.listGrid.innerHTML = `<p class="events-empty">No events match your filters.</p>`;
    setStatus("");
    return;
  }

  els.listGrid.innerHTML = events.map(buildEventCard).join("");
  setStatus(`${events.length} event${events.length === 1 ? "" : "s"}`);
}

function isToday(year, month, day) {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
}

function hasEventMarkerForDay(day, monthEvents) {
  const dayKey = `${state.calendarYear}-${String(state.calendarMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  for (const event of monthEvents) {
    if (event.scheduleType === "month_year") {
      if (day === 1) return true;
      continue;
    }

    if (event.scheduleType === "year") {
      if (day === 1 && state.calendarMonth === 1) return true;
      continue;
    }

    if (getSurfEventExactCalendarDayKeys(event).includes(dayKey)) {
      return true;
    }
  }

  return false;
}

function renderCalendar() {
  if (!els.calendarRoot || !els.calendarDayList) return;

  const filtered = getFilteredEvents();
  const monthEvents = getCalendarMonthEvents(filtered);
  const weeks = buildCalendarMonthWeeks(state.calendarYear, state.calendarMonth);
  const monthLabel = formatMonthYearLabel(state.calendarYear, state.calendarMonth);
  const today = new Date();
  const showTodayButton =
    state.calendarYear !== today.getFullYear() || state.calendarMonth !== today.getMonth() + 1;

  const weekdayHeader = CALENDAR_WEEKDAY_LABELS.map(
    (label) => `<div class="events-calendar-weekday">${label}</div>`,
  ).join("");

  const dayCells = weeks
    .flat()
    .map((cell) => {
      if (cell.kind === "empty") {
        return `<div class="events-calendar-cell events-calendar-cell--empty" aria-hidden="true"></div>`;
      }

      const { day } = cell;
      const isSelected = day === state.calendarDay;
      const isTodayCell = isToday(state.calendarYear, state.calendarMonth, day);
      const hasMarker = hasEventMarkerForDay(day, monthEvents);

      const classes = [
        "events-calendar-cell",
        "events-calendar-cell--day",
        isSelected ? "is-selected" : "",
        isTodayCell ? "is-today" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `<button type="button" class="${classes}" data-day="${day}" aria-label="${monthLabel} ${day}" aria-pressed="${isSelected ? "true" : "false"}">
        <span class="events-calendar-day-num">${day}</span>
        ${hasMarker ? '<span class="events-calendar-marker" aria-hidden="true"></span>' : ""}
      </button>`;
    })
    .join("");

  els.calendarRoot.innerHTML = `
    <div class="events-calendar-header">
      <button type="button" class="events-calendar-nav" data-nav="prev" aria-label="Previous month">
        <i class="bi bi-chevron-left" aria-hidden="true"></i>
      </button>
      <h2 class="events-calendar-month">${escapeHtml(monthLabel)}</h2>
      <button type="button" class="events-calendar-nav" data-nav="next" aria-label="Next month">
        <i class="bi bi-chevron-right" aria-hidden="true"></i>
      </button>
    </div>
    ${showTodayButton ? '<div class="events-calendar-today-row"><button type="button" class="events-calendar-today" data-nav="today">Jump to today</button></div>' : ""}
    <div class="events-calendar-weekdays">${weekdayHeader}</div>
    <div class="events-calendar-grid">${dayCells}</div>
  `;

  const groups = groupSurfEventsForCalendarDay(
    monthEvents,
    state.calendarYear,
    state.calendarMonth,
    state.calendarDay,
  );
  const dayEvents = [...groups.exact, ...groups.monthYear, ...groups.yearOnly].sort(
    compareSurfEventsBySchedule,
  );

  if (!dayEvents.length) {
    els.calendarDayList.innerHTML = `<p class="events-empty">No events on this day.</p>`;
  } else {
    els.calendarDayList.innerHTML = dayEvents.map(buildEventCard).join("");
  }

  setStatus(`${monthEvents.length} event${monthEvents.length === 1 ? "" : "s"} this month`);
}

function buildPopupHtml(event) {
  const dateLabel = formatSurfEventSchedule(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
  );
  const locationLabel = formatEventLocationLabel(event.locationName, event.countryCode);
  const link = hasWebsite(event.websiteUrl)
    ? `<div class="events-popup-link"><a href="${escapeHtml(event.websiteUrl.trim())}" target="_blank" rel="noopener noreferrer">Visit website</a></div>`
    : "";

  return `<strong>${escapeHtml(event.title)}</strong>
    <div class="events-popup-subtitle">${escapeHtml(dateLabel)}</div>
    <div class="events-popup-subtitle">${escapeHtml(locationLabel)}</div>
    ${link}`;
}

function clearMapMarkers() {
  for (const marker of mapMarkers) {
    marker.remove();
  }
  mapMarkers = [];
}

function fitMapToEvents(events) {
  if (!map) return;

  const pins = events.filter(
    (event) => typeof event.latitude === "number" && typeof event.longitude === "number",
  );

  if (!pins.length) {
    map.setView([EUROPE_CENTER.lat, EUROPE_CENTER.lng], DEFAULT_ZOOM);
    return;
  }

  if (pins.length === 1) {
    map.setView([pins[0].latitude, pins[0].longitude], 8);
    return;
  }

  const bounds = L.latLngBounds(pins.map((pin) => [pin.latitude, pin.longitude]));
  map.fitBounds(bounds, { padding: [56, 56], maxZoom: 10 });
}

function renderMap() {
  if (!map || !window.L) return;

  clearMapMarkers();
  const events = getFilteredEvents();
  const withCoords = events.filter(
    (event) => typeof event.latitude === "number" && typeof event.longitude === "number",
  );

  for (const event of withCoords) {
    const icon = L.divIcon({
      className: "events-map-marker leaflet-div-icon",
      html: "",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -12],
    });

    const marker = L.marker([event.latitude, event.longitude], { icon })
      .addTo(map)
      .bindPopup(buildPopupHtml(event), { closeButton: true, maxWidth: 280 });

    mapMarkers.push(marker);
  }

  fitMapToEvents(withCoords);
  setMapStatus(withCoords.length ? "" : "No events with map coordinates match your filters.");
  setStatus(`${withCoords.length} event${withCoords.length === 1 ? "" : "s"} on map`);
}

function initMap() {
  if (!window.L || !els.mapContainer) {
    setMapStatus("Map failed to load.", true);
    els.mapContainer?.classList.add("is-hidden");
    return;
  }

  if (map) return;

  map = L.map(els.mapContainer, { zoomControl: true }).setView(
    [EUROPE_CENTER.lat, EUROPE_CENTER.lng],
    DEFAULT_ZOOM,
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  renderMap();
}

function renderFilterChips() {
  if (!els.filterChips) return;

  els.filterChips.innerHTML = SURF_EVENT_TYPES.map((type) => {
    const isActive = state.selectedTypes.has(type);
    const label = SURF_EVENT_TYPE_LABELS[type] ?? type;
    return `<button type="button" class="events-filter-chip${isActive ? " is-active" : ""}" data-type="${escapeHtml(type)}" aria-pressed="${isActive ? "true" : "false"}">${escapeHtml(label)}</button>`;
  }).join("");
}

function renderAll() {
  showViewSection(state.viewMode);

  if (state.viewMode === "list") {
    renderList();
  } else if (state.viewMode === "calendar") {
    renderCalendar();
  } else if (state.viewMode === "map") {
    if (!map) initMap();
    else renderMap();
  }
}

function bindEvents() {
  if (els.search) {
    els.search.addEventListener("input", () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        state.searchQuery = els.search.value;
        renderAll();
      }, 300);
    });
  }

  if (els.upcomingToggle) {
    els.upcomingToggle.addEventListener("change", () => {
      state.upcomingOnly = els.upcomingToggle.checked;
      renderAll();
    });
  }

  if (els.filterChips) {
    els.filterChips.addEventListener("click", (event) => {
      const button = event.target.closest("[data-type]");
      if (!button) return;

      const type = button.dataset.type;
      if (state.selectedTypes.has(type)) {
        state.selectedTypes.delete(type);
      } else {
        state.selectedTypes.add(type);
      }

      renderFilterChips();
      renderAll();
    });
  }

  if (els.viewToggle) {
    els.viewToggle.addEventListener("click", (event) => {
      const button = event.target.closest("[data-view]");
      if (!button) return;

      state.viewMode = button.dataset.view;
      renderAll();
    });
  }

  if (els.calendarRoot) {
    els.calendarRoot.addEventListener("click", (event) => {
      const navButton = event.target.closest("[data-nav]");
      if (navButton) {
        const nav = navButton.dataset.nav;
        if (nav === "prev") {
          if (state.calendarMonth === 1) {
            state.calendarMonth = 12;
            state.calendarYear -= 1;
          } else {
            state.calendarMonth -= 1;
          }
        } else if (nav === "next") {
          if (state.calendarMonth === 12) {
            state.calendarMonth = 1;
            state.calendarYear += 1;
          } else {
            state.calendarMonth += 1;
          }
        } else if (nav === "today") {
          const today = new Date();
          state.calendarYear = today.getFullYear();
          state.calendarMonth = today.getMonth() + 1;
        }

        state.calendarDay = getDefaultSelectedDayForMonth(state.calendarYear, state.calendarMonth);
        renderCalendar();
        return;
      }

      const dayButton = event.target.closest("[data-day]");
      if (!dayButton) return;

      state.calendarDay = Number(dayButton.dataset.day);
      renderCalendar();
    });
  }
}

function normalizeFetchError(error) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Could not load events.";

  if (/load failed|network|failed to fetch|connection was lost/i.test(message)) {
    return "Connection lost — please check your network and refresh.";
  }

  return message || "Could not load events.";
}

async function fetchEvents(maxAttempts = 3) {
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

async function init() {
  renderFilterChips();
  bindEvents();
  setLoading(true);

  try {
    state.allEvents = await fetchEvents();
    setError("");
    renderAll();
  } catch (error) {
    console.error("Events page failed:", error);
    setError(normalizeFetchError(error));
    setStatus("");
  } finally {
    setLoading(false);
  }
}

init();
