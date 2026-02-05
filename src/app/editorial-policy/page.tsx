import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Editorial Policy",
    description: "How Bhakti Sagar reviews, updates, and presents devotional content.",
    pathname: "/editorial-policy"
  })
};

export default function EditorialPolicyPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Editorial Policy</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">Editorial Policy</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        Our team curates lyrics from trusted sources, verifies transliterations, and updates pages when
        corrections are received. AI explanations are reviewed for clarity and devotional tone.
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Editorial Policy", url: "https://bhakti-sagar.com/editorial-policy" }
        ])) }}
      />
    </div>
  );
}
