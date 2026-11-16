const COUNTRY_NAMES = {
  PT: "Portugal",
  ES: "Spain",
  FR: "France",
  DE: "Germany",
  DK: "Denmark",
  MA: "Morocco",
};

export function countryName(countryCode) {
  return COUNTRY_NAMES[countryCode] || countryCode;
}
