import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Melyia — Pure Malaysian Honey",
    short_name: "Melyia",
    description: "Shop single-origin Malaysian honey from Melyia.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6efe1",
    theme_color: "#1a1410",
    orientation: "portrait-primary",
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
