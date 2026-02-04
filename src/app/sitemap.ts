import { getAartis, getCategories } from "@/lib/data";
import { siteConfig } from "@/lib/seo";

export default function sitemap() {
  const staticRoutes = ["/", "/aartis", "/categories", "/about"].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date()
  }));

  const aartiRoutes = getAartis().map((aarti) => ({
    url: `${siteConfig.url}/aartis/${aarti.slug}`,
    lastModified: new Date()
  }));

  const categoryRoutes = getCategories().map((category) => ({
    url: `${siteConfig.url}/categories/${category.slug}`,
    lastModified: new Date()
  }));

  return [...staticRoutes, ...aartiRoutes, ...categoryRoutes];
}
