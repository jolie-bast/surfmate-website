function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function revealTeamElements(elements) {
  elements.forEach((el) => el.classList.add("is-visible"));
}

function initTeamReveal() {
  const reveals = document.querySelectorAll(".team-reveal");
  if (!reveals.length) return;

  if (prefersReducedMotion()) {
    revealTeamElements(reveals);
    return;
  }

  const heroReveals = [...reveals].filter((el) =>
    el.dataset.teamReveal?.startsWith("hero-")
  );
  const cardReveals = [...reveals].filter((el) =>
    el.dataset.teamReveal?.startsWith("card-")
  );

  requestAnimationFrame(() => {
    revealTeamElements(heroReveals);
  });

  if (!cardReveals.length) return;

  if (!("IntersectionObserver" in window)) {
    revealTeamElements(cardReveals);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      root: null,
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  cardReveals.forEach((card) => observer.observe(card));
}

function initTeamPage() {
  if (!document.body.classList.contains("team-page")) return;
  initTeamReveal();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTeamPage);
} else {
  initTeamPage();
}
