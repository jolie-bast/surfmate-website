// Include Manager für HTML Partials
class IncludeManager {
  static async loadIncludes() {
    const includes = document.querySelectorAll("[data-include]");

    for (const include of includes) {
      try {
        const file = include.getAttribute("data-include");
        const response = await fetch(`/includes/${file}`);

        if (response.ok) {
          const content = await response.text();
          include.innerHTML = content;
          include.removeAttribute("data-include");
        } else {
          console.error(`Fehler beim Laden von ${file}:`, response.status);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Include-Datei:", error);
      }
    }
  }
}

function isAppleDevice() {
  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMacOS = /Macintosh|Mac OS X/i.test(ua) || /Mac/i.test(platform);

  return isIOS || isMacOS;
}

function isAndroidDevice() {
  const ua = navigator.userAgent || "";
  return /Android/i.test(ua);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeText(element, text, speedMs = 40) {
  if (!element) return;

  const content = typeof text === "string" ? text : "";
  element.textContent = "";

  if (!content) return;

  element.classList.add("is-typing");

  for (const character of content) {
    element.textContent += character;
    await sleep(speedMs);
  }

  element.classList.remove("is-typing");
}

function revealHeroCta(ctaElement) {
  if (!ctaElement) return;

  ctaElement.classList.remove("hero-cta-hidden");
  requestAnimationFrame(() => {
    ctaElement.classList.add("hero-cta-visible");
  });
}

function revealHeroSubtitle(subtitleElement, text) {
  if (!subtitleElement) return;

  subtitleElement.textContent = text || "";
  subtitleElement.classList.remove("hero-subtitle-hidden");
  requestAnimationFrame(() => {
    subtitleElement.classList.add("hero-subtitle-visible");
  });
}

async function runHeroTypewriterSequence() {
  const title = document.querySelector("[data-typewriter-title]");
  const subtitle = document.querySelector("[data-typewriter-subtitle]");
  const cta = document.querySelector("[data-typewriter-cta]");

  const baseTitleText = title?.getAttribute("data-text") || "";
  const isMobileViewport = window.matchMedia("(max-width: 768px)").matches;
  const titleText = isMobileViewport
    ? baseTitleText.replace(". ", ".\n")
    : baseTitleText;
  const subtitleText = subtitle?.getAttribute("data-text") || "";

  if (!title || !subtitle || !cta) {
    if (title && titleText) title.textContent = titleText;
    if (subtitle && subtitleText) revealHeroSubtitle(subtitle, subtitleText);
    revealHeroCta(cta);
    return;
  }

  if (prefersReducedMotion()) {
    title.textContent = titleText;
    revealHeroSubtitle(subtitle, subtitleText);
    revealHeroCta(cta);
    return;
  }

  subtitle.classList.add("hero-subtitle-hidden");
  subtitle.classList.remove("hero-subtitle-visible");
  cta.classList.add("hero-cta-hidden");
  cta.classList.remove("hero-cta-visible");

  await typeText(title, titleText, 52);
  await sleep(220);
  revealHeroSubtitle(subtitle, subtitleText);
  await sleep(120);
  revealHeroCta(cta);
}

function revealCommunityCopy(communityHeading) {
  if (!communityHeading) return;

  communityHeading.classList.remove("community-copy-hidden");
  requestAnimationFrame(() => {
    communityHeading.classList.add("community-copy-visible");
  });
}

function revealAboutIntroCopy(copyElement) {
  if (!copyElement) return;

  copyElement.classList.remove("about-intro-copy-hidden");
  requestAnimationFrame(() => {
    copyElement.classList.add("about-intro-copy-visible");
  });
}

async function runAboutIntroTypewriterSequence() {
  const aboutTitle = document.querySelector("[data-typewriter-about-title]");
  const aboutTitleText = aboutTitle?.getAttribute("data-text") || "";
  const aboutCopy = document.querySelector(".about-intro-copy");

  if (!aboutTitle) {
    revealAboutIntroCopy(aboutCopy);
    return;
  }

  if (!aboutTitleText) {
    aboutTitle.textContent = "What is Surfmate?";
    revealAboutIntroCopy(aboutCopy);
    return;
  }

  if (prefersReducedMotion()) {
    aboutTitle.textContent = aboutTitleText;
    revealAboutIntroCopy(aboutCopy);
    return;
  }

  aboutCopy?.classList.add("about-intro-copy-hidden");
  aboutCopy?.classList.remove("about-intro-copy-visible");

  await typeText(aboutTitle, aboutTitleText, 44);
  await sleep(140);
  revealAboutIntroCopy(aboutCopy);
}

function initAboutIntroOnView() {
  const aboutTitle = document.querySelector("[data-typewriter-about-title]");
  if (!aboutTitle) return;

  const runOnce = async () => {
    if (aboutTitle.dataset.typed === "true") return;
    aboutTitle.dataset.typed = "true";
    await runAboutIntroTypewriterSequence();
  };

  if (!("IntersectionObserver" in window)) {
    runOnce();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      runOnce();
    },
    {
      root: null,
      threshold: 0.35,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  observer.observe(aboutTitle);
}

function initCommunityTypewriterOnView() {
  const communityHeading = document.querySelector(".community-typewriter");
  if (!communityHeading) return;

  const runOnce = async () => {
    if (communityHeading.dataset.typed === "true") return;
    communityHeading.dataset.typed = "true";
    revealCommunityCopy(communityHeading);
  };

  if (prefersReducedMotion()) {
    revealCommunityCopy(communityHeading);
    return;
  }

  if (!("IntersectionObserver" in window)) {
    runOnce();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      runOnce();
    },
    {
      root: null,
      threshold: 0.35,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  observer.observe(communityHeading);
}

function initUseCasesOnView() {
  const useCasesSection = document.querySelector(".use-cases-section");
  const cards = Array.from(document.querySelectorAll(".use-case-card"));
  if (!cards.length) return;

  const revealCards = () => {
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add("is-visible");
      }, index * 130);
    });
  };

  if (prefersReducedMotion()) {
    cards.forEach((card) => {
      card.classList.add("is-visible");
    });
    return;
  }

  cards.forEach((card) => {
    card.classList.add("reveal-init");
  });

  if (!("IntersectionObserver" in window)) {
    revealCards();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      revealCards();
    },
    {
      root: null,
      threshold: 0.25,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  observer.observe(useCasesSection || cards[0]);
}

async function typeInputPlaceholder(inputElement, text, speedMs = 40) {
  if (!inputElement) return;

  const content = typeof text === "string" ? text : "";
  inputElement.placeholder = "";

  for (const character of content) {
    inputElement.placeholder += character;
    await sleep(speedMs);
  }
}

function initWaitlistPlaceholderTypewriterOnView() {
  const emailInput = document.getElementById("waitlist-email");
  if (!emailInput) return;

  const placeholderText =
    emailInput.getAttribute("placeholder") || "Your Email Address";

  const setFinalPlaceholder = () => {
    if (!emailInput.value) {
      emailInput.placeholder = placeholderText;
    }
  };

  if (prefersReducedMotion()) {
    setFinalPlaceholder();
    return;
  }

  let userInteracted = false;
  const markInteracted = () => {
    userInteracted = true;
  };

  emailInput.addEventListener("focus", markInteracted, { once: true });
  emailInput.addEventListener("input", markInteracted, { once: true });
  emailInput.addEventListener("pointerdown", markInteracted, { once: true });

  const runOnce = async () => {
    if (emailInput.dataset.placeholderTyped === "true") return;
    emailInput.dataset.placeholderTyped = "true";

    if (emailInput.value || userInteracted) {
      setFinalPlaceholder();
      return;
    }

    // Delay start slightly so the animation doesn't trigger too aggressively.
    await sleep(500);
    if (emailInput.value || userInteracted) {
      setFinalPlaceholder();
      return;
    }

    emailInput.placeholder = "";

    for (const character of placeholderText) {
      if (userInteracted || emailInput.value) {
        setFinalPlaceholder();
        return;
      }
      emailInput.placeholder += character;
      await sleep(42);
    }
  };

  if (!("IntersectionObserver" in window)) {
    runOnce();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      runOnce();
    },
    {
      root: null,
      threshold: 0.35,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  observer.observe(emailInput);
}

function configureHeroCtaByPlatform() {
  const storeUrls = {
    "app-store":
      "https://apps.apple.com/de/app/surfmate-surf-log-connect/id6760191082",
    "play-store":
      "https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp&pcampaignid=web_share",
  };

  document.querySelectorAll("[data-hero-store]").forEach((cta) => {
    const store = cta.dataset.heroStore;
    if (!storeUrls[store]) return;

    cta.href = storeUrls[store];
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
  });
}

function getSafeAreaTopInset() {
  return "env(safe-area-inset-top, 0px)";
}

function findConnectionBannerCandidate() {
  const selectors = [
    ".no-connection-banner",
    ".offline-banner",
    ".network-status-banner",
    "[data-connection-banner]",
    "[data-network-banner]",
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  const candidates = document.querySelectorAll("div, section, aside");
  for (const element of candidates) {
    const text = (element.textContent || "").trim().toLowerCase();
    if (!text) continue;

    if (
      text.includes("no connection") ||
      text.includes("no internet") ||
      text.includes("keine verbindung")
    ) {
      return element;
    }
  }

  return null;
}

function adjustNoConnectionBannerForApple() {
  if (!isAppleDevice()) return;

  const banner = findConnectionBannerCandidate();
  if (!banner) return;

  banner.style.top = getSafeAreaTopInset();
  banner.style.transform = "none";
  banner.style.zIndex = "2100";
  banner.style.left = "0";
  banner.style.right = "0";
}

function initNoConnectionBannerAdjustment() {
  if (!isAppleDevice()) return;

  adjustNoConnectionBannerForApple();

  const observer = new MutationObserver(() => {
    adjustNoConnectionBannerForApple();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function getHashTargetElement(hash) {
  if (!hash || hash === "#") return null;

  const decodedHash = decodeURIComponent(hash);

  try {
    return document.querySelector(decodedHash);
  } catch {
    const id = decodedHash.replace(/^#/, "");
    return document.getElementById(id);
  }
}

function scrollToHash(hash, { behavior = "auto", attempts = 0 } = {}) {
  if (!hash || hash === "#") return;

  const targetElement = getHashTargetElement(hash);

  if (targetElement) {
    const header = document.querySelector(".header");
    const headerHeight = header
      ? Math.max(header.getBoundingClientRect().height, 80)
      : 80;
    const targetTop =
      targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior,
    });

    return;
  }

  if (attempts < 12) {
    setTimeout(() => {
      scrollToHash(hash, { behavior, attempts: attempts + 1 });
    }, 150);
  }
}

function scrollToCurrentHash({ behavior = "auto", attempts = 0 } = {}) {
  scrollToHash(window.location.hash, { behavior, attempts });
}

window.scrollToHash = scrollToHash;

// Lade Includes wenn DOM geladen ist

document.addEventListener("DOMContentLoaded", () => {
  initNoConnectionBannerAdjustment();

  IncludeManager.loadIncludes()
    .then(async () => {
      configureHeroCtaByPlatform();
      await runHeroTypewriterSequence();
      initAboutIntroOnView();
      initUseCasesOnView();
      initCommunityTypewriterOnView();
      initWaitlistPlaceholderTypewriterOnView();

      // Initialisiere Custom Scrollbars und Navigation nach dem Laden der Includes
      if (typeof window.initCustomScrollbars === "function") {
        window.initCustomScrollbars();
      }
      if (typeof window.initNavigation === "function") {
        window.initNavigation();
      }
      if (typeof window.initFaq === "function") {
        window.initFaq();
      }
      if (typeof window.initStoryJourney === "function") {
        window.initStoryJourney();
      }

      // Important for links like /index.html#newsletter:
      // the target may only exist after includes are rendered.
      scrollToCurrentHash({ behavior: "auto" });
    })
    .catch((error) => {
      console.error("Fehler beim Laden der Includes:", error);
    });
});

window.addEventListener("hashchange", () => {
  scrollToCurrentHash({ behavior: "smooth" });
});
