// Einfacher Content Manager
class ContentManager {
  constructor() {
    console.log("🚀 Content Manager wird initialisiert...");
    this.init();
  }

  async init() {
    console.log("🔄 Content Manager Init gestartet");
    try {
      await this.loadHeroContent();
      await this.loadAboutContent();
    } catch (error) {
      console.error("❌ Fehler beim Laden der CMS-Inhalte:", error);
    }
  }

  async loadHeroContent() {
    try {
      console.log("🔄 Lade Hero Content aus Sanity...");

      const query =
        '*[_type == "hero" && isActive == true][0]{title, subtitle, backgroundImage{asset->{_id, url}, alt}}';
      const heroData = await client.fetch(query);

      console.log("📦 Hero Data erhalten:", heroData);

      if (heroData) {
        this.updateHeroSection(heroData);
        console.log("✅ Hero Content aktualisiert");
      } else {
        console.log(
          "⚠️ Keine Hero-Daten gefunden - prüfe ob Hero-Document existiert und isActive=true ist"
        );
      }
    } catch (error) {
      console.error("❌ Fehler beim Laden der Hero-Daten:", error);
    }
  }

  async loadAboutContent() {
    try {
      console.log("🔄 Lade About Content aus Sanity...");

      const query =
        '*[_type == "about" && isActive == true][0]{mainSection{title, content}, darkSection{headline, content, backgroundImage{asset->{_id, url}, alt}}}';
      const aboutData = await client.fetch(query);

      console.log("📦 About Data erhalten:", aboutData);

      if (aboutData) {
        this.updateAboutSection(aboutData);
        console.log("✅ About Content aktualisiert");
      } else {
        console.log(
          "⚠️ Keine About-Daten gefunden - prüfe ob About-Document existiert und isActive=true ist"
        );
      }
    } catch (error) {
      console.error("❌ Fehler beim Laden der About-Daten:", error);
    }
  }

  updateHeroSection(data) {
    console.log("🎯 updateHeroSection aufgerufen mit:", data);

    const heroTitle = document.querySelector('[data-cms="hero-title"]');
    const heroSubtitle = document.querySelector('[data-cms="hero-subtitle"]');
    const heroImage = document.querySelector('[data-cms="hero-bg-image"]');

    console.log("🔍 Gefundene Hero-Elemente:", {
      heroTitle: !!heroTitle,
      heroSubtitle: !!heroSubtitle,
      heroImage: !!heroImage,
    });

    if (heroTitle && data.title) {
      console.log("📝 Setze Hero Title:", data.title);
      heroTitle.textContent = data.title;
    } else {
      console.log("⚠️ Hero Title nicht gefunden oder leer:", {
        element: !!heroTitle,
        data: data.title,
      });
    }

    if (heroSubtitle && data.subtitle) {
      console.log("📝 Setze Hero Subtitle:", data.subtitle);
      heroSubtitle.textContent = data.subtitle;
    }

    if (heroImage && data.backgroundImage?.asset) {
      const imageUrl = urlFor(data.backgroundImage.asset);
      console.log("🖼️ Setze Hero Image:", imageUrl);
      heroImage.src = imageUrl;
      heroImage.alt = data.backgroundImage.alt || "Hero Background";
    }
  }

  updateAboutSection(data) {
    console.log("🎯 updateAboutSection aufgerufen mit:", data);

    // Main Section
    const mainTitle = document.querySelector('[data-cms="about-title"]');
    const mainContent = document.querySelector('[data-cms="about-content"]');

    console.log("🔍 Gefundene About-Main-Elemente:", {
      mainTitle: !!mainTitle,
      mainContent: !!mainContent,
    });

    if (mainTitle && data.mainSection?.title) {
      console.log("📝 Setze About Title:", data.mainSection.title);
      mainTitle.textContent = data.mainSection.title;
    }

    if (mainContent && data.mainSection?.content) {
      const htmlContent = this.portableTextToHtml(data.mainSection.content);
      console.log("📝 Setze About Content:", htmlContent);
      mainContent.innerHTML = htmlContent;
    }

    // Dark Section
    const darkHeadline = document.querySelector(
      '[data-cms="about-dark-headline"]'
    );
    const darkContent = document.querySelector(
      '[data-cms="about-dark-content"]'
    );

    console.log("🔍 Gefundene About-Dark-Elemente:", {
      darkHeadline: !!darkHeadline,
      darkContent: !!darkContent,
    });

    if (darkHeadline && data.darkSection?.headline) {
      console.log("📝 Setze Dark Headline:", data.darkSection.headline);
      darkHeadline.textContent = data.darkSection.headline;
    }

    if (darkContent && data.darkSection?.content) {
      const htmlContent = this.portableTextToHtml(data.darkSection.content);
      console.log("📝 Setze Dark Content:", htmlContent);
      darkContent.innerHTML = htmlContent;
    }

    // Dark Section Background Image
    if (data.darkSection?.backgroundImage?.asset) {
      const imageUrl = urlFor(data.darkSection.backgroundImage.asset);
      const darkSection = document.querySelector('[data-cms="about-dark"]');
      if (darkSection) {
        console.log("🖼️ Setze Dark Background:", imageUrl);
        darkSection.style.setProperty("--dark-bg-image", `url('${imageUrl}')`);
      }
    }
  }

  // Einfache Portable Text zu HTML Konvertierung
  portableTextToHtml(blocks) {
    if (!blocks || !Array.isArray(blocks)) return "";

    return blocks
      .map((block) => {
        if (block._type === "block") {
          const children =
            block.children
              ?.map((child) => {
                let text = child.text || "";

                if (child.marks?.includes("strong")) {
                  text = `<strong>${text}</strong>`;
                }
                if (child.marks?.includes("em")) {
                  text = `<em>${text}</em>`;
                }

                return text;
              })
              .join("") || "";

          switch (block.style) {
            case "h3":
              return `<h3>${children}</h3>`;
            case "h4":
              return `<h4>${children}</h4>`;
            default:
              return `<p>${children}</p>`;
          }
        }
        return "";
      })
      .join("");
  }
}

// Initialize Content Manager when DOM is loaded and includes are loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 DOM geladen, warte auf Include-Dateien...");

  // Warte auf die Include-Dateien bevor Content Manager gestartet wird
  setTimeout(() => {
    console.log("⏰ Starte Content Manager nach Include-Wartezeit");
    new ContentManager();
  }, 500); // 500ms sollten genug sein für die Include-Dateien
});
