// Mobile nav toggle for the new-design header (public/includes/header-sm.html).
// Uses event delegation since the header markup is injected asynchronously
// by includes.js — no need to wait for it before wiring listeners up.
(function () {
  function closeNav() {
    const toggle = document.getElementById("sm-nav-toggle");
    const nav = document.getElementById("sm-main-nav");
    const backdrop = document.querySelector(".sm-nav-backdrop");
    if (toggle) {
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }
    if (nav) nav.classList.remove("is-open");
    if (backdrop) backdrop.remove();
  }

  function openNav() {
    const toggle = document.getElementById("sm-nav-toggle");
    const nav = document.getElementById("sm-main-nav");
    if (!toggle || !nav) return;

    toggle.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    nav.classList.add("is-open");

    if (!document.querySelector(".sm-nav-backdrop")) {
      const backdrop = document.createElement("button");
      backdrop.type = "button";
      backdrop.className = "sm-nav-backdrop";
      backdrop.setAttribute("aria-hidden", "true");
      backdrop.tabIndex = -1;
      toggle.closest(".sm-header")?.appendChild(backdrop);
    }
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("#sm-nav-toggle")) {
      const nav = document.getElementById("sm-main-nav");
      if (nav && nav.classList.contains("is-open")) {
        closeNav();
      } else {
        openNav();
      }
      return;
    }

    if (event.target.closest(".sm-nav-backdrop")) {
      closeNav();
      return;
    }

    if (event.target.closest("#sm-main-nav a")) {
      closeNav();
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    var poll = setInterval(function () {
      var year = document.getElementById("sm-footer-year");
      if (!year) return;
      year.textContent = new Date().getFullYear();
      clearInterval(poll);
    }, 200);
    setTimeout(function () {
      clearInterval(poll);
    }, 5000);
  });
})();
