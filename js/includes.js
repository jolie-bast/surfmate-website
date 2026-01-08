// Include Manager für HTML Partials
class IncludeManager {
  static async loadIncludes() {
    const includes = document.querySelectorAll("[data-include]");

    for (const include of includes) {
      try {
        const file = include.getAttribute("data-include");
        const response = await fetch(`./includes/${file}`);

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

// Lade Includes wenn DOM geladen ist
document.addEventListener("DOMContentLoaded", () => {
  IncludeManager.loadIncludes();
});
