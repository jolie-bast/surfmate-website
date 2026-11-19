"use client";

import { useState } from "react";
import { getSmartAppLink } from "../lib/appLinks";

const NAV_LINKS = [
  { href: "/spots/", label: "Spots" },
  { href: "/lensmates/", label: "Lensmates" },
  { href: "/events/", label: "Events" },
  { href: "/#community", label: "Community" },
  { href: "/#blog", label: "Blog" },
  { href: "https://shop.surfmate.eu", label: "Wear", external: true },
];

function ExternalLinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ marginLeft: 4, verticalAlign: -1 }}
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export default function Header({ homeHref = "/" }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  function handleGetAppClick(event) {
    close();
    const smartLink = getSmartAppLink();
    if (smartLink) {
      event.preventDefault();
      window.location.href = smartLink;
    }
  }

  return (
    <header className="sm-header">
      <div className="sm-container sm-header-bar">
        <a href={homeHref} aria-label="Surfmate home" className="sm-header-logo">
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

        <nav id="sm-main-nav" aria-label="Main" className={`sm-nav${open ? " is-open" : ""}`}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={close}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {link.label}
              {link.external && <ExternalLinkIcon />}
            </a>
          ))}
          <a href="/#download" className="sm-btn sm-btn-dark sm-nav-cta" onClick={handleGetAppClick}>
            Get the app
          </a>
        </nav>
      </div>

      {open && <button type="button" aria-hidden="true" tabIndex={-1} className="sm-nav-backdrop" onClick={close} />}
    </header>
  );
}
