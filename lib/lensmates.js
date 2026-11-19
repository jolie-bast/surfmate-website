export function lensmateKindLabel(kind) {
  if (kind === "both") return "Photographer & Videographer";
  if (!kind) return "Lensmate";
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

// Shorter variant for tight spaces like the card image badge.
export function lensmateKindBadge(kind) {
  if (kind === "both") return "Photo & video";
  return lensmateKindLabel(kind);
}

export function formatAvailableFor(value) {
  return value.replace(/_/g, " ");
}
