import Link from "next/link";
import type { Metadata } from "next";
import { toDescription, toTitle } from "@/lib/seo";
import { mantras } from "@/lib/content";

export const metadata: Metadata = {
  title: toTitle("Mantras"),
  description: toDescription("Simple mantras to support your daily pooja and prayer.")
};

export default function MantraIndexPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Mantras</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">Daily mantras</h1>
      <p className="mt-4 max-w-2xl text-sm text-sagar-ink/70">
        Short mantras for daily prayer and remembrance. More are coming soon.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {mantras.map((mantra) => (
          <Link
            key={mantra.slug}
            href={`/mantra/${mantra.slug}`}
            className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft transition hover:-translate-y-1"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{mantra.name}</p>
            <p className="mt-2 text-sm text-sagar-ink/70">{mantra.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
