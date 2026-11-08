/**
 * Features Carousel Component
 * Handles touch/swipe scrolling through feature cards
 */
class FeaturesCarousel {
  constructor() {
    this.carousel = null;
    this.track = null;
    this.cards = null;
    this.currentIndex = 0;
    this.cardsVisible = 3;
    this.cardWidth = 304; // 280px + 24px gap
    this.isDown = false;
    this.startX = 0;
    this.scrollLeft = 0;

    this.init();
  }

  init() {
    // Wait for includes to load, then initialize
    this.waitForElements();
  }

  waitForElements() {
    let attempts = 0;
    const maxAttempts = 20;

    const checkForElements = () => {
      attempts++;
      console.log(
        `🔍 Checking for carousel elements... Attempt ${attempts}/${maxAttempts}`
      );

      this.findElements();

      if (this.track && this.cards.length > 0) {
        console.log("✅ Carousel elements found!");
        this.calculateDimensions();
        this.bindEvents();
        console.log("🎠 Carousel initialized successfully");
      } else if (attempts < maxAttempts) {
        console.log("⏳ Elements not found yet, retrying in 200ms...");
        setTimeout(checkForElements, 200);
      } else {
        console.error(
          "❌ Could not find carousel elements after",
          maxAttempts,
          "attempts"
        );
      }
    };

    // Start checking immediately and also after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", checkForElements);
    } else {
      checkForElements();
    }
  }

  findElements() {
    this.carousel = document.querySelector(".features-carousel");
    this.track = document.querySelector(".carousel-track");
    this.cards = document.querySelectorAll(".feature-card");

    console.log("Elements found:", {
      carousel: !!this.carousel,
      track: !!this.track,
      cards: this.cards.length,
    });
  }

  calculateDimensions() {
    if (window.innerWidth <= 768) {
      this.cardsVisible = 1;
      this.cardWidth = 266; // 250px + 16px gap
    } else if (window.innerWidth <= 1024) {
      this.cardsVisible = 2;
      this.cardWidth = 304; // 280px + 24px gap
    } else {
      this.cardsVisible = 3;
      this.cardWidth = 304; // 280px + 24px gap
    }
  }

  bindEvents() {
    if (!this.track) return;

    // Mouse events
    this.track.addEventListener("mousedown", (e) => {
      this.isDown = true;
      this.track.style.cursor = "grabbing";
      this.startX = e.pageX - this.track.offsetLeft;
      this.scrollLeft = this.track.scrollLeft;
      console.log("Mouse down at:", this.startX);
    });

    this.track.addEventListener("mouseleave", () => {
      this.isDown = false;
      this.track.style.cursor = "grab";
    });

    this.track.addEventListener("mouseup", (e) => {
      this.isDown = false;
      this.track.style.cursor = "grab";

      // Calculate swipe distance
      const x = e.pageX - this.track.offsetLeft;
      const walk = x - this.startX;
      console.log("Mouse up, walk distance:", walk);

      if (Math.abs(walk) > 50) {
        if (walk < 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      }
    });

    this.track.addEventListener("mousemove", (e) => {
      if (!this.isDown) return;
      e.preventDefault();
      const x = e.pageX - this.track.offsetLeft;
      const walk = (x - this.startX) * 2;
      this.track.scrollLeft = this.scrollLeft - walk;
    });

    // Touch events
    this.track.addEventListener("touchstart", (e) => {
      this.startX = e.touches[0].clientX;
      console.log("Touch start at:", this.startX);
    });

    this.track.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      const diffX = this.startX - endX;
      console.log("Touch end, diff:", diffX);

      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      }
    });

    // Resize handler
    window.addEventListener("resize", () => {
      this.calculateDimensions();
    });

    // Initial setup
    this.track.style.cursor = "grab";
    this.track.style.userSelect = "none";
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateCarousel();
      console.log("Previous slide, index:", this.currentIndex);
    }
  }

  nextSlide() {
    const maxIndex = this.cards.length - this.cardsVisible;
    if (this.currentIndex < maxIndex) {
      this.currentIndex++;
      this.updateCarousel();
      console.log("Next slide, index:", this.currentIndex);
    }
  }

  updateCarousel() {
    if (!this.track) return;

    const translateX = -(this.currentIndex * this.cardWidth);
    this.track.style.transform = `translateX(${translateX}px)`;
    console.log("Updating carousel, translateX:", translateX);
  }
}

// Initialize carousel
document.addEventListener("DOMContentLoaded", () => {
  new FeaturesCarousel();
});
