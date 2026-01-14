// Custom Scrollbar Synchronisation für Features Carousel
// Erstellt: 2026-01-14

window.initCustomScrollbars = function initCustomScrollbars() {
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

    // Dragging Thumb oder Click auf die Scrollbar
    function onPointerDown(e) {
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
