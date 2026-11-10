import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import EventSubmitForm from "../../../components/EventSubmitForm";
import EventSubmitScripts from "../../../components/EventSubmitScripts";
import JsonLd from "../../../components/JsonLd";
import { breadcrumbNode, pageMetadata } from "../../../lib/seo";
import "./submit.css";

const DESCRIPTION = "Share a surf event with the Surfmate community — no account required.";

export const metadata = pageMetadata({
  title: "Add your event",
  description: DESCRIPTION,
  path: "/events/submit/",
});

export default function EventSubmitPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbNode([
          { name: "Home", path: "/" },
          { name: "Events", path: "/events/" },
          { name: "Add your event", path: "/events/submit/" },
        ])}
      />
      <Header />
      <main className="event-submit-page">
        <section className="sm-container event-submit-main" style={{ padding: "48px 24px 96px" }}>
          <p className="event-submit-back-wrap">
            <a href="/events/" className="event-submit-back">
              ← Back to events
            </a>
          </p>
          <header className="content-header">
            <p className="sm-eyebrow">Hosting a surf event?</p>
            <h1 className="sm-heavy">Add your event.</h1>
            <p>
              It&apos;s free. A few quick steps — no account needed. We review every submission before it goes live in
              the app.
            </p>
          </header>
          <EventSubmitForm />
        </section>
      </main>
      <Footer />
      <EventSubmitScripts />
    </>
  );
}
