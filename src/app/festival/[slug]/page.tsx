import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { toDescription, toTitle } from "@/lib/seo";
import { festivals } from "@/lib/content";
import { getAartisByCategory } from "@/lib/data";
import AartiCard from "@/components/AartiCard";

export function generateStaticParams() {
  return festivals.map((festival) => ({ slug: festival.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const festival = festivals.find((item) => item.slug === params.slug);
  if (!festival) {
    return { title: toTitle("Festival") };
  }
  return {
    title: toTitle(`${festival.name} Aartis`),
    description: toDescription(`Explore ${festival.name} aartis with English and Hindi lyrics.`),
    alternates: { canonical: `https://bhakti-sagar.com/festival/${festival.slug}` }
  };
}

export default function FestivalPage({ params }: { params: { slug: string } }) {
  const festival = festivals.find((item) => item.slug === params.slug);
  if (!festival) {
    notFound();
  }

  const aartis = festival.categories.flatMap((category) => getAartisByCategory(category));

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Festival</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">{festival.name} Aartis</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">{festival.description}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {aartis.map((aarti) => (
          <AartiCard key={aarti.id} aarti={aarti} />
        ))}
      </div>
    </div>
  );
}
