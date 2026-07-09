import { buildEventCard, buildMobileStripCard } from "./events-cards.js";
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
  readEventsPageUrlState,
  buildEventsPageSearchParams,
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
  filterChips: document.getElementById("events-filter-chips"),
  viewToggle: document.getElementById("events-view-toggle"),
  splitLayout: document.getElementById("events-split-layout"),
  listSection: document.getElementById("events-list-section"),
  listGrid: document.getElementById("events-list-grid"),
  calendarSection: document.getElementById("events-calendar-section"),
  calendarRoot: document.getElementById("events-calendar"),
  calendarDayList: document.getElementById("events-calendar-day-list"),
  calendarSentinel: document.getElementById("events-calendar-sentinel"),
  listSentinel: document.getElementById("events-list-sentinel"),
  splitMap: document.querySelector(".events-split-map"),
  mapFullscreenChrome: document.querySelector(".events-map-fullscreen-chrome"),
  mapStatus: document.getElementById("events-map-status"),
  mapContainer: document.getElementById("events-map"),
  mobileStrip: document.getElementById("events-mobile-strip"),
  mobileStripLabel: document.getElementById("events-mobile-strip-label"),
  mobileStripScroll: document.getElementById("events-mobile-strip-scroll"),
  mapBack: document.getElementById("events-map-back"),
  mapExpand: document.getElementById("events-map-expand"),
  mapFilterChips: document.getElementById("events-map-filter-chips"),
};

const EUROPE_CENTER = { lng: 10, lat: 52 };
const DEFAULT_ZOOM = 4;
const LIST_BATCH_SIZE = 12;
const MAP_MARKER_BATCH_SIZE = 20;
const MOBILE_STRIP_LIMIT = 24;
const MOBILE_LAYOUT_MQ = typeof window !== "undefined"
  ? window.matchMedia("(max-width: 768px)")
  : null;

const state = {
  allEvents: [],
  viewMode: "list",
  searchQuery: "",
  selectedTypes: new Set(),
  listVisibleCount: LIST_BATCH_SIZE,
  calendarDayVisibleCount: LIST_BATCH_SIZE,
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth() + 1,
  calendarDay: getDefaultSelectedDayForMonth(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
  ),
  mapBoundsFilterEnabled: false,
  selectedStripEventId: null,
  mobileMapMode: false,
  mapFullscreen: false,
  mapFullscreenScrollY: 0,
};

let map = null;
let mapMarkers = [];
let markerByEventId = new Map();
let mapRenderToken = 0;
let mapViewportDebounceTimer = null;
let mapVisibilityObserver = null;
let searchDebounceTimer = null;
let listLoadObserver = null;
let calendarLoadObserver = null;
let calendarMapHeightObserver = null;
let mobileMapHeightObserver = null;

function shouldSyncCalendarMapHeight() {
  return (
    !isMobileLayout() &&
    state.viewMode === "calendar" &&
    Boolean(els.splitLayout?.classList.contains("is-calendar-view")) &&
    Boolean(els.calendarRoot) &&
    Boolean(els.splitMap) &&
    Boolean(els.mapContainer)
  );
}

function clearCalendarMapHeight() {
  els.splitMap?.style.removeProperty("height");
  els.splitMap?.style.removeProperty("min-height");
  els.mapContainer?.style.removeProperty("height");
}

function shouldSyncMobileMapHeight() {
  return (
    isMobileLayout() &&
    !state.mapFullscreen &&
    state.viewMode === "list" &&
    Boolean(els.splitMap) &&
    Boolean(els.mapContainer)
  );
}

function getMobileMapStackHeight() {
  const hero = document.querySelector(".events-hero");
  const toolbarSection = document.querySelector(".events-toolbar-section");
  const splitSection = document.querySelector(".events-split-section");
  let height = 0;

  if (hero) height += hero.getBoundingClientRect().height;
  if (toolbarSection) height += toolbarSection.getBoundingClientRect().height;
  if (splitSection) {
    const styles = window.getComputedStyle(splitSection);
    height += parseFloat(styles.paddingTop) || 0;
  }

  return height;
}

function syncMobileMapHeight() {
  if (!shouldSyncMobileMapHeight()) {
    els.splitMap?.style.removeProperty("height");
    els.splitMap?.style.removeProperty("min-height");
    if (!shouldSyncCalendarMapHeight()) {
      els.mapContainer?.style.removeProperty("height");
    }
    return;
  }

  const height = Math.max(
    280,
    Math.round(window.innerHeight - getTopChromeHeight() - getMobileMapStackHeight()),
  );

  els.splitMap.style.removeProperty("min-height");
  els.splitMap.style.height = `${height}px`;
  els.mapContainer.style.height = `${height}px`;
}

function bindMobileMapHeightObserver() {
  if (!window.ResizeObserver) return;

  mobileMapHeightObserver?.disconnect();

  if (!isMobileLayout() || state.viewMode !== "list") return;

  const targets = [
    document.querySelector(".events-hero"),
    document.querySelector(".events-toolbar-section"),
  ].filter(Boolean);

  if (!targets.length) return;

  mobileMapHeightObserver = new ResizeObserver(() => {
    syncMobileMapHeight();
    map?.invalidateSize();
  });

  for (const target of targets) {
    mobileMapHeightObserver.observe(target);
  }
}

function syncCalendarMapHeight() {
  if (!shouldSyncCalendarMapHeight()) {
    clearCalendarMapHeight();
    return;
  }

  const height = Math.round(els.calendarRoot.getBoundingClientRect().height);
  if (!height) return;

  els.splitMap.style.height = `${height}px`;
  els.mapContainer.style.height = `${height}px`;
}

function bindCalendarMapHeightObserver() {
  if (!window.ResizeObserver || !els.calendarRoot) return;

  calendarMapHeightObserver?.disconnect();
  calendarMapHeightObserver = new ResizeObserver(() => syncCalendarMapHeight());
  calendarMapHeightObserver.observe(els.calendarRoot);
}

const STRIP_DRAG_THRESHOLD_PX = 10;
const stripInteraction = {
  pointerId: null,
  startX: 0,
  startY: 0,
  dragged: false,
  scrolled: false,
};
let stripScrollResetTimer = null;

const filterChipsHome = {
  parent: null,
  nextSibling: null,
};

function mountFullscreenFilterChips() {
  if (!els.filterChips || !els.mapFullscreenChrome) return;

  filterChipsHome.parent = els.filterChips.parentElement;
  filterChipsHome.nextSibling = els.filterChips.nextElementSibling;
  els.mapFullscreenChrome.appendChild(els.filterChips);
}

function restoreFullscreenFilterChips() {
  if (!els.filterChips || !filterChipsHome.parent) return;

  filterChipsHome.parent.insertBefore(els.filterChips, filterChipsHome.nextSibling);
  filterChipsHome.parent = null;
  filterChipsHome.nextSibling = null;
}

function getHeaderElement() {
  return document.querySelector(".header");
}

function getDownloadBannerElement() {
  return document.querySelector(".download-banner");
}

function getTopChromeHeight() {
  const header = getHeaderElement();
  const banner = getDownloadBannerElement();
  let height = header?.offsetHeight ?? 0;

  if (banner?.classList.contains("is-visible")) {
    const bannerStyle = window.getComputedStyle(banner);
    if (bannerStyle.display !== "none") {
      height += banner.offsetHeight;
    }
  }

  return height;
}

function syncTopChromeCssVar() {
  document.documentElement.style.setProperty(
    "--events-top-chrome",
    `${getTopChromeHeight()}px`,
  );
}

function canEnterMapFullscreen() {
  return (
    isMobileLayout() &&
    state.viewMode === "list" &&
    !state.mapFullscreen &&
    !els.splitLayout?.classList.contains("is-calendar-view")
  );
}

function shouldShowMapExpand() {
  return canEnterMapFullscreen();
}

function syncMapFullscreenControls() {
  if (els.mapBack) els.mapBack.hidden = !state.mapFullscreen;
  if (els.mapExpand) els.mapExpand.hidden = !shouldShowMapExpand();
  if (els.mapFilterChips) els.mapFilterChips.hidden = true;
}

function enterMapFullscreen() {
  if (!canEnterMapFullscreen()) return;

  state.mapFullscreenScrollY = window.scrollY;
  state.mapFullscreen = true;
  document.body.classList.add("is-map-fullscreen");
  document.body.style.overflow = "hidden";
  els.splitMap?.style.removeProperty("height");
  els.mapContainer?.style.removeProperty("height");
  els.mapContainer?.style.removeProperty("min-height");
  mountFullscreenFilterChips();
  syncTopChromeCssVar();
  syncMapFullscreenControls();

  refreshMapSize();
  renderMobileStrip();
  updateMapAreaStatus();
}

function exitMapFullscreen() {
  if (!state.mapFullscreen) return;

  const scrollY = state.mapFullscreenScrollY;
  state.mapFullscreen = false;
  document.body.classList.remove("is-map-fullscreen");
  document.body.style.overflow = "";
  restoreFullscreenFilterChips();
  syncMapFullscreenControls();
  setMapStatus("");

  refreshMapSize();

  requestAnimationFrame(() => {
    window.scrollTo(0, scrollY);
  });
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

function isMobileLayout() {
  return Boolean(MOBILE_LAYOUT_MQ?.matches);
}

function distanceSquaredToMapCenter(event, center) {
  const dLat = event.latitude - center.lat;
  const dLng = event.longitude - center.lng;
  return dLat * dLat + dLng * dLng;
}

function getMobileStripSourceEvents() {
  if (state.viewMode === "calendar") {
    return getSelectedCalendarDayEvents(getBaseFilteredEvents());
  }

  return getBaseFilteredEvents();
}

function getMobileStripEvents() {
  let events = getMobileStripSourceEvents().filter(eventHasMapCoordinates);

  if (map) {
    const bounds = map.getBounds();
    events = events.filter((event) => isEventInMapBounds(event, bounds));
    const center = map.getCenter();
    events = [...events].sort(
      (left, right) =>
        distanceSquaredToMapCenter(left, center) - distanceSquaredToMapCenter(right, center),
    );
  }

  return events.slice(0, MOBILE_STRIP_LIMIT);
}

function updateMobileLayoutMode() {
  const mobile = isMobileLayout();
  state.mobileMapMode = mobile;

  els.splitLayout?.classList.toggle("is-mobile-map", mobile);
  if (els.mobileStrip) els.mobileStrip.hidden = !mobile;

  syncTopChromeCssVar();

  if (mobile) {
    if (mapVisibilityObserver) {
      mapVisibilityObserver.disconnect();
      mapVisibilityObserver = null;
    }
    setMapBoundsFilterEnabled(true);

    if (state.viewMode === "calendar") {
      exitMapFullscreen();
    }

    syncMapFullscreenControls();
    clearCalendarMapHeight();
    bindMobileMapHeightObserver();
    syncMobileMapHeight();
    return;
  }

  mobileMapHeightObserver?.disconnect();
  mobileMapHeightObserver = null;
  exitMapFullscreen();
  if (state.viewMode === "calendar") {
    syncCalendarMapHeight();
  } else {
    clearCalendarMapHeight();
  }
  state.selectedStripEventId = null;
  setMapBoundsFilterEnabled(false);
  setupMapBoundsFilter();
}

function renderMobileStrip() {
  if (!isMobileLayout() || !els.mobileStripScroll) return;

  const events = getMobileStripEvents();
  const totalInView = events.length;

  if (els.mobileStripLabel) {
    if (!totalInView) {
      els.mobileStripLabel.textContent = "No events in this map area";
    } else if (state.viewMode === "calendar") {
      els.mobileStripLabel.textContent = `${totalInView} on this day nearby`;
    } else {
      els.mobileStripLabel.textContent = `${totalInView} nearby`;
    }
  }

  if (!totalInView) {
    els.mobileStripScroll.innerHTML =
      '<p class="events-mobile-strip-empty">Pan or zoom the map to find events.</p>';
    if (state.mapFullscreen) {
      updateMapAreaStatus();
    } else {
      setMapStatus("");
    }
    return;
  }

  els.mobileStripScroll.innerHTML = events
    .map((event) =>
      buildMobileStripCard(event, {
        selected: String(event.id) === String(state.selectedStripEventId),
      }),
    )
    .join("");

  if (state.selectedStripEventId) {
    scrollStripToEvent(state.selectedStripEventId);
  }

  if (state.mapFullscreen) {
    updateMapAreaStatus();
  } else {
    setMapStatus("");
  }
}

function scrollStripToEvent(eventId) {
  if (!els.mobileStripScroll || !eventId) return;

  const card = els.mobileStripScroll.querySelector(`[data-event-id="${CSS.escape(String(eventId))}"]`);
  card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
}

function focusEventOnMap(eventId) {
  const event = state.allEvents.find((item) => String(item.id) === String(eventId));
  if (!event || !map || !eventHasMapCoordinates(event)) return;

  state.selectedStripEventId = event.id;
  const marker = markerByEventId.get(event.id);

  map.flyTo([event.latitude, event.longitude], Math.max(map.getZoom(), 9), {
    animate: true,
    duration: 0.45,
  });

  if (marker) {
    window.setTimeout(() => marker.openPopup(), 320);
  }

  renderMobileStrip();
}

function renderEventCard(event) {
  return buildEventCard(event, { selectedTypes: state.selectedTypes });
}

function resetPageStateToDefaults() {
  state.searchQuery = "";
  state.selectedTypes = new Set();
  state.viewMode = "list";
  if (els.search) els.search.value = "";
}

function applyUrlState() {
  const urlState = readEventsPageUrlState(window.location.search);

  if (urlState.selectedTypes.size > 0) {
    state.selectedTypes = new Set(urlState.selectedTypes);
  }

  if (urlState.searchQuery) {
    state.searchQuery = urlState.searchQuery;
    if (els.search) els.search.value = urlState.searchQuery;
  }

  state.viewMode = urlState.viewMode;
}

function syncUrlFromState() {
  if (typeof window === "undefined" || !window.history?.replaceState) return;

  const params = buildEventsPageSearchParams(state);
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  const currentUrl = `${window.location.pathname}${window.location.search}`;

  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
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
  const showOnMap = !isMobileLayout() || state.mapFullscreen;

  els.mapStatus.textContent = text;
  els.mapStatus.classList.toggle("is-error", isError);
  els.mapStatus.hidden = !text || !showOnMap;
}

function resetListPagination() {
  state.listVisibleCount = LIST_BATCH_SIZE;
}

function resetCalendarDayPagination() {
  state.calendarDayVisibleCount = LIST_BATCH_SIZE;
}

function formatCountStatus(visible, total, noun = "event") {
  const plural = total === 1 ? noun : `${noun}s`;
  if (visible < total) {
    return `Showing ${visible} of ${total} ${plural}`;
  }
  return `${total} ${plural}`;
}

function updateLoadSentinel(sentinel, hasMore) {
  if (!sentinel) return;

  sentinel.hidden = !hasMore;
  sentinel.innerHTML = hasMore
    ? `<span class="events-load-more-inner"><span class="events-spinner" aria-hidden="true"></span>Loading more events…</span>`
    : "";
}

function bindInfiniteScroll(sentinel, getHasMore, onLoadMore, currentObserver) {
  if (currentObserver?.disconnect) {
    currentObserver.disconnect();
  }

  if (!sentinel || !window.IntersectionObserver) {
    return null;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && getHasMore()) {
        onLoadMore();
      }
    },
    { root: null, rootMargin: "280px 0px" },
  );

  observer.observe(sentinel);
  return observer;
}

function eventHasMapCoordinates(event) {
  return typeof event.latitude === "number" && typeof event.longitude === "number";
}

function isEventInMapBounds(event, bounds) {
  if (!eventHasMapCoordinates(event)) return false;
  return bounds.contains([event.latitude, event.longitude]);
}

function getBaseFilteredEvents() {
  const filtered = filterEvents(state.allEvents, {
    searchQuery: state.searchQuery,
    selectedTypes: state.selectedTypes,
    upcomingOnly: true,
  });

  return [...filtered].sort(compareSurfEventsBySchedule);
}

function isMapBoundsFilterActive() {
  return state.mapBoundsFilterEnabled && state.viewMode !== "calendar" && Boolean(map);
}

function getFilteredEvents() {
  const events = getBaseFilteredEvents();

  if (!isMapBoundsFilterActive()) {
    return events;
  }

  const bounds = map.getBounds();
  return events.filter((event) => isEventInMapBounds(event, bounds));
}

function updateMapAreaStatus() {
  if (!isMapBoundsFilterActive()) return;

  const inView = getFilteredEvents().length;
  if (inView === 0) {
    setMapStatus("No events in this map area.");
    return;
  }

  setMapStatus(`${inView} event${inView === 1 ? "" : "s"} in this map area`);
}

function setMapBoundsFilterEnabled(enabled) {
  if (enabled && state.viewMode === "calendar") return;

  const next = Boolean(enabled);
  if (state.mapBoundsFilterEnabled === next) return;

  state.mapBoundsFilterEnabled = next;
  els.splitLayout?.classList.toggle("is-map-bounds-filter", next);
  resetListPagination();
  resetCalendarDayPagination();
  renderContentViews(true);
  updateMapAreaStatus();
}

function onMapViewportChanged() {
  if (!isMapBoundsFilterActive()) return;

  clearTimeout(mapViewportDebounceTimer);
  mapViewportDebounceTimer = setTimeout(() => {
    if (!isMobileLayout()) {
      resetListPagination();
      resetCalendarDayPagination();
    }
    renderContentViews(false);
    updateMapAreaStatus();
    renderMobileStrip();
  }, 180);
}

function setupMapBoundsFilter() {
  if (!els.splitMap || !window.IntersectionObserver || isMobileLayout()) return;

  if (mapVisibilityObserver) {
    mapVisibilityObserver.disconnect();
  }

  mapVisibilityObserver = new IntersectionObserver(
    (entries) => {
      const visible = Boolean(entries[0]?.isIntersecting);
      setMapBoundsFilterEnabled(visible && state.viewMode !== "calendar");
    },
    { threshold: 0.2 },
  );

  mapVisibilityObserver.observe(els.splitMap);
}

function bindMapViewportEvents() {
  if (!map) return;

  map.on("moveend", onMapViewportChanged);
  map.on("zoomend", onMapViewportChanged);
}

function renderContentViews(resetPagination = true) {
  if (state.viewMode === "list") {
    renderList(resetPagination);
  } else {
    renderCalendar(resetPagination);
  }
}

function getCalendarMonthEvents(filteredEvents) {
  return filteredEvents.filter((event) =>
    surfEventOverlapsCalendarMonth(event, state.calendarYear, state.calendarMonth),
  );
}

function getSelectedCalendarDayEvents(filteredEvents = getBaseFilteredEvents()) {
  const monthEvents = getCalendarMonthEvents(filteredEvents);
  const groups = groupSurfEventsForCalendarDay(
    monthEvents,
    state.calendarYear,
    state.calendarMonth,
    state.calendarDay,
  );

  return [...groups.exact, ...groups.monthYear, ...groups.yearOnly];
}

function getMapEvents() {
  if (state.viewMode === "calendar") {
    return getSelectedCalendarDayEvents();
  }

  return getBaseFilteredEvents();
}

function showViewSection(mode) {
  if (els.listSection) els.listSection.hidden = mode !== "list";
  if (els.calendarSection) els.calendarSection.hidden = mode !== "calendar";
  els.splitLayout?.classList.toggle("is-calendar-view", mode === "calendar");

  if (mode === "calendar" && state.mapFullscreen) {
    exitMapFullscreen();
  }

  if (mode === "calendar") {
    setMapBoundsFilterEnabled(false);
  }

  syncMapFullscreenControls();

  if (mode === "calendar") {
    mobileMapHeightObserver?.disconnect();
    mobileMapHeightObserver = null;
  } else if (isMobileLayout()) {
    bindMobileMapHeightObserver();
  }

  if (els.viewToggle) {
    for (const button of els.viewToggle.querySelectorAll("[data-view]")) {
      const isActive = button.dataset.view === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    }
  }

  refreshMapSize();
}

function refreshMapSize() {
  if (!map) return;

  syncCalendarMapHeight();
  syncMobileMapHeight();

  requestAnimationFrame(() => {
    map.invalidateSize();
    if (state.viewMode === "calendar") {
      fitMapToCalendarSelection();
      return;
    }
    if (isMapBoundsFilterActive()) return;

    const withCoords = getMapEvents().filter(eventHasMapCoordinates);
    fitMapToEvents(withCoords);
  });
}

function renderList(resetPagination = true) {
  if (!els.listGrid) return;

  if (isMobileLayout()) {
    els.listGrid.innerHTML = "";
    renderMobileStrip();
    setStatus("");
    setMapStatus("");
    return;
  }

  if (resetPagination) {
    resetListPagination();
  }

  const events = getFilteredEvents();

  if (!events.length) {
    const emptyMessage = state.mapBoundsFilterEnabled
      ? "No events in the current map view."
      : "No events match your filters.";
    els.listGrid.innerHTML = `<p class="events-empty">${emptyMessage}</p>`;
    updateLoadSentinel(els.listSentinel, false);
    setStatus(state.mapBoundsFilterEnabled ? "No events in map view" : "");
    return;
  }

  const visible = events.slice(0, state.listVisibleCount);
  els.listGrid.innerHTML = visible.map(renderEventCard).join("");

  const hasMore = visible.length < events.length;
  updateLoadSentinel(els.listSentinel, hasMore);

  const suffix = state.mapBoundsFilterEnabled ? " in map view" : "";
  setStatus(`${formatCountStatus(visible.length, events.length)}${suffix}`);

  listLoadObserver = bindInfiniteScroll(
    els.listSentinel,
    () => state.listVisibleCount < getFilteredEvents().length,
    () => {
      state.listVisibleCount = Math.min(
        state.listVisibleCount + LIST_BATCH_SIZE,
        getFilteredEvents().length,
      );
      renderList(false);
    },
    listLoadObserver,
  );
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

function renderCalendar(resetDayPagination = true) {
  if (!els.calendarRoot || !els.calendarDayList) return;

  if (resetDayPagination) {
    resetCalendarDayPagination();
  }

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

  const dayEvents = getSelectedCalendarDayEvents(monthEvents).sort(compareSurfEventsBySchedule);

  if (isMobileLayout()) {
    els.calendarDayList.innerHTML = "";
    renderMobileStrip();
    setStatus(`${monthEvents.length} event${monthEvents.length === 1 ? "" : "s"} this month`);
    if (state.viewMode === "calendar") {
      renderMap();
    }
    return;
  }

  if (!dayEvents.length) {
    const emptyMessage = isMapBoundsFilterActive()
      ? "No events in the current map view."
      : "No events on this day.";
    els.calendarDayList.innerHTML = `<p class="events-empty">${emptyMessage}</p>`;
    updateLoadSentinel(els.calendarSentinel, false);
  } else {
    const visibleDayEvents = dayEvents.slice(0, state.calendarDayVisibleCount);
    els.calendarDayList.innerHTML = visibleDayEvents.map(renderEventCard).join("");

    const hasMoreDayEvents = visibleDayEvents.length < dayEvents.length;
    updateLoadSentinel(els.calendarSentinel, hasMoreDayEvents);

    calendarLoadObserver = bindInfiniteScroll(
      els.calendarSentinel,
      () => state.calendarDayVisibleCount < dayEvents.length,
      () => {
        state.calendarDayVisibleCount = Math.min(
          state.calendarDayVisibleCount + LIST_BATCH_SIZE,
          dayEvents.length,
        );
        renderCalendar(false);
      },
      calendarLoadObserver,
    );
  }

  setStatus(`${monthEvents.length} event${monthEvents.length === 1 ? "" : "s"} this month`);

  if (state.viewMode === "calendar") {
    syncCalendarMapHeight();
    renderMap();
  }
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
  markerByEventId.clear();
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

function fitMapToCalendarSelection(events = getMapEvents()) {
  if (!map || state.viewMode !== "calendar") return;

  const withCoords = events.filter(eventHasMapCoordinates);

  requestAnimationFrame(() => {
    map.invalidateSize({ animate: false });
    requestAnimationFrame(() => fitMapToEvents(withCoords));
  });
}

function getEventMapMarkerMetrics() {
  if (isMobileLayout()) {
    return { size: 44, anchor: 22, popupOffset: -18 };
  }

  return { size: 18, anchor: 9, popupOffset: -12 };
}

function addMapMarker(event) {
  const isLive = isSurfEventLiveNow(
    event.scheduleType,
    event.startsAt,
    event.endsAt,
    event.eventYear,
    event.eventMonth,
  );

  const metrics = getEventMapMarkerMetrics();

  const icon = L.divIcon({
    className: `events-map-marker${isLive ? " events-map-marker--on" : ""}${isMobileLayout() ? " events-map-marker--touch" : ""} leaflet-div-icon`,
    html: '<span class="events-map-marker-dot" aria-hidden="true"></span>',
    iconSize: [metrics.size, metrics.size],
    iconAnchor: [metrics.anchor, metrics.anchor],
    popupAnchor: [0, metrics.popupOffset],
  });

  const marker = L.marker([event.latitude, event.longitude], { icon })
    .addTo(map)
    .bindPopup(buildPopupHtml(event), { closeButton: true, maxWidth: 280 });

  marker.on("click", () => {
    state.selectedStripEventId = event.id;
    renderMobileStrip();
  });

  mapMarkers.push(marker);
  markerByEventId.set(event.id, marker);
}

async function renderMap() {
  if (!map || !window.L) return;

  clearMapMarkers();
  const token = ++mapRenderToken;
  const events = getMapEvents();
  const withCoords = events.filter(eventHasMapCoordinates);

  for (let index = 0; index < withCoords.length; index += MAP_MARKER_BATCH_SIZE) {
    if (token !== mapRenderToken) return;

    const batch = withCoords.slice(index, index + MAP_MARKER_BATCH_SIZE);
    for (const event of batch) {
      addMapMarker(event);
    }

    if (index + MAP_MARKER_BATCH_SIZE < withCoords.length) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }

  if (token !== mapRenderToken) return;

  renderMobileStrip();

  if (state.viewMode === "calendar") {
    syncCalendarMapHeight();
    fitMapToCalendarSelection(withCoords);
    const noun = withCoords.length === 1 ? "event" : "events";
    setMapStatus(
      withCoords.length
        ? `${withCoords.length} ${noun} on this day`
        : "No events with map coordinates on this day.",
    );
    return;
  }

  if (!isMapBoundsFilterActive()) {
    fitMapToEvents(withCoords);
    setMapStatus(withCoords.length ? "" : "No events with map coordinates match your filters.");
  } else {
    updateMapAreaStatus();
  }
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

  bindMapViewportEvents();
  if (isMobileLayout()) {
    setMapBoundsFilterEnabled(true);
  } else {
    setupMapBoundsFilter();
  }
  renderMap();
}

function buildFilterChipsHtml() {
  return SURF_EVENT_TYPES.map((type) => {
    const isActive = state.selectedTypes.has(type);
    const label = SURF_EVENT_TYPE_LABELS[type] ?? type;
    return `<button type="button" class="events-filter-chip${isActive ? " is-active" : ""}" data-type="${escapeHtml(type)}" aria-pressed="${isActive ? "true" : "false"}">${escapeHtml(label)}</button>`;
  }).join("");
}

function renderFilterChips() {
  const html = buildFilterChipsHtml();
  if (els.filterChips) els.filterChips.innerHTML = html;
  if (els.mapFilterChips) els.mapFilterChips.innerHTML = html;
}

function handleFilterChipClick(event) {
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
}

function renderAll() {
  showViewSection(state.viewMode);
  renderContentViews(true);
  syncUrlFromState();

  if (!map) initMap();
  else renderMap();
}

function bindMobileStripInteractions() {
  if (!els.mobileStripScroll) return;

  els.mobileStripScroll.addEventListener(
    "pointerdown",
    (event) => {
      stripInteraction.pointerId = event.pointerId;
      stripInteraction.startX = event.clientX;
      stripInteraction.startY = event.clientY;
      stripInteraction.dragged = false;
      stripInteraction.scrolled = false;
    },
    { passive: true },
  );

  els.mobileStripScroll.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerId !== stripInteraction.pointerId) return;

      const deltaX = Math.abs(event.clientX - stripInteraction.startX);
      const deltaY = Math.abs(event.clientY - stripInteraction.startY);
      if (deltaX > STRIP_DRAG_THRESHOLD_PX || deltaY > STRIP_DRAG_THRESHOLD_PX) {
        stripInteraction.dragged = true;
      }
    },
    { passive: true },
  );

  const clearStripPointer = () => {
    stripInteraction.pointerId = null;
  };

  els.mobileStripScroll.addEventListener("pointerup", clearStripPointer, { passive: true });
  els.mobileStripScroll.addEventListener("pointercancel", () => {
    stripInteraction.dragged = true;
    clearStripPointer();
  }, { passive: true });

  els.mobileStripScroll.addEventListener(
    "scroll",
    () => {
      stripInteraction.scrolled = true;
      clearTimeout(stripScrollResetTimer);
      stripScrollResetTimer = setTimeout(() => {
        stripInteraction.scrolled = false;
      }, 120);
    },
    { passive: true },
  );

  els.mobileStripScroll.addEventListener("click", (event) => {
    if (event.target.closest("[data-strip-link]")) return;

    if (stripInteraction.dragged || stripInteraction.scrolled) {
      stripInteraction.dragged = false;
      return;
    }

    const card = event.target.closest("[data-event-id]");
    if (!card) return;

    focusEventOnMap(card.dataset.eventId);
  });

  els.mobileStripScroll.addEventListener("keydown", (event) => {
    const card = event.target.closest("[data-event-id]");
    if (!card) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      focusEventOnMap(card.dataset.eventId);
    }
  });
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

  if (els.filterChips) {
    els.filterChips.addEventListener("click", handleFilterChipClick);
  }

  if (els.mapFilterChips) {
    els.mapFilterChips.addEventListener("click", handleFilterChipClick);
  }

  window.addEventListener("popstate", () => {
    resetPageStateToDefaults();
    applyUrlState();
    renderFilterChips();
    renderAll();
  });

  if (els.viewToggle) {
    els.viewToggle.addEventListener("click", (event) => {
      const button = event.target.closest("[data-view]");
      if (!button) return;

      state.viewMode = button.dataset.view;
      renderAll();
    });
  }

  bindMobileStripInteractions();

  if (els.mapBack) {
    els.mapBack.addEventListener("click", () => exitMapFullscreen());
  }

  if (els.mapExpand) {
    els.mapExpand.addEventListener("click", () => enterMapFullscreen());
  }

  window.addEventListener("resize", () => {
    syncTopChromeCssVar();
    if (!isMobileLayout()) {
      exitMapFullscreen();
    }
    refreshMapSize();
    syncMapFullscreenControls();
  });

  MOBILE_LAYOUT_MQ?.addEventListener("change", () => {
    updateMobileLayoutMode();
    renderAll();
  });

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
        renderCalendar(true);
        return;
      }

      const dayButton = event.target.closest("[data-day]");
      if (!dayButton) return;

      state.calendarDay = Number(dayButton.dataset.day);
      renderCalendar(true);
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
  applyUrlState();
  renderFilterChips();
  bindEvents();
  updateMobileLayoutMode();
  syncMapFullscreenControls();

  bindCalendarMapHeightObserver();
  bindMobileMapHeightObserver();

  if (els.splitLayout && window.ResizeObserver) {
    const observer = new ResizeObserver(() => refreshMapSize());
    observer.observe(els.splitLayout);
  }

  if (window.ResizeObserver) {
    const topChromeObserver = new ResizeObserver(() => {
      syncTopChromeCssVar();
      syncMobileMapHeight();
      map?.invalidateSize();
    });
    const header = getHeaderElement();
    const banner = getDownloadBannerElement();
    if (header) topChromeObserver.observe(header);
    if (banner) topChromeObserver.observe(banner);
  }

  window.setTimeout(syncTopChromeCssVar, 1200);

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
    refreshMapSize();
  }
}

init();
