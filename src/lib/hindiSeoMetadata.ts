import type { Metadata } from "next";
import { buildLocalizedMetadata } from "@/lib/seo";
import {
  getHubContent,
  getLocaleText,
  getTopicContent,
  type DeitySlug,
  type Locale
} from "@/lib/hindiSeoContent";

export function buildHubMetadata(deity: DeitySlug, locale: Locale): Metadata {
  const content = getHubContent(deity);
  return buildLocalizedMetadata({
    locale,
    path: `/${deity}`,
    title: getLocaleText(content.title, locale),
    description: getLocaleText(content.description, locale),
    keywords:
      locale === "hi"
        ? [
            `${getLocaleText(content.h1, locale)}`,
            "भक्ति चैट",
            "ऑनलाइन भगवान से बात",
            `${getLocaleText(content.h1, locale).split(" ")[0]} मंत्र`
          ]
        : ["Bhakti Chat", "devotional AI", `${deity} guidance`]
  });
}

export function buildTopicMetadata(deity: DeitySlug, topic: string, locale: Locale): Metadata {
  const content = getTopicContent(deity, topic);
  if (!content) {
    return buildLocalizedMetadata({
      locale,
      path: `/${deity}/${topic}`,
      title: locale === "hi" ? "पेज नहीं मिला" : "Page not found",
      description: locale === "hi" ? "यह पेज उपलब्ध नहीं है।" : "This page is not available.",
      noindex: true
    });
  }

  return buildLocalizedMetadata({
    locale,
    path: `/${deity}/${topic}`,
    title: getLocaleText(content.title, locale),
    description: getLocaleText(content.description, locale),
    keywords:
      locale === "hi"
        ? [
            getLocaleText(content.h1, locale),
            "भक्ति चैट",
            "पूजा विधि",
            "आरती"
          ]
        : [`${deity} ${topic}`, "devotional guide", "Bhakti Chat"]
  });
}
