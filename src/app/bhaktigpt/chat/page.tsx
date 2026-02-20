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
    <div className="container py-4 pb-12 md:py-6">
      <BhaktiGptPageView page="chat" />
      <section className="mb-4 rounded-2xl border border-sagar-amber/20 bg-white/85 p-3 shadow-sagar-soft">
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
          <div className="rounded-3xl border border-sagar-amber/20 bg-white/88 p-6 text-sm text-sagar-ink/70 shadow-sagar-soft">
            Loading BhaktiGPT chat...
          </div>
        }
      >
        <BhaktiGptChatClient />
      </Suspense>
    </div>
  );
}
