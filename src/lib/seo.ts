import type { Metadata } from "next";
import { headers } from "next/headers";
import { BRAND_LOGO_PATH, BRAND_NAME } from "@/lib/brand";

export const siteConfig = {
  name: BRAND_NAME,
  description:
    "Bhakti Chat offers devotional AI guidance inspired by sacred teachings, plus trusted aarti and daily reflection tools.",
  url: "https://bhaktichat.com",
  ogImage: BRAND_LOGO_PATH,
  twitter: "@bhaktisagar"
};

export const supportedLanguages: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" }
];

export type SeoLocale = "en" | "hi";

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

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (withSlash.length > 1 && withSlash.endsWith("/")) {
    return withSlash.slice(0, -1);
  }
  return withSlash;
}

function splitLocalePath(pathname: string) {
  const normalized = normalizePath(pathname);
  const parts = normalized.split("/").filter(Boolean);
  const first = parts[0];
  if (first === "en" || first === "hi") {
    const base = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "/";
    return {
      locale: first as SeoLocale,
      basePath: normalizePath(base)
    };
  }
  return {
    locale: "en" as SeoLocale,
    basePath: normalized
  };
}

export function buildAlternates(pathname: string) {
  const { locale, basePath } = splitLocalePath(pathname);
  const canonicalPath = `/${locale}${basePath === "/" ? "" : basePath}`;
  const alternates: { canonical: string; languages?: Record<string, string> } = {
    canonical: absoluteUrl(canonicalPath)
  };
  if (supportedLanguages.length > 0) {
    alternates.languages = {
      en: absoluteUrl(`/en${basePath === "/" ? "" : basePath}`),
      "hi-IN": absoluteUrl(`/hi${basePath === "/" ? "" : basePath}`)
    };
  }
  return alternates;
}

export function buildLocalizedMetadata(params: {
  locale: SeoLocale;
  path: string;
  title: string;
  description?: string;
  ogImage?: string;
  noindex?: boolean;
  keywords?: string[];
}): Metadata {
  const normalizedBasePath = normalizePath(params.path);
  const localizedPath = `/${params.locale}${normalizedBasePath === "/" ? "" : normalizedBasePath}`;
  return buildMetadata({
    title: params.title,
    description: params.description,
    pathname: localizedPath,
    ogImage: params.ogImage,
    noindex: params.noindex,
    keywords: params.keywords
  });
}

export function buildMetadata({
  title,
  description,
  pathname,
  ogImage,
  noindex = false,
  keywords
}: {
  title: string;
  description?: string;
  pathname: string;
  ogImage?: string;
  noindex?: boolean;
  keywords?: string[];
}): Metadata {
  const fullTitle = toTitle(title);
  const desc = toDescription(description);
  const url = absoluteUrl(pathname);
  const image = ogImage ?? siteConfig.ogImage;

  return {
    title: fullTitle,
    description: desc,
    keywords,
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
