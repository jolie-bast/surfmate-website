export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--sm-border)" }}>
      <div
        className="sm-container"
        style={{
          padding: "56px 24px 40px",
          display: "flex",
          flexWrap: "wrap",
          gap: 48,
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 14 }}>
          <img src="/assets/logo-surfmate-schriftzug.svg" alt="Surfmate" style={{ height: 40, width: "auto", alignSelf: "flex-start" }} />
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--sm-muted)", maxWidth: 280 }}>
            The community app connecting surfers worldwide.
          </p>
        </div>
        <nav aria-label="Explore" style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 15 }}>
          <strong style={{ fontWeight: 600 }}>Explore</strong>
          <a href="/spots/">Spots</a>
          <a href="/events/">Events</a>
          <a href="/#faq">Questions</a>
          <a href="/support/">Support</a>
        </nav>
        <nav aria-label="Surfmate" style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 15 }}>
          <strong style={{ fontWeight: 600 }}>Surfmate</strong>
          <a href="/#story">Our story</a>
          <a href="/team.html">Team</a>
          <a href="/partners/">Partners</a>
          <a href="/creators/">Creators</a>
          <a href="/join/">Join</a>
          <a href="/shop/">Wear</a>
        </nav>
        <nav aria-label="Get in touch" style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 15 }}>
          <strong style={{ fontWeight: 600 }}>Get in touch</strong>
          <a href="/support/">Support</a>
          <a href="https://instagram.com/surfmate.app">Instagram</a>
          <a href="/#newsletter">Newsletter</a>
        </nav>
      </div>
      <div
        className="sm-container"
        style={{
          padding: "20px 24px 40px",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "space-between",
          fontSize: 14,
          color: "var(--sm-muted)",
        }}
      >
        <span>
          © {new Date().getFullYear()} Surfmate · <a href="/impressum.html">Imprint</a> · <a href="/datenschutz.html">Privacy</a>
        </span>
        <span>App languages: EN, DE, PT, ES, FR</span>
      </div>
    </footer>
  );
}
