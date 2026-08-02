import type { MetadataRoute } from "next";
import { getAartis, getCategories } from "@/lib/data";
import { chalisas, deityHubs, festivals, mantras, poojaGuides } from "@/lib/content";
import { siteConfig } from "@/lib/seo";
import { buildUrl } from "@/lib/site";

const canonicalStaticRoutes = [
  "/chat",
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
  "/support",
  "/contact",
  "/privacy",
  "/delete-account",
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

const localizedIndexableRoutes = ["/en/aartis", "/en/choghadiya", "/hi/aartis", "/hi/choghadiya"];
const indexableChatGuideRoutes = ["krishna", "lakshmi", "shani", "shiv", "hanuman"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: buildUrl("en"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
      alternates: {
        languages: {
          en: buildUrl("en"),
          hi: buildUrl("hi"),
          "hi-IN": buildUrl("hi"),
          "x-default": buildUrl("en")
        }
      }
    },
    {
      url: buildUrl("hi"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
      alternates: {
        languages: {
          en: buildUrl("en"),
          hi: buildUrl("hi"),
          "hi-IN": buildUrl("hi"),
          "x-default": buildUrl("en")
        }
      }
    },
  ];

  for (const guide of indexableChatGuideRoutes) {
    entries.push({
      url: `${siteConfig.url}/chat?guide=${guide}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9
    });
  }

  for (const route of canonicalStaticRoutes) {
    entries.push({
      url: `${siteConfig.url}${route}`,
      lastModified: now,
      changeFrequency: route === "/" ? "daily" : "weekly",
      priority: route === "/" ? 1 : route === "/lakshmi" || route === "/shani" ? 0.9 : 0.7
    });
  }

  for (const route of localizedIndexableRoutes) {
    entries.push({
      url: `${siteConfig.url}${route}`,
      lastModified: now,
      changeFrequency: route === "/hi" ? "daily" : "weekly",
      priority: route === "/hi" ? 1 : 0.7
    });
  }

  for (const aarti of getAartis()) {
    entries.push({
      url: `${siteConfig.url}/aartis/${aarti.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    });
  }

  for (const category of getCategories()) {
    entries.push({
      url: `${siteConfig.url}/categories/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6
    });
  }

  for (const deity of deityHubs) {
    entries.push({
      url: `${siteConfig.url}/deity/${deity.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6
    });
  }

  for (const festival of festivals) {
    entries.push({
      url: `${siteConfig.url}/festival/${festival.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7
    });
  }

  for (const guide of poojaGuides) {
    entries.push({
      url: `${siteConfig.url}/pooja/${guide.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6
    });
  }

  for (const mantra of mantras) {
    entries.push({
      url: `${siteConfig.url}/mantra/${mantra.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
    });
  }

  for (const chalisa of chalisas) {
    entries.push({
      url: `${siteConfig.url}/chalisa/${chalisa.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5
    });
  }

  return entries;
}
