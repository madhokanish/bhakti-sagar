import type { Metadata } from "next";
import Link from "next/link";
import { toDescription, toTitle } from "@/lib/seo";

export const metadata: Metadata = {
  title: toTitle("Pooja Guide"),
  description: toDescription(
    "Learn how to perform a simple pooja with aarti, and explore devotional lyrics by deity."
  )
};

export default function PoojaPage() {
  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Pooja Guide</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">A simple pooja with aarti</h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-sagar-ink/70">
        A pooja is a devotional ritual that invites divine presence through prayer, offerings, and singing.
        Aarti is usually performed at the end of the pooja as a heartfelt offering of light and gratitude.
        This page gives a simple, beginner-friendly flow and links to aartis by deity.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
          <h2 className="text-xl font-serif text-sagar-ink">Basic pooja steps</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-sagar-ink/70">
            <li>Clean the space and light a diya or candle.</li>
            <li>Offer flowers, water, or fruits with a short prayer.</li>
            <li>Chant a simple mantra or name of the deity.</li>
            <li>Sing an aarti from Bhakti Sagar.</li>
            <li>Offer prasad and close with a moment of silence.</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
          <h2 className="text-xl font-serif text-sagar-ink">Choose an aarti</h2>
          <p className="mt-3 text-sm text-sagar-ink/70">
            Browse by deity or explore the full library of aartis with English and Hindi lyrics.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/categories"
              className="rounded-full border border-sagar-saffron/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-saffron"
            >
              Browse Deities
            </Link>
            <Link
              href="/aartis"
              className="rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
            >
              All Aartis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
