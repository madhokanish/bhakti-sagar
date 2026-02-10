import Image from "next/image";
import AartiCard from "@/components/AartiCard";
import CategoryCard from "@/components/CategoryCard";
import { getCategories, getTopAartis } from "@/lib/data";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import DailyAIInsight from "@/components/DailyAIInsight";
import MobileQuickNav from "@/components/MobileQuickNav";

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
      <section className="grid gap-8 py-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-16">
        <div className="md:hidden">
          <h1 className="mt-2 text-3xl font-serif text-sagar-ink">
            Daily devotion, made simple.
          </h1>
          <p className="mt-3 text-sm text-sagar-ink/70">
            Read aartis with clear meanings, check Choghadiya, and join weekly Online Pujas.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <a
              href="/aartis"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white"
            >
              Explore Aartis
            </a>
            <a
              href="/online-puja"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-saffron/45 bg-sagar-saffron/10 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-sagar-saffron"
            >
              Online Puja
            </a>
            <a
              href="/choghadiya"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-saffron/40 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-sagar-saffron"
            >
              Choghadiya
            </a>
          </div>
          <div className="mt-3">
            <a href="/about" className="text-xs text-sagar-ink/60 underline decoration-sagar-amber/40 underline-offset-4">
              Our vision
            </a>
          </div>
        </div>

        <div className="md:hidden">
          <div className="mb-4 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/60 p-3">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-white">
              <Image
                src="/brand/bhakti-sagar-logo.png"
                alt="Bhakti Sagar banner"
                fill
                className="object-cover"
                style={{ objectPosition: "50% 50%" }}
                sizes="100vw"
                priority
              />
            </div>
          </div>
          <div className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Top Aartis</p>
            <div className="mt-4 space-y-3">
              {topAartis.slice(0, 3).map((aarti) => {
                const title =
                  lang === "hi"
                    ? aarti.title.hindi || aarti.title.english
                    : aarti.title.english || aarti.title.hindi;
                return (
                  <a
                    key={aarti.id}
                    href={`/aartis/${aarti.slug}`}
                    className="flex items-center justify-between rounded-2xl border border-sagar-amber/10 bg-sagar-cream/70 px-4 py-3 text-sm text-sagar-ink/80"
                  >
                    <span>{title}</span>
                    <span className="text-[0.6rem] uppercase tracking-[0.2em] text-sagar-rose">Open</span>
                  </a>
                );
              })}
              <a
                href="/aartis"
                className="block rounded-2xl border border-sagar-saffron/30 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-sagar-saffron"
              >
                View all aartis
              </a>
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <h1 className="mt-4 text-4xl font-serif text-sagar-ink md:text-5xl">
            Daily devotion, made simple.
          </h1>
          <p className="mt-4 max-w-lg text-base text-sagar-ink/70">
            Read aartis with clear meanings, check Choghadiya, and join weekly Online Pujas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/aartis"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white"
            >
              Explore Aartis
            </a>
            <a
              href="/online-puja"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-saffron/45 bg-sagar-saffron/10 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-sagar-saffron"
            >
              Online Puja
            </a>
            <a
              href="/choghadiya"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-saffron/40 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-sagar-saffron"
            >
              Choghadiya
            </a>
          </div>
          <div className="mt-3">
            <a href="/about" className="text-xs text-sagar-ink/60 underline decoration-sagar-amber/40 underline-offset-4">
              Our vision
            </a>
          </div>
        </div>

        <div className="hidden md:block rounded-3xl border border-sagar-amber/20 bg-white p-6 shadow-none lg:shadow-sagar-card">
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

      <details className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white p-6 md:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-sagar-ink">About Bhakti Sagar</summary>
        <div className="mt-3 text-sm text-sagar-ink/70">
          Bhakti Sagar is a calm space for aartis, bhajans, and daily devotion. Read lyrics in English and Hindi and
          use AI Insight for simple meanings.
        </div>
      </details>

      <MobileQuickNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </div>
  );
}
