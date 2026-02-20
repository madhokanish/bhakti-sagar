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
    <div className="fixed inset-x-0 bottom-0 z-30 overflow-hidden bg-white" style={{ top: "var(--nav-height, 0px)" }}>
      <BhaktiGptPageView page="chat" />
      <Suspense
        fallback={
          <div className="h-full rounded-none border border-sagar-amber/20 bg-white p-6 text-sm text-sagar-ink/70 shadow-sagar-soft">
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
