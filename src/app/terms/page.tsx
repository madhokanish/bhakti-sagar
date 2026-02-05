import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Terms of Use",
    description: "Terms and conditions for using Bhakti Sagar.",
    pathname: "/terms"
  })
};

export default function TermsPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Terms</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">Terms of Use</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        Bhakti Sagar provides devotional content for personal and educational use. Please share links
        rather than reproducing full pages. For corrections, contact hello@bhakti-sagar.com.
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Terms", url: "https://bhakti-sagar.com/terms" }
        ])) }}
      />
    </div>
  );
}
