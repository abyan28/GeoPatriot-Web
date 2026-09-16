import type { MetadataRoute } from "next";

/**
 * Web App Manifest untuk GeoPatriot Web (Phase 12 / PRD #19 / Rules #14).
 * Mengonfigurasi metadata instalasi PWA: standalone mode, tema Deep Navy, dan orientasi portrait.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GeoPatriot Web — GPS Camera",
    short_name: "GeoPatriot",
    description:
      "Kamera GPS dokumentasi lapangan dengan penanaman metadata lokasi dan waktu terverifikasi. Local-first, aman, dan tanpa upload server.",
    start_url: "/",
    display: "standalone",
    background_color: "#08111d",
    theme_color: "#08111d",
    orientation: "portrait",
    categories: ["photography", "utilities", "productivity"],
    icons: [
      {
        src: "/app-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
