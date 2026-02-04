import AartiCard from "@/components/AartiCard";
import { getAartisByCategory, getCategories } from "@/lib/data";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { toDescription, toTitle } from "@/lib/seo";

export function generateStaticParams() {
  return getCategories().map((category) => ({ slug: category.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const category = getCategories().find((item) => item.slug === params.slug);
  if (!category) {
    return { title: toTitle("Category") };
  }
  return {
    title: toTitle(`${category.name} Aartis`),
    description: toDescription(`Explore ${category.name} aartis with English and Hindi lyrics.`),
    alternates: {
      canonical: `/categories/${category.slug}`
    }
  };
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = getCategories().find((item) => item.slug === params.slug);
  if (!category) {
    notFound();
  }

  const aartis = getAartisByCategory(category.slug);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: aartis.map((aarti, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: aarti.title.english || aarti.title.hindi,
      url: `https://bhakti-sagar.com/aartis/${aarti.slug}`
    }))
  };

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Category</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">{category.name}</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">{category.description}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {aartis.map((aarti) => (
          <AartiCard key={aarti.id} aarti={aarti} />
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </div>
  );
}
