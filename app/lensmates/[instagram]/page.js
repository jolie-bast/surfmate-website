import { notFound } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import JsonLd from "../../../components/JsonLd";
import { KindIcon, InstagramIcon } from "../../../components/LensmateIcons";
import ProtectedPhoto from "../../../components/ProtectedPhoto";
import { getWebsiteLensmate, getWebsiteLensmates } from "../../../lib/supabase";
import { lensmateKindLabel, formatAvailableFor } from "../../../lib/lensmates";
import { breadcrumbNode, lensmatePath, lensmatePersonNode, pageMetadata } from "../../../lib/seo";

export async function generateStaticParams() {
  const lensmates = await getWebsiteLensmates();
  return lensmates.map((lensmate) => ({ instagram: lensmate.instagram_username }));
}

export async function generateMetadata({ params }) {
  const { instagram } = await params;
  const lensmate = await getWebsiteLensmate(instagram);
  if (!lensmate) return {};
  const name = lensmate.display_name || `@${lensmate.instagram_username}`;
  return pageMetadata({
    title: `${name} · Lensmate`,
    description: lensmate.about || `${name} shoots photos and video for the Surfmate community. See their work and get in touch on Instagram.`,
    path: lensmatePath(lensmate),
  });
}

export default async function LensmatePage({ params }) {
  const { instagram } = await params;
  const lensmate = await getWebsiteLensmate(instagram);
  if (!lensmate) notFound();

  const moreLensmates = await getWebsiteLensmates();
  const others = moreLensmates.filter((l) => l.instagram_username !== lensmate.instagram_username).slice(0, 4);

  const name = lensmate.display_name || `@${lensmate.instagram_username}`;
  const shots = [lensmate.shot_1_url, lensmate.shot_2_url, lensmate.shot_3_url].filter(Boolean);
  const instagramUrl = `https://www.instagram.com/${lensmate.instagram_username}/`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Lensmates", path: "/lensmates/" },
            { name, path: lensmatePath(lensmate) },
          ]),
          lensmatePersonNode(lensmate),
        ]}
      />
      <Header />
      <main>
        {/* LENSMATE HEADER */}
        <section className="sm-container" style={{ padding: "32px 24px 40px", display: "flex", flexDirection: "column", gap: 28 }}>
          <nav aria-label="Breadcrumb" style={{ fontSize: 14, color: "var(--sm-muted)", display: "flex", flexWrap: "wrap", gap: 8 }}>
            <a href="/">Home</a>
            <span aria-hidden="true">/</span>
            <a href="/lensmates/">Lensmates</a>
            <span aria-hidden="true">/</span>
            <span style={{ color: "var(--sm-black)", fontWeight: 600 }}>{name}</span>
          </nav>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
                <div style={{ position: "relative", width: 112, height: 112, flex: "none" }}>
                  {lensmate.avatar_url ? (
                    <img
                      src={lensmate.avatar_url}
                      alt=""
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <span style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--sm-blue-light)", display: "block" }} />
                  )}
                  <span
                    style={{
                      position: "absolute",
                      right: -2,
                      bottom: -2,
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--sm-black)",
                      color: "var(--sm-white)",
                      border: "3px solid var(--sm-white)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    <KindIcon kind={lensmate.kind} size={16} />
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
                  <p className="sm-eyebrow" style={{ margin: 0 }}>Lensmate · {lensmateKindLabel(lensmate.kind)}</p>
                  <h1 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(44px, 6vw, 76px)", lineHeight: 0.95 }}>{name}</h1>
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 16, fontWeight: 600 }}>
                    @{lensmate.instagram_username} ↗
                  </a>
                </div>
              </div>

              {Array.isArray(lensmate.available_for) && lensmate.available_for.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <p className="sm-eyebrow" style={{ margin: 0 }}>Available for</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {lensmate.available_for.map((item) => (
                      <span key={item} className="sm-pill">
                        {formatAvailableFor(item)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="sm-btn sm-btn-accent">
              <InstagramIcon size={18} /> Message on Instagram
            </a>
          </div>
        </section>

        {/* SHOTS */}
        {shots.length > 0 && (
          <section className="sm-container" style={{ padding: "0 24px 24px" }}>
            {shots.length > 1 ? (
              <div className="lensmate-shots">
                <ProtectedPhoto
                  className="lensmate-shots-top"
                  src={shots[0]}
                  alt={`Shot by ${name}`}
                  watermark={false}
                  size="md"
                />
                <div className="lensmate-shots-rest">
                  {shots.slice(1).map((url) => (
                    <ProtectedPhoto
                      key={url}
                      src={url}
                      alt={`Shot by ${name}`}
                      watermark={false}
                      size="md"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <ProtectedPhoto
                src={shots[0]}
                alt={`Shot by ${name}`}
                watermark={false}
                size="md"
                style={{ width: "100%", aspectRatio: "3 / 2", borderRadius: 15 }}
              />
            )}
            <div style={{ fontSize: 14, color: "var(--sm-muted)", paddingTop: 12 }}>Photos by {name}</div>
          </section>
        )}

        {/* ABOUT + CTA */}
        <section className="sm-container" style={{ padding: "48px 24px 56px", display: "flex", flexWrap: "wrap", gap: 48 }}>
          <div style={{ flex: "999 1 480px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 className="sm-heavy" style={{ margin: 0, fontSize: "clamp(32px, 4vw, 40px)", lineHeight: 1.05 }}>About</h2>
            {lensmate.about && (
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "var(--sm-ink)", maxWidth: 620 }}>{lensmate.about}</p>
            )}
          </div>

          <aside style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "var(--sm-black)", color: "#fff", borderRadius: "var(--sm-radius)", padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
              <strong className="sm-heavy" style={{ fontSize: 24, lineHeight: 1.1 }}>Contact {name} for your session</strong>
              <p style={{ margin: 0, fontSize: 15, color: "#d9d9d9" }}>Get in touch directly with {name} on Instagram.</p>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sm-btn sm-btn-accent"
                style={{ width: "100%" }}
              >
                <InstagramIcon size={18} /> Message on Instagram
              </a>
            </div>
            {others.length > 0 && (
              <div style={{ border: "1px solid var(--sm-border)", borderRadius: "var(--sm-radius)", padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>More Lensmates</h3>
                {others.map((l) => (
                  <a key={l.user_id} href={lensmatePath(l)} style={{ fontSize: 15 }}>
                    {l.display_name || `@${l.instagram_username}`} →
                  </a>
                ))}
              </div>
            )}
          </aside>
        </section>

        <div className="sm-container" style={{ padding: "0 24px 80px" }}>
          <a href="/lensmates/" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 16, fontWeight: 600 }}>
            ← All Lensmates
          </a>
        </div>

        {/* APP CTA */}
        <section id="app" style={{ background: "var(--sm-mint)" }}>
          <div className="sm-container" style={{ padding: "80px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <img src="/images/app-icon.png" alt="" style={{ width: 72, height: 72, borderRadius: 16, display: "block" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <strong className="sm-heavy" style={{ fontSize: "clamp(26px, 3vw, 40px)", lineHeight: 1 }}>Want your own Lensmate page?</strong>
                <span style={{ fontSize: 17, color: "var(--sm-ink)" }}>Apply as a Lensmate in the Surfmate app — it's free, just shout us out on Instagram.</span>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href="https://apps.apple.com/app/id6760191082" aria-label="Download on the App Store">
                <img src="/assets/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg" alt="Download on the App Store" style={{ height: 52, width: "auto", display: "block" }} />
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp" aria-label="Get it on Google Play">
                <img src="/assets/GetItOnGooglePlay_Badge_Web_color_English.svg" alt="Get it on Google Play" style={{ height: 52, width: "auto", display: "block" }} />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
