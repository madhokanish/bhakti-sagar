import type { Metadata } from "next";
import BhaktiGptChatClient from "@/components/bhaktigpt/BhaktiGptChatClient";
import BhaktiGptPageView from "@/components/bhaktigpt/BhaktiGptPageView";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams
}: {
  searchParams?: { guide?: string };
}): Promise<Metadata> {
  const guide = searchParams?.guide;
  const guideMetadata = {
    krishna: {
      title: "Talk to Shri Krishna AI | BhaktiChat",
      description:
        "Talk to Shri Krishna for calm guidance on duty, decisions, and inner peace. Private AI chat for reflection. Free to start.",
      image: absoluteUrl("/og/krishna.png"),
      imageAlt: "Talk to Shri Krishna AI"
    },
    lakshmi: {
      title: "Talk to Lakshmi Ji AI | BhaktiChat",
      description:
        "Talk to Lakshmi Ji for calm guidance on money stress, stability, gratitude, and steady growth through private AI chat.",
      image: absoluteUrl("/og/bhaktichat.png"),
      imageAlt: "Talk to Lakshmi Ji AI"
    },
    shani: {
      title: "Talk to Shani Dev AI | BhaktiChat",
      description:
        "Talk to Shani Dev for disciplined guidance through setbacks, patience, and focused action in a private AI devotional chat.",
      image: absoluteUrl("/og/bhaktichat.png"),
      imageAlt: "Talk to Shani Dev AI"
    },
    shiv: {
      title: "Talk to Shiv Ji AI | BhaktiChat",
      description:
        "Talk to Shiv Ji for stillness, clarity, and grounded guidance during change through private AI devotional chat.",
      image: absoluteUrl("/og/bhaktichat.png"),
      imageAlt: "Talk to Shiv Ji AI"
    },
    hanuman: {
      title: "Talk to Hanuman Ji AI | BhaktiChat",
      description:
        "Talk to Hanuman Ji for courage, discipline, and devotional strength through private AI chat for focused daily action.",
      image: absoluteUrl("/og/bhaktichat.png"),
      imageAlt: "Talk to Hanuman Ji AI"
    }
  } as const;

  if (guide && guide in guideMetadata) {
    const selected = guideMetadata[guide as keyof typeof guideMetadata];
    const canonical = absoluteUrl(`/chat?guide=${guide}`);
    return {
      title: selected.title,
      description: selected.description,
      alternates: { canonical },
      robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true }
      },
      openGraph: {
        title: selected.title,
        description: selected.description,
        type: "website",
        siteName: "BhaktiChat",
        url: canonical,
        images: [{ url: selected.image, width: 1200, height: 630, alt: selected.imageAlt }]
      },
      twitter: {
        card: "summary_large_image",
        title: selected.title,
        description: selected.description,
        images: [selected.image]
      }
    };
  }

  const homepageTitle = "BhaktiChat – The AI Hindu Devotion App";
  const homepageDescription =
    "Talk to Shri Krishna, Shiv Ji, Hanuman Ji, Lakshmi Ji, and Shani Dev through private AI chat.";

  return {
    title: homepageTitle,
    description: homepageDescription,
    alternates: { canonical: absoluteUrl("/chat") },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true }
    },
    openGraph: {
      title: homepageTitle,
      description: homepageDescription,
      type: "website",
      siteName: "BhaktiChat",
      url: absoluteUrl("/chat"),
      images: [{ url: absoluteUrl("/og/bhaktichat.png"), width: 1200, height: 630, alt: "BhaktiChat" }]
    },
    twitter: {
      card: "summary_large_image",
      title: homepageTitle,
      description: homepageDescription,
      images: [absoluteUrl("/og/bhaktichat.png")]
    }
  };
}

export default function ChatPage() {
  return (
    <div
      className="fixed inset-0 z-[60] flex min-h-0 flex-col overflow-hidden bg-[#fff8ef] [height:var(--chat-vh,100dvh)] [max-height:var(--chat-vh,100dvh)]"
    >
      <BhaktiGptPageView page="chat" />
      <div className="h-full bg-[#fff8ef]">
        <BhaktiGptChatClient />
      </div>
    </div>
  );
}
