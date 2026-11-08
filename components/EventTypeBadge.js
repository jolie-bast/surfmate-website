const LABELS = {
  contest: "Contest",
  festival: "Festival",
  meetup: "Meetup",
  longboard: "Longboard",
  shortboard: "Shortboard",
  sup: "SUP",
  qs: "Qualifying Series",
  bwt: "Big Wave Tour",
  ct: "Championship Tour",
  national: "National",
  isa: "ISA",
};

export default function eventTypeBadge(eventTypes) {
  if (!eventTypes || !eventTypes.length) return "Event";
  for (const key of ["meetup", "festival", "contest"]) {
    if (eventTypes.includes(key)) return LABELS[key];
  }
  return LABELS[eventTypes[0]] || eventTypes[0];
}
