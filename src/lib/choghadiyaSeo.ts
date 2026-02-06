import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo";

export function buildChoghadiyaMetadata({
  cityLabel,
  dateLabel,
  canonicalUrl
}: {
  cityLabel: string;
  dateLabel: string;
  canonicalUrl: string;
}): Metadata {
  const title = `Aaj Ka Choghadiya for ${cityLabel} on ${dateLabel} | ${siteConfig.name}`;
  const description =
    `Live choghadiya timings for ${cityLabel} on ${dateLabel}. See the current slot, next good time, and day/night schedule.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    robots: {
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
