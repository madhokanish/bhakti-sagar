import Link from "next/link";
import ChoghadiyaClient from "@/components/ChoghadiyaClient";
import { resolveChoghadiyaState, SearchParams } from "@/lib/choghadiyaPage";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { siteConfig } from "@/lib/seo";
import { getTopAartis } from "@/lib/data";
import { mantras, poojaGuides, festivals } from "@/lib/content";

const faqItems = [
  {
    q: "What is choghadiya?",
    a: "Choghadiya is a traditional time window system that divides the day and night into 8 segments for planning activities."
  },
  {
    q: "How is today’s choghadiya calculated?",
    a: "We use your city’s sunrise, sunset, and next sunrise times, then divide day and night into 8 equal parts."
  },
  {
    q: "Which choghadiya is best for starting an auspicious task?",
    a: "Amrit, Shubh, Labh, and Char are considered good slots for positive beginnings."
  },
  {
    q: "Can I use this for overseas time zones?",
    a: "Yes. Pick your city and timezone, and the timings update instantly for your location."
  },
  {
    q: "What if sunrise or sunset is missing for my location?",
    a: "Some polar regions don’t have sunrise/sunset on certain dates. Switch to manual mode and enter the times."
  },
  {
    q: "Can I set a reminder for a choghadiya slot?",
    a: "Yes. Use the ‘Add reminder’ button to download a calendar file for that slot."
  }
];

export function ChoghadiyaPage({
  params,
  searchParams,
  pathnameBase
}: {
  params?: { citySlug?: string };
  searchParams?: SearchParams;
  pathnameBase: string;
}) {
  const state = resolveChoghadiyaState({ params, searchParams, pathnameBase });
  const breadcrumbItems = [
    { name: "Home", url: siteConfig.url },
    { name: "Choghadiya", url: `${siteConfig.url}/choghadiya` }
  ];

  if (state.cityLabel && state.cityLabel !== "your location") {
    breadcrumbItems.push({ name: state.cityLabel, url: state.canonicalUrl });
  }

  const topAarti = getTopAartis()[0];
  const mantra = mantras[0];
  const pooja = poojaGuides[0];
  const festival = festivals[0];

  return (
    <div className="container py-10">
      <ChoghadiyaClient
        initialCity={state.initialCity}
        initialCityName={state.initialCityName}
        initialLat={state.initialLat}
        initialLon={state.initialLon}
        initialDate={state.initialDate}
        initialTz={state.initialTz}
        initialMode={state.initialMode}
        initialSunrise={state.initialSunrise}
        initialSunset={state.initialSunset}
        initialNextSunrise={state.initialNextSunrise}
        initialPathBase={state.initialPathBase}
        hasTzParam={state.hasTzParam}
        hasDateParam={state.hasDateParam}
        initialPlannerGoal={state.plannerGoal}
        initialPlannerWindow={state.plannerWindow}
        initialPlannerStart={state.plannerStart}
        initialPlannerEnd={state.plannerEnd}
      />

      <section className="mt-10 rounded-3xl border border-sagar-amber/20 bg-white p-6">
        <h2 className="text-xl font-serif text-sagar-ink">Suggested for this time</h2>
        <p className="mt-2 text-sm text-sagar-ink/70">
          Pair the current choghadiya with a short prayer or simple home ritual. Here are quick options to begin.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {topAarti && (
            <Link
              href={`/aartis/${topAarti.slug}`}
              className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/60 p-4 text-sm font-semibold text-sagar-ink hover:text-sagar-saffron"
            >
              {topAarti.title.english || topAarti.title.hindi}
            </Link>
          )}
          {mantra && (
            <Link
              href={`/mantra/${mantra.slug}`}
              className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/60 p-4 text-sm font-semibold text-sagar-ink hover:text-sagar-saffron"
            >
              {mantra.name}
            </Link>
          )}
          {pooja && (
            <Link
              href={`/pooja/${pooja.slug}`}
              className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/60 p-4 text-sm font-semibold text-sagar-ink hover:text-sagar-saffron"
            >
              {pooja.name}
            </Link>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white p-6">
        <h2 className="text-xl font-serif text-sagar-ink">
          Aaj Ka Choghadiya for {state.cityLabel} on {state.dateLabel}
        </h2>
        <p className="mt-3 text-sm text-sagar-ink/70">
          Use this page to find the current choghadiya, the next good slot, and the full day and night schedule. It is
          designed for quick decisions—especially if you are outside India and want a trusted daily ritual time. Bookmark
          this page and share it with family when planning a pooja, travel, or a new start.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <details className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-sagar-ink">What is Choghadiya?</summary>
          <p className="mt-2 text-sm text-sagar-ink/70">
            Choghadiya divides the day and night into eight equal parts. Each part is associated with a quality such as
            Amrit, Shubh, Labh, Char, Rog, Kaal, or Udveg. Many families use it to pick the most favorable time for
            important actions.
          </p>
        </details>
        <details className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-sagar-ink">How is it calculated?</summary>
          <p className="mt-2 text-sm text-sagar-ink/70">
            We calculate sunrise and sunset for your location, then divide the daylight and nighttime durations into
            eight equal segments each. The segment names follow the weekday sequence used in traditional panchang
            calculations.
          </p>
        </details>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white p-6" id="faq">
        <h2 className="text-xl font-serif text-sagar-ink">Choghadiya FAQs</h2>
        <div className="mt-4 space-y-4 text-sm text-sagar-ink/70">
          {faqItems.map((item) => (
            <div key={item.q}>
              <h3 className="font-semibold text-sagar-ink">{item.q}</h3>
              <p className="mt-1">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white p-6">
        <h2 className="text-xl font-serif text-sagar-ink">More from Bhakti Sagar</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-sagar-ink/70">
          <Link href="/aartis" className="hover:text-sagar-saffron">Aarti collection</Link>
          <Link href="/festival" className="hover:text-sagar-saffron">Festival guides</Link>
          {festival && (
            <Link href={`/festival/${festival.slug}`} className="hover:text-sagar-saffron">
              {festival.name}
            </Link>
          )}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbItems)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqItems)) }}
      />
    </div>
  );
}
