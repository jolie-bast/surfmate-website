// Minimal header for the surf-events.com mirror: just the Surfmate brand
// (linking back to the main site) and a "Get the app" CTA. Unlike the main
// site's Header, there is no multi-page nav here (Spots/Shop/Community
// don't exist on this domain), so all links are absolute to surfmate.eu.
export default function Header() {
  return (
    <header className="sm-header">
      <div className="sm-container sm-header-bar">
        <a href="https://surfmate.eu" aria-label="Surfmate home" className="sm-header-logo">
          <img src="/assets/logo-surfmate-schriftzug.svg" alt="Surfmate" />
        </a>
        <a href="https://surfmate.eu/#download" className="sm-btn sm-btn-dark">
          Get the app
        </a>
      </div>
    </header>
  );
}
