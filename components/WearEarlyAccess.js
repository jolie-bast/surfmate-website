"use client";

import { useEffect, useRef, useState } from "react";

// Separate MailerLite form for the Wear list — not the app newsletter.
const WEAR_FORM_URL =
  "https://assets.mailerlite.com/jsonp/2025965/forms/202215834903381236/subscribe";

// Drop 01 opens Nov 15, 7 pm Lisbon / 8 pm Berlin.
const OPEN_AT = Date.parse("2026-11-15T19:00:00Z");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function remaining(now) {
  const diff = OPEN_AT - now;
  if (diff <= 0) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return {
    days: Math.floor(diff / 86400000),
    hours: pad(Math.floor((diff % 86400000) / 3600000)),
    mins: pad(Math.floor((diff % 3600000) / 60000)),
  };
}

function firstError(data) {
  const fields = data && data.errors && data.errors.fields;
  if (fields) {
    const lists = Object.values(fields);
    for (let i = 0; i < lists.length; i += 1) {
      if (lists[i] && lists[i].length) return lists[i][0];
    }
  }
  if (data && typeof data.message === "string" && data.message) return data.message;
  return "Something went wrong — please try again.";
}

const inputStyle = {
  width: "100%",
  minHeight: 52,
  padding: "12px 16px",
  fontSize: 16,
  fontFamily: "inherit",
  color: "var(--sm-black)",
  background: "#fff",
  border: "1px solid var(--sm-border-strong)",
  borderRadius: 15,
  boxSizing: "border-box",
};

export default function WearEarlyAccess() {
  const [time, setTime] = useState(undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const submitting = useRef(false);
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  useEffect(() => {
    const tick = () => setTime(remaining(Date.now()));
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, []);

  function showError(message, field) {
    setError(message);
    setInvalidField(field);
    const node = field === "name" ? nameRef.current : emailRef.current;
    if (node) node.focus();
  }

  function onSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      showError("Please enter your name.", "name");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      showError("Please enter a valid email.", "email");
      return;
    }
    if (submitting.current) return;
    submitting.current = true;
    setError("");
    setInvalidField("");

    const body = new URLSearchParams();
    body.append("fields[name]", trimmedName);
    body.append("fields[email]", trimmedEmail);
    body.append("ml-submit", "1");
    body.append("anticsrf", "true");

    // iOS Safari cancels a fetch started in the submit turn if the button
    // is disabled there. Start the request on the next turn.
    window.setTimeout(() => {
      setPending(true);
      fetch(WEAR_FORM_URL, { method: "POST", body })
        .then((response) =>
          response.json().then(
            (data) => ({ ok: response.ok, data }),
            () => ({ ok: false, data: null }),
          ),
        )
        .then((result) => {
          if (result.ok && result.data && result.data.success === true) {
            setDone(true);
            if (typeof window.gtag === "function") {
              window.gtag("event", "sign_up", { method: "wear_waitlist" });
            }
            return;
          }
          submitting.current = false;
          setPending(false);
          showError(firstError(result.data), "email");
        })
        .catch(() => {
          submitting.current = false;
          setPending(false);
          showError("Something went wrong — please try again.", "email");
        });
    }, 0);
  }

  const form = done ? (
    <p role="status" style={{ margin: 0, fontSize: 17, lineHeight: 1.55 }}>
      <strong>You&apos;re on the list.</strong> We&apos;ll email you the early-access link on Nov 15.
    </p>
  ) : (
    <form onSubmit={onSubmit} noValidate className="wear-form">
      <label htmlFor="wear-name" className="sm-sr-only">Name</label>
      <input
        ref={nameRef}
        id="wear-name"
        name="name"
        type="text"
        autoComplete="given-name"
        placeholder="Your name"
        required
        value={name}
        aria-invalid={invalidField === "name" || undefined}
        aria-describedby={error ? "wear-error" : undefined}
        onChange={(event) => {
          setName(event.target.value);
          if (invalidField === "name") {
            setError("");
            setInvalidField("");
          }
        }}
        style={inputStyle}
      />
      <label htmlFor="wear-email" className="sm-sr-only">Email</label>
      <input
        ref={emailRef}
        id="wear-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@email.com"
        required
        value={email}
        aria-invalid={invalidField === "email" || undefined}
        aria-describedby={error ? "wear-error" : undefined}
        onChange={(event) => {
          setEmail(event.target.value);
          if (invalidField === "email") {
            setError("");
            setInvalidField("");
          }
        }}
        style={inputStyle}
      />
      <button type="submit" className="sm-btn wear-form-submit" disabled={pending}>
        {pending ? "Joining…" : "Join the waitlist"}
      </button>
      <p id="wear-error" role="alert" hidden={!error} className="wear-form-error">
        {error}
      </p>
      <p className="wear-form-note">
        <a href="/datenschutz.html">Privacy</a>
      </p>
    </form>
  );

  return (
    <div className="wear-early-grid">
      <div>
        <h2 className="sm-heavy wear-early-title">Get early access</h2>
        <p className="wear-early-lead">
          The shop opens Nov 15. Join the list and we&apos;ll email you the link one hour before everyone else.
        </p>
        <p id="wear-countdown-label" className="wear-count-label">
          {time === null ? "Drop 01 is live" : "Opens in"}
        </p>
        {time ? (
          <div role="timer" aria-labelledby="wear-countdown-label" className="wear-count">
            {[
              [time.days, "Days"],
              [time.hours, "Hours"],
              [time.mins, "Min"],
            ].map(([value, label]) => (
              <div key={label}>
                <span className="wear-count-value">{value}</span>
                <span className="wear-count-unit">{label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="wear-form-card">{form}</div>
    </div>
  );
}
