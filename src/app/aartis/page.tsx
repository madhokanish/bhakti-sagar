import AartiCard from "@/components/AartiCard";
import { getAartis, searchAartis } from "@/lib/data";
import type { Metadata } from "next";
import { toDescription, toTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: toTitle("All Aartis & Bhajans"),
  description: toDescription("Browse the full library of aartis and bhajans with English and Hindi lyrics.")
};

export default function AartisPage({
  searchParams
}: {
  searchParams?: { q?: string };
}) {
  const query = searchParams?.q ?? "";
  const results = query ? searchAartis(query) : getAartis();

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
          <AartiCard key={aarti.id} aarti={aarti} />
        ))}
      </div>
    </div>
  );
}
