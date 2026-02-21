import { siteConfig } from "@/lib/seo";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/signin",
        "/profile",
        "/account",
        "/manage-subscription",
        "/subscribe",
        "/search",
        "/search*"
      ]
    },
    sitemap: `${siteConfig.url}/sitemap.xml`
  };
}
