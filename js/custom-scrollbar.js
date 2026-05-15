// Custom Scrollbar Synchronisation für Features Carousel
// Erstellt: 2026-01-14

window.initCustomScrollbars = function initCustomScrollbars() {
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Für alle Carousels mit Custom-Scrollbar
  document.querySelectorAll(".features-carousel").forEach(function (carousel) {
    // Die zugehörige Custom-Scrollbar ist das nächste Element nach dem Carousel
    const customScrollbar = carousel.nextElementSibling;
    if (
      !customScrollbar ||
      !customScrollbar.classList.contains("custom-scrollbar")
    )
      return;
    const customThumb = customScrollbar.querySelector(
      ".custom-scrollbar-thumb"
    );
    if (!customThumb) return;

    function updateThumb() {
      const scrollWidth = carousel.scrollWidth;
      const clientWidth = carousel.clientWidth;
      const scrollLeft = carousel.scrollLeft;
      const ratio = clientWidth / scrollWidth;
      const thumbWidth = Math.max(ratio * customScrollbar.offsetWidth, 40); // min width
      const maxScroll = scrollWidth - clientWidth;
      const left =
        maxScroll > 0
          ? (scrollLeft / maxScroll) *
            (customScrollbar.offsetWidth - thumbWidth)
          : 0;
      customThumb.style.width = thumbWidth + "px";
      customThumb.style.transform = `translateX(${left}px)`;
    }

    // Sync thumb on scroll
    carousel.addEventListener("scroll", updateThumb);
    window.addEventListener("resize", updateThumb);
    updateThumb();

    // Drag support
    let isDragging = false;
    let dragStartX = 0;
    let startScrollLeft = 0;
    let userInteracted = false;
    let hintHasRun = false;
    let hintRafId = null;
    let isProgrammaticHinting = false;

    // Dragging Thumb oder Click auf die Scrollbar
    function onPointerDown(e) {
      userInteracted = true;

      // Thumb Drag
      if (e.target === customThumb) {
        isDragging = true;
        dragStartX = e.clientX;
        startScrollLeft = carousel.scrollLeft;
        document.body.classList.add("scrollbar-dragging");
        e.preventDefault();
      } else {
        // Klick auf die Scrollbar springt an die Position
        const rect = customScrollbar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const scrollbarWidth = customScrollbar.offsetWidth;
        const thumbWidth = customThumb.offsetWidth;
        const maxThumbMove = scrollbarWidth - thumbWidth;
        const percent = Math.max(
          0,
          Math.min(1, (x - thumbWidth / 2) / maxThumbMove)
        );
        const scrollWidth = carousel.scrollWidth;
        const clientWidth = carousel.clientWidth;
        const maxScroll = scrollWidth - clientWidth;
        carousel.scrollLeft = percent * maxScroll;
      }
    }
    customScrollbar.addEventListener("mousedown", onPointerDown);

    document.addEventListener("mousemove", function (e) {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const scrollWidth = carousel.scrollWidth;
      const clientWidth = carousel.clientWidth;
      const maxScroll = scrollWidth - clientWidth;
      const scrollbarWidth = customScrollbar.offsetWidth;
      const thumbWidth = customThumb.offsetWidth;
      const maxThumbMove = scrollbarWidth - thumbWidth;
      let newThumbLeft = (carousel.scrollLeft =
        startScrollLeft + dx * (maxScroll / maxThumbMove));
      // Begrenzung
      if (carousel.scrollLeft < 0) carousel.scrollLeft = 0;
      if (carousel.scrollLeft > maxScroll) carousel.scrollLeft = maxScroll;
    });

    document.addEventListener("mouseup", function () {
      isDragging = false;
      document.body.classList.remove("scrollbar-dragging");
    });

    function markInteracted() {
      userInteracted = true;
      customScrollbar.classList.remove("is-hinting");
      if (hintRafId) {
        cancelAnimationFrame(hintRafId);
        hintRafId = null;
      }
      isProgrammaticHinting = false;
    }

    carousel.addEventListener("wheel", markInteracted, { passive: true });
    carousel.addEventListener("touchmove", markInteracted, { passive: true });
    carousel.addEventListener(
      "scroll",
      () => {
        if (!isProgrammaticHinting) {
          markInteracted();
        }
      },
      { passive: true }
    );

    function animateScrollTo(targetLeft, durationMs) {
      return new Promise((resolve) => {
        const from = carousel.scrollLeft;
        const distance = targetLeft - from;
        const start = performance.now();

        const step = (now) => {
          if (userInteracted) {
            isProgrammaticHinting = false;
            resolve(false);
            return;
          }

          const t = Math.min(1, (now - start) / durationMs);
          // Smooth ease-in-out
          const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          isProgrammaticHinting = true;
          carousel.scrollLeft = from + distance * eased;

          if (t < 1) {
            hintRafId = requestAnimationFrame(step);
          } else {
            hintRafId = null;
            isProgrammaticHinting = false;
            resolve(true);
          }
        };

        hintRafId = requestAnimationFrame(step);
      });
    }

    async function runScrollHintOnce() {
      if (hintHasRun || prefersReducedMotion) return;
      hintHasRun = true;

      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (maxScroll <= 0) return;
      if (userInteracted) return;

      const hintDistance = Math.min(
        maxScroll,
        Math.max(90, Math.round(carousel.clientWidth * 0.2))
      );
      if (hintDistance <= 0) return;

      customScrollbar.classList.add("is-hinting");
      const movedForward = await animateScrollTo(hintDistance, 1800);
      if (movedForward && !userInteracted) {
        await animateScrollTo(0, 1800);
      }
      customScrollbar.classList.remove("is-hinting");
    }

    if (!prefersReducedMotion && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry?.isIntersecting) return;
          observer.disconnect();
          setTimeout(runScrollHintOnce, 300);
        },
        {
          root: null,
          threshold: 0.2,
          rootMargin: "0px 0px -10% 0px",
        }
      );

      observer.observe(carousel);
    }
  });
};

// Automatisch initialisieren, falls das Script direkt geladen wird (z.B. nach allen Includes)

if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(window.initCustomScrollbars, 0);
} else {
  document.addEventListener("DOMContentLoaded", window.initCustomScrollbars);
}
