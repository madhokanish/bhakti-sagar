import { getAartis, getCategories } from "@/lib/data";
import { siteConfig } from "@/lib/seo";
import { chalisas, deityHubs, festivals, mantras, poojaGuides } from "@/lib/content";

export default function sitemap() {
  const staticRoutes = ["/", "/aartis", "/aarti", "/categories", "/about", "/pooja", "/bhajan", "/deity", "/festival", "/mantra", "/chalisa"].map((path) => ({
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

  const deityRoutes = deityHubs.map((deity) => ({
    url: `${siteConfig.url}/deity/${deity.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6
  }));

  const festivalRoutes = festivals.map((festival) => ({
    url: `${siteConfig.url}/festival/${festival.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6
  }));

  const poojaRoutes = poojaGuides.map((guide) => ({
    url: `${siteConfig.url}/pooja/${guide.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5
  }));

  const mantraRoutes = mantras.map((mantra) => ({
    url: `${siteConfig.url}/mantra/${mantra.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.4
  }));

  const chalisaRoutes = chalisas.map((chalisa) => ({
    url: `${siteConfig.url}/chalisa/${chalisa.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.4
  }));

  return [
    ...staticRoutes,
    ...aartiRoutes,
    ...categoryRoutes,
    ...deityRoutes,
    ...festivalRoutes,
    ...poojaRoutes,
    ...mantraRoutes,
    ...chalisaRoutes
  ];
}
