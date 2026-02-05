import Image from "next/image";
import AartiCard from "@/components/AartiCard";
import CategoryCard from "@/components/CategoryCard";
import AIBadge from "@/components/AIBadge";
import { getCategories, getTopAartis } from "@/lib/data";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import DailyAIInsight from "@/components/DailyAIInsight";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Aarti, Bhajan, Mantra & Pooja Vidhi",
    description:
      "Read aartis, chalisas, stotras, mantras and pooja guides with easy lyrics, meaning, and videos. Explore by deity and festival.",
    pathname: "/"
  })
};

export default function HomePage() {
  const topAartis = getTopAartis();
  const categories = getCategories();
  const lang = getRequestLanguage();
  const dayIndex = Math.abs(
    Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % topAartis.length
  );
  const dailyAarti = topAartis[dayIndex];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is an aarti?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Aarti is a devotional hymn sung with a lamp or diya at the end of prayer to offer light and gratitude."
        }
      },
      {
        "@type": "Question",
        name: "How do I choose an aarti?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Choose by deity or intent. Bhakti Sagar lets you browse by deity and read lyrics in English and Hindi."
        }
      },
      {
        "@type": "Question",
        name: "What is a bhajan?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Bhajans are devotional songs of praise. Bhakti Sagar is expanding its bhajan collection alongside aartis."
        }
      },
      {
        "@type": "Question",
        name: "What is a simple pooja flow?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Light a diya, offer flowers or prasad, chant a mantra, and sing an aarti with devotion."
        }
      }
    ]
  };

  return (
    <div className="container">
      <section className="grid gap-8 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sagar-rose">Bhakti Sagar</p>
          <h1 className="mt-4 text-4xl font-serif text-sagar-ink md:text-5xl">
            A calm home for aarti, bhajan, and daily devotion.
          </h1>
          <p className="mt-4 max-w-lg text-base text-sagar-ink/70">
            Browse the most-loved aartis, explore categories by deity, and understand each prayer with a gentle
            explanation in simple words.
          </p>
          <div className="mt-4 hidden sm:block">
            <AIBadge label="AI Insight for meanings" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/aartis"
              className="rounded-full bg-sagar-saffron px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white"
            >
              Explore Aartis
            </a>
            <a
              href="/about"
              className="rounded-full border border-sagar-saffron/40 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-sagar-saffron"
            >
              Our Vision
            </a>
          </div>
        </div>
        <div className="rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-none lg:shadow-sagar-card">
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/60 p-3">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-white">
                <Image
                  src="/brand/bhakti-sagar-logo.png"
                  alt="Bhakti Sagar banner"
                  fill
                  className="object-cover"
                  style={{ objectPosition: "50% 50%" }}
                  sizes="(max-width: 768px) 100vw, 520px"
                  priority
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Daily Prayer</p>
              <h2 className="mt-3 text-2xl font-serif text-sagar-ink">Start with a top aarti</h2>
              <div className="mt-4 space-y-3 text-sm text-sagar-ink/70">
                {topAartis.slice(0, 4).map((aarti) => {
                  const title =
                    lang === "hi"
                      ? aarti.title.hindi || aarti.title.english
                      : aarti.title.english || aarti.title.hindi;
                  return (
                  <a
                    key={aarti.id}
                    href={`/aartis/${aarti.slug}`}
                    className="flex items-center justify-between rounded-2xl border border-sagar-amber/10 bg-sagar-cream/70 px-4 py-3 hover:border-sagar-saffron/50"
                  >
                    <span>{title}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-sagar-rose">View</span>
                  </a>
                );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <h2 className="section-title">Browse by Category</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {dailyAarti && (
        <section className="py-8">
          <DailyAIInsight
            title={dailyAarti.title.english || dailyAarti.title.hindi}
            slug={dailyAarti.slug}
            lyrics={dailyAarti.lyrics.english.length ? dailyAarti.lyrics.english : dailyAarti.lyrics.hindi}
          />
        </section>
      )}

      <section className="py-8">
        <h2 className="section-title">Common questions</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
            <h3 className="text-lg font-serif text-sagar-ink">What is an aarti?</h3>
            <p className="mt-2 text-sm text-sagar-ink/70">
              Aarti is a devotional hymn sung with a lamp or diya at the end of prayer to offer light and gratitude.
            </p>
          </div>
          <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
            <h3 className="text-lg font-serif text-sagar-ink">How do I choose an aarti?</h3>
            <p className="mt-2 text-sm text-sagar-ink/70">
              Choose by deity or intent. Bhakti Sagar lets you browse by deity and read lyrics in English and Hindi.
            </p>
          </div>
          <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
            <h3 className="text-lg font-serif text-sagar-ink">What is a bhajan?</h3>
            <p className="mt-2 text-sm text-sagar-ink/70">
              Bhajans are devotional songs of praise. We are expanding the bhajan collection alongside aartis.
            </p>
            <Link href="/bhajan" className="mt-3 inline-block text-xs font-semibold uppercase tracking-wide text-sagar-saffron">
              Learn about bhajans
            </Link>
          </div>
          <div className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-6 shadow-sagar-soft">
            <h3 className="text-lg font-serif text-sagar-ink">What is a simple pooja flow?</h3>
            <p className="mt-2 text-sm text-sagar-ink/70">
              Light a diya, offer flowers or prasad, chant a mantra, and sing an aarti with devotion.
            </p>
            <Link href="/pooja" className="mt-3 inline-block text-xs font-semibold uppercase tracking-wide text-sagar-saffron">
              Read the pooja guide
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8">
        <h2 className="section-title">Explore more devotion</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/stotras"
            className="rounded-full border border-sagar-amber/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70 hover:text-sagar-saffron"
          >
            Stotras
          </Link>
          <Link
            href="/vrat-katha"
            className="rounded-full border border-sagar-amber/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70 hover:text-sagar-saffron"
          >
            Vrat Katha
          </Link>
          <Link
            href="/pooja-vidhi"
            className="rounded-full border border-sagar-amber/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sagar-ink/70 hover:text-sagar-saffron"
          >
            Pooja Vidhi
          </Link>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
