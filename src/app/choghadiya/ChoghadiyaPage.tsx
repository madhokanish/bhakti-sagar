import Link from "next/link";
import ChoghadiyaClient from "@/components/ChoghadiyaClient";
import { resolveChoghadiyaState, SearchParams } from "@/lib/choghadiyaPage";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { siteConfig } from "@/lib/seo";
import { getRequestLanguage } from "@/lib/seo";
import { getTopAartis } from "@/lib/data";
import { festivals } from "@/lib/content";

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
  const lang = getRequestLanguage();
  const localePrefix = `/${lang}`;
  const copy =
    lang === "hi"
      ? {
          suggestedTitle: "इस समय के लिए सुझाव",
          suggestedText: "अभी के चौघड़िया के साथ एक छोटी आरती जोड़ें और तुरंत शुरू करें।",
          whatIsTitle: "चौघड़िया क्या है?",
          whatIsText:
            "चौघड़िया दिन और रात को आठ-आठ हिस्सों में बांटता है। हर हिस्से का एक गुण माना जाता है, जैसे अमृत, शुभ, लाभ, चर, रोग, काल, उद्वेग। बहुत से परिवार शुभ समय चुनने के लिए इसका उपयोग करते हैं।",
          calcTitle: "यह कैसे निकाला जाता है?",
          calcText:
            "हम आपके स्थान के सूर्योदय और सूर्यास्त के समय निकालते हैं, फिर दिन और रात को आठ बराबर हिस्सों में बांटते हैं। इसके बाद सप्ताह के दिन के अनुसार पारंपरिक क्रम लागू किया जाता है।",
          faqTitle: "चौघड़िया FAQs",
          moreTitle: "भक्ति चैट से और देखें",
          aartiCollection: "आरती संग्रह",
          festivalGuides: "त्योहार गाइड"
        }
      : {
          suggestedTitle: "Suggested for this time",
          suggestedText: "Pair the current choghadiya with a short aarti you can start right away.",
          whatIsTitle: "What is Choghadiya?",
          whatIsText:
            "Choghadiya divides the day and night into eight equal parts. Each part is associated with a quality such as Amrit, Shubh, Labh, Char, Rog, Kaal, or Udveg. Many families use it to pick the most favorable time for important actions.",
          calcTitle: "How is it calculated?",
          calcText:
            "We calculate sunrise and sunset for your location, then divide the daylight and nighttime durations into eight equal segments each. The segment names follow the weekday sequence used in traditional panchang calculations.",
          faqTitle: "Choghadiya FAQs",
          moreTitle: "More from Bhakti Chat",
          aartiCollection: "Aarti collection",
          festivalGuides: "Festival guides"
        };

  const state = resolveChoghadiyaState({ params, searchParams, pathnameBase });
  const breadcrumbItems = [
    {
      name: lang === "hi" ? "होम" : "Home",
      url: `${siteConfig.url}${localePrefix}`
    },
    {
      name: lang === "hi" ? "चौघड़िया" : "Choghadiya",
      url: `${siteConfig.url}${localePrefix}/choghadiya`
    }
  ];

  if (state.cityLabel && state.cityLabel !== "your location") {
    breadcrumbItems.push({ name: state.cityLabel, url: state.canonicalUrl });
  }

  const topAartis = getTopAartis().slice(0, 3);
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
        initialPane={state.pane}
      />

      <section className="mt-10 rounded-3xl border border-sagar-amber/20 bg-white p-6">
        <h2 className="text-xl font-serif text-sagar-ink">{copy.suggestedTitle}</h2>
        <p className="mt-2 text-sm text-sagar-ink/70">
          {copy.suggestedText}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {topAartis.map((aarti) => (
            <Link
              key={aarti.slug}
              href={`${localePrefix}/aartis/${aarti.slug}`}
              className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/60 p-4 text-sm font-semibold text-sagar-ink hover:text-sagar-saffron"
            >
              {aarti.title.english || aarti.title.hindi}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <details className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-sagar-ink">{copy.whatIsTitle}</summary>
          <p className="mt-2 text-sm text-sagar-ink/70">
            {copy.whatIsText}
          </p>
        </details>
        <details className="rounded-2xl border border-sagar-amber/20 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-sagar-ink">{copy.calcTitle}</summary>
          <p className="mt-2 text-sm text-sagar-ink/70">
            {copy.calcText}
          </p>
        </details>
      </section>

      <section className="mt-8 rounded-3xl border border-sagar-amber/20 bg-white p-6" id="faq">
        <h2 className="text-xl font-serif text-sagar-ink">{copy.faqTitle}</h2>
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
        <h2 className="text-xl font-serif text-sagar-ink">{copy.moreTitle}</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-sagar-ink/70">
          <Link href={`${localePrefix}/aartis`} className="hover:text-sagar-saffron">{copy.aartiCollection}</Link>
          <Link href={`${localePrefix}/festival`} className="hover:text-sagar-saffron">{copy.festivalGuides}</Link>
          {festival && (
            <Link href={`${localePrefix}/festival/${festival.slug}`} className="hover:text-sagar-saffron">
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
