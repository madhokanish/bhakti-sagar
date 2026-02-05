import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";
import { authors, getAuthorBySlug } from "@/lib/authors";
import { getAartis } from "@/lib/data";

export function generateStaticParams() {
  return authors.map((author) => ({ slug: author.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const author = getAuthorBySlug(params.slug);
  if (!author) {
    return buildMetadata({
      title: "Author",
      description: "Bhakti Sagar author page.",
      pathname: `/authors/${params.slug}`
    });
  }
  return buildMetadata({
    title: author.name,
    description: author.bio,
    pathname: `/authors/${author.slug}`
  });
}

export default function AuthorPage({ params }: { params: { slug: string } }) {
  const author = getAuthorBySlug(params.slug);
  if (!author) notFound();

  const aartis = getAartis().slice(0, 12);
  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Author", url: `https://bhakti-sagar.com/authors/${author.slug}` }
  ]);

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Author</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">{author.name}</h1>
      <p className="mt-3 max-w-2xl text-sm text-sagar-ink/70">{author.bio}</p>

      <h2 className="mt-10 text-2xl font-serif text-sagar-ink">Latest updates</h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {aartis.map((aarti) => (
          <li key={aarti.id} className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-4">
            <p className="text-sm font-semibold text-sagar-ink">
              {aarti.title.english || aarti.title.hindi}
            </p>
            <p className="mt-1 text-xs text-sagar-ink/60">Updated recently</p>
          </li>
        ))}
      </ul>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </div>
  );
}
