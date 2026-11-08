export default function Header({ homeHref = "/" }) {
  return (
    <header style={{ borderBottom: "1px solid var(--sm-border)", background: "#fff" }}>
      <div
        className="sm-container"
        style={{
          padding: "18px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <a href={homeHref} aria-label="Surfmate home" style={{ display: "flex", alignItems: "center" }}>
          <img src="/assets/logo-surfmate-schriftzug.svg" alt="Surfmate" style={{ height: 18, width: "auto", display: "block" }} />
        </a>
        <nav
          aria-label="Main"
          style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 28, fontSize: 15, fontWeight: 500 }}
        >
          <a href="/#spots" style={{ textDecoration: "none" }}>Spots</a>
          <a href="/#events" style={{ textDecoration: "none" }}>Events</a>
          <a href="/#community" style={{ textDecoration: "none" }}>Community</a>
          <a href="/#blog" style={{ textDecoration: "none" }}>Blog</a>
          <a href="https://shop.surfmate.eu" style={{ textDecoration: "none" }}>Wear ↗</a>
        </nav>
        <a href="/#download" className="sm-btn sm-btn-dark">Get the app</a>
      </div>
    </header>
  );
}
