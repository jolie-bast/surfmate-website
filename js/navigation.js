/**
 * Navigation Component
 * Handles mobile navigation toggle and active states
 */
class Navigation {
  constructor() {
    this.navToggle = null;
    this.navMenu = null;
    this.navLinks = null;
    this.header = null;
    this.observer = null;

    this.init();
  }

  init() {
    console.log("🚀 Navigation wird initialisiert...");
    this.findElements();
    this.setupWaitlistObserver();
  }

  findElements() {
    // Dynamisch alle Elemente finden (wegen Includes)
    let attempts = 0;
    const maxAttempts = 20;

    const findAllElements = () => {
      attempts++;
      console.log(
        `🔍 Suche Navigation Elemente... Versuch ${attempts}/${maxAttempts}`
      );

      // Header suchen
      if (!this.header) {
        this.header = document.querySelector(".header");
        if (this.header) console.log("✅ Header gefunden!");
      }

      // Navigation Elemente suchen
      if (!this.navToggle) {
        this.navToggle = document.querySelector(".nav-toggle");
        this.navMenu = document.querySelector(".nav-menu");
        this.navLinks = document.querySelectorAll(".nav-link");

        if (this.navToggle && this.navMenu && this.navLinks.length > 0) {
          console.log("✅ Navigation Elemente gefunden!");
          this.bindEvents();
          this.setActiveLink();
        }
      }

      // Wenn nicht alle Elemente gefunden, weiter suchen
      if ((!this.header || !this.navToggle) && attempts < maxAttempts) {
        setTimeout(findAllElements, 200);
      } else if (attempts >= maxAttempts) {
        console.log(
          "⚠️ Nicht alle Navigation Elemente gefunden nach 20 Versuchen"
        );
      }
    };

    findAllElements();
  }

  bindEvents() {
    // Mobile menu toggle
    this.navToggle.addEventListener("click", () => this.toggleMobileMenu());

    // Close mobile menu when clicking a link
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        this.closeMobileMenu();
        this.handleAnchorClick(e, link);
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".header")) {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    this.navMenu.classList.toggle("active");
    this.navToggle.classList.toggle("active");
    if (this.navMenu.classList.contains("active")) {
      // Nur wenn Navbar aktuell transparent ist, auf dunkel setzen
      if (this.header && !this.header.classList.contains("scrolled")) {
        this.header.classList.add("scrolled");
        this.header.style.background = "var(--surfmate-dark)";
        this.header.style.backdropFilter = "blur(10px)";
      }
    } else {
      // Wenn Menü geschlossen, Observer übernimmt wieder
      // Observer setzt Zustand korrekt, daher hier nichts tun
    }
  }

  closeMobileMenu() {
    this.navMenu.classList.remove("active");
    this.navToggle.classList.remove("active");
    // Observer übernimmt wieder, daher hier nichts tun
  }

  handleAnchorClick(e, link) {
    const href = link.getAttribute("href");

    // Prüfe ob es ein Anker-Link ist (beginnt mit #)
    if (href && href.startsWith("#")) {
      e.preventDefault();

      const targetId = href;
      console.log(`Klick auf ${targetId} - suche Section...`);

      // Versuche mehrmals die Section zu finden (für dynamisch geladene Includes)
      const findAndScrollToSection = (attempts = 0) => {
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          console.log(`Section ${targetId} gefunden!`);

          // Header-Höhe korrekt berechnen
          let headerHeight = 80; // CSS Variable --header-height

          if (this.header) {
            // Tatsächliche Header-Höhe messen
            const computedHeight = this.header.getBoundingClientRect().height;
            headerHeight = Math.max(computedHeight, 80); // Mindestens 80px
            console.log(`Header Höhe gemessen: ${computedHeight}px`);
          }

          // Perfekte Positionierung ohne zusätzliches Padding
          const targetPosition = targetSection.offsetTop - headerHeight;

          window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: "smooth",
          });

          console.log(
            `Scrolling zu ${targetId}, Position: ${targetPosition}px (Header: ${headerHeight}px)`
          );
        } else if (attempts < 5) {
          console.log(
            `Section ${targetId} noch nicht gefunden, Versuch ${attempts + 1}/5`
          );
          setTimeout(() => findAndScrollToSection(attempts + 1), 200);
        } else {
          console.error(`Section ${targetId} nach 5 Versuchen nicht gefunden!`);
          // Alternative: Scroll zum Ende der Seite als Fallback
          if (targetId === "#waitlist") {
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            });
            console.log("Fallback: Scrolle zum Ende der Seite");
          }
        }
      };

      findAndScrollToSection();
    }
  }

  setActiveLink() {
    const currentPath = window.location.pathname;
    const currentPage =
      currentPath === "/" ? "index.html" : currentPath.split("/").pop();

    this.navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");

      if (
        href === currentPage ||
        (currentPage === "index.html" && href === "./") ||
        (currentPath === "/" && href === "./")
      ) {
        link.classList.add("active");
      }
    });
  }

  setupWaitlistObserver() {
    // Warte auf das Laden aller Includes bevor Scroll-Logik eingerichtet wird
    setTimeout(() => {
      this.aboutSection = document.querySelector("#about.section");
      const section = this.aboutSection;
      if (section) {
        console.log(
          "Features-Carousel gefunden, Scroll-Listener wird eingerichtet"
        );
        const handleScroll = () => {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          const scrollY = window.scrollY;
          const offset = 200; // 200px früher dunkel
          // Header dunkel, wenn man ca. 200px vor der Section ist
          if (scrollY + 1 >= sectionTop - offset) {
            if (this.header) {
              this.header.classList.add("scrolled");
              this.header.style.background = "var(--surfmate-dark)";
              this.header.style.backdropFilter = "blur(10px)";
            }
          } else {
            if (this.header) {
              this.header.classList.remove("scrolled");
              this.header.style.background = "";
              this.header.style.backdropFilter = "";
            }
          }
        };
        window.addEventListener("scroll", handleScroll);
        // Initial prüfen
        handleScroll();
      } else {
        console.log("Keine relevante Section gefunden - prüfe HTML");
      }
    }, 1000);
  }

  // Fallback: Alte handleScroll Methode entfernt da wir Observer verwenden
}

window.initNavigation = function initNavigation() {
  new Navigation();
};
