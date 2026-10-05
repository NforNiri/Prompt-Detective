import type { MetadataRoute } from "next";
import { en } from "@/lib/i18n/en";

// Installable PWA. No service worker on purpose: puzzle data is never cached offline.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: en.appName,
    short_name: en.appName,
    description: en.tagline,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0d10",
    theme_color: "#0b0d10",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
