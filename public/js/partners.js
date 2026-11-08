function getConfig() {
  return window.SURFMATE_SUPABASE;
}

const config = getConfig();

const els = {
  loadingSection: document.getElementById("partners-loading-section"),
  loading: document.getElementById("partners-loading"),
  pageError: document.getElementById("partners-error"),
  mapStatus: document.getElementById("partners-map-status"),
  mapContainer: document.getElementById("partners-map"),
  localSection: document.getElementById("partners-local-section"),
  marquee: document.getElementById("partners-marquee"),
  eventsSection: document.getElementById("partners-events-section"),
  eventsGrid: document.getElementById("partners-events-grid"),
  productSection: document.getElementById("partners-product-section"),
  productGrid: document.getElementById("partners-product-grid"),
};

const EUROPE_CENTER = { lng: 10, lat: 52 };
const DEFAULT_ZOOM = 4;
const LEAFLET_CSS_URL =
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_URL =
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";

const BUSINESS_TYPE_LABELS = {
  surf_shop: "Surf shop",
  surf_camp: "Surf camp",
  surf_school: "Surf school",
  surf_hostel: "Surf hostel",
  surf_rental: "Surf rental",
  surf_repair: "Surf repair",
  surf_cafe: "Surf cafe",
};

let map = null;
let mapInitStarted = false;
let mapObserver = null;
let leafletPromise = null;

function formatBusinessTypeTags(types) {
  if (!Array.isArray(types) || !types.length) return [];

  return types
    .map((type) => {
      const key = String(type ?? "").trim();
      if (!key) return null;
      return BUSINESS_TYPE_LABELS[key] ?? key.replace(/^surf_/, "").replaceAll("_", " ");
    })
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setLoading(isLoading) {
  if (els.loading) els.loading.hidden = !isLoading;
}

function hideLoadingSection() {
  if (els.loadingSection) els.loadingSection.hidden = true;
}

function setPageError(message) {
  const text = String(message ?? "").trim();
  if (!els.pageError) return;
  els.pageError.textContent = text;
  els.pageError.hidden = !text;
  if (text) {
    setLoading(false);
    if (els.loadingSection) els.loadingSection.hidden = false;
  }
}

function setMapStatus(message, isError = false) {
  if (!els.mapStatus) return;
  const text = String(message ?? "").trim();
  els.mapStatus.textContent = text;
  els.mapStatus.classList.toggle("is-error", isError);
  els.mapStatus.hidden = !text;
}

function showSection(section) {
  if (!section) return;
  section.hidden = false;
  section.removeAttribute("aria-hidden");
}

function hideSection(section) {
  if (!section) return;
  section.hidden = true;
  section.setAttribute("aria-hidden", "true");
}

function hasWebsite(url) {
  return typeof url === "string" && url.trim().length > 0;
}

function wrapWithLink(innerHtml, url, className, ariaLabel) {
  if (!hasWebsite(url)) {
    return `<div class="${className}" aria-label="${escapeHtml(ariaLabel)}">${innerHtml}</div>`;
  }

  return `<a href="${escapeHtml(url.trim())}" class="${className}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(ariaLabel)}">${innerHtml}</a>`;
}

function isInvertFriendlyLogo(url) {
  const path = String(url).split(/[?#]/)[0].toLowerCase();
  return /\.(png|webp|svg)$/.test(path);
}

function buildLogoMarkup(logoUrl, label) {
  if (!logoUrl) {
    return `<span class="partners-logo-fallback">${escapeHtml(label)}</span>`;
  }

  const img = `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(label)}" loading="lazy" decoding="async" />`;

  if (isInvertFriendlyLogo(logoUrl)) {
    return img;
  }

  return `<span class="partners-logo-well">${img}</span>`;
}

function buildLogoTile(partner, fallbackLabel) {
  const label = partner.name?.trim() || fallbackLabel;
  const monoClass = isInvertFriendlyLogo(partner.logo_url) ? " is-logo-mono" : "";
  return wrapWithLink(
    buildLogoMarkup(partner.logo_url, label),
    partner.website_url,
    `partners-logo-tile${monoClass}`,
    label,
  );
}

function shouldShowLogoOnWebsite(partner) {
  return Boolean(partner.logo_url) && !partner.hide_logo_on_website;
}

function renderLocalMarquee(localBusinesses) {
  const withLogo = localBusinesses.filter((partner) => shouldShowLogoOnWebsite(partner));
  if (!withLogo.length || !els.marquee) {
    hideSection(els.localSection);
    return;
  }

  const tiles = withLogo
    .map((partner) => buildLogoTile(partner, "Local partner"))
    .join("");

  if (!tiles) {
    hideSection(els.localSection);
    return;
  }

  els.marquee.innerHTML = `
    <div class="partners-marquee-track">${tiles}</div>
    <div class="partners-marquee-track" aria-hidden="true">${tiles}</div>
  `;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.marquee.classList.add("is-paused");
  }

  showSection(els.localSection);
}

function renderPartnerCards(partners, grid, section, fallbackLabel) {
  if (!grid || !section) return;

  if (!partners.length) {
    hideSection(section);
    grid.innerHTML = "";
    return;
  }

  grid.innerHTML = partners
    .map((partner) => {
      const name = partner.name?.trim() || fallbackLabel;
      const description = partner.description?.trim()
        ? `<p class="partners-partner-card-desc">${escapeHtml(partner.description.trim())}</p>`
        : "";

      const monoClass = isInvertFriendlyLogo(partner.logo_url) ? " is-logo-mono" : "";
      const inner = `
        <div class="partners-partner-card-logo${monoClass}">${buildLogoMarkup(partner.logo_url, name)}</div>
        <h3 class="partners-partner-card-name">${escapeHtml(name)}</h3>
        ${description}
      `;

      return wrapWithLink(inner, partner.website_url, "partners-partner-card", name);
    })
    .join("");

  showSection(section);
}

function buildPopupTagsHtml(tags) {
  if (!tags?.length) return "";

  const chips = tags
    .map((tag) => `<span class="partners-popup-tag">${escapeHtml(tag)}</span>`)
    .join("");

  return `<div class="partners-popup-tags">${chips}</div>`;
}

function buildPopupHtml(title, subtitle, url, tags = []) {
  const safeTitle = escapeHtml(title);
  const tagsHtml = buildPopupTagsHtml(tags);
  const safeSubtitle = subtitle
    ? `<div class="partners-popup-subtitle">${escapeHtml(subtitle)}</div>`
    : "";
  const link = hasWebsite(url)
    ? `<div class="partners-popup-link"><a href="${escapeHtml(url.trim())}" target="_blank" rel="noopener noreferrer">Visit website</a></div>`
    : "";

  return `<strong>${safeTitle}</strong>${tagsHtml}${safeSubtitle}${link}`;
}

function addMapMarker({ lng, lat, type, title, subtitle, url, tags }) {
  if (!map || !window.L || typeof lng !== "number" || typeof lat !== "number") return null;

  const icon = L.divIcon({
    className: `partners-map-marker partners-map-marker--${type} leaflet-div-icon`,
    html: '<span class="partners-map-marker-dot" aria-hidden="true"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });

  return L.marker([lat, lng], { icon })
    .addTo(map)
    .bindPopup(buildPopupHtml(title, subtitle, url, tags), {
      closeButton: true,
      maxWidth: 280,
    });
}

function fitMapToPins(pins) {
  if (!map) return;

  if (!pins.length) {
    map.setView([EUROPE_CENTER.lat, EUROPE_CENTER.lng], DEFAULT_ZOOM);
    return;
  }

  if (pins.length === 1) {
    map.setView([pins[0].lat, pins[0].lng], 8);
    return;
  }

  const bounds = L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng]));
  map.fitBounds(bounds, { padding: [56, 56], maxZoom: 10 });
}

function loadLeafletAssets() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet-css="partners"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS_URL;
      link.crossOrigin = "anonymous";
      link.dataset.leafletCss = "partners";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS_URL;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (window.L) {
        resolve(window.L);
        return;
      }
      reject(new Error("Map failed to load."));
    };
    script.onerror = () => reject(new Error("Map failed to load."));
    document.body.appendChild(script);
  });

  return leafletPromise;
}

function initMap(pins) {
  if (!window.L || !els.mapContainer) {
    setMapStatus("Map failed to load.", true);
    els.mapContainer?.classList.add("is-hidden");
    return;
  }

  map = L.map(els.mapContainer, { zoomControl: true }).setView(
    [EUROPE_CENTER.lat, EUROPE_CENTER.lng],
    DEFAULT_ZOOM,
  );

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  for (const pin of pins) {
    addMapMarker(pin);
  }

  els.mapContainer.classList.add("is-ready");
  requestAnimationFrame(() => {
    map.invalidateSize();
    fitMapToPins(pins);
  });

  setMapStatus("");
}

async function ensureMapReady(pins) {
  if (map || mapInitStarted) return;
  mapInitStarted = true;

  try {
    await loadLeafletAssets();
    initMap(pins);
  } catch (error) {
    console.error("Partners map failed:", error);
    setMapStatus("Map failed to load.", true);
    els.mapContainer?.classList.add("is-hidden");
  }
}

function scheduleMapInit(pins) {
  if (!els.mapContainer) return;

  if (!window.IntersectionObserver) {
    void ensureMapReady(pins);
    return;
  }

  if (mapObserver) {
    mapObserver.disconnect();
  }

  mapObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      mapObserver?.disconnect();
      void ensureMapReady(pins);
    },
    { rootMargin: "240px 0px", threshold: 0.01 },
  );

  mapObserver.observe(els.mapContainer);
}

function collectMapPins(data) {
  const pins = [];

  for (const partner of data.local_businesses ?? []) {
    if (typeof partner.latitude !== "number" || typeof partner.longitude !== "number") continue;
    pins.push({
      lng: partner.longitude,
      lat: partner.latitude,
      type: "local",
      title: partner.name ?? "Local partner",
      subtitle: partner.location_name ?? undefined,
      url: partner.website_url,
      tags: formatBusinessTypeTags(partner.business_types),
    });
  }

  for (const partner of data.event_partners ?? []) {
    for (const event of partner.linked_events ?? []) {
      if (typeof event.latitude !== "number" || typeof event.longitude !== "number") continue;
      pins.push({
        lng: event.longitude,
        lat: event.latitude,
        type: "event",
        title: event.title ?? partner.name ?? "Event",
        subtitle: event.location_name ?? partner.name ?? undefined,
        url: event.website_url ?? partner.website_url,
      });
    }
  }

  return pins;
}

function renderPartnersContent(data) {
  renderLocalMarquee(data.local_businesses ?? []);
  renderPartnerCards(data.event_partners ?? [], els.eventsGrid, els.eventsSection, "Event partner");
  renderPartnerCards(data.product_partners ?? [], els.productGrid, els.productSection, "Partner");
}

function renderPartnersPage(data) {
  renderPartnersContent(data);
  scheduleMapInit(collectMapPins(data));
}

function normalizeFetchError(error) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Could not load partners.";

  if (/load failed|network|failed to fetch|connection was lost/i.test(message)) {
    return "Connection lost — please check your network and refresh.";
  }

  return message || "Could not load partners.";
}

async function fetchPartners(maxAttempts = 2) {
  if (!config?.url || !config?.anonKey) {
    throw new Error("Supabase is not configured.");
  }

  const url = `${config.url.replace(/\/+$/, "")}/rest/v1/rpc/get_website_partners`;
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
      if (!data || typeof data !== "object") {
        throw new Error("Invalid partners response.");
      }

      return data;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
      }
    }
  }

  throw lastError ?? new Error("Could not load partners.");
}

async function init() {
  setLoading(true);
  setPageError("");

  try {
    const data = await fetchPartners();
    hideLoadingSection();
    renderPartnersPage(data);
  } catch (error) {
    console.error("Partners page failed:", error);
    setPageError(normalizeFetchError(error));
    setMapStatus("", false);
    els.mapContainer?.classList.add("is-hidden");
    hideSection(els.localSection);
    hideSection(els.eventsSection);
    hideSection(els.productSection);
  }
}

init();
