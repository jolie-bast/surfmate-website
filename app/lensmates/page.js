import Header from "../../components/Header";
import Footer from "../../components/Footer";
import JsonLd from "../../components/JsonLd";
import LensmateDirectory from "../../components/LensmateDirectory";
import { ChevronDownIcon } from "../../components/LensmateIcons";
import { getWebsiteLensmates } from "../../lib/supabase";
import { breadcrumbNode, faqNode, lensmateItemListNode, LENSMATE_FAQS, pageMetadata } from "../../lib/seo";

const TITLE = "Lensmates";
const DESCRIPTION =
  "Surf photographers and filmmakers from the Surfmate community – browse their work and contact them for your next session.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/lensmates/",
});

export default async function LensmatesIndexPage() {
  const lensmates = await getWebsiteLensmates();

  return (
    <>
      <JsonLd
        data={[
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Lensmates", path: "/lensmates/" },
          ]),
          lensmateItemListNode(lensmates, "Lensmates on Surfmate"),
          faqNode(LENSMATE_FAQS),
        ]}
      />
      <Header />
      <main>
        <section className="sm-container" style={{ padding: "48px 24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <p className="sm-eyebrow">Lensmate guide</p>
          <h1 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.95 }}>
            Who's shooting your sessions?
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 640 }}>
            Photographers and filmmakers from the Surfmate community. Every Lensmate has their own page with their
            work, what they're available for, and their Instagram.
          </p>
        </section>

        <section className="sm-container" style={{ padding: "24px 24px 96px" }}>
          <LensmateDirectory lensmates={lensmates} />
        </section>

        {/* THE LENSMATE PROGRAM */}
        <section id="program" style={{ background: "var(--sm-mint)" }}>
          <div className="sm-container" style={{ padding: "72px 24px", display: "flex", flexDirection: "column", gap: 40 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p className="sm-eyebrow">The Lensmate program</p>
              <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.02 }}>
                Shoot surf, get found
              </h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: "var(--sm-ink)", maxWidth: 640 }}>
                Lensmates are the photographers and filmmakers of the Surfmate community. Apply in the app, and once
                your profile is approved you get your own page here, so surfers can see your work and contact you
                for their next session.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
              {[
                {
                  step: "01",
                  title: "Apply in the app",
                  copy: "Open Settings in the Surfmate app and tap “Become a Lensmate”. Add your Instagram, your three best shots, a short text and what you’re available for.",
                },
                {
                  step: "02",
                  title: "Get approved",
                  copy: "We look at every application, so the Lensmate tag keeps its meaning.",
                },
                {
                  step: "03",
                  title: "Get found",
                  copy: "You get the Lensmate tag on your profile, your own page here and a shout-out in our story.",
                },
              ].map((item) => (
                <div key={item.step} style={{ background: "var(--sm-white)", borderRadius: "var(--sm-radius)", padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                  <span
                    className="sm-heavy"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--sm-blue)",
                      borderRadius: 999,
                      width: 40,
                      height: 32,
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                  >
                    {item.step}
                  </span>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{item.title}</div>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "var(--sm-ink)" }}>{item.copy}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Apply as a Lensmate in the Surfmate app</div>
                <div style={{ fontSize: 15, color: "var(--sm-ink)" }}>It's free — just introduce us to your followers on Instagram.</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <a href="https://apps.apple.com/app/id6760191082" aria-label="Download on the App Store">
                  <img src="/assets/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg" alt="Download on the App Store" style={{ height: 48, width: "auto", display: "block" }} />
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp" aria-label="Get it on Google Play">
                  <img src="/assets/GetItOnGooglePlay_Badge_Web_color_English.svg" alt="Get it on Google Play" style={{ height: 48, width: "auto", display: "block" }} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* QUESTIONS */}
        <section className="sm-container" style={{ padding: "72px 24px 104px", display: "flex", flexWrap: "wrap", gap: 48 }}>
          <h2 className="sm-heavy" style={{ flex: "1 1 220px", margin: 0, fontSize: "clamp(32px, 4vw, 40px)", lineHeight: 1.05 }}>Questions</h2>
          <div style={{ flex: "999 1 480px", minWidth: 0, borderTop: "1px solid var(--sm-border-strong)" }}>
            {LENSMATE_FAQS.map((faq, i) => (
              <details key={faq.question} className="sm-faq" open={i === 0} style={{ borderBottom: "1px solid var(--sm-border-strong)" }}>
                <summary style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 44, padding: "20px 0", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
                  {faq.question}
                  <ChevronDownIcon />
                </summary>
                <p style={{ margin: 0, padding: "0 0 22px", fontSize: 16, lineHeight: 1.55, color: "var(--sm-ink)", maxWidth: 640 }}>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
