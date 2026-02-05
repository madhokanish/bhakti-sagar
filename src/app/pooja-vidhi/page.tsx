import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Pooja Vidhi",
    description: "Simple pooja vidhi steps with aarti, offerings, and devotional guidance.",
    pathname: "/pooja-vidhi"
  })
};

export default function PoojaVidhiPage() {
  const faqData = faqJsonLd([
    {
      q: "What is pooja vidhi?",
      a: "Pooja vidhi is the step-by-step method of performing a devotional ritual."
    },
    {
      q: "What items are needed for a basic pooja?",
      a: "A diya, flowers, incense, water, and prasad are commonly used."
    },
    {
      q: "When should I do pooja?",
      a: "Most devotees perform pooja in the morning, evening, or on festival days."
    },
    {
      q: "Is aarti part of pooja?",
      a: "Yes. Aarti is typically performed at the end as an offering of light."
    },
    {
      q: "Can I do pooja at home?",
      a: "Absolutely. A simple, sincere pooja at home is encouraged."
    }
  ]);

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Pooja Vidhi</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">Simple pooja vidhi</h1>
      <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-sagar-ink/70">
        <p>
          Pooja vidhi is the simple method of performing a devotional ritual with attention, gratitude,
          and reverence. A basic pooja can be done at home with a diya, incense, flowers, water, and a
          small offering. The essence of pooja is not complexity—it is the sincerity of your intention.
        </p>
        <p>
          Begin by cleaning the space and lighting the diya. Offer water or flowers to the deity, recite
          a short mantra or name, and spend a moment in silent prayer. Aarti is usually performed at the
          end of the pooja as an offering of light and devotion.
        </p>
        <p>
          Bhakti Sagar provides aarti lyrics, mantras, and simple guidance so you can create a peaceful
          daily routine. If you are new, start with a short pooja and one aarti, then slowly expand as
          you become comfortable.
        </p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/aartis"
          className="rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
        >
          Explore Aartis
        </Link>
        <Link
          href="/pooja"
          className="rounded-full border border-sagar-saffron/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-saffron"
        >
          Pooja Guide
        </Link>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Pooja Vidhi", url: "https://bhakti-sagar.com/pooja-vidhi" }
        ])) }}
      />
    </div>
  );
}
