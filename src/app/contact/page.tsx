import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Contact",
    description: "Get in touch with the Bhakti Sagar team.",
    pathname: "/contact"
  })
};

export default function ContactPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Contact</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">Contact Bhakti Sagar</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        For corrections, feedback, or partnership inquiries, email us at
        <span className="font-semibold text-sagar-ink"> hello@bhakti-sagar.com</span>.
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Contact", url: "https://bhakti-sagar.com/contact" }
        ])) }}
      />
    </div>
  );
}
