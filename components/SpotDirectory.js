import { countryName } from "../lib/countries";
import { spotPath } from "../lib/seo";

export default function SpotDirectory({ spots }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--sm-border-strong)" }}>
      {spots.map((spot, i) => (
        <li key={spot.id} style={{ borderBottom: "1px solid var(--sm-border-strong)" }}>
          <a
            href={spotPath(spot)}
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 20, padding: "20px 4px", flexWrap: "wrap" }}
          >
            <span style={{ fontSize: 13, color: "var(--sm-muted)", width: 28 }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ flex: 1, minWidth: 180, fontSize: 20, fontWeight: 600 }}>{spot.name}</span>
            <span style={{ fontSize: 15, color: "var(--sm-muted)" }}>{spot.region}, {countryName(spot.country_code)}</span>
            <span className="sm-pill" style={{ fontSize: 13 }}>
              {spot.surfer_count > 0 ? `${spot.surfer_count} surfed here` : "New"}
            </span>
            <span aria-hidden="true">→</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
