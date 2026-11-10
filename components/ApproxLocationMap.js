"use client";

import { useEffect, useRef, useState } from "react";

const LEAFLET_CSS = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";

// Coords from the spots API are already rounded. The circle marks that area
// instead of dropping a pin on a single point.
const MAP_ZOOM = 12;
const AREA_RADIUS_M = 2200;

function loadLeaflet() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);

  if (!loadLeaflet.promise) {
    loadLeaflet.promise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-leaflet-css="spot"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = LEAFLET_CSS;
        link.crossOrigin = "anonymous";
        link.dataset.leafletCss = "spot";
        document.head.appendChild(link);
      }

      const existing = document.querySelector('script[data-leaflet-js="spot"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(window.L), { once: true });
        existing.addEventListener("error", () => reject(new Error("Map failed to load")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = LEAFLET_JS;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.leafletJs = "spot";
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error("Map failed to load"));
      document.body.appendChild(script);
    });
  }

  return loadLeaflet.promise;
}

export default function ApproxLocationMap({ latitude, longitude, name }) {
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    if (!hasCoords || !canvasRef.current) return undefined;

    let map;
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !L || !canvasRef.current || canvasRef.current._leaflet_id) return;

        map = L.map(canvasRef.current, {
          scrollWheelZoom: false,
          zoomControl: false,
          attributionControl: true,
        }).setView([lat, lng], MAP_ZOOM);

        L.control.zoom({ position: "topright" }).addTo(map);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        L.circle([lat, lng], {
          radius: AREA_RADIUS_M,
          color: "#1A1A1A",
          weight: 2,
          fillColor: "#73C9EB",
          fillOpacity: 0.35,
        }).addTo(map);

        const refresh = () => map.invalidateSize();
        requestAnimationFrame(refresh);
        window.addEventListener("resize", refresh);
        map._spotRefresh = refresh;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (map) {
        window.removeEventListener("resize", map._spotRefresh);
        map.remove();
      }
    };
  }, [hasCoords, lat, lng]);

  return (
    <div className="spot-approx-map" role="region" aria-label={`Approximate location of ${name}`}>
      {hasCoords && !failed ? <div ref={canvasRef} className="spot-approx-map-canvas" /> : null}
      <span className="spot-approx-map-label">Approximate location</span>
    </div>
  );
}
