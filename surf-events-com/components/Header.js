"use client";

import { useState } from "react";

// Minimal header for the surf-events.com mirror: just the Surfmate brand
// (linking back to the main site) and the "Add your event" / "Get the app"
// CTAs. Unlike the main site's Header, there is no multi-page nav here
// (Spots/Shop/Community don't exist on this domain), so all links are
// absolute to surfmate.eu. On narrow screens the CTAs move into a burger
// dropdown so the logo keeps its full size.
export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sm-header">
      <div className="sm-container sm-header-bar">
        <a href="https://surfmate.eu" aria-label="Surfmate home" className="sm-header-logo">
          <img src="/assets/logo-surfmate-schriftzug.svg" alt="Surfmate" />
        </a>

        <button
          type="button"
          className={`sm-nav-toggle${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-controls="sm-main-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <div id="sm-main-nav" className={`sm-nav${open ? " is-open" : ""}`}>
          <a href="https://surfmate.eu/events/submit/" className="sm-btn sm-btn-accent" onClick={close}>
            Add your event
          </a>
          <a href="https://surfmate.eu/#download" className="sm-btn sm-btn-dark" onClick={close}>
            Get the app
          </a>
        </div>
      </div>

      {open && <button type="button" aria-hidden="true" tabIndex={-1} className="sm-nav-backdrop" onClick={close} />}
    </header>
  );
}
