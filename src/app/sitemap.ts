import { getAartis, getCategories } from "@/lib/data";
import { siteConfig } from "@/lib/seo";

export default function sitemap() {
  const staticRoutes = ["/", "/aartis", "/aarti", "/categories", "/about", "/pooja", "/bhajan"].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  const aartiRoutes = getAartis().map((aarti) => ({
    url: `${siteConfig.url}/aartis/${aarti.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8
  }));

  const categoryRoutes = getCategories().map((category) => ({
    url: `${siteConfig.url}/categories/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6
  }));

  return [...staticRoutes, ...aartiRoutes, ...categoryRoutes];
}
