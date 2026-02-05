import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { chalisas } from "@/lib/content";
import { breadcrumbJsonLd } from "@/lib/schema";

export function generateStaticParams() {
  return chalisas.map((chalisa) => ({ slug: chalisa.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const chalisa = chalisas.find((item) => item.slug === params.slug);
  if (!chalisa) {
    return buildMetadata({
      title: "Chalisa",
      description: "Chalisa prayers for daily devotion.",
      pathname: `/chalisa/${params.slug}`
    });
  }
  return buildMetadata({
    title: `${chalisa.name} Lyrics | Meaning`,
    description: chalisa.description,
    pathname: `/chalisa/${chalisa.slug}`
  });
}

export default function ChalisaPage({ params }: { params: { slug: string } }) {
  const chalisa = chalisas.find((item) => item.slug === params.slug);
  if (!chalisa) {
    notFound();
  }

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Chalisa</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">{chalisa.name}</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">{chalisa.description}</p>
      <div className="mt-8 rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
        <p className="text-sm text-sagar-ink/70">
          This page will include the full chalisa text and meaning. We will expand it soon.
        </p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Chalisa", url: "https://bhakti-sagar.com/chalisa" },
          { name: chalisa.name, url: `https://bhakti-sagar.com/chalisa/${chalisa.slug}` }
        ])) }}
      />
    </div>
  );
}
