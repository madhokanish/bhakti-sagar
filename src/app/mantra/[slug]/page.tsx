import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { toDescription, toTitle } from "@/lib/seo";
import { mantras } from "@/lib/content";

export function generateStaticParams() {
  return mantras.map((mantra) => ({ slug: mantra.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const mantra = mantras.find((item) => item.slug === params.slug);
  if (!mantra) {
    return { title: toTitle("Mantra") };
  }
  return {
    title: toTitle(mantra.name),
    description: toDescription(mantra.description),
    alternates: { canonical: `https://bhakti-sagar.com/mantra/${mantra.slug}` }
  };
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
    </div>
  );
}
