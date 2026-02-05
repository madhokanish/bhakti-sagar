import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { mantras } from "@/lib/content";
import { breadcrumbJsonLd } from "@/lib/schema";

export function generateStaticParams() {
  return mantras.map((mantra) => ({ slug: mantra.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const mantra = mantras.find((item) => item.slug === params.slug);
  if (!mantra) {
    return buildMetadata({
      title: "Mantra",
      description: "Daily mantras for devotion and remembrance.",
      pathname: `/mantra/${params.slug}`
    });
  }
  return buildMetadata({
    title: `${mantra.name} | Meaning`,
    description: mantra.description,
    pathname: `/mantra/${mantra.slug}`
  });
}

export default function MantraPage({ params }: { params: { slug: string } }) {
  const mantra = mantras.find((item) => item.slug === params.slug);
  if (!mantra) {
    notFound();
  }

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Mantra</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">{mantra.name}</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">{mantra.description}</p>
      <div className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
        <p className="text-sm text-sagar-ink/70">
          This mantra is shared for daily remembrance. Chant slowly with focus and devotion.
        </p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Mantra", url: "https://bhakti-sagar.com/mantra" },
          { name: mantra.name, url: `https://bhakti-sagar.com/mantra/${mantra.slug}` }
        ])) }}
      />
    </div>
  );
}
