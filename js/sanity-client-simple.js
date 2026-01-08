// Einfacher Sanity Client ohne externe Dependencies
class SimpleSanityClient {
  constructor(config) {
    this.projectId = config.projectId;
    this.dataset = config.dataset;
    this.apiVersion = config.apiVersion;
    this.baseUrl = `https://${this.projectId}.api.sanity.io/v${this.apiVersion}/data/query/${this.dataset}`;
  }

  async fetch(query) {
    try {
      console.log("📡 Sende Anfrage an Sanity:", query);
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}?query=${encodedQuery}`;

      console.log("🔗 URL:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📦 Sanity Response:", data);

      return data.result;
    } catch (error) {
      console.error("❌ Sanity Fetch Error:", error);
      throw error;
    }
  }
}

// Client initialisieren
const client = new SimpleSanityClient({
  projectId: "zjxdm42e",
  dataset: "production",
  apiVersion: "2024-01-01",
});

// Einfache Image URL Funktion
function urlFor(imageRef) {
  if (!imageRef || !imageRef._id) return "";

  const imageId = imageRef._id
    .replace("image-", "")
    .replace("-jpg", ".jpg")
    .replace("-png", ".png")
    .replace("-webp", ".webp");
  return `https://cdn.sanity.io/images/zjxdm42e/production/${imageId}`;
}

console.log("✅ Sanity Client initialisiert");
