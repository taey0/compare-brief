import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pickle",
    short_name: "Pickle",
    description: "Pick the best. Skip the rest. Compare anything in seconds.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a7f37",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
