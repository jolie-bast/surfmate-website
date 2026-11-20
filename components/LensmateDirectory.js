"use client";

import { useMemo, useState } from "react";
import { lensmatePath } from "../lib/seo";
import { lensmateKindBadge } from "../lib/lensmates";
import { KindIcon } from "./LensmateIcons";
import ProtectedPhoto from "./ProtectedPhoto";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "photographer", label: "Photographers" },
  { value: "videographer", label: "Videographers" },
];

export default function LensmateDirectory({ lensmates }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (filter === "all") return lensmates;
    return lensmates.filter((l) => l.kind === filter || l.kind === "both");
  }, [filter, lensmates]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.value)}
                style={{
                  height: 44,
                  padding: "0 18px",
                  borderRadius: 999,
                  fontFamily: "inherit",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  background: active ? "var(--sm-black)" : "var(--sm-white)",
                  color: active ? "var(--sm-white)" : "var(--sm-black)",
                  border: active ? "1px solid var(--sm-black)" : "1px solid var(--sm-border-strong)",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: 15, color: "var(--sm-muted)" }}>
          {filtered.length} Lensmate{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 24,
        }}
      >
        {filtered.map((lensmate) => (
          <a
            key={lensmate.user_id}
            href={lensmatePath(lensmate)}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "var(--sm-white)",
              border: "1px solid var(--sm-border)",
              borderRadius: "var(--sm-radius)",
              overflow: "hidden",
              textDecoration: "none",
              color: "var(--sm-black)",
            }}
          >
            <div style={{ position: "relative", aspectRatio: "4 / 3", background: "var(--sm-mint)" }}>
              <ProtectedPhoto
                src={lensmate.shot_1_url}
                alt={`Shot by ${lensmate.display_name || lensmate.instagram_username}`}
                watermark={false}
                style={{ width: "100%", height: "100%" }}
              />
              <span
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--sm-white)",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <KindIcon kind={lensmate.kind} /> {lensmateKindBadge(lensmate.kind)}
              </span>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, flexGrow: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {lensmate.avatar_url ? (
                  <img
                    src={lensmate.avatar_url}
                    alt=""
                    style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flex: "none" }}
                  />
                ) : (
                  <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--sm-blue-light)", flex: "none" }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3, minWidth: 0 }}>
                  <strong style={{ fontSize: 18, fontWeight: 700 }}>{lensmate.display_name || `@${lensmate.instagram_username}`}</strong>
                  <span style={{ fontSize: 14, color: "var(--sm-muted)" }}>@{lensmate.instagram_username}</span>
                </div>
              </div>
              {lensmate.about && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    color: "var(--sm-ink)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {lensmate.about}
                </p>
              )}
              {Array.isArray(lensmate.available_for) && lensmate.available_for.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {lensmate.available_for.map((item) => (
                    <span key={item} className="sm-pill" style={{ padding: "4px 12px", fontSize: 13 }}>
                      {item.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: "auto", paddingTop: 6, fontSize: 15, fontWeight: 600 }}>View page →</div>
            </div>
          </a>
        ))}

        <div
          className="sm-lensmate-promo"
          style={{
            background: "var(--sm-mint)",
            borderRadius: "var(--sm-radius)",
            padding: 40,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--sm-beige)",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Free — just shout us out
          </span>
          <div className="sm-heavy" style={{ fontSize: "clamp(28px, 3vw, 40px)", lineHeight: 1.05 }}>
            Your page could be here
          </div>
          <p style={{ margin: 0, fontSize: 16, maxWidth: 440 }}>
            You shoot surf? Apply in the Surfmate app and get your own page with your best shots, what you're
            available for and your Instagram.
          </p>
          <a href="#program" className="sm-btn sm-btn-dark">
            How it works ↓
          </a>
        </div>
      </div>
    </div>
  );
}
