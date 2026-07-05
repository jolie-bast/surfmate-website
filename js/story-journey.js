/**
 * Scroll-driven story journey — single pinned stage
 */

const HOME_DOWNLOAD_BANNER_ID = "home-download-banner";
const HOME_DOWNLOAD_BANNER_STORAGE_KEY = "surfmate-home-download-banner";
/** Scroll progress through the story track that counts as “finished”. */
const STORY_COMPLETE_SCROLL_PROGRESS = 0.9;

function getHomeDownloadBanner() {
  return document.getElementById(HOME_DOWNLOAD_BANNER_ID);
}

function showHomeDownloadBanner() {
  const banner = getHomeDownloadBanner();
  if (!banner || banner.classList.contains("is-visible")) return;

  banner.classList.add("is-visible");
  banner.removeAttribute("hidden");

  try {
    sessionStorage.setItem(HOME_DOWNLOAD_BANNER_STORAGE_KEY, "1");
  } catch {
    // Ignore private browsing / quota errors.
  }
}

function restoreHomeDownloadBannerFromSession() {
  try {
    if (sessionStorage.getItem(HOME_DOWNLOAD_BANNER_STORAGE_KEY) !== "1") return;
  } catch {
    return;
  }

  showHomeDownloadBanner();
}

function initHomeDownloadBannerFallbackObserver(storyRoot) {
  const banner = getHomeDownloadBanner();
  if (!banner || banner.classList.contains("is-visible")) return;

  const lastScene = storyRoot?.querySelector(".story-scene--yours");
  if (!lastScene) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.45)) {
        showHomeDownloadBanner();
        observer.disconnect();
      }
    },
    { threshold: [0.45, 0.65] },
  );

  observer.observe(lastScene);
}

class StoryJourney {
  constructor(root) {
    this.root = root;
    this.track = root.querySelector(".story-scroll-track");
    this.stage = root.querySelector(".story-stage");
    this.scenes = [...root.querySelectorAll("[data-story-scene]")];
    this.progressFill = root.querySelector(".story-progress-fill");
    this.progressDots = [...root.querySelectorAll("[data-chapter-dot]")];
    this.wavePath = root.querySelector(".story-wave-path");
    this.currentChapter = -1;
    this.waveTime = 0;
    this.waveFrame = null;
    this.ticking = false;

    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (this.reducedMotion || !this.track) return;

    this.onScroll = this.onScroll.bind(this);
    this.animateWave = this.animateWave.bind(this);

    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onScroll, { passive: true });
    this.onScroll();
    this.startWaveAnimation();
  }

  clamp(value) {
    return Math.min(1, Math.max(0, value));
  }

  getScrollProgress() {
    const rect = this.track.getBoundingClientRect();
    const scrollable = this.track.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return this.clamp(-rect.top / scrollable);
  }

  mapRange(p, start, end) {
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  }

  setVisible(el, visible) {
    if (!el) return;
    el.classList.toggle("is-visible", visible);
  }

  resetScene(scene) {
    scene.querySelectorAll(".is-visible, .is-drawn").forEach((el) => {
      el.classList.remove("is-visible", "is-drawn");
    });
    scene.style.removeProperty("--ocean");
    scene.style.removeProperty("--wave");
  }

  animateDream(scene, p) {
    const ocean = this.mapRange(p, 0.12, 0.55);
    const wave = this.mapRange(p, 0.5, 0.85);

    scene.style.setProperty("--ocean", ocean);
    scene.style.setProperty("--wave", wave);

    this.setVisible(scene.querySelector('[data-story-line="dream-1"]'), p >= 0);
    this.setVisible(scene.querySelector('[data-story-line="dream-2"]'), p > 0.35);
  }

  animateFirstSurf(scene, p) {
    this.setVisible(scene.querySelector(".story-polaroid"), p > 0.08);
    this.setVisible(scene.querySelector('[data-story-line="first-1"]'), p > 0.22);

    const tattoo = scene.querySelector(".story-tattoo");
    if (p > 0.45) {
      tattoo.classList.add("is-visible");
      tattoo.classList.toggle("is-drawn", p > 0.55);
    } else {
      tattoo.classList.remove("is-visible", "is-drawn");
    }
  }

  animateLost(scene, p) {
    this.setVisible(scene.querySelector('[data-story-line="lost-1"]'), p > 0.05);

    const drift = this.mapRange(p, 0.15, 0.85);
    scene.querySelectorAll(".story-scatter").forEach((el, i) => {
      const show = p > 0.12 + i * 0.04;
      el.classList.toggle("is-visible", show);
      const dir = i % 2 === 0 ? 1 : -1;
      el.style.setProperty("--sx" + (i + 1), `${dir * drift * (30 + i * 12)}px`);
      el.style.setProperty("--sy" + (i + 1), `${drift * (20 + i * 8) * (i % 2 === 0 ? -1 : 1)}px`);
    });

    this.setVisible(scene.querySelector('[data-story-line="lost-chaos-1"]'), p > 0.28);
    this.setVisible(scene.querySelector('[data-story-line="lost-chaos-2"]'), p > 0.38);
    this.setVisible(scene.querySelector('[data-story-line="lost-chaos-3"]'), p > 0.48);
    this.setVisible(scene.querySelector('[data-story-line="lost-2"]'), p > 0.65);
  }

  animateTurning(scene, p) {
    const cards = scene.querySelectorAll(".story-memory-card");
    cards.forEach((card, i) => {
      this.setVisible(card, p > 0.18 + i * 0.1);
    });

    this.setVisible(scene.querySelector('[data-story-line="turning-1"]'), p > 0.55);
    this.setVisible(scene.querySelector('[data-story-line="turning-2"]'), p > 0.72);
  }

  animateYours(scene, p) {
    this.setVisible(scene.querySelector('[data-story-line="yours-1"]'), p > 0.08);
    this.setVisible(scene.querySelector('[data-story-line="yours-2"]'), p > 0.28);
    this.setVisible(scene.querySelector(".story-signature"), p > 0.45);
    this.setVisible(scene.querySelector(".story-cta-group"), p > 0.6);
  }

  animateChapter(scene, chapterIndex, localProgress) {
    switch (chapterIndex) {
      case 0:
        this.animateDream(scene, localProgress);
        break;
      case 1:
        this.animateFirstSurf(scene, localProgress);
        break;
      case 2:
        this.animateLost(scene, localProgress);
        break;
      case 3:
        this.animateTurning(scene, localProgress);
        break;
      case 4:
        this.animateYours(scene, localProgress);
        break;
      default:
        break;
    }
  }

  updateProgressUI(overall, chapterIndex) {
    const stageRect = this.stage?.getBoundingClientRect();
    const isStoryEngaged =
      stageRect &&
      stageRect.top <= 0 &&
      stageRect.bottom > window.innerHeight * 0.2;

    this.root.classList.toggle("is-active", Boolean(isStoryEngaged));

    if (this.progressFill) {
      const pct = `${overall * 100}%`;
      this.progressFill.style.height = pct;
      this.progressFill.style.width = "100%";
    }

    this.progressDots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === chapterIndex);
    });
  }

  update() {
    const overall = this.getScrollProgress();
    const count = this.scenes.length;
    const chapterIndex = Math.min(count - 1, Math.floor(overall * count));
    const localProgress =
      count > 0 ? this.clamp(overall * count - chapterIndex) : 0;

    if (chapterIndex !== this.currentChapter) {
      this.scenes.forEach((scene, i) => {
        if (i !== chapterIndex) this.resetScene(scene);
        scene.classList.toggle("is-active", i === chapterIndex);
      });
      this.currentChapter = chapterIndex;
    }

    this.animateChapter(this.scenes[chapterIndex], chapterIndex, localProgress);
    this.updateProgressUI(overall, chapterIndex);

    if (overall >= STORY_COMPLETE_SCROLL_PROGRESS) {
      showHomeDownloadBanner();
    }
  }

  onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      this.update();
      this.ticking = false;
    });
  }

  generateWavePath() {
    const svgWidth = 1000;
    const svgHeight = 300;
    const baseY = 140;
    const waveLength = 350;

    this.waveTime += 0.03;

    let pathData = `M0,${svgHeight}`;
    for (let x = 0; x <= svgWidth; x += 5) {
      const y =
        baseY +
        10 * Math.sin((x / waveLength) * 2 * Math.PI - this.waveTime) +
        40 * Math.sin(-this.waveTime + x / 200);
      pathData += ` L${x},${y}`;
    }
    pathData += ` L${svgWidth},${svgHeight} Z`;
    return pathData;
  }

  animateWave() {
    if (!this.wavePath) return;

    const dreamScene = this.root.querySelector(".story-scene--dream");
    const waveOpacity = dreamScene
      ? parseFloat(getComputedStyle(dreamScene).getPropertyValue("--wave") || "0")
      : 0;

    if (waveOpacity > 0.05 && dreamScene.classList.contains("is-active")) {
      this.wavePath.setAttribute("d", this.generateWavePath());
    }

    this.waveFrame = requestAnimationFrame(this.animateWave);
  }

  startWaveAnimation() {
    if (this.wavePath) this.animateWave();
  }
}

function configureStoryCtas() {
  const storeUrls = {
    "app-store":
      "https://apps.apple.com/de/app/surfmate-surf-log-connect/id6760191082",
    "play-store":
      "https://play.google.com/store/apps/details?id=com.joliebast.surfmateapp&pcampaignid=web_share",
  };

  document.querySelectorAll("[data-story-cta]").forEach((cta) => {
    const store = cta.dataset.storyCta;
    if (!storeUrls[store]) return;

    cta.href = storeUrls[store];
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
  });
}

function initStoryJourney() {
  const root = document.querySelector("[data-story-journey]");
  if (!root || root.dataset.storyInitialized === "true") return;

  root.dataset.storyInitialized = "true";
  configureStoryCtas();
  restoreHomeDownloadBannerFromSession();
  initHomeDownloadBannerFallbackObserver(root);
  new StoryJourney(root);
}

window.initStoryJourney = initStoryJourney;
