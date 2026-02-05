import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Vrat Katha",
    description: "Vrat katha summaries, rituals, and devotional guidance.",
    pathname: "/vrat-katha"
  })
};

export default function VratKathaPage() {
  const faqData = faqJsonLd([
    {
      q: "What is a vrat katha?",
      a: "A vrat katha is the devotional story and ritual guidance for a fasting observance."
    },
    {
      q: "When is vrat katha read?",
      a: "It is read during the vrat or on the associated festival day, often before the aarti."
    },
    {
      q: "Why are vrat kathas important?",
      a: "They preserve the meaning and significance of the vrat and inspire devotion."
    },
    {
      q: "Do you provide rituals and steps?",
      a: "Yes. We include simple steps and related aartis where possible."
    },
    {
      q: "Are vrat kathas available in English letters?",
      a: "We provide English transliteration and summaries to make them accessible."
    }
  ]);

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Vrat Katha</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">Vrat katha and rituals</h1>
      <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-sagar-ink/70">
        <p>
          Vrat katha is the devotional story associated with a fasting observance. The katha preserves
          the spiritual meaning of the vrat and reminds devotees of the values it represents—gratitude,
          discipline, and devotion. It is usually read on the day of the vrat, often alongside pooja
          rituals, offerings, and an aarti at the end.
        </p>
        <p>
          Bhakti Sagar aims to make vrat kathas approachable by providing concise summaries, simple
          ritual steps, and links to relevant aartis. Whether you are observing Karva Chauth, Ekadashi,
          or another vrat, you can use these guides to stay focused on devotion without feeling
          overwhelmed by complexity.
        </p>
        <p>
          When you read a vrat katha, try to do so with a calm, reflective pace. Many families read the
          story together, followed by a prayer and aarti. Over time, the katha becomes a spiritual
          anchor for the family and community.
        </p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", url: "https://bhakti-sagar.com/" },
          { name: "Vrat Katha", url: "https://bhakti-sagar.com/vrat-katha" }
        ])) }}
      />
    </div>
  );
}
