import { siteConfig } from "@/lib/seo";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/aartis?*", "/search", "/search*"]
    },
    sitemap: `${siteConfig.url}/sitemap.xml`
  };
}
