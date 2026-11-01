import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Christhood Ministries",
    short_name: "Christhood",
    description: "Believe. Belong. Become.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    theme_color: "#2d0f5a",
    background_color: "#130a26",
    icons: [{ src: "/logo.png", sizes: "640x640", type: "image/png", purpose: "any" }],
  };
}
