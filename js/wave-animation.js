/**
 * Wave Animation Component
 * Animates the wave mask for the Surfmate logo
 */
class WaveAnimation {
  constructor(wavePathId = "wave-path") {
    this.waveElement = document.getElementById(wavePathId);
    this.svgWidth = 1000;
    this.svgHeight = 300;
    this.baseY = 140;
    this.amplitude = 10;
    this.frequency = 2;
    this.waveLength = 350;
    this.time = 0;
    this.animationId = null;

    if (this.waveElement) {
      this.startAnimation();
    }
  }

  generateWavePath() {
    this.time += 0.03; // Langsamere Animation (war 0.05)

    // Start unten links
    let pathData = `M0,${this.svgHeight}`;

    // Wellenlinie generieren
    for (let x = 0; x <= this.svgWidth; x += 5) {
      const y =
        this.baseY +
        this.amplitude *
          Math.sin((x / this.waveLength) * 2 * Math.PI - this.time) +
        40 * Math.sin(-this.time + x / 200);
      pathData += ` L${x},${y}`;
    }

    // Rechts unten zurück und Pfad schließen
    pathData += ` L${this.svgWidth},${this.svgHeight} Z`;

    return pathData;
  }

  animate() {
    if (!this.waveElement) return;

    const pathData = this.generateWavePath();
    this.waveElement.setAttribute("d", pathData);

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  startAnimation() {
    this.animate();
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // Pause animation when page is not visible (performance optimization)
  handleVisibilityChange() {
    if (document.hidden) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  }
}

// Initialize wave animation when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Original wave animation (if it exists)
  const waveAnimation = new WaveAnimation();

  // Logo animation section wave animation
  const logoWaveAnimation = new WaveAnimation("wave-path-animation");

  // Optimize performance by pausing animation when tab is not visible
  document.addEventListener("visibilitychange", () => {
    waveAnimation.handleVisibilityChange();
    logoWaveAnimation.handleVisibilityChange();
  });
});
