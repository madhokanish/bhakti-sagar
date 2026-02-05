import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Privacy Policy",
    description: "Read how Bhakti Sagar handles data and privacy.",
    pathname: "/privacy"
  })
};

export default function PrivacyPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Privacy</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">Privacy Policy</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        We collect basic analytics to improve the experience. We do not sell personal data. If you have
        questions, please reach out at hello@bhakti-sagar.com.
      </p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Privacy", url: "https://bhakti-sagar.com/privacy" }
        ])) }}
      />
    </div>
  );
}
