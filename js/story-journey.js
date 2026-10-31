/**
 * Home download banner appears after the story has been read.
 * The story itself is static.
 */

const HOME_DOWNLOAD_BANNER_ID = "home-download-banner";
const HOME_DOWNLOAD_BANNER_STORAGE_KEY = "surfmate-home-download-banner";
const HOME_SCROLL_DIRECTION_THRESHOLD = 6;

let homeDownloadBannerUnlocked = false;
let lastHomeScrollY = typeof window !== "undefined" ? window.scrollY : 0;
let bannerScrollBound = false;

function getHomeDownloadBanner() {
  return document.getElementById(HOME_DOWNLOAD_BANNER_ID);
}

function showHomeDownloadBanner() {
  const banner = getHomeDownloadBanner();
  if (!banner || banner.classList.contains("is-visible")) return;

  homeDownloadBannerUnlocked = true;
  banner.classList.add("is-visible");
  banner.removeAttribute("hidden");

  try {
    sessionStorage.setItem(HOME_DOWNLOAD_BANNER_STORAGE_KEY, "1");
  } catch {
    // Ignore private browsing / quota errors.
  }
}

function hideHomeDownloadBanner() {
  const banner = getHomeDownloadBanner();
  if (!banner || !banner.classList.contains("is-visible")) return;

  banner.classList.remove("is-visible");
  banner.setAttribute("hidden", "");
}

function getHomeScrollDirection() {
  const currentScrollY = window.scrollY;
  const delta = currentScrollY - lastHomeScrollY;

  if (Math.abs(delta) < HOME_SCROLL_DIRECTION_THRESHOLD) {
    return null;
  }

  lastHomeScrollY = currentScrollY;
  return delta > 0 ? "down" : "up";
}

function hasReadStory() {
  const story = document.getElementById("story");
  if (!story) return false;

  return story.getBoundingClientRect().bottom <= window.innerHeight * 0.92;
}

function syncHomeDownloadBannerOnScroll() {
  const eligible = hasReadStory();

  if (!eligible) {
    if (homeDownloadBannerUnlocked) hideHomeDownloadBanner();
    lastHomeScrollY = window.scrollY;
    return;
  }

  if (!homeDownloadBannerUnlocked) {
    showHomeDownloadBanner();
    lastHomeScrollY = window.scrollY;
    return;
  }

  const direction = getHomeScrollDirection();
  if (direction === "up") hideHomeDownloadBanner();
  else if (direction === "down") showHomeDownloadBanner();
}

function initHomeDownloadBannerScrollBehavior() {
  if (bannerScrollBound || !getHomeDownloadBanner()) return;

  bannerScrollBound = true;
  lastHomeScrollY = window.scrollY;
  window.addEventListener("scroll", syncHomeDownloadBannerOnScroll, {
    passive: true,
  });
}

function restoreHomeDownloadBannerFromSession() {
  try {
    if (sessionStorage.getItem(HOME_DOWNLOAD_BANNER_STORAGE_KEY) !== "1") return;
  } catch {
    return;
  }

  homeDownloadBannerUnlocked = true;
  showHomeDownloadBanner();
}

function initStoryJourney() {
  const root = document.getElementById("story");
  if (!root || root.dataset.storyInitialized === "true") return;

  root.dataset.storyInitialized = "true";
  restoreHomeDownloadBannerFromSession();
  initHomeDownloadBannerScrollBehavior();
  syncHomeDownloadBannerOnScroll();
}

function syncStoryJourney() {
  syncHomeDownloadBannerOnScroll();
}

window.initStoryJourney = initStoryJourney;
window.syncStoryJourney = syncStoryJourney;
