import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo";

export function buildChoghadiyaMetadata({
  cityLabel,
  dateLabel,
  canonicalUrl,
  locale = "en",
  noindex = false
}: {
  cityLabel: string;
  dateLabel: string;
  canonicalUrl: string;
  locale?: "en" | "hi";
  noindex?: boolean;
}): Metadata {
  const title =
    locale === "hi"
      ? `${cityLabel} के लिए आज का चौघड़िया ${dateLabel} | ${siteConfig.name}`
      : `Aaj Ka Choghadiya for ${cityLabel} on ${dateLabel} | ${siteConfig.name}`;
  const description =
    locale === "hi"
      ? `${cityLabel} के लिए ${dateLabel} का चौघड़िया देखें। अभी का स्लॉट, अगला अच्छा समय और दिन/रात का शेड्यूल पाएँ।`
      : `Live choghadiya timings for ${cityLabel} on ${dateLabel}. See the current slot, next good time, and day/night schedule.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    robots: noindex
      ? {
          index: false,
          follow: true,
          googleBot: { index: false, follow: true }
        }
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
      url: canonicalUrl,
      siteName: siteConfig.name,
      title,
      description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteConfig.ogImage]
    }
  };
}
