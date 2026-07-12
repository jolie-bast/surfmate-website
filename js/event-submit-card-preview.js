import { buildEventCard } from "./events-cards.js";

export function createEventSubmitCardPreview(mountEl, asideEl) {
  if (!mountEl) {
    return { update() {}, syncVisibility() {} };
  }

  const grid = document.createElement("div");
  grid.className = "event-submit-preview-grid";
  grid.setAttribute("role", "presentation");
  mountEl.appendChild(grid);

  function syncVisibility(isVisible) {
    if (!asideEl) return;
    asideEl.hidden = !isVisible;
  }

  function update(snapshot = {}) {
    const title = String(snapshot.title ?? "").trim();
    const locationName = String(snapshot.locationName ?? "").trim();
    const isPlaceholder = !title && !locationName;

    const event = {
      id: "submit-preview",
      title: title || "Your event name",
      scheduleType: snapshot.scheduleType || "exact",
      startsAt: snapshot.startsAt || null,
      endsAt: snapshot.endsAt || null,
      locationName: locationName || "Location",
      countryCode: snapshot.countryCode || null,
      eventTypes: Array.isArray(snapshot.eventTypes) ? snapshot.eventTypes : [],
      coverImageUrl: snapshot.coverImageUrl || null,
      logoUrl: snapshot.logoUrl || null,
      websiteUrl: null,
      isPartner: Boolean(snapshot.isPartner),
      liveHeatsUrl: null,
    };

    grid.innerHTML = buildEventCard(event, {
      selectedTypes: new Set(event.eventTypes),
      omitEmptyCover: true,
    });

    const card = grid.querySelector(".events-card");
    if (!card) return;

    card.classList.add("events-card--preview");
    card.classList.toggle("is-placeholder", isPlaceholder);

    if (card instanceof HTMLAnchorElement) {
      card.removeAttribute("href");
      card.setAttribute("aria-disabled", "true");
      card.tabIndex = -1;
    }
  }

  return { update, syncVisibility };
}
