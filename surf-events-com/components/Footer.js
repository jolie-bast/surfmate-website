// Minimal footer for the surf-events.com mirror: credits + legal links back
// to surfmate.eu (same operator, one set of legal pages).
export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--sm-border)" }}>
      <div
        className="sm-container"
        style={{ padding: "40px 24px", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", fontSize: 14, color: "var(--sm-muted)" }}
      >
        <span>
          Surf Events is run by <a href="https://surfmate.eu">Surfmate</a>, the community app for surfers.
        </span>
        <span>
          © {new Date().getFullYear()} Surfmate · <a href="https://surfmate.eu/impressum.html">Imprint</a> ·{" "}
          <a href="https://surfmate.eu/datenschutz.html">Privacy</a>
        </span>
      </div>
    </footer>
  );
}
