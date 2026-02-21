import { siteConfig } from "@/lib/seo";
import { BRAND_LOGO_PATH } from "@/lib/brand";

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
        src: BRAND_LOGO_PATH,
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
