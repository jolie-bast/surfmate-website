const COUNTRY_NAMES = {
  PT: "Portugal",
  ES: "Spain",
  FR: "France",
  DE: "Germany",
};

export function countryName(countryCode) {
  return COUNTRY_NAMES[countryCode] || countryCode;
}

export function countrySlug(countryCode) {
  return countryName(countryCode).toLowerCase().replace(/\s+/g, "-");
}

export function slugToCountryCode(slug) {
  const entry = Object.entries(COUNTRY_NAMES).find(
    ([, name]) => name.toLowerCase().replace(/\s+/g, "-") === slug,
  );
  return entry ? entry[0] : null;
}
