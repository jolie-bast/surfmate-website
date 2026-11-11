/**
 * Google Places API (New) — Autocomplete + Place Details.
 * Needs window.SURFMATE_GOOGLE_PLACES.apiKey (see google-places-config.local.js).
 * The key is restricted by HTTP referrer in Google Cloud Console, so it is
 * safe to ship in client-side code — same model as the Maps JavaScript API.
 */

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DETAILS_URL = "https://places.googleapis.com/v1/places";

function apiKey() {
  const key = window.SURFMATE_GOOGLE_PLACES?.apiKey;
  if (!key) {
    throw new Error("Location search isn't configured — missing Google Places API key.");
  }
  return key;
}

export async function searchPlaces(query) {
  const response = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.text",
    },
    body: JSON.stringify({ input: query }),
  });

  if (!response.ok) {
    throw new Error(`Place search failed (${response.status}).`);
  }

  const payload = await response.json().catch(() => null);
  const suggestions = payload?.suggestions ?? [];

  return suggestions
    .map((item) => item.placePrediction)
    .filter(Boolean)
    .map((prediction) => ({
      id: prediction.placeId,
      placeName:
        prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? "Location",
      subtitle: prediction.structuredFormat?.secondaryText?.text ?? null,
    }));
}

export async function getPlaceDetails(placeId) {
  const response = await fetch(`${DETAILS_URL}/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": "location,addressComponents,displayName",
    },
  });

  if (!response.ok) {
    throw new Error(`Place details failed (${response.status}).`);
  }

  const payload = await response.json().catch(() => null);
  const countryComponent = (payload?.addressComponents ?? []).find((component) =>
    component.types?.includes("country"),
  );

  return {
    latitude: payload?.location?.latitude ?? null,
    longitude: payload?.location?.longitude ?? null,
    countryCode: countryComponent?.shortText ?? null,
    placeName: payload?.displayName?.text ?? null,
  };
}
