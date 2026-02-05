import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { festivals } from "@/lib/content";
import { breadcrumbJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Festivals",
    description: "Browse aartis for festivals and holy days.",
    pathname: "/festival"
  })
};

export default function FestivalIndexPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Festivals</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">Festival aartis</h1>
      <p className="mt-4 max-w-2xl text-sm text-sagar-ink/70">
        Discover festival-specific aartis by occasion and deity.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {festivals.map((festival) => (
          <Link
            key={festival.slug}
            href={`/festival/${festival.slug}`}
            className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft transition hover:-translate-y-1"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{festival.name}</p>
            <p className="mt-2 text-sm text-sagar-ink/70">{festival.description}</p>
          </Link>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Festivals", url: "https://bhakti-sagar.com/festival" }
        ])) }}
      />
    </div>
  );
}
