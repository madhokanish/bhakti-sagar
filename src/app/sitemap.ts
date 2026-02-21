import type { MetadataRoute } from "next";
import { getAartis, getCategories } from "@/lib/data";
import { chalisas, deityHubs, festivals, mantras, poojaGuides } from "@/lib/content";
import { siteConfig } from "@/lib/seo";

const LOCALES: Array<"en" | "hi"> = ["en", "hi"];

const staticRoutes = [
  "",
  "/bhaktigpt/chat",
  "/krishna",
  "/krishna/mantra",
  "/krishna/aarti",
  "/krishna/chalisa",
  "/krishna/bhajan",
  "/krishna/gita-shlok",
  "/lakshmi",
  "/lakshmi/mantra",
  "/lakshmi/aarti",
  "/lakshmi/chalisa",
  "/lakshmi/puja-vidhi",
  "/lakshmi/katha",
  "/shani",
  "/shani/mantra",
  "/shani/aarti",
  "/shani/chalisa",
  "/shani/vrat-katha",
  "/shani/puja-vidhi",
  "/aartis",
  "/choghadiya",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/bhajan",
  "/mantra",
  "/chalisa",
  "/stotras",
  "/pooja-vidhi",
  "/vrat-katha",
  "/pooja",
  "/festival",
  "/categories",
  "/deity",
  "/panchang",
  "/sources"
];

function localePath(locale: "en" | "hi", route: string) {
  if (!route || route === "/") return `/${locale}`;
  return `/${locale}${route}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${siteConfig.url}${localePath(locale, route)}`,
        lastModified: now,
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1 : 0.7
      });
    }

    for (const aarti of getAartis()) {
      entries.push({
        url: `${siteConfig.url}/${locale}/aartis/${aarti.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8
      });
    }

    for (const category of getCategories()) {
      entries.push({
        url: `${siteConfig.url}/${locale}/categories/${category.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6
      });
    }

    for (const deity of deityHubs) {
      entries.push({
        url: `${siteConfig.url}/${locale}/deity/${deity.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6
      });
    }

    for (const festival of festivals) {
      entries.push({
        url: `${siteConfig.url}/${locale}/festival/${festival.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7
      });
    }

    for (const guide of poojaGuides) {
      entries.push({
        url: `${siteConfig.url}/${locale}/pooja/${guide.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6
      });
    }

    for (const mantra of mantras) {
      entries.push({
        url: `${siteConfig.url}/${locale}/mantra/${mantra.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5
      });
    }

    for (const chalisa of chalisas) {
      entries.push({
        url: `${siteConfig.url}/${locale}/chalisa/${chalisa.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5
      });
    }
  }

  return entries;
}
