export default function EventSubmitForm() {
  return (
    <div className="event-submit-panel">
      <div id="event-submit-form-section" className="event-submit-card">
        <form id="event-submit-form" className="event-submit-form" noValidate>
          <nav className="wizard-progress" aria-label="Submission steps">
            <ol id="wizard-steps-map" className="wizard-steps-map">
              {[
                ["1", "Event"],
                ["2", "When"],
                ["3", "Type"],
                ["4", "Contact"],
                ["5", "Send"],
              ].map(([step, label]) => (
                <li
                  key={step}
                  className={step === "1" ? "wizard-step-marker is-active" : "wizard-step-marker"}
                  data-step-marker={step}
                >
                  <button
                    type="button"
                    className="wizard-step-marker-btn"
                    data-step-jump={step}
                    aria-label={`Go to step ${step}: ${label}`}
                    aria-current={step === "1" ? "step" : undefined}
                    disabled
                  >
                    {step}
                  </button>
                  <span className="wizard-step-marker-label">{label}</span>
                </li>
              ))}
            </ol>
          </nav>

          <div className="wizard-step-header">
            <p className="wizard-step-kicker" id="wizard-step-kicker">
              Step 1 of 5
            </p>
            <h2 className="wizard-step-title" id="wizard-step-title">
              What’s the event?
            </h2>
            <p className="wizard-step-lead" id="wizard-step-lead">
              Name it and pin the location on the map.
            </p>
          </div>

          <div className="wizard-step-panels">
            <section className="wizard-step is-active" data-step="1" aria-labelledby="wizard-step-title">
              <div className="form-field">
                <label htmlFor="event-title">
                  Event name <span className="required-mark" aria-hidden="true">*</span>
                </label>
                <input
                  id="event-title"
                  name="title"
                  type="text"
                  maxLength={200}
                  placeholder="e.g. Baltic Surf Festival"
                />
                <p id="event-title-error" className="field-error" hidden role="alert" />
              </div>

              <div className="form-field location-field">
                <label htmlFor="event-location">
                  Location <span className="required-mark" aria-hidden="true">*</span>
                </label>
                <div className="location-autocomplete">
                  <div className="location-search-wrap">
                    <input
                      id="event-location"
                      name="location"
                      type="text"
                      autoComplete="off"
                      placeholder="Search city, venue, or beach…"
                      aria-describedby="place-hint place-status selected-place event-location-error"
                      aria-expanded="false"
                      aria-controls="place-results"
                      role="combobox"
                    />
                  </div>
                  <ul id="place-results" className="place-results" role="listbox" hidden />
                </div>
                <p id="place-hint" className="field-hint">
                  Start typing, then tap a result to confirm.
                </p>
                <p id="place-status" className="field-status" aria-live="polite" />
                <p id="event-location-error" className="field-error" hidden role="alert" />
                <div id="selected-place" className="selected-place" hidden>
                  <span className="selected-place-label">Selected</span>
                  <span id="selected-place-name" className="selected-place-name" />
                  <button type="button" id="clear-place-btn" className="selected-place-clear">
                    Change
                  </button>
                </div>
              </div>
            </section>

            <section className="wizard-step" data-step="2" hidden>
              <div className="form-field">
                <span className="field-label">Schedule</span>
                <div className="schedule-toggle" role="radiogroup" aria-label="Schedule type">
                  <label className="schedule-option">
                    <input type="radio" name="scheduleMode" id="schedule-with-time" value="exact_datetime" defaultChecked />
                    <span className="schedule-option-text">
                      <strong>Dates &amp; times</strong>
                      <small>Start and end times included</small>
                    </span>
                  </label>
                  <label className="schedule-option">
                    <input type="radio" name="scheduleMode" id="schedule-all-day" value="exact" />
                    <span className="schedule-option-text">
                      <strong>Dates only</strong>
                      <small>All-day — no times needed</small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="date-grid">
                <DateField id="start-date" labelId="start-date-label" label="Starts" required />
                <DateField id="end-date" labelId="end-date-label" label="Ends" optional />
              </div>

              <div id="datetime-fields" className="datetime-fields">
                <div className="date-grid">
                  <TimeField id="start-time" labelId="start-time-label" label="Start time" required hourId="start-time-hour" minuteId="start-time-minute" />
                  <TimeField id="end-time" labelId="end-time-label" label="End time" optional hourId="end-time-hour" minuteId="end-time-minute" />
                </div>
                <div className="form-field timezone-field">
                  <label className="field-label" htmlFor="event-timezone">
                    Timezone <span className="required-mark" aria-hidden="true">*</span>
                  </label>
                  <select id="event-timezone" className="timezone-select" required aria-describedby="timezone-hint" />
                  <p id="timezone-hint" className="field-hint">
                    Enter times in this timezone (local time at the event).
                  </p>
                </div>
              </div>

              <div id="schedule-preview" className="schedule-preview-card" hidden aria-live="polite" />
              <p id="schedule-error" className="field-error" hidden role="alert" />
            </section>

            <section className="wizard-step" data-step="3" hidden>
              <p className="field-hint section-hint">Pick one or more — tap to toggle.</p>
              <div id="event-types" className="event-type-chips" role="group" aria-label="Event types" />
              <p id="event-types-error" className="field-error" hidden role="alert" />
            </section>

            <section className="wizard-step" data-step="4" hidden>
              <div className="form-field">
                <label htmlFor="submitter-email">
                  Your email <span className="required-mark" aria-hidden="true">*</span>
                </label>
                <input
                  id="submitter-email"
                  name="submitterEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-describedby="submitter-email-hint submitter-email-error"
                />
                <p id="submitter-email-hint" className="field-hint">
                  So we can confirm your submission or ask a quick question if needed.
                </p>
                <p id="submitter-email-error" className="field-error" hidden role="alert" />
              </div>
            </section>

            <section className="wizard-step" data-step="5" hidden>
              <div id="wizard-review" className="wizard-review" aria-live="polite" />
              <div className="form-field">
                <label htmlFor="event-description">Short description</label>
                <textarea
                  id="event-description"
                  name="description"
                  maxLength={600}
                  placeholder="What's this event about? A few sentences is enough."
                  aria-describedby="description-count"
                />
                <p id="description-count" className="field-hint field-hint-right">
                  0 / 600
                </p>
              </div>
              <div className="form-field">
                <label htmlFor="submitter-note">Note for our team</label>
                <textarea
                  id="submitter-note"
                  name="note"
                  maxLength={500}
                  placeholder="e.g. Lineup TBA, tickets link coming soon…"
                  aria-describedby="note-count"
                />
                <p className="field-hint">Optional — only visible to us during review.</p>
                <p id="note-count" className="field-hint field-hint-right">
                  0 / 500
                </p>
              </div>
              <p className="submit-footnote">Your event won&apos;t appear in the app until our team approves it.</p>
            </section>
          </div>

          <p id="form-error" className="form-error" hidden role="alert" />

          <div className="wizard-nav is-first-step" id="wizard-nav">
            <button type="button" id="wizard-back" className="btn-secondary wizard-nav-back" hidden tabIndex={-1}>
              Back
            </button>
            <button type="button" id="wizard-next" className="btn-primary wizard-nav-action wizard-nav-action--next">
              Continue
            </button>
            <button
              type="button"
              id="submit-event-btn"
              className="btn-primary wizard-nav-action wizard-nav-action--submit"
              hidden
              tabIndex={-1}
            >
              Submit for review
            </button>
          </div>
        </form>
      </div>

      <aside id="event-submit-card-preview" className="event-submit-card-preview" aria-labelledby="event-submit-preview-heading">
        <h2 id="event-submit-preview-heading" className="event-submit-preview-heading">
          Preview
        </h2>
        <p className="event-submit-preview-lead">This is how your event could look in the Surfmate calendar.</p>
        <div id="event-submit-card-preview-mount" className="event-submit-preview-stage" />
      </aside>

      <div id="event-submit-success" className="event-submit-card success-card" hidden>
        <div className="success-icon" aria-hidden="true">
          ✓
        </div>
        <h2>Thanks — we&apos;ll review your event soon.</h2>
        <p>
          Your suggestion is in our queue. If we have a question, we&apos;ll reach out to the email you provided. Once
          approved, it will appear in the Surfmate app calendar.
        </p>
        <div className="success-actions">
          <a href="/events/" className="btn-primary btn-block">
            Back to events
          </a>
          <a href="/" className="btn-secondary btn-block">
            Back to homepage
          </a>
          <button type="button" id="submit-another-btn" className="btn-secondary btn-block">
            Submit another event
          </button>
        </div>
      </div>

      <section className="event-submit-partner-cta" aria-label="Partner event options">
        <div className="event-submit-partner-cta-box">
          <p className="event-submit-partner-cta-text">
            Want to add your logo, hero picture &amp; link? Please send a mail to{" "}
            <a href="mailto:jolie@surfmate.eu" className="event-submit-partner-cta-link">
              jolie@surfmate.eu
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

function DateField({ id, labelId, label, required = false, optional = false }) {
  return (
    <div className="form-field">
      <span className="field-label" id={labelId}>
        {label}{" "}
        {required && (
          <span className="required-mark" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="optional-mark">(optional)</span>}
      </span>
      <div id={id} className="date-segments" role="group" aria-labelledby={labelId} data-date-required={required ? "true" : undefined}>
        <div className="date-segments-row">
          <input type="text" inputMode="numeric" autoComplete="off" maxLength={2} placeholder="DD" className="date-segment" data-segment="day" aria-label="Day" />
          <span className="date-segment-sep" aria-hidden="true">/</span>
          <input type="text" inputMode="numeric" autoComplete="off" maxLength={2} placeholder="MM" className="date-segment" data-segment="month" aria-label="Month" />
          <span className="date-segment-sep" aria-hidden="true">/</span>
          <input type="text" inputMode="numeric" autoComplete="off" maxLength={4} placeholder="YYYY" className="date-segment date-segment-year" data-segment="year" aria-label="Year" />
        </div>
      </div>
    </div>
  );
}

function TimeField({ id, labelId, label, required = false, optional = false, hourId, minuteId }) {
  return (
    <div className="form-field">
      <span className="field-label" id={labelId}>
        {label}{" "}
        {required && (
          <span className="required-mark" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="optional-mark">(optional)</span>}
      </span>
      <div id={id} className="time-segments" role="group" aria-labelledby={labelId} data-time-required={required ? "true" : undefined}>
        <div className="time-segments-row">
          <input id={hourId} type="text" inputMode="numeric" autoComplete="off" maxLength={2} placeholder="HH" className="time-segment" data-segment="hour" aria-label="Hour" />
          <span className="time-segment-sep" aria-hidden="true">:</span>
          <input id={minuteId} type="text" inputMode="numeric" autoComplete="off" maxLength={2} placeholder="MM" className="time-segment" data-segment="minute" aria-label="Minute" />
        </div>
      </div>
    </div>
  );
}
