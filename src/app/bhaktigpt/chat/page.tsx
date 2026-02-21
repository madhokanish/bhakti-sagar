import type { Metadata } from "next";
import { Suspense } from "react";
import BhaktiGptChatClient from "@/components/bhaktigpt/BhaktiGptChatClient";
import BhaktiGptPageView from "@/components/bhaktigpt/BhaktiGptPageView";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "BhaktiGPT Chat",
    description:
      "Chat with devotional AI guides inspired by Shri Krishna, Shani Dev, and Goddess Lakshmi teachings.",
    pathname: "/bhaktigpt/chat"
  })
};

export default function BhaktiGptChatPage() {
  return (
    <div
      className="fixed inset-x-0 z-30 overflow-x-hidden overflow-y-hidden bg-white [height:calc(100dvh-var(--nav-height,0px))] [max-height:calc(100dvh-var(--nav-height,0px))]"
      style={{ top: "var(--nav-height, 0px)" }}
    >
      <BhaktiGptPageView page="chat" />
      <Suspense
        fallback={
          <div className="h-full bg-white p-6 text-sm text-sagar-ink/70">
            Loading BhaktiGPT chat...
          </div>
        }
      >
        <div className="h-full bg-white">
          <BhaktiGptChatClient />
        </div>
      </Suspense>
    </div>
  );
}
