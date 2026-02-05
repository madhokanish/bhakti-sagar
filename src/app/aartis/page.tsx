import AartiCard from "@/components/AartiCard";
import { getAartis, searchAartis } from "@/lib/data";
import type { Metadata } from "next";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";

export function generateMetadata({
  searchParams
}: {
  searchParams?: { q?: string };
}): Metadata {
  const query = searchParams?.q?.trim();
  const title = query ? `Search results for "${query}"` : "All Aartis & Bhajans";
  const description = query
    ? `Search results for ${query} on Bhakti Sagar.`
    : "Browse the full library of aartis and bhajans with English and Hindi lyrics.";
  return buildMetadata({
    title,
    description,
    pathname: "/aartis",
    noindex: Boolean(query)
  });
}

export default function AartisPage({
  searchParams
}: {
  searchParams?: { q?: string };
}) {
  const query = searchParams?.q ?? "";
  const results = query ? searchAartis(query) : getAartis();
  const lang = getRequestLanguage();
  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", url: "https://bhakti-sagar.com/" },
    { name: "Aartis", url: "https://bhakti-sagar.com/aartis" }
  ]);
  const faqData = faqJsonLd([
    {
      q: "Where can I find aarti lyrics in English?",
      a: "Bhakti Sagar provides aarti lyrics in English letters along with Hindi text."
    },
    {
      q: "Do you have aarti meaning?",
      a: "Yes. Use the AI Insight panel to read a short, simple meaning."
    },
    {
      q: "Can I search by deity?",
      a: "Yes. Search by deity name or browse categories."
    },
    {
      q: "Are videos available?",
      a: "Many aarti pages include embedded YouTube videos."
    },
    {
      q: "Is this content free?",
      a: "Yes, all aarti lyrics and meanings are free to read."
    }
  ]);

  return (
    <div className="container py-12">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Aarti Library</p>
          <h1 className="mt-2 text-3xl font-serif text-sagar-ink">All Aartis & Bhajans</h1>
          <p className="mt-2 text-sm text-sagar-ink/70">
            {query ? `Results for “${query}” (${results.length})` : `${results.length} prayers available`}
          </p>
        </div>
        <form action="/aartis" className="flex w-full max-w-md items-center gap-2 rounded-full border border-sagar-amber/30 bg-white px-4 py-2 shadow-sagar-soft">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by title, deity, tag"
            className="w-full bg-transparent text-sm outline-none placeholder:text-sagar-ink/50"
          />
          <button className="rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
            Search
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {results.map((aarti) => (
          <AartiCard key={aarti.id} aarti={aarti} language={lang} />
        ))}
      </div>
      {!query && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
    </div>
  );
}
