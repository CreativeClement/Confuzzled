import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Confuzzled",
    short_name: "Confuzzled",
    description:
      "Show Confuzzled the confusing thing. Get back a version you can follow, that does not invent safety-critical steps.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#7C3AED",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
