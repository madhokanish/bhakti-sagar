import { siteConfig } from "@/lib/seo";

export function organizationJsonLd() {
  const youtubeUrl = process.env.NEXT_PUBLIC_BHAKTISAGAR_TV_URL?.trim();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: "Bhakti Chat",
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}${siteConfig.ogImage}`,
    sameAs: youtubeUrl ? [youtubeUrl] : []
  };
}

export function websiteJsonLd(locale: "en" | "hi" = "en") {
  const localizedPath = locale === "en" ? "/" : `/${locale}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: "Bhakti Chat",
    description: siteConfig.description,
    url: `${siteConfig.url}${localizedPath}`,
    inLanguage: locale === "hi" ? "hi-IN" : "en",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/${locale}/aartis?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function webPageJsonLd({
  name,
  description,
  url,
  inLanguage = "en"
}: {
  name: string;
  description: string;
  url: string;
  inLanguage?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    inLanguage,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url
    }
  };
}

export function articleJsonLd({
  headline,
  description,
  url,
  datePublished,
  dateModified,
  authorName,
  image
}: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    mainEntityOfPage: url,
    datePublished,
    dateModified,
    author: {
      "@type": "Organization",
      name: authorName
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}${siteConfig.ogImage}`
      }
    },
    image: image ? [image] : undefined
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a }
    }))
  };
}

export function videoObjectJsonLd({
  name,
  description,
  url,
  embedUrl,
  thumbnailUrl,
  uploadDate
}: {
  name: string;
  description: string;
  url: string;
  embedUrl: string;
  thumbnailUrl: string;
  uploadDate?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    url,
    embedUrl,
    thumbnailUrl,
    uploadDate
  };
}
