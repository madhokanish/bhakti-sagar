import { siteConfig } from "@/lib/seo";
export default function manifest() {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#FFF1DD",
    theme_color: "#E56A20",
    icons: [
      {
        src: "/favicon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/brand/bhakti-chat-logo-512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/brand/bhakti-chat-logo-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
