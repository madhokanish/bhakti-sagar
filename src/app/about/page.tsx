import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, siteConfig } from "@/lib/seo";
import { breadcrumbJsonLd, faqJsonLd, organizationJsonLd } from "@/lib/schema";

const aboutFaqs = [
  {
    q: "What is an aarti?",
    a: "An aarti is a devotional prayer hymn sung with light offerings. On Bhakti Sagar you can read simple lyrics and follow along daily."
  },
  {
    q: "How do I use meanings?",
    a: "Each aarti page includes a meaning panel that explains lines in plain words. It is made for easier understanding and devotional focus."
  },
  {
    q: "How do online pujas work?",
    a: "Online Puja pages show the weekly schedule and details. You can submit your interest and our team follows up with the next steps."
  }
];

export const metadata: Metadata = {
  ...buildMetadata({
    title: "About Bhakti Sagar | A Global Devotional Platform",
    description:
      "Bhakti Sagar helps you read aartis with meanings, follow daily devotion, check Choghadiya, and join weekly online pujas. Built for devotees in India and abroad.",
    pathname: "/about"
  })
};

export default function AboutPage() {
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", url: `${siteConfig.url}/` },
    { name: "About", url: `${siteConfig.url}/about` }
  ]);

  const aboutPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Bhakti Sagar",
    url: `${siteConfig.url}/about`,
    description:
      "Bhakti Sagar helps devotees read aarti lyrics and aarti meanings, check Choghadiya, and join weekly online puja schedules.",
    inLanguage: "en"
  };

  const organization = {
    ...organizationJsonLd(),
    description:
      "A global devotional platform focused on daily prayer, readable content, and practical tools for devotees."
  };

  return (
    <div className="container py-10 md:py-14">
      <section className="max-w-4xl border-b border-sagar-amber/20 pb-8 md:pb-10">
        <h1 className="text-4xl font-serif text-sagar-ink md:text-5xl">About</h1>
        <h2 className="mt-6 text-2xl font-serif text-sagar-ink">A calm place for daily devotion</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-sagar-ink/75 md:text-base">
          Bhakti Sagar helps you stay close to prayer every day with{" "}
          <Link href="/aartis" className="text-sagar-saffron underline decoration-sagar-amber/50 underline-offset-4">
            aarti lyrics
          </Link>{" "}
          and{" "}
          <Link href="/aartis" className="text-sagar-saffron underline decoration-sagar-amber/50 underline-offset-4">
            aarti meanings
          </Link>
          , practical{" "}
          <Link href="/choghadiya" className="text-sagar-saffron underline decoration-sagar-amber/50 underline-offset-4">
            Choghadiya
          </Link>{" "}
          guidance, and weekly{" "}
          <Link href="/online-puja" className="text-sagar-saffron underline decoration-sagar-amber/50 underline-offset-4">
            online puja
          </Link>{" "}
          opportunities.
        </p>
      </section>

      <section className="max-w-4xl border-b border-sagar-amber/20 py-8 md:py-10">
        <h2 className="text-2xl font-serif text-sagar-ink">Our vision</h2>
        <p className="mt-3 text-sm leading-7 text-sagar-ink/75 md:text-base">
          We are building Bhakti Sagar as a global daily devotional habit where prayer feels accessible, focused, and
          grounded in respectful understanding.
        </p>
        <ul className="mt-5 space-y-2 text-sm text-sagar-ink/75 md:text-base">
          <li>Simple and distraction free</li>
          <li>Respectful explanations in plain words</li>
          <li>Built for devotees worldwide</li>
          <li>Fast, readable, mobile first</li>
        </ul>
      </section>

      <section className="max-w-5xl border-b border-sagar-amber/20 py-8 md:py-10">
        <h2 className="text-2xl font-serif text-sagar-ink">What you can do here</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Link
            href="/aartis"
            className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-5 text-sm leading-6 text-sagar-ink/75 transition hover:border-sagar-saffron/50"
          >
            <h3 className="text-base font-semibold text-sagar-ink">Aartis with lyrics and meanings</h3>
            <p className="mt-2">Read in English or Hindi and use guided meaning support in one clean flow.</p>
          </Link>
          <Link
            href="/online-puja"
            className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-5 text-sm leading-6 text-sagar-ink/75 transition hover:border-sagar-saffron/50"
          >
            <h3 className="text-base font-semibold text-sagar-ink">Online Puja weekly schedule</h3>
            <p className="mt-2">Explore upcoming temple puja opportunities and share your interest quickly.</p>
          </Link>
          <Link
            href="/choghadiya"
            className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-5 text-sm leading-6 text-sagar-ink/75 transition hover:border-sagar-saffron/50"
          >
            <h3 className="text-base font-semibold text-sagar-ink">Choghadiya for daily checks</h3>
            <p className="mt-2">Check the current slot, next good slot, and day-night timetable in your timezone.</p>
          </Link>
        </div>
      </section>

      <section className="max-w-4xl border-b border-sagar-amber/20 py-8 md:py-10">
        <h2 className="text-2xl font-serif text-sagar-ink">How meanings work</h2>
        <p className="mt-3 text-sm leading-7 text-sagar-ink/75 md:text-base">
          The meaning panel gives a gentle explanation of prayer lines in plain language so reading feels easier and
          more connected. Meanings are meant to guide devotion and understanding. If something looks off, you can
          share feedback.
        </p>
      </section>

      <section className="max-w-4xl border-b border-sagar-amber/20 py-8 md:py-10">
        <h2 className="text-2xl font-serif text-sagar-ink">For devotees in India and abroad</h2>
        <p className="mt-3 text-sm leading-7 text-sagar-ink/75 md:text-base">
          Whether you are in India, the UK, the US, or anywhere else, we want Bhakti Sagar to feel like home for your
          daily prayer rhythm.
        </p>
      </section>

      <section className="max-w-4xl border-b border-sagar-amber/20 py-8 md:py-10">
        <h2 className="text-2xl font-serif text-sagar-ink">FAQs</h2>
        <div className="mt-4 space-y-3">
          {aboutFaqs.map((faq) => (
            <details
              key={faq.q}
              className="rounded-2xl border border-sagar-amber/20 bg-white/70 p-4 text-sm text-sagar-ink/80"
            >
              <summary className="cursor-pointer font-semibold text-sagar-ink">{faq.q}</summary>
              <p className="mt-2 leading-7">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="max-w-4xl py-8 md:py-10">
        <h2 className="sr-only">Call to action</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/aartis"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sagar-saffron px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white"
          >
            Explore Aartis
          </Link>
          <Link
            href="/online-puja"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-sagar-saffron/40 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-sagar-saffron"
          >
            Online Puja
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(aboutFaqs)) }} />
    </div>
  );
}
