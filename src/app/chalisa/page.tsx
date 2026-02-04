import Link from "next/link";
import type { Metadata } from "next";
import { toDescription, toTitle } from "@/lib/seo";
import { chalisas } from "@/lib/content";

export const metadata: Metadata = {
  title: toTitle("Chalisa"),
  description: toDescription("Chalisa prayers for daily devotion and strength.")
};

export default function ChalisaIndexPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Chalisa</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">Chalisa prayers</h1>
      <p className="mt-4 max-w-2xl text-sm text-sagar-ink/70">
        Explore chalisa prayers with simple guidance. More will be added soon.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {chalisas.map((chalisa) => (
          <Link
            key={chalisa.slug}
            href={`/chalisa/${chalisa.slug}`}
            className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft transition hover:-translate-y-1"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{chalisa.name}</p>
            <p className="mt-2 text-sm text-sagar-ink/70">{chalisa.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
