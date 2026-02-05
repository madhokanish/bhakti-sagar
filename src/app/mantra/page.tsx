import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { mantras } from "@/lib/content";
import { breadcrumbJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Mantras",
    description: "Simple mantras to support your daily pooja and prayer.",
    pathname: "/mantra"
  })
};

export default function MantraIndexPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Mantras</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">Daily mantras</h1>
      <p className="mt-4 max-w-2xl text-sm text-sagar-ink/70">
        Short mantras for daily prayer and remembrance. More are coming soon.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {mantras.map((mantra) => (
          <Link
            key={mantra.slug}
            href={`/mantra/${mantra.slug}`}
            className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft transition hover:-translate-y-1"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{mantra.name}</p>
            <p className="mt-2 text-sm text-sagar-ink/70">{mantra.description}</p>
          </Link>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Mantra", url: "https://bhakti-sagar.com/mantra" }
        ])) }}
      />
    </div>
  );
}
