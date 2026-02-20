import type { Metadata } from "next";
import { Suspense } from "react";
import BhaktiGptChatClient from "@/components/bhaktigpt/BhaktiGptChatClient";
import BhaktiGptPageView from "@/components/bhaktigpt/BhaktiGptPageView";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "BhaktiGPT Chat",
    description:
      "Chat with devotional AI guides inspired by Shani Dev, Shri Lakshmi Ji, and Shri Krishna Ji teachings.",
    pathname: "/bhaktigpt/chat"
  })
};

export default function BhaktiGptChatPage() {
  return (
    <div className="px-0 py-0 md:px-4 md:py-4">
      <BhaktiGptPageView page="chat" />
      <section className="mx-2 mb-2 rounded-2xl border border-sagar-amber/20 bg-white/85 p-2 shadow-sagar-soft md:mx-0 md:mb-3 md:p-3">
        <div className="flex flex-wrap gap-2 text-xs text-sagar-ink/75">
          <span className="rounded-full border border-sagar-amber/20 bg-sagar-cream/50 px-2.5 py-1">
            Inspired by scriptures and tradition
          </span>
          <span className="rounded-full border border-sagar-amber/20 bg-sagar-cream/50 px-2.5 py-1">
            Private chats, secure by design
          </span>
          <span className="rounded-full border border-sagar-amber/20 bg-sagar-cream/50 px-2.5 py-1">
            No fear, no predictions
          </span>
        </div>
      </section>
      <Suspense
        fallback={
          <div className="mx-2 rounded-3xl border border-sagar-amber/20 bg-white/88 p-6 text-sm text-sagar-ink/70 shadow-sagar-soft md:mx-0">
            Loading BhaktiGPT chat...
          </div>
        }
      >
        <div className="mx-0 md:mx-0">
          <BhaktiGptChatClient />
        </div>
      </Suspense>
    </div>
  );
}
