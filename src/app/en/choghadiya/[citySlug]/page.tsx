import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ChoghadiyaPage } from "@/app/choghadiya/ChoghadiyaPage";
import { resolveChoghadiyaState, SearchParams } from "@/lib/choghadiyaPage";
import { buildChoghadiyaMetadata } from "@/lib/choghadiyaSeo";
import { findCityBySlug } from "@/lib/choghadiyaCities";
import { HOME_LANG_COOKIE, resolveHomeLang } from "@/lib/homeCopy";

export function generateMetadata({
  params,
  searchParams
}: {
  params: { citySlug: string };
  searchParams?: SearchParams;
}): Metadata {
  const pathnameBase = `/en/choghadiya/${params.citySlug}`;
  const state = resolveChoghadiyaState({ params, searchParams, pathnameBase });
  const selectedLang = resolveHomeLang(cookies().get(HOME_LANG_COOKIE)?.value, "en");

  return buildChoghadiyaMetadata({
    cityLabel: state.cityLabel,
    dateLabel: state.dateLabel,
    canonicalUrl: state.canonicalUrl,
    locale: "en",
    noindex: selectedLang === "hinglish"
  });
}

export default function EnCityChoghadiyaPage({
  params,
  searchParams
}: {
  params: { citySlug: string };
  searchParams?: SearchParams;
}) {
  if (!findCityBySlug(params.citySlug)) {
    notFound();
  }

  return (
    <ChoghadiyaPage
      params={params}
      pathnameBase={`/en/choghadiya/${params.citySlug}`}
      searchParams={searchParams}
      routeLocale="en"
      initialLang={resolveHomeLang(cookies().get(HOME_LANG_COOKIE)?.value, "en")}
    />
  );
}
