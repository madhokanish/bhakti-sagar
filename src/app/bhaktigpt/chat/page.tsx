import type { Metadata } from "next";
import { headers } from "next/headers";
import BhaktiGptChatClient from "@/components/bhaktigpt/BhaktiGptChatClient";
import BhaktiGptPageView from "@/components/bhaktigpt/BhaktiGptPageView";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = headers().get("x-lang") === "hi" ? "hi" : "en";

  if (locale === "hi") {
    return buildMetadata({
      title: "श्री कृष्ण, लक्ष्मी जी, शनि देव चैट | भक्ति चैट",
      description: "सरल हिंदी में आध्यात्मिक मार्गदर्शन के लिए भक्ति चैट पर अपने इष्ट गाइड से तुरंत बात करें।",
      pathname: "/hi/bhaktigpt/chat"
    });
  }

  return buildMetadata({
    title: "Chat with Krishna, Lakshmi, Shani | Bhakti Chat",
    description:
      "Start a devotional AI chat inspired by Shri Krishna, Lakshmi Ji, and Shani Dev teachings for calm and clarity.",
    pathname: "/en/bhaktigpt/chat"
  });
}

export default function BhaktiGptChatPage() {
  return (
    <div
      className="fixed inset-0 z-[60] flex min-h-0 flex-col overflow-hidden bg-[#F7F7F8] [height:var(--chat-vh,100dvh)] [max-height:var(--chat-vh,100dvh)]"
    >
      <BhaktiGptPageView page="chat" />
      <div className="h-full bg-[#F7F7F8]">
        <BhaktiGptChatClient />
      </div>
    </div>
  );
}
