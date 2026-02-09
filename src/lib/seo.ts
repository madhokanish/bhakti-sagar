import type { Metadata } from "next";
import { headers } from "next/headers";

export const siteConfig = {
  name: "Bhakti Sagar",
  description:
    "A Global Devotional Platform for aartis, pooja guides, mantras, and devotional timings.",
  url: "https://bhakti-sagar.com",
  ogImage: "/brand/bhakti-sagar-logo.png",
  twitter: "@bhaktisagar"
};

export const supportedLanguages: { code: string; label: string }[] = [];

export function getRequestLanguage(defaultLang: "en" | "hi" = "en") {
  try {
    const lang = headers().get("x-lang");
    if (lang === "hi" || lang === "en") return lang;
  } catch {
    // ignore
  }
  return defaultLang;
}

export function toTitle(title: string) {
  return `${title} | ${siteConfig.name}`;
}

export function toDescription(description?: string) {
  return description ?? siteConfig.description;
}

export function absoluteUrl(path: string) {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildAlternates(pathname: string) {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const alternates: { canonical: string; languages?: Record<string, string> } = {
    canonical: absoluteUrl(cleanPath)
  };
  if (supportedLanguages.length > 0) {
    alternates.languages = supportedLanguages.reduce<Record<string, string>>((acc, lang) => {
      acc[lang.code] = absoluteUrl(`/${lang.code}${cleanPath}`);
      return acc;
    }, {});
  }
  return alternates;
}

export function buildMetadata({
  title,
  description,
  pathname,
  ogImage,
  noindex = false
}: {
  title: string;
  description?: string;
  pathname: string;
  ogImage?: string;
  noindex?: boolean;
}): Metadata {
  const fullTitle = toTitle(title);
  const desc = toDescription(description);
  const url = absoluteUrl(pathname);
  const image = ogImage ?? siteConfig.ogImage;

  return {
    title: fullTitle,
    description: desc,
    alternates: buildAlternates(pathname),
    robots: noindex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1
          }
        },
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description: desc,
      images: [{ url: image, width: 1200, height: 630, alt: siteConfig.name }]
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [image]
    }
  };
}
