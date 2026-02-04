import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { toDescription, toTitle } from "@/lib/seo";
import { deityHubs } from "@/lib/content";
import { getAartisByCategory } from "@/lib/data";
import AartiCard from "@/components/AartiCard";

export function generateStaticParams() {
  return deityHubs.map((deity) => ({ slug: deity.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const deity = deityHubs.find((item) => item.slug === params.slug);
  if (!deity) {
    return { title: toTitle("Deity") };
  }
  return {
    title: toTitle(`${deity.label} Aartis`),
    description: toDescription(`Read ${deity.label} aartis with lyrics and AI Insight.`),
    alternates: { canonical: `https://bhakti-sagar.com/deity/${deity.slug}` }
  };
}

export default function DeityPage({ params }: { params: { slug: string } }) {
  const deity = deityHubs.find((item) => item.slug === params.slug);
  if (!deity) {
    notFound();
  }

  const aartis = getAartisByCategory(deity.category);

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Deity</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">{deity.label} Aartis</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        Explore {deity.label} aartis with lyrics in English and Hindi and AI Insight for meaning.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {aartis.map((aarti) => (
          <AartiCard key={aarti.id} aarti={aarti} />
        ))}
      </div>
    </div>
  );
}
