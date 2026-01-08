/**
 * Navigation Component
 * Handles mobile navigation toggle and active states
 */
class Navigation {
  constructor() {
    this.navToggle = document.querySelector(".nav-toggle");
    this.navMenu = document.querySelector(".nav-menu");
    this.navLinks = document.querySelectorAll(".nav-link");

    this.init();
  }

  init() {
    if (this.navToggle && this.navMenu) {
      this.bindEvents();
    }
    this.setActiveLink();
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
  }

  closeMobileMenu() {
    this.navMenu.classList.remove("active");
    this.navToggle.classList.remove("active");
  }

  handleAnchorClick(e, link) {
    const href = link.getAttribute("href");

    // Prüfe ob es ein Anker-Link ist (beginnt mit #)
    if (href && href.startsWith("#")) {
      e.preventDefault();

      const targetId = href;
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
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
}

// Initialize navigation when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new Navigation();
});
