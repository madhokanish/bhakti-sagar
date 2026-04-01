import ChoghadiyaClient from "@/components/ChoghadiyaClient";
import { resolveChoghadiyaState, SearchParams } from "@/lib/choghadiyaPage";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/schema";
import { siteConfig } from "@/lib/seo";
import { getTopAartis } from "@/lib/data";
import { festivals } from "@/lib/content";
import type { HomeLang } from "@/lib/homeCopy";
import { CHOGHADIYA_COPY } from "@/lib/choghadiyaCopy";

export function ChoghadiyaPage({
  params,
  searchParams,
  pathnameBase,
  routeLocale = "en",
  initialLang = "en"
}: {
  params?: { citySlug?: string };
  searchParams?: SearchParams;
  pathnameBase: string;
  routeLocale?: "en" | "hi";
  initialLang?: HomeLang;
}) {
  const lang = routeLocale;
  const localePrefix = `/${lang}`;
  const copy = CHOGHADIYA_COPY[lang];
  const faqItems = [
    { q: copy.faq_1_q, a: copy.faq_1_a },
    { q: copy.faq_2_q, a: copy.faq_2_a },
    { q: copy.faq_3_q, a: copy.faq_3_a },
    { q: copy.faq_4_q, a: copy.faq_4_a },
    { q: copy.faq_5_q, a: copy.faq_5_a },
    { q: copy.faq_6_q, a: copy.faq_6_a }
  ];

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
        initialLang={initialLang}
        topAartis={topAartis.map((aarti) => ({ slug: aarti.slug, title: aarti.title.english || aarti.title.hindi }))}
        featuredFestival={festival ? { slug: festival.slug, name: festival.name } : null}
      />

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
