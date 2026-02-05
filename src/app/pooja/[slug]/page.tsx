import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import { poojaGuides } from "@/lib/content";
import { getAartisByCategory } from "@/lib/data";
import { breadcrumbJsonLd } from "@/lib/schema";
import AartiCard from "@/components/AartiCard";

export function generateStaticParams() {
  return poojaGuides.map((guide) => ({ slug: guide.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = poojaGuides.find((item) => item.slug === params.slug);
  if (!guide) {
    return buildMetadata({
      title: "Pooja Vidhi",
      description: "Simple pooja steps with aarti and offerings.",
      pathname: `/pooja/${params.slug}`
    });
  }
  return buildMetadata({
    title: guide.name,
    description: guide.description,
    pathname: `/pooja/${guide.slug}`
  });
}

export default function PoojaGuidePage({ params }: { params: { slug: string } }) {
  const guide = poojaGuides.find((item) => item.slug === params.slug);
  if (!guide) {
    notFound();
  }

  const aartis = getAartisByCategory(guide.category);
  const lang = getRequestLanguage();
  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Pooja", url: "https://bhakti-sagar.com/pooja" },
    { name: guide.name, url: `https://bhakti-sagar.com/pooja/${guide.slug}` }
  ]);

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Pooja Guide</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">{guide.name}</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">{guide.description}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
          <h2 className="text-xl font-serif text-sagar-ink">Simple steps</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-sagar-ink/70">
            <li>Clean the space and light a diya.</li>
            <li>Offer flowers, water, or prasad.</li>
            <li>Chant a short mantra with devotion.</li>
            <li>Sing the aarti and offer light.</li>
            <li>Close with a moment of gratitude.</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
          <h2 className="text-xl font-serif text-sagar-ink">Related aartis</h2>
          <p className="mt-2 text-sm text-sagar-ink/70">Choose an aarti to sing during the pooja.</p>
          <div className="mt-4 grid gap-4">
            {aartis.map((aarti) => (
              <AartiCard key={aarti.id} aarti={aarti} language={lang} />
            ))}
          </div>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </div>
  );
}
