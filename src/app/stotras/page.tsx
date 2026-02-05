import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Stotras",
    description: "Devotional stotras with simple explanations and reading guidance.",
    pathname: "/stotras"
  })
};

export default function StotrasPage() {
  const faqData = faqJsonLd([
    {
      q: "What is a stotra?",
      a: "A stotra is a devotional hymn of praise composed for a deity, often recited during prayer."
    },
    {
      q: "How is a stotra different from an aarti?",
      a: "Aarti is sung with a lamp offering; a stotra is typically recited or chanted as a praise hymn."
    },
    {
      q: "Do stotras have meanings?",
      a: "Yes. Many stotras include poetic descriptions of the deity’s qualities and blessings."
    },
    {
      q: "When should I recite a stotra?",
      a: "You can recite a stotra during daily worship, after mantra japa, or on festival days."
    },
    {
      q: "Are stotras available in English letters?",
      a: "Bhakti Sagar provides transliteration in English letters where available."
    }
  ]);

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Stotras</p>
      <h1 className="mt-3 text-4xl font-serif text-sagar-ink">Stotras for devotion</h1>
      <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-sagar-ink/70">
        <p>
          Stotras are devotional hymns that praise the qualities and stories of a deity. They are often
          chanted in a calm, steady rhythm and can be recited during daily pooja, festivals, or quiet
          personal prayer. Unlike aarti, which is sung with a lamp offering, stotras are primarily spoken
          or chanted to focus the mind and heart on devotion.
        </p>
        <p>
          At Bhakti Sagar, our goal is to make stotras easy to read and understand. Where possible, we
          provide English transliteration alongside Hindi text so anyone can follow the pronunciation.
          We also add short explanations to help you connect with the meaning without overwhelming the
          flow of prayer.
        </p>
        <p>
          If you are new to stotras, start with a short hymn and recite it slowly, focusing on each
          line. You can keep a small rhythm with your breath, and pause after each verse. Over time,
          regular recitation builds familiarity, peace, and a deeper devotional connection.
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
          { name: "Stotras", url: "https://bhakti-sagar.com/stotras" }
        ])) }}
      />
    </div>
  );
}
