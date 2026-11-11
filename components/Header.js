"use client";

import { useState } from "react";

const NAV_LINKS = [
  { href: "/spots/", label: "Spots" },
  { href: "/events/", label: "Events" },
  { href: "/#community", label: "Community" },
  { href: "/#blog", label: "Blog" },
  { href: "/shop/", label: "Wear" },
];

export default function Header({ homeHref = "/" }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
            <a key={link.href} href={link.href} onClick={close}>
              {link.label}
            </a>
          ))}
          <a href="/#download" className="sm-btn sm-btn-dark sm-nav-cta" onClick={close}>
            Get the app
          </a>
        </nav>
      </div>

      {open && <button type="button" aria-hidden="true" tabIndex={-1} className="sm-nav-backdrop" onClick={close} />}
    </header>
  );
}
