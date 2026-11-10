"use client";

import { useEffect, useRef, useState } from "react";

export default function EventRail({ count, children }) {
  const scroller = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scroller.current;
    if (!el || count < 2) return;

    const update = () => {
      const item = el.firstElementChild;
      const styles = getComputedStyle(el);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
      const width = item ? item.getBoundingClientRect().width : el.clientWidth;
      const index = Math.round(el.scrollLeft / (width + gap));
      setActive(Math.max(0, Math.min(count - 1, index)));
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [count]);

  function go(index) {
    const el = scroller.current;
    const item = el?.children[index];
    if (!el || !item) return;
    item.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  if (!count) return null;

  return (
    <div>
      <div className="sm-events-rail" ref={scroller}>
        {children}
      </div>
      {count > 1 && (
        <div className="sm-events-dots" role="tablist" aria-label="Upcoming events">
          {Array.from({ length: count }, (_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Show event ${index + 1} of ${count}`}
              className={index === active ? "is-active" : undefined}
              onClick={() => go(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
