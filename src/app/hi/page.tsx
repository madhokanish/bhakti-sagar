import type { Metadata } from "next";
import HomePageContent from "@/components/home/HomePageContent";
import { buildUrl } from "@/lib/site";

const HI_TITLE = "भगवान से ऑनलाइन बात करें | भक्ति चैट";
const HI_DESCRIPTION =
  "श्री कृष्ण, लक्ष्मी जी और शनि देव से एआई के माध्यम से मार्गदर्शन पाएँ। अपने मन की बात कहें और सही दिशा पाएँ।";

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = buildUrl("en", "/og/bhaktichat.png");

  return {
    title: HI_TITLE,
    description: HI_DESCRIPTION,
    alternates: {
      canonical: buildUrl("hi"),
      languages: {
        en: buildUrl("en"),
        hi: buildUrl("hi"),
        "hi-IN": buildUrl("hi"),
        "x-default": buildUrl("en")
      }
    },
    openGraph: {
      title: HI_TITLE,
      description: HI_DESCRIPTION,
      type: "website",
      siteName: "BhaktiChat",
      url: buildUrl("hi"),
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Bhakti Chat" }]
    },
    twitter: {
      card: "summary_large_image",
      title: HI_TITLE,
      description: HI_DESCRIPTION,
      images: [ogImage]
    }
  };
}

export default function HindiHomePage() {
  return <HomePageContent lang="hi" />;
}
