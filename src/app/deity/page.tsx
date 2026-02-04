import Link from "next/link";
import type { Metadata } from "next";
import { toDescription, toTitle } from "@/lib/seo";
import { deityHubs } from "@/lib/content";

export const metadata: Metadata = {
  title: toTitle("Deities"),
  description: toDescription("Browse aartis by deity in English and Hindi.")
};

export default function DeityIndexPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Deities</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">Browse by deity</h1>
      <p className="mt-4 max-w-2xl text-sm text-sagar-ink/70">
        Explore aartis by deity with lyrics in English and Hindi, plus AI Insight for meaning.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {deityHubs.map((deity) => (
          <Link
            key={deity.slug}
            href={`/deity/${deity.slug}`}
            className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft transition hover:-translate-y-1"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{deity.label}</p>
            <p className="mt-2 text-sm text-sagar-ink/70">Aartis and prayers for {deity.label}.</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
