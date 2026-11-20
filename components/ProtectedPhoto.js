"use client";

// Renders a photo as a CSS background (not an <img>) so the browser's native
// "Save image as" / drag-to-desktop menu doesn't apply, plus a small Surfmate
// + photographer watermark baked into the view. This is a deterrent, not a
// lock: anyone can still screenshot a page. It just removes the one-click
// ways to lift a full-res file straight off the site.
export default function ProtectedPhoto({ src, alt, instagramUsername, size = "sm", watermark = true, className, style }) {
  const wordmarkHeight = size === "md" ? 13 : 10;
  const fontSize = size === "md" ? 10 : 9;

  return (
    <div
      role="img"
      aria-label={alt}
      className={className}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        position: "relative",
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitUserDrag: "none",
        WebkitTouchCallout: "none",
        ...style,
      }}
    >
      {watermark && (
        <img
          src="/images/logo-surfmate-white.png"
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            left: 10,
            bottom: 10,
            height: wordmarkHeight,
            width: "auto",
            opacity: 0.35,
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.45))",
            pointerEvents: "none",
          }}
        />
      )}
      {watermark && instagramUsername && (
        <span
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            color: "#fff",
            opacity: 0.35,
            fontSize,
            fontWeight: 600,
            pointerEvents: "none",
          }}
        >
          @{instagramUsername}
        </span>
      )}
    </div>
  );
}
