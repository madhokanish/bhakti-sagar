import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Sources",
    description: "Sources and references used for Bhakti Sagar content.",
    pathname: "/sources"
  })
};

export default function SourcesPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Sources</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">Sources & References</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        Lyrics and traditions are compiled from public devotional resources and community submissions.
        If you notice any errors, please contact hello@bhakti-sagar.com for updates.
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Sources", url: "https://bhakti-sagar.com/sources" }
        ])) }}
      />
    </div>
  );
}
