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

  getHashFromHref(href) {
    if (!href) return null;
    const hashIndex = href.indexOf("#");
    return hashIndex === -1 ? null : href.slice(hashIndex);
  }

  isOnIndexPage() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    return page === "" || page === "index.html";
  }

  isIndexSectionLink(href) {
    if (!href) return false;
    if (href.startsWith("#")) return true;
    return /^(\.\/|\/|)index\.html#/.test(href);
  }

  handleAnchorClick(e, link) {
    const href = link.getAttribute("href");
    const hash = this.getHashFromHref(href);
    if (!hash) return;

    const shouldScrollOnPage =
      href.startsWith("#") ||
      (this.isOnIndexPage() && this.isIndexSectionLink(href));

    if (!shouldScrollOnPage) return;

    e.preventDefault();

    if (window.location.hash !== hash) {
      history.pushState(null, "", hash);
    }

    if (typeof window.scrollToHash === "function") {
      window.scrollToHash(hash, { behavior: "smooth" });
    }
  }

  setActiveLink() {
    const currentPath =
      window.location.pathname.replace(/\/+$/, "") || "/index.html";

    this.navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let linkPath = href;
      if (!href.startsWith("http")) {
        try {
          linkPath = new URL(href, window.location.origin).pathname;
        } catch {
          linkPath = href;
        }
      }
      linkPath = linkPath.replace(/\/+$/, "") || "/index.html";

      if (linkPath === currentPath) {
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
