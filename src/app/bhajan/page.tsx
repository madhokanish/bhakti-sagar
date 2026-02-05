import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Bhajan & Aarti",
    description: "Discover devotional bhajans and aartis with lyrics in English and Hindi.",
    pathname: "/bhajan"
  })
};

export default function BhajanPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Bhajan & Aarti</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">Devotional songs for daily bhakti</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-sagar-ink/70">
        Bhajans are devotional songs sung in praise and remembrance. Bhakti Sagar currently focuses on aartis
        and is expanding the bhajan collection. Explore aartis by deity and check back for more bhajans soon.
      </p>

      <div className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
        <h2 className="text-xl font-serif text-sagar-ink">Start with aartis</h2>
        <p className="mt-3 text-sm text-sagar-ink/70">
          Read lyrics, listen, and use AI Insight to understand each prayer in simple words.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/aartis"
            className="rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
          >
            Explore Aartis
          </Link>
          <Link
            href="/categories"
            className="rounded-full border border-sagar-saffron/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-saffron"
          >
            Browse Deities
          </Link>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Bhajan", url: "https://bhakti-sagar.com/bhajan" }
        ])) }}
      />
    </div>
  );
}
