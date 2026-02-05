import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import { deityHubs } from "@/lib/content";
import { breadcrumbJsonLd } from "@/lib/schema";
import { getAartisByCategory } from "@/lib/data";
import AartiCard from "@/components/AartiCard";

export function generateStaticParams() {
  return deityHubs.map((deity) => ({ slug: deity.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const deity = deityHubs.find((item) => item.slug === params.slug);
  if (!deity) {
    return buildMetadata({
      title: "Deity",
      description: "Explore aarti lyrics by deity.",
      pathname: `/deity/${params.slug}`
    });
  }
  return buildMetadata({
    title: `${deity.label} Aartis`,
    description: `Read ${deity.label} aartis with lyrics and AI Insight.`,
    pathname: `/deity/${deity.slug}`
  });
}

export default function DeityPage({ params }: { params: { slug: string } }) {
  const deity = deityHubs.find((item) => item.slug === params.slug);
  if (!deity) {
    notFound();
  }

  const aartis = getAartisByCategory(deity.category);
  const lang = getRequestLanguage();
  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Deity", url: "https://bhakti-sagar.com/deity" },
    { name: deity.label, url: `https://bhakti-sagar.com/deity/${deity.slug}` }
  ]);

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Deity</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">{deity.label} Aartis</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">
        Explore {deity.label} aartis with lyrics in English and Hindi and AI Insight for meaning.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {aartis.map((aarti) => (
          <AartiCard key={aarti.id} aarti={aarti} language={lang} />
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </div>
  );
}
