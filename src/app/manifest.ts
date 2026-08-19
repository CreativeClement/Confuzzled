import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Confuzzled",
    short_name: "Confuzzled",
    description:
      "Show Confuzzled the confusing thing. Get back a version you can follow, that does not invent safety-critical steps.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#2A338C",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
